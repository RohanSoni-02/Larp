-- 0015: official guides — the cold-start content for a brand-new community.
--
-- A new social app has no posts, so every first-time visitor lands on an empty
-- feed. The industry-standard answer is editorial seeding: a handful of
-- clearly-labelled official accounts that publish useful starter content, not a
-- crowd of fake "users". Everything here follows three rules:
--
--   1. Honest. Guides are flagged `is_official`, carry a visible badge, say they
--      are not real people, and have no tier, XP, streak, kudos, comments or
--      follower counts that they did not earn. Nothing here fabricates social
--      proof (the FTC's 2024 rule on fake indicators of social-media influence
--      covers fake accounts, likes and followers).
--   2. Temporary. The client fades guide posts out of "For You" as real posts
--      arrive (src/features/posts/blend.ts); guides are never ranked.
--   3. Contained. Guides cannot log in or receive messages, are kept off the
--      leaderboards, and only the service role can change what makes an account
--      official.
--
-- Images live in the public `official` storage bucket. Locally they are loaded
-- from supabase/seed-media by `supabase db reset`; for a hosted project run
-- `npx supabase seed buckets --linked` after `supabase db push`.

-- ─── columns ─────────────────────────────────────────────────────────────────
alter table public.profiles
  add column is_official boolean not null default false,
  add column avatar_path text;                    -- object path in the public `official` bucket

comment on column public.profiles.is_official is
  'larpr-run guide account. Set only by migrations / the service role.';
comment on column public.profiles.avatar_path is
  'Photo avatar: object path in the public `official` bucket. Null = initials avatar.';

alter table public.media
  add column public_path text;                    -- object path in the public `official` bucket

comment on column public.media.public_path is
  'Set for official guide photos, which live in the public bucket instead of the private `media` one.';

-- ─── guards ──────────────────────────────────────────────────────────────────
-- Clients may edit their own profile row, but never the columns that make an
-- account official or give it a photo (no upload flow exists yet).
create or replace function public.protect_official_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.is_official is distinct from old.is_official
          or new.avatar_path is distinct from old.avatar_path) then
    raise exception 'official and avatar fields cannot be written by clients';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_official
  before update on public.profiles
  for each row execute function public.protect_official_columns();

-- Same rule as before, plus: a client can never point media at the public bucket.
create or replace function public.force_media_defaults()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    new.status := 'pending';
    new.moderation := null;
    new.public_path := null;
  end if;
  return new;
end;
$$;

-- Guides are announcements, not people: nobody can open a chat with one.
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
  if exists (select 1 from public.profiles where id = p_user_id and is_official) then
    raise exception 'Official larpr accounts can''t receive messages.';
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

