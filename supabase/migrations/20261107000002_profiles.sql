-- 0002: profiles, push tokens, signup trigger, account deletion
-- Every table in this project has RLS enabled in the same migration that creates it.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle citext not null unique,
  display_name text not null default '',
  bio text,
  avatar_color text not null default '#5B3DF5',
  timezone text not null default 'UTC',           -- IANA name; streaks/daily resets use this
  reminder_time time,
  onboarded_at timestamptz,                        -- set when onboarding completes
  -- Cached progression values. Written ONLY by security-definer functions.
  xp_total int not null default 0 check (xp_total >= 0),
  larper_level int not null default 1 check (larper_level >= 1),
  class_title text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are public"
  on public.profiles for select
  using (true);

create policy "users update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cache columns must never be written by clients, even their own row.
revoke update (xp_total, larper_level, class_title, created_at) on public.profiles from authenticated, anon;

-- Defense in depth on top of the column revoke.
create or replace function public.protect_profile_caches()
returns trigger
language plpgsql
as $$
begin
  -- current_user is the function owner inside security-definer functions
  -- (save_session & co.), but the client role ('authenticated') for direct
  -- writes. auth.role() reads the JWT, which is set in both cases — so the
  -- database role is the reliable signal.
  if current_user in ('authenticated', 'anon')
     and (new.xp_total is distinct from old.xp_total
          or new.larper_level is distinct from old.larper_level
          or new.class_title is distinct from old.class_title) then
    raise exception 'progression caches are server-computed and cannot be written by clients';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_caches
  before update on public.profiles
  for each row execute function public.protect_profile_caches();

-- ─── push tokens ────────────────────────────────────────────────────────────
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

create policy "users manage their own push tokens"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── signup trigger ─────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  final_handle text;
  n int := 0;
begin
  base_handle := lower(regexp_replace(
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'larper'),
    '[^a-z0-9]+', '', 'g'));
  if base_handle = '' then
    base_handle := 'larper';
  end if;
  final_handle := base_handle;
  while exists (select 1 from public.profiles where handle = final_handle) loop
    n := n + 1;
    final_handle := base_handle || n::text;
  end loop;

  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    final_handle,
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── account deletion (Apple App Store requirement) ─────────────────────────
-- Deletes the auth user; every public table cascades from auth.users/profiles.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
