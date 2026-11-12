-- 0004: progression — the tables clients must NEVER write directly.
-- All writes flow through security-definer functions (save_session in Phase 2,
-- cast_vouch in Phase 7). Read policies are permissive where the product shows
-- other people's progress; write grants are revoked from API roles entirely.

create table public.user_skills (
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  tier smallint not null default 0 check (tier between 0 and 3),
  total_minutes int not null default 0 check (total_minutes >= 0),
  total_xp int not null default 0 check (total_xp >= 0),
  nodes_landed int not null default 0 check (nodes_landed >= 0),
  started_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

alter table public.user_skills enable row level security;

create policy "portfolios are public"
  on public.user_skills for select
  using (true);

create policy "users add skills to their own portfolio"
  on public.user_skills for insert
  with check (auth.uid() = user_id);

create policy "users remove skills from their own portfolio"
  on public.user_skills for delete
  using (auth.uid() = user_id);

-- Progression columns are function-written only.
revoke update on public.user_skills from authenticated, anon;

create or replace function public.force_user_skill_defaults()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    new.tier := 0;
    new.total_minutes := 0;
    new.total_xp := 0;
    new.nodes_landed := 0;
  end if;
  return new;
end;
$$;

create trigger user_skills_force_defaults
  before insert on public.user_skills
  for each row execute function public.force_user_skill_defaults();

-- ─── sessions ───────────────────────────────────────────────────────────────
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id),
  node_id uuid references public.skill_nodes (id),
  room_id uuid,                                   -- FK added with co-op rooms migration
  started_at timestamptz not null,
  duration_sec int not null check (duration_sec between 60 and 43200),  -- 1 min .. 12 h
  note text check (char_length(note) <= 500),
  landed_node boolean not null default false,     -- the "I landed it" checkbox
  visibility public.visibility_level not null default 'public',
  client_uuid uuid not null,                      -- idempotency key for offline sync
  created_at timestamptz not null default now(),
  unique (user_id, client_uuid)
);

alter table public.sessions enable row level security;

create index sessions_user_recent on public.sessions (user_id, started_at desc);
create index sessions_skill_recent on public.sessions (skill_id, started_at desc);

create policy "sessions visible per visibility and blocks"
  on public.sessions for select
  using (
    user_id = auth.uid()
    or (
      not exists (
        select 1 from public.blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = sessions.user_id)
           or (b.blocker_id = sessions.user_id and b.blocked_id = auth.uid())
      )
      and (
        visibility = 'public'
        or (
          visibility = 'followers'
          and exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid() and f.followee_id = sessions.user_id
          )
        )
      )
    )
  );

-- No insert/update/delete policies for API roles: sessions are written only by
-- save_session (Phase 2) so a modified client cannot fake practice.
revoke insert, update, delete on public.sessions from authenticated, anon;

-- ─── node progress ──────────────────────────────────────────────────────────
create table public.node_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  node_id uuid not null references public.skill_nodes (id) on delete cascade,
  status public.node_status not null default 'in_progress',
  sessions_count int not null default 0 check (sessions_count >= 0),
  proof_session_id uuid references public.sessions (id),
  landed_at timestamptz,
  primary key (user_id, node_id)
);

alter table public.node_progress enable row level security;

create policy "node progress is public"
  on public.node_progress for select
  using (true);

revoke insert, update, delete on public.node_progress from authenticated, anon;

-- ─── XP ledger (append-only) ────────────────────────────────────────────────
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid references public.skills (id),
  amount int not null check (amount > 0),
  reason public.xp_reason not null,
  source_id uuid,                                 -- session/node/larp_check that earned it
  created_at timestamptz not null default now(),
  -- Idempotent: retrying the same source can never double-award.
  unique (user_id, reason, source_id)
);

alter table public.xp_events enable row level security;

create index xp_events_user on public.xp_events (user_id, created_at desc);

create policy "users read their own XP ledger"
  on public.xp_events for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.xp_events from authenticated, anon;

-- ─── streaks ────────────────────────────────────────────────────────────────
create table public.user_streaks (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_streak int not null default 0 check (current_streak >= 0),
  longest_streak int not null default 0 check (longest_streak >= 0),
  last_activity_local_date date,                  -- in the user's timezone
  shields int not null default 0 check (shields between 0 and 2)
);

alter table public.user_streaks enable row level security;

create policy "users read their own streak"
  on public.user_streaks for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.user_streaks from authenticated, anon;

create table public.streak_shield_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.shield_event_kind not null,
  local_date date not null,
  created_at timestamptz not null default now()
);

alter table public.streak_shield_events enable row level security;

create policy "users read their own shield events"
  on public.streak_shield_events for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.streak_shield_events from authenticated, anon;

-- ─── tier history (badges, glow-ups, notifications) ─────────────────────────
create table public.tier_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  tier smallint not null check (tier between 0 and 3),
  achieved_at timestamptz not null default now(),
  unique (user_id, skill_id, tier)
);

alter table public.tier_history enable row level security;

create policy "tier history is public"
  on public.tier_history for select
  using (true);

revoke insert, update, delete on public.tier_history from authenticated, anon;
