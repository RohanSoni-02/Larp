-- 0013: direct messages — private one-to-one chats.
-- Conversations and memberships are written only by start_conversation(), so
-- nobody can add themselves (or anyone else) to a thread. Members read the
-- thread and send as themselves. A block in either direction stops new
-- messages and hides the conversation from both inboxes.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  pair_key text not null unique,                   -- "<lower uuid>:<higher uuid>": one thread per pair
  created_at timestamptz not null default now(),
  last_message_at timestamptz                      -- null until the first message; hidden from inboxes
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index conversation_members_user on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),  -- client-generated so optimistic sends dedupe
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_recent on public.messages (conversation_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Security definer: membership policies would otherwise recurse into
-- conversation_members, and the blocks table only shows a user their own blocks.
create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members m
    where m.conversation_id = p_conversation_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_conversation_blocked(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_members other
    join public.blocks b
      on (b.blocker_id = auth.uid() and b.blocked_id = other.user_id)
      or (b.blocker_id = other.user_id and b.blocked_id = auth.uid())
    where other.conversation_id = p_conversation_id
      and other.user_id <> auth.uid()
  );
$$;

create policy "members read their conversations"
  on public.conversations for select
  using (public.is_conversation_member(id));

create policy "members see who is in their conversations"
  on public.conversation_members for select
  using (public.is_conversation_member(conversation_id));

create policy "members read messages"
  on public.messages for select
  using (public.is_conversation_member(conversation_id));

create policy "members send as themselves unless blocked"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id)
    and not public.is_conversation_blocked(conversation_id)
  );

revoke insert, update, delete on public.conversations from authenticated, anon;
revoke insert, update, delete on public.conversation_members from authenticated, anon;
-- Messages are immutable, and created_at is always the server's clock.
revoke insert, update, delete on public.messages from authenticated, anon;
grant insert (id, conversation_id, sender_id, body) on public.messages to authenticated;

-- ─── open (or reopen) the one conversation between me and someone else ───────
create or replace function public.start_conversation(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_key text;
  v_id uuid;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  if p_user_id is null or p_user_id = v_me then
    raise exception 'Pick someone else to message.';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'That account no longer exists.';
  end if;
  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = v_me and b.blocked_id = p_user_id)
       or (b.blocker_id = p_user_id and b.blocked_id = v_me)
  ) then
    raise exception 'You can''t message this person.';
  end if;

  v_key := least(v_me::text, p_user_id::text) || ':' || greatest(v_me::text, p_user_id::text);

  insert into public.conversations (pair_key) values (v_key)
  on conflict (pair_key) do nothing
  returning id into v_id;
  if v_id is null then
    select c.id into v_id from public.conversations c where c.pair_key = v_key;
  end if;

  insert into public.conversation_members (conversation_id, user_id)
  values (v_id, v_me), (v_id, p_user_id)
  on conflict do nothing;

  return v_id;
end;
$$;

-- ─── inbox: one row per conversation with a message, newest first ────────────
create or replace function public.list_conversations()
returns table (
  conversation_id uuid,
  other_id uuid,
  other_handle text,
  other_name text,
  other_color text,
  last_body text,
  last_sender_id uuid,
  last_message_at timestamptz,
  unread_count int
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    p.id,
    p.handle::text,
    p.display_name,
    p.avatar_color,
    lm.body,
    lm.sender_id,
    c.last_message_at,
    (
      select count(*)::int from public.messages m
      where m.conversation_id = c.id
        and m.sender_id <> me.user_id
        and m.created_at > me.last_read_at
    )
  from public.conversation_members me
  join public.conversations c on c.id = me.conversation_id
  join public.conversation_members other
    on other.conversation_id = c.id and other.user_id <> me.user_id
  join public.profiles p on p.id = other.user_id
  left join lateral (
    select m.body, m.sender_id from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) lm on true
  where me.user_id = auth.uid()
    and c.last_message_at is not null
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = me.user_id and b.blocked_id = other.user_id)
         or (b.blocker_id = other.user_id and b.blocked_id = me.user_id)
    )
  order by c.last_message_at desc;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.conversation_members
  set last_read_at = now()
  where conversation_id = p_conversation_id and user_id = auth.uid();
$$;

-- ─── on send: bump the thread, count it as read for the sender, push the rest ─
create or replace function public.on_message_sent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender_name text;
  r record;
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;

  update public.conversation_members
  set last_read_at = new.created_at
  where conversation_id = new.conversation_id and user_id = new.sender_id;

  select nullif(p.display_name, '') into v_sender_name from public.profiles p where p.id = new.sender_id;
  for r in
    select m.user_id from public.conversation_members m
    where m.conversation_id = new.conversation_id and m.user_id <> new.sender_id
  loop
    perform public.send_expo_push(
      r.user_id,
      coalesce(v_sender_name, 'New message'),
      left(new.body, 140),
      jsonb_build_object('url', '/messages/' || new.conversation_id));
  end loop;

  return new;
end;
$$;

create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.on_message_sent();

revoke execute on function public.is_conversation_member(uuid) from public, anon;
revoke execute on function public.is_conversation_blocked(uuid) from public, anon;
revoke execute on function public.start_conversation(uuid) from public, anon;
revoke execute on function public.list_conversations() from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid) to authenticated;
grant execute on function public.is_conversation_blocked(uuid) to authenticated;
grant execute on function public.start_conversation(uuid) to authenticated;
grant execute on function public.list_conversations() to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Live delivery to open threads and inboxes (RLS decides who receives what).
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when undefined_object then
  raise notice 'supabase_realtime publication missing; messages will not stream live';
end $$;
