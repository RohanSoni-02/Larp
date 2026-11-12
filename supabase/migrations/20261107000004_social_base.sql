-- 0004: social base — follows, blocks, reports, notifications.
-- (Before progression: session visibility policies reference follows/blocks.)

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

alter table public.follows enable row level security;

create index follows_followee on public.follows (followee_id);

create policy "follows are public"
  on public.follows for select
  using (true);

create policy "users follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "users unfollow as themselves"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ─── blocks (App Store requirement; feeds and policies exclude both directions) ─
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "users see their own blocks"
  on public.blocks for select
  using (auth.uid() = blocker_id);

create policy "users block as themselves"
  on public.blocks for insert
  with check (auth.uid() = blocker_id);

create policy "users unblock as themselves"
  on public.blocks for delete
  using (auth.uid() = blocker_id);

-- ─── reports (App Store requirement) ─────────────────────────────────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('session', 'comment', 'profile', 'larp_check')),
  target_id uuid not null,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "users file reports as themselves"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "users see their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- ─── notifications ───────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create index notifications_recipient on public.notifications (recipient_id, created_at desc);

create policy "users read their own notifications"
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy "users mark their own notifications read"
  on public.notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

revoke update (recipient_id, actor_id, type, data, created_at) on public.notifications
  from authenticated, anon;

-- No client insert: notifications are created by triggers/functions only.
revoke insert, delete on public.notifications from authenticated, anon;
