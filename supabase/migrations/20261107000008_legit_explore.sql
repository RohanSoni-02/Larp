-- 0008: Larp to Legit (vouches), quests, standards, co-op rooms, guilds, glow-ups

create table public.vouches (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.profiles (id) on delete cascade,
  vouchee_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  weight numeric(4,2) not null default 1,
  flagged boolean not null default false,          -- vouch-ring detection (Phase 7)
  created_at timestamptz not null default now(),
  unique (voucher_id, vouchee_id, skill_id),
  check (voucher_id <> vouchee_id)
);

alter table public.vouches enable row level security;

create policy "vouches are public"
  on public.vouches for select
  using (true);

-- No client writes: cast_vouch (Phase 7) checks eligibility, weight and rings.
revoke insert, update, delete on public.vouches from authenticated, anon;

-- ─── Side Quests ─────────────────────────────────────────────────────────────
create table public.quests (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references public.skills (id) on delete cascade,  -- null = any skill
  title text not null,
  description text not null,
  goal_days smallint not null check (goal_days between 1 and 7),
  starts_on date not null,
  ends_on date not null,
  created_by uuid references public.profiles (id), -- null = system quest
  created_at timestamptz not null default now(),
  check (ends_on > starts_on)
);

alter table public.quests enable row level security;

create policy "quests are public"
  on public.quests for select
  using (true);

revoke insert, update, delete on public.quests from authenticated, anon;

create table public.quest_participants (
  quest_id uuid not null references public.quests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  progress_days int not null default 0 check (progress_days >= 0),
  primary key (quest_id, user_id)
);

alter table public.quest_participants enable row level security;

create policy "participation is public"
  on public.quest_participants for select
  using (true);

create policy "users join quests as themselves"
  on public.quest_participants for insert
  with check (auth.uid() = user_id);

create policy "users leave quests as themselves"
  on public.quest_participants for delete
  using (auth.uid() = user_id);

revoke update on public.quest_participants from authenticated, anon;

-- ─── Standards (shared benchmarks with graded result ladders) ────────────────
create table public.standards (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills (id) on delete cascade,
  title text not null,
  description text not null,
  result_ladder jsonb not null default '[]'::jsonb,  -- ["95 lb for 5", "155 lb for 1", …]
  created_at timestamptz not null default now()
);

alter table public.standards enable row level security;

create policy "standards are public"
  on public.standards for select
  using (true);

revoke insert, update, delete on public.standards from authenticated, anon;

create table public.standard_attempts (
  id uuid primary key default gen_random_uuid(),
  standard_id uuid not null references public.standards (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,  -- the proof
  result_index smallint,                            -- which rung of the ladder was reached
  tier_at_attempt smallint not null default 0 check (tier_at_attempt between 0 and 3),
  note text,
  created_at timestamptz not null default now()
);

alter table public.standard_attempts enable row level security;

create policy "attempts are public"
  on public.standard_attempts for select
  using (true);

create policy "users log their own attempts"
  on public.standard_attempts for insert
  with check (auth.uid() = user_id);

revoke update, delete on public.standard_attempts from authenticated, anon;

-- ─── Co-op rooms (presence lives in Realtime, not the DB) ────────────────────
create table public.coop_rooms (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills (id) on delete cascade,
  title text not null,
  created_by uuid references public.profiles (id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.coop_rooms enable row level security;

alter table public.sessions
  add constraint sessions_room_fk
  foreign key (room_id) references public.coop_rooms (id);

create policy "live rooms are public"
  on public.coop_rooms for select
  using (true);

create policy "users open rooms"
  on public.coop_rooms for insert
  with check (auth.uid() = created_by);

create policy "hosts update their own rooms"
  on public.coop_rooms for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- ─── IRL guilds + events ─────────────────────────────────────────────────────
create table public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  skill_id uuid references public.skills (id) on delete set null,
  city text,
  place text,
  description text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.guilds enable row level security;

create policy "guilds are public"
  on public.guilds for select
  using (true);

create policy "users create guilds"
  on public.guilds for insert
  with check (auth.uid() = created_by);

create policy "creators update their own guilds"
  on public.guilds for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds (id) on delete cascade,
  title text not null,
  place text,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "events are public"
  on public.events for select
  using (true);

create policy "guild creators add events"
  on public.events for insert
  with check (
    exists (select 1 from public.guilds g where g.id = guild_id and g.created_by = auth.uid())
  );

create table public.rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.rsvp_status not null default 'going',
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.rsvps enable row level security;

create policy "rsvps are public"
  on public.rsvps for select
  using (true);

create policy "users manage their own rsvps"
  on public.rsvps for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Glow-up jobs (Phase 8 worker queue) ─────────────────────────────────────
create table public.glowup_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  status public.glowup_status not null default 'queued',
  first_media_id uuid references public.media (id),
  latest_media_id uuid references public.media (id),
  output_media_id uuid references public.media (id),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill_id)
);

alter table public.glowup_jobs enable row level security;

create policy "users see their own glow-up jobs"
  on public.glowup_jobs for select
  using (auth.uid() = user_id);

-- Enqueueing is a client action; processing states are worker-only (service role).
create policy "users enqueue their own glow-up"
  on public.glowup_jobs for insert
  with check (auth.uid() = user_id and status = 'queued');

revoke update, delete on public.glowup_jobs from authenticated, anon;
