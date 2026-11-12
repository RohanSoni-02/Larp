-- 0011: leaderboards, guild membership, mentorship (feedback requests),
-- session templates, personalised Larp Check scheduling + Expo push.

-- ═══ Leaderboards ════════════════════════════════════════════════════════════
alter table public.profiles
  add column show_on_leaderboards boolean not null default true;

create table public.guild_members (
  guild_id uuid not null references public.guilds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (guild_id, user_id)
);

alter table public.guild_members enable row level security;

create policy "guild membership is public"
  on public.guild_members for select
  using (true);

create policy "users join guilds themselves"
  on public.guild_members for insert
  with check (auth.uid() = user_id);

create policy "users leave guilds themselves"
  on public.guild_members for delete
  using (auth.uid() = user_id);

-- Ranked practice minutes for a period. Scope: one skill, or one guild (its
-- members, its skill), optionally only people the caller follows. Private
-- sessions never count; opted-out users only ever see themselves.
create or replace function public.get_leaderboard(
  p_skill_id uuid default null,
  p_guild_id uuid default null,
  p_following_only boolean default false,
  p_days int default 7
)
returns table (
  user_id uuid,
  handle text,
  display_name text,
  avatar_color text,
  tier int,
  minutes int,
  sessions int,
  nodes_landed int,
  rank_position int
)
language sql
stable
security definer
set search_path = ''
as $$
  with params as (
    select
      coalesce(p_skill_id, (select g.skill_id from public.guilds g where g.id = p_guild_id)) as skill_id,
      now() - make_interval(days => greatest(1, least(coalesce(p_days, 7), 90))) as since
  ),
  pool as (
    select p.id
    from public.profiles p
    where (p.show_on_leaderboards or p.id = auth.uid())
      and (p_guild_id is null or exists (
        select 1 from public.guild_members gm where gm.guild_id = p_guild_id and gm.user_id = p.id))
      and (not p_following_only or p.id = auth.uid() or exists (
        select 1 from public.follows f where f.follower_id = auth.uid() and f.followee_id = p.id))
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
           or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
  ),
  totals as (
    select s.user_id as uid, sum(s.duration_sec) / 60 as mins, count(*) as n_sessions
    from public.sessions s, params
    where s.started_at >= params.since
      and s.visibility <> 'private'
      and (params.skill_id is null or s.skill_id = params.skill_id)
      and s.user_id in (select id from pool)
    group by s.user_id
  ),
  landed as (
    select np.user_id as uid, count(*) as n_nodes
    from public.node_progress np
    join public.skill_nodes sn on sn.id = np.node_id
    join public.skill_branches sb on sb.id = sn.branch_id,
    params
    where np.status = 'landed'
      and np.landed_at >= params.since
      and (params.skill_id is null or sb.skill_id = params.skill_id)
      and np.user_id in (select id from pool)
    group by np.user_id
  )
  select
    p.id as user_id,
    p.handle::text as handle,
    p.display_name as display_name,
    p.avatar_color as avatar_color,
    coalesce((
      select us.tier from public.user_skills us, params
      where us.user_id = p.id and us.skill_id = params.skill_id
    ), 0)::int as tier,
    t.mins::int as minutes,
    t.n_sessions::int as sessions,
    coalesce(l.n_nodes, 0)::int as nodes_landed,
    (rank() over (order by t.mins desc, coalesce(l.n_nodes, 0) desc))::int as rank_position
  from totals t
  join public.profiles p on p.id = t.uid
  left join landed l on l.uid = t.uid
  order by 9, p.display_name
  limit 50;
$$;

grant execute on function public.get_leaderboard(uuid, uuid, boolean, int) to authenticated;

-- ═══ Mentorship: feedback requests ═══════════════════════════════════════════
alter table public.user_skills
  add column open_to_feedback boolean not null default false;

create table public.feedback_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id),
  session_id uuid references public.sessions (id) on delete set null,
  message text not null check (char_length(message) between 1 and 500),
  status text not null default 'pending' check (status in ('pending', 'answered', 'declined')),
  response text check (response is null or char_length(response) <= 2000),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> mentor_id)
);

create index feedback_requests_mentor_idx on public.feedback_requests (mentor_id, status);
create index feedback_requests_requester_idx on public.feedback_requests (requester_id, status);

alter table public.feedback_requests enable row level security;

create policy "feedback visible to its two participants"
  on public.feedback_requests for select
  using (auth.uid() in (requester_id, mentor_id));

revoke insert, update, delete on public.feedback_requests from authenticated, anon;

