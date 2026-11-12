-- 03: session visibility rules (public / followers / private) and block exclusion.
-- Sessions owned by user …0002 (jonah); viewer is user …0009 (sofia),
-- who does NOT follow jonah in the seed. Fixtures written as postgres
-- (clients can't write sessions by design).

delete from public.sessions
where id in (
  'ff000000-0000-4000-8000-000000000001',
  'ff000000-0000-4000-8000-000000000002',
  'ff000000-0000-4000-8000-000000000003'
);

insert into public.sessions (id, user_id, skill_id, started_at, duration_sec, visibility, client_uuid)
values
  ('ff000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000001', now(), 1800, 'public', gen_random_uuid()),
  ('ff000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000001', now(), 1800, 'followers', gen_random_uuid()),
  ('ff000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000001', now(), 1800, 'private', gen_random_uuid());

-- ── as user 9 (not a follower) ───────────────────────────────────────────────
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000009","role":"authenticated"}';

  do $$
  begin
    assert exists (select 1 from public.sessions where id = 'ff000000-0000-4000-8000-000000000001'),
      'public session should be visible to everyone';
    assert not exists (select 1 from public.sessions where id = 'ff000000-0000-4000-8000-000000000002'),
      'followers session should be hidden from non-followers';
    assert not exists (select 1 from public.sessions where id = 'ff000000-0000-4000-8000-000000000003'),
      'private session should be hidden from others';
  end $$;
rollback;

-- ── as user 9 after following user 2 ─────────────────────────────────────────
insert into public.follows (follower_id, followee_id)
values ('10000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002')
on conflict do nothing;

begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000009","role":"authenticated"}';

  do $$
  begin
    assert exists (select 1 from public.sessions where id = 'ff000000-0000-4000-8000-000000000002'),
      'followers session should be visible to followers';
    assert not exists (select 1 from public.sessions where id = 'ff000000-0000-4000-8000-000000000003'),
      'private session should stay hidden from followers';
  end $$;
rollback;

delete from public.follows
where follower_id = '10000000-0000-4000-8000-000000000009'
  and followee_id = '10000000-0000-4000-8000-000000000002';

-- ── blocks hide content in both directions ───────────────────────────────────
insert into public.blocks (blocker_id, blocked_id)
values ('10000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002')
on conflict do nothing;

begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000009","role":"authenticated"}';

  do $$
  begin
    assert not exists (select 1 from public.sessions where id = 'ff000000-0000-4000-8000-000000000001'),
      'blocked user''s public session must be hidden';
  end $$;
rollback;

delete from public.blocks
where blocker_id = '10000000-0000-4000-8000-000000000009'
  and blocked_id = '10000000-0000-4000-8000-000000000002';
delete from public.sessions
where id in (
  'ff000000-0000-4000-8000-000000000001',
  'ff000000-0000-4000-8000-000000000002',
  'ff000000-0000-4000-8000-000000000003'
);
