-- 0006: media, Larp Check, storage bucket + policies

create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  larp_check_id uuid,                             -- FK added below, after larp_checks exists
  kind public.media_kind not null,
  storage_key text not null unique,               -- "{owner_id}/{uuid}.{ext}" in the media bucket
  duration_ms int check (duration_ms is null or duration_ms between 0 and 30000),  -- clips cap 30 s
  status public.media_status not null default 'pending',
  moderation jsonb,                               -- provider response (moderation stub, Phase 4)
  created_at timestamptz not null default now(),
  check ((session_id is not null) <> (larp_check_id is not null))  -- exactly one target
);

alter table public.media enable row level security;

-- Owners always see their own media; others only after moderation approves it.
create policy "media visible to owner, or once approved"
  on public.media for select
  using (owner_id = auth.uid() or status = 'approved');

create policy "users upload their own media"
  on public.media for insert
  with check (auth.uid() = owner_id);

create policy "users delete their own media"
  on public.media for delete
  using (auth.uid() = owner_id);

revoke update on public.media from authenticated, anon;

create or replace function public.force_media_defaults()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    new.status := 'pending';
    new.moderation := null;
  end if;
  return new;
end;
$$;

create trigger media_force_defaults
  before insert on public.media
  for each row execute function public.force_media_defaults();

-- ─── Larp Check ──────────────────────────────────────────────────────────────
-- Daily random check-in windows, generated per region by a cron job (Phase 5).
create table public.larp_check_windows (
  id uuid primary key default gen_random_uuid(),
  region text not null,                            -- e.g. "au-vic"; client region mapping later
  window_date date not null,
  fired_at timestamptz not null,                   -- the random moment the push went out
  unique (region, window_date)
);

alter table public.larp_check_windows enable row level security;

create policy "windows are readable by signed-in users"
  on public.larp_check_windows for select
  using (auth.role() = 'authenticated');

revoke insert, update, delete on public.larp_check_windows from authenticated, anon;

create table public.larp_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  window_id uuid not null references public.larp_check_windows (id) on delete cascade,
  skill_id uuid not null references public.skills (id),
  work_media_id uuid references public.media (id),
  selfie_media_id uuid references public.media (id),
  posted_at timestamptz not null default now(),
  is_late boolean not null default false,          -- set by trigger from the window's fired_at
  created_at timestamptz not null default now(),
  unique (user_id, window_id)
);

alter table public.larp_checks enable row level security;

alter table public.media
  add constraint media_larp_check_fk
  foreign key (larp_check_id) references public.larp_checks (id) on delete cascade;

-- The BeReal blur, enforced in the database: other people's checks for a window
-- are only readable once YOU have posted for that window.
-- SECURITY DEFINER helper: reads larp_checks as the table owner, so the policy
-- below doesn't recurse into itself.
create or replace function public.has_posted_larp_check(p_window_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.larp_checks
    where user_id = auth.uid() and window_id = p_window_id
  );
$$;

create policy "larp checks hidden until you post your own"
  on public.larp_checks for select
  using (
    user_id = auth.uid()
    or (
      public.has_posted_larp_check(window_id)
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = larp_checks.user_id)
           or (b.blocker_id = larp_checks.user_id and b.blocked_id = auth.uid())
      )
    )
  );

create policy "users post their own larp check"
  on public.larp_checks for insert
  with check (auth.uid() = user_id);

revoke update, delete on public.larp_checks from authenticated, anon;

create or replace function public.set_larp_check_lateness()
returns trigger
language plpgsql
as $$
declare
  fired timestamptz;
begin
  select w.fired_at into fired from public.larp_check_windows w where w.id = new.window_id;
  if fired is not null then
    new.is_late := new.posted_at > fired + interval '2 minutes';
  end if;
  return new;
end;
$$;

create trigger larp_checks_set_lateness
  before insert on public.larp_checks
  for each row execute function public.set_larp_check_lateness();

-- ─── storage ─────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

-- Users upload only into their own folder: media/{user_id}/...
create policy "users write their own media folder"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Direct reads are owner-only; everyone else gets short-lived signed URLs from
-- an Edge Function that re-checks access (Phase 4).
create policy "users read their own media folder"
  on storage.objects for select
  using (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users delete their own media folder"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