-- Adept (tier 2) and above can open themselves to feedback on a skill.
create or replace function public.set_open_to_feedback(p_skill_id uuid, p_open boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select tier into v_tier from public.user_skills where user_id = auth.uid() and skill_id = p_skill_id;
  if v_tier is null then raise exception 'skill not in your portfolio'; end if;
  if p_open and v_tier < 2 then raise exception 'Reach Adept to mentor others in this skill'; end if;
  update public.user_skills set open_to_feedback = p_open
  where user_id = auth.uid() and skill_id = p_skill_id;
end;
$$;

-- Mentors for a skill the caller can ask: open, and a higher tier than the caller.
create or replace function public.list_mentors(p_skill_id uuid)
returns table (user_id uuid, handle text, display_name text, avatar_color text, tier int, answered int)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.handle::text, p.display_name, p.avatar_color, us.tier,
    (select count(*)::int from public.feedback_requests fr
     where fr.mentor_id = p.id and fr.status = 'answered')
  from public.user_skills us
  join public.profiles p on p.id = us.user_id
  where us.skill_id = p_skill_id
    and us.open_to_feedback
    and p.id <> auth.uid()
    and us.tier > coalesce((
      select me.tier from public.user_skills me
      where me.user_id = auth.uid() and me.skill_id = p_skill_id), 0)
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
  order by us.tier desc, 6 desc
  limit 30;
$$;

create or replace function public.request_feedback(
  p_mentor_id uuid,
  p_skill_id uuid,
  p_session_id uuid,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_my_tier int;
  v_mentor_tier int;
  v_open boolean;
  v_skill_name text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_mentor_id = auth.uid() then raise exception 'you cannot mentor yourself'; end if;

  select tier, open_to_feedback into v_mentor_tier, v_open
  from public.user_skills where user_id = p_mentor_id and skill_id = p_skill_id;
  if not coalesce(v_open, false) then raise exception 'this person is not taking feedback requests'; end if;

  select coalesce(tier, 0) into v_my_tier
  from public.user_skills where user_id = auth.uid() and skill_id = p_skill_id;
  if v_mentor_tier <= coalesce(v_my_tier, 0) then
    raise exception 'mentors must be a higher tier than you';
  end if;

  if p_session_id is not null and not exists (
    select 1 from public.sessions s
    where s.id = p_session_id and s.user_id = auth.uid() and s.skill_id = p_skill_id
  ) then
    raise exception 'you can only ask about your own sessions in this skill';
  end if;

  if (select count(*) from public.feedback_requests
      where requester_id = auth.uid() and status = 'pending') >= 5 then
    raise exception 'you have 5 open requests — wait for a reply first';
  end if;

  insert into public.feedback_requests (requester_id, mentor_id, skill_id, session_id, message)
  values (auth.uid(), p_mentor_id, p_skill_id, p_session_id, trim(p_message))
  returning id into v_id;

  select name into v_skill_name from public.skills where id = p_skill_id;
  insert into public.notifications (recipient_id, actor_id, type, data)
  values (p_mentor_id, auth.uid(), 'system',
          jsonb_build_object('kind', 'feedback_request', 'request_id', v_id, 'skill_name', v_skill_name));
  return v_id;
end;
$$;

create or replace function public.respond_feedback(p_request_id uuid, p_response text, p_decline boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.feedback_requests;
  v_skill_name text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into r from public.feedback_requests where id = p_request_id for update;
  if r.id is null or r.mentor_id <> auth.uid() then raise exception 'request not found'; end if;
  if r.status <> 'pending' then raise exception 'already handled'; end if;
  if not p_decline and coalesce(trim(p_response), '') = '' then raise exception 'write some feedback first'; end if;

  update public.feedback_requests
  set status = case when p_decline then 'declined' else 'answered' end,
      response = case when p_decline then null else trim(p_response) end,
      responded_at = now()
  where id = p_request_id;

  select name into v_skill_name from public.skills where id = r.skill_id;
  insert into public.notifications (recipient_id, actor_id, type, data)
  values (r.requester_id, auth.uid(), 'system',
          jsonb_build_object('kind', case when p_decline then 'feedback_declined' else 'feedback_answered' end,
                             'request_id', r.id, 'skill_name', v_skill_name));
end;
$$;

-- Inbox + sent, with a snapshot of the session (mentors may not otherwise be
-- allowed to read a followers-only session).
create or replace function public.get_feedback_requests()
returns table (
  id uuid,
  direction text,
  other_id uuid,
  other_name text,
  other_color text,
  skill_id uuid,
  skill_name text,
  message text,
  status text,
  response text,
  created_at timestamptz,
  responded_at timestamptz,
  session_id uuid,
  session_minutes int,
  session_note text,
  session_label text,
  media_key text,
  media_kind text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    fr.id,
    case when fr.mentor_id = auth.uid() then 'inbox' else 'sent' end,
    o.id, o.display_name, o.avatar_color,
    fr.skill_id, sk.name,
    fr.message, fr.status, fr.response, fr.created_at, fr.responded_at,
    s.id, (s.duration_sec / 60)::int, s.note, s.label,
    m.storage_key, m.kind::text
  from public.feedback_requests fr
  join public.profiles o on o.id = case when fr.mentor_id = auth.uid() then fr.requester_id else fr.mentor_id end
  join public.skills sk on sk.id = fr.skill_id
  left join public.sessions s on s.id = fr.session_id
  left join lateral (
    select mm.storage_key, mm.kind from public.media mm
    where mm.session_id = fr.session_id order by mm.created_at limit 1
  ) m on true
  where auth.uid() in (fr.requester_id, fr.mentor_id)
  order by (fr.status = 'pending') desc, fr.created_at desc
  limit 100;
$$;

-- Storage reads: owner, approved media, or a mentor reviewing a request's clip.
create or replace function public.can_read_media_object(p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.media m
    where m.storage_key = p_key
      and (
        m.owner_id = auth.uid()
        or m.status = 'approved'
        or exists (
          select 1 from public.feedback_requests fr
          where fr.mentor_id = auth.uid() and fr.session_id = m.session_id
        )
      )
  );
$$;

create policy "read approved media or media shared for feedback"
  on storage.objects for select
  using (bucket_id = 'media' and public.can_read_media_object(name));

-- ═══ Session templates ═══════════════════════════════════════════════════════
create table public.session_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  skill_id uuid references public.skills (id) on delete set null,
  -- [{ "label": "Scales", "minutes": 10 }, ...]
  blocks jsonb not null check (
    jsonb_typeof(blocks) = 'array' and jsonb_array_length(blocks) between 1 and 12
  ),
  created_at timestamptz not null default now()
);

alter table public.session_templates enable row level security;

create policy "users manage their own templates"
  on public.session_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══ Personalised Larp Check scheduling ══════════════════════════════════════
-- Windows become per-user: each person gets one random moment inside the hours
-- and days THEY choose. Global windows (user_id null) still work for seeds.
alter table public.larp_check_windows
  add column user_id uuid references public.profiles (id) on delete cascade;

alter table public.larp_check_windows
  drop constraint larp_check_windows_region_window_date_key;

create unique index larp_check_windows_global_key
  on public.larp_check_windows (region, window_date) where user_id is null;

create unique index larp_check_windows_personal_key
  on public.larp_check_windows (user_id, window_date) where user_id is not null;

-- The blur now works per day: post any Larp Check today to see everyone's today.
create or replace function public.has_posted_larp_check(p_window_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.larp_checks lc
    join public.larp_check_windows mine on mine.id = lc.window_id
    join public.larp_check_windows target on target.id = p_window_id
    where lc.user_id = auth.uid() and mine.window_date = target.window_date
  );
$$;

create table public.larp_check_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  enabled boolean not null default true,
  days smallint[] not null default '{0,1,2,3,4,5,6}',   -- 0 = Sunday (JS getDay)
  start_minute int not null default 600 check (start_minute between 0 and 1439),
  end_minute int not null default 1260 check (end_minute between 1 and 1440),
  updated_at timestamptz not null default now(),
  check (end_minute - start_minute >= 60),              -- a 1h+ window keeps it a surprise
  check (days <@ '{0,1,2,3,4,5,6}'::smallint[])
);

alter table public.larp_check_prefs enable row level security;

create policy "users read their own larp check prefs"
  on public.larp_check_prefs for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.larp_check_prefs from authenticated, anon;

-- Planned fire times. Deliberately unreadable by clients: knowing the moment
-- in advance would defeat the point.
create table public.larp_check_schedule (
  user_id uuid not null references public.profiles (id) on delete cascade,
  local_date date not null,
  fire_at timestamptz not null,
  window_id uuid references public.larp_check_windows (id) on delete set null,
  primary key (user_id, local_date)
);

alter table public.larp_check_schedule enable row level security;
revoke all on public.larp_check_schedule from authenticated, anon;

-- Plan today + tomorrow for everyone (or one user). Idempotent.
create or replace function public.plan_larp_checks(p_user_id uuid default null)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  d date;
  lo int;
  cur int;
  off int;
  v_fire timestamptz;
  n int := 0;
begin
  for r in
    select p.id, p.timezone,
      coalesce(lp.enabled, true) as enabled,
      coalesce(lp.days, '{0,1,2,3,4,5,6}'::smallint[]) as days,
      coalesce(lp.start_minute, 600) as sm,
      coalesce(lp.end_minute, 1260) as em
    from public.profiles p
    left join public.larp_check_prefs lp on lp.user_id = p.id
    where p.onboarded_at is not null and (p_user_id is null or p.id = p_user_id)
  loop
    continue when not r.enabled;
    for off in 0..1 loop
      d := (now() at time zone r.timezone)::date + off;
      continue when not (extract(dow from d)::smallint = any (r.days));
      lo := r.sm;
      if off = 0 then
        cur := extract(hour from (now() at time zone r.timezone))::int * 60
             + extract(minute from (now() at time zone r.timezone))::int;
        lo := greatest(lo, cur + 1);
      end if;
      continue when r.em - lo < 3;  -- need room for the 2-minute window
      v_fire := ((d + make_interval(mins => lo + floor(random() * (r.em - lo - 2))::int))::timestamp)
                at time zone r.timezone;
      insert into public.larp_check_schedule (user_id, local_date, fire_at)
      values (r.id, d, v_fire)
      on conflict do nothing;
      if found then n := n + 1; end if;
    end loop;
  end loop;
  return n;
end;
$$;

-- Expo push via pg_net. Best-effort: never fails the caller.
create or replace function public.send_expo_push(p_user_id uuid, p_title text, p_body text, p_data jsonb default '{}')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_msgs jsonb;
begin
  select jsonb_agg(jsonb_build_object(
    'to', t.expo_token, 'title', p_title, 'body', p_body,
    'data', p_data, 'sound', 'default', 'priority', 'high'))
  into v_msgs
  from public.push_tokens t
  where t.user_id = p_user_id and t.platform <> 'web';
  if v_msgs is null then return; end if;
  begin
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := v_msgs,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  exception when others then
    raise warning 'expo push failed: %', sqlerrm;
  end;
end;
$$;

-- Every minute: open a personal 2-minute window for anyone whose moment has come.
create or replace function public.fire_due_larp_checks()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_window uuid;
  n int := 0;
begin
  for r in
    select s.user_id, s.local_date
    from public.larp_check_schedule s
    where s.window_id is null
      and s.fire_at <= now()
      and s.fire_at > now() - interval '15 minutes'   -- never fire stale checks
    for update skip locked
  loop
    insert into public.larp_check_windows (region, window_date, fired_at, user_id)
    values ('personal', r.local_date, now(), r.user_id)
    on conflict (user_id, window_date) where user_id is not null
    do update set fired_at = excluded.fired_at
    returning id into v_window;

    update public.larp_check_schedule set window_id = v_window
    where user_id = r.user_id and local_date = r.local_date;

    insert into public.notifications (recipient_id, type, data)
    values (r.user_id, 'larp_check', jsonb_build_object('window_id', v_window));

    perform public.send_expo_push(
      r.user_id, '⚡ Larp Check!', 'Two minutes. Show what you''re practising.',
      jsonb_build_object('url', '/larp-check'));
    n := n + 1;
  end loop;
  return n;
end;
$$;

create or replace function public.set_larp_check_prefs(
  p_enabled boolean,
  p_days smallint[],
  p_start_minute int,
  p_end_minute int
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.larp_check_prefs (user_id, enabled, days, start_minute, end_minute, updated_at)
  values (auth.uid(), p_enabled, p_days, p_start_minute, p_end_minute, now())
  on conflict (user_id) do update
    set enabled = excluded.enabled,
        days = excluded.days,
        start_minute = excluded.start_minute,
        end_minute = excluded.end_minute,
        updated_at = now();
  -- Re-roll anything not yet fired so new hours take effect immediately.
  delete from public.larp_check_schedule where user_id = auth.uid() and window_id is null;
  perform public.plan_larp_checks(auth.uid());
end;
$$;

-- Dev menu: fire a personal Larp Check for the caller right now.
create or replace function public.dev_trigger_larp_check(p_region text default 'au-vic')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_date date;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  v_date := (now() at time zone coalesce(
    (select timezone from public.profiles where id = auth.uid()), 'UTC'))::date;
  insert into public.larp_check_windows (region, window_date, fired_at, user_id)
  values ('personal', v_date, now(), auth.uid())
  on conflict (user_id, window_date) where user_id is not null
  do update set fired_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

-- Internal jobs are not client-callable.
revoke execute on function public.plan_larp_checks(uuid) from public, anon, authenticated;
revoke execute on function public.fire_due_larp_checks() from public, anon, authenticated;
revoke execute on function public.send_expo_push(uuid, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.can_read_media_object(text) from public, anon;
grant execute on function public.can_read_media_object(text) to authenticated;

-- ═══ Scheduler (pg_cron) + HTTP (pg_net) — optional in some environments ════
do $$
begin
  create extension if not exists pg_net;
exception when others then
  raise notice 'pg_net unavailable, Larp Check push disabled: %', sqlerrm;
end $$;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('larp-check-plan', '*/15 * * * *', 'select public.plan_larp_checks()');
  perform cron.schedule('larp-check-fire', '* * * * *', 'select public.fire_due_larp_checks()');
exception when others then
  raise notice 'pg_cron unavailable, Larp Checks will not auto-fire: %', sqlerrm;
end $$;