-- ─── public bucket for guide photos ─────────────────────────────────────────
-- Public buckets serve reads without RLS. No insert/update/delete policies are
-- created, so only the service role (the seed command) can write to it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('official', 'official', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ─── the guides ──────────────────────────────────────────────────────────────
create temp table guide_seed (idx int, slug text, handle text, display_name text, color text);
insert into guide_seed values
  (1, 'calisthenics', 'larpr.calisthenics', 'larpr Calisthenics',   '#E0548A'),
  (2, 'piano',        'larpr.piano',        'larpr Piano',          '#2F8FDE'),
  (3, 'candle',       'larpr.candle',       'larpr Candle making',  '#F08A24'),
  (4, 'guitar',       'larpr.guitar',       'larpr Guitar',         '#65A30D'),
  (5, 'drawing',      'larpr.drawing',      'larpr Drawing',        '#C026D3'),
  (6, 'baking',       'larpr.baking',       'larpr Baking',         '#CA8A04'),
  (7, 'pottery',      'larpr.pottery',      'larpr Pottery',        '#C2410C'),
  (8, 'spanish',      'larpr.spanish',      'larpr Spanish',        '#DC2626'),
  (9, 'penspin',      'larpr.penspin',      'larpr Pen spinning',   '#0891B2');

-- Two evergreen posts per guide: a starter session and a tip. Written as
-- guidance from the larpr team, never as first-person experience.
create temp table guide_posts (slug text, n int, node text, minutes int, label text, days_ago int, note text);
insert into guide_posts values
  ('calisthenics', 1, 'Dead hangs',  12, 'Starter session', 1,
   $n$Three dead hangs, as long as you can hold, with a full minute of rest between them. Keep your shoulders down and away from your ears. Log your best hold, then beat it next week.$n$),
  ('calisthenics', 2, 'Push-ups',    15, 'Guide tip', 6,
   $n$Form check: hands under your shoulders, body in one straight line, chest down to a fist's height off the floor. If you can't hold that for five reps, raise your hands on a bench and log it. Honest reps are the ones that count.$n$),

  ('piano', 1, 'C major scale',      15, 'Starter session', 2,
   $n$C major, right hand only, metronome at 60. Four clean passes, then repeat with the left hand. Speed is the reward for playing it clean, not the goal.$n$),
  ('piano', 2, 'Treble clef',        20, 'Guide tip', 7,
   $n$Practise hands separately until each one feels boring, then play together at half speed. Slow and clean beats fast and messy every time.$n$),

  ('candle', 1, 'Container candle',  45, 'Starter session', 1,
   $n$Your first container candle: melt soy wax to about 185°F, stir in fragrance oil (6-10% by weight, check your wax maker's guide), pour at around 135°F and keep the wick centred while it sets. Let it cure for a week before you judge it.$n$),
  ('candle', 2, 'Wick sizing',       30, 'Guide tip', 8,
   $n$Candle tunnelling? The wick is usually too small for the jar. Go up a wick size, then run a 3-4 hour burn test and check that the melt pool reaches the edge of the glass.$n$),

  ('guitar', 1, 'Open chords',       15, 'Starter session', 3,
   $n$Em, Am, D and G. Change slowly, one strum per chord, no rushing. Aim for zero buzzing before you add speed.$n$),
  ('guitar', 2, 'Smooth chord changes', 10, 'Guide tip', 9,
   $n$Lift your fingers together and move the whole chord shape as one unit instead of rebuilding it finger by finger. Two minutes of G to C a day beats one long session a week.$n$),

  ('drawing', 1, 'Shading a sphere', 25, 'Starter session', 2,
   $n$Draw a six-step value scale from light to dark, then shade a sphere using it. Keep the lightest area as pure paper and let the cast shadow be the darkest step.$n$),
  ('drawing', 2, 'Still life from life', 30, 'Guide tip', 10,
   $n$One lamp, one apple, thirty minutes. Squint to find the big shapes of light and shadow before you add a single detail.$n$),

  ('baking', 1, 'Sourdough starter', 10, 'Starter session', 3,
   $n$Feed your starter at the same time every day and mark the jar with a rubber band. It is ready to bake with when it doubles in four to eight hours and smells pleasantly tangy.$n$),
  ('baking', 2, 'Open crumb boule', 20, 'Guide tip', 11,
   $n$After the first slice, read the crumb: big, uneven holes point to good fermentation, while a tight, gummy crumb usually means it was under-proofed. Log what you change for the next bake.$n$),

  ('pottery', 1, 'Centering',        40, 'Starter session', 4,
   $n$Wedge a pound of clay, then centre it with steady pressure and your elbows braced against your body. Centre it ten times before you try to open it.$n$),
  ('pottery', 2, 'Matching set',     35, 'Guide tip', 12,
   $n$Making a set? Mark a stick with your target height and measure every piece against it so mug one and mug four match. Consistency is the skill.$n$),

  ('spanish', 1, 'Introduce yourself', 15, 'Starter session', 4,
   $n$Record a 60-second introduction in Spanish: your name, where you are from, why you are learning. Listen back once, fix one thing, and record it again.$n$),
  ('spanish', 2, 'Slow podcasts',    10, 'Guide tip', 13,
   $n$Shadow a slow podcast for ten minutes: pause, repeat the sentence out loud and copy the rhythm. Your ear improves before your vocabulary does.$n$),

  ('penspin', 1, 'ThumbAround',      10, 'Starter session', 5,
   $n$ThumbAround in slow motion. Hold the pen at its balance point, push it around your thumb with your index finger and catch it every single time. Speed comes later.$n$),
  ('penspin', 2, 'Charge',           10, 'Guide tip', 14,
   $n$If you are dropping the pen, you are practising at the right level. Sit over a bed or sofa so every drop is free, and count your catches instead of your drops.$n$);

do $$
declare
  g record;
  p record;
  uid uuid;
  sk uuid;
  node uuid;
  sid uuid;
  cid uuid;
  v_bio text;
  skill_name text;
begin
  for g in select * from guide_seed order by idx loop
    select s.id, s.name into sk, skill_name
    from public.skills s
    where s.slug = g.slug and s.status = 'approved';
    if sk is null then continue; end if;   -- this project doesn't have the skill; no guide for it

    uid := ('90000000-0000-4000-8000-' || lpad(to_hex(g.idx), 12, '0'))::uuid;

    -- A real auth row so the profile foreign key holds, but one nobody can use:
    -- no password, banned forever, and an address on a reserved TLD that can
    -- never receive a sign-in or reset email. Token columns must be '' not NULL.
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, banned_until,
      confirmation_token, recovery_token, reauthentication_token,
      email_change, email_change_token_new, email_change_token_current,
      phone_change, phone_change_token,
      email_change_confirm_status, is_sso_user, is_anonymous,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'guide-' || g.slug || '@guides.larpr.invalid', '',
      now(), now(), now(), 'infinity',
      '', '', '',
      '', '', '',
      '', '',
      0, false, false,
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('display_name', g.display_name)
    )
    on conflict (id) do nothing;

    v_bio := 'Official larpr guide to ' || lower(skill_name)
        || '. Starter sessions and tips from the larpr team, so there is always something to start from. Not a real person.';

    update public.profiles
       set handle = g.handle,
           display_name = g.display_name,
           bio = v_bio,
           avatar_color = g.color,
           avatar_path = 'avatars/' || g.slug || '.jpg',
           is_official = true,
           show_on_leaderboards = false,
           class_title = 'Official guide',
           onboarded_at = now()
     where id = uid
       and not exists (select 1 from public.profiles x where x.handle = g.handle and x.id <> uid);

    -- On the skill's roster at tier 0 with zero totals: guides never earn XP,
    -- tiers or streaks, so nothing about them looks like earned progress.
    insert into public.user_skills (user_id, skill_id)
    values (uid, sk)
    on conflict do nothing;

    for p in select * from guide_posts where slug = g.slug order by n loop
      select n.id into node
      from public.skill_nodes n
      join public.skill_branches b on b.id = n.branch_id
      where b.skill_id = sk and n.name = p.node
      limit 1;

      cid := md5('larpr-guide:' || g.slug || ':' || p.n)::uuid;

      insert into public.sessions (
        user_id, skill_id, node_id, started_at, duration_sec, note, label,
        landed_node, visibility, client_uuid, created_at
      ) values (
        uid, sk, node,
        now() - make_interval(days => p.days_ago),
        p.minutes * 60, p.note, p.label,
        false, 'public', cid, now() - make_interval(days => p.days_ago)
      )
      on conflict (user_id, client_uuid) do nothing;

      select s.id into sid from public.sessions s where s.user_id = uid and s.client_uuid = cid;

      insert into public.media (owner_id, session_id, kind, storage_key, public_path, status, moderation)
      values (
        uid, sid, 'image',
        'official/posts/' || g.slug || '-' || p.n || '.jpg',
        'posts/' || g.slug || '-' || p.n || '.jpg',
        'approved', '{"source":"larpr-official"}'::jsonb
      )
      on conflict (storage_key) do nothing;
    end loop;
  end loop;
end $$;
