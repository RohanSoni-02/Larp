-- 0007: social interactions on content — kudos, comments, saves

create table public.kudos (
  id uuid primary key default gen_random_uuid(),
  giver_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  larp_check_id uuid references public.larp_checks (id) on delete cascade,
  label text not null,                             -- "Clean technique", skill-specific label…
  created_at timestamptz not null default now(),
  check ((session_id is not null) <> (larp_check_id is not null)),
  unique (giver_id, session_id, label),
  unique (giver_id, larp_check_id, label)
);

alter table public.kudos enable row level security;

create policy "kudos are public"
  on public.kudos for select
  using (true);

create policy "users give kudos as themselves"
  on public.kudos for insert
  with check (auth.uid() = giver_id);

create policy "users take back their own kudos"
  on public.kudos for delete
  using (auth.uid() = giver_id);

-- ─── comments (one level of replies, enforced by trigger) ────────────────────
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  larp_check_id uuid references public.larp_checks (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  check ((session_id is not null) <> (larp_check_id is not null))
);

alter table public.comments enable row level security;

create index comments_session on public.comments (session_id, created_at);

create policy "comments are public"
  on public.comments for select
  using (true);

create policy "users comment as themselves"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "users edit their own comments"
  on public.comments for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "users delete their own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

create or replace function public.enforce_single_reply_level()
returns trigger
language plpgsql
as $$
begin
  if new.parent_id is not null and exists (
    select 1 from public.comments p where p.id = new.parent_id and p.parent_id is not null
  ) then
    raise exception 'only one level of replies is allowed';
  end if;
  return new;
end;
$$;

create trigger comments_single_reply_level
  before insert on public.comments
  for each row execute function public.enforce_single_reply_level();

-- ─── saves ───────────────────────────────────────────────────────────────────
create table public.saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  larp_check_id uuid references public.larp_checks (id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((session_id is not null) <> (larp_check_id is not null)),
  unique (user_id, session_id),
  unique (user_id, larp_check_id)
);

alter table public.saves enable row level security;

create policy "users manage their own saves"
  on public.saves for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
