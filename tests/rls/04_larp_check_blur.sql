-- 04: Larp Check blur — others' checks are unreadable until you post your own.
-- The seed has checks from users 1, 10 and 3 in window …0001 (au-vic, today).

-- ── as user 2 (has NOT posted): sees nothing ─────────────────────────────────
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';

  do $$
  begin
    assert (select count(*) from public.larp_checks
            where window_id = '82000000-0000-4000-8000-000000000001') = 0,
      'larp checks must stay hidden until you post your own';
  end $$;
rollback;

-- ── as user 4 (has NOT posted): hidden, then visible after posting ───────────
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated"}';

  do $$
  begin
    assert (select count(*) from public.larp_checks
            where window_id = '82000000-0000-4000-8000-000000000001') = 0,
      'larp checks must stay hidden before posting';
  end $$;

  -- user 4 posts their own check (insert allowed; is_late computed by trigger)
  insert into public.larp_checks (user_id, window_id, skill_id)
  values ('10000000-0000-4000-8000-000000000004',
          '82000000-0000-4000-8000-000000000001',
          '20000000-0000-4000-8000-000000000001');

  do $$
  begin
    assert (select count(*) from public.larp_checks
            where window_id = '82000000-0000-4000-8000-000000000001') = 4,
      'after posting, the whole window should be visible';
    assert (select is_late from public.larp_checks
            where user_id = '10000000-0000-4000-8000-000000000004'
              and window_id = '82000000-0000-4000-8000-000000000001') = true,
      'posting 2 h after the window fired must be marked late';
  end $$;
rollback;

delete from public.larp_checks
where user_id = '10000000-0000-4000-8000-000000000004'
  and window_id = '82000000-0000-4000-8000-000000000001';
