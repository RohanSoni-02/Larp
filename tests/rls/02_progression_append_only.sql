-- 02: progression tables are server-only — a modified client cannot fake progress.
-- user …0003 = wickedwax.lena; skill …0002 = piano (not in her portfolio)

begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}';

  -- cannot insert XP directly
  do $$
  begin
    begin
      insert into public.xp_events (user_id, amount, reason)
      values ('10000000-0000-4000-8000-000000000003', 10000, 'session');
      raise exception 'FAIL: client could insert xp_events';
    exception when insufficient_privilege then null;
    end;
  end $$;

  -- cannot insert a session directly (save_session RPC only)
  do $$
  begin
    begin
      insert into public.sessions (user_id, skill_id, started_at, duration_sec, client_uuid)
      values ('10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002',
              now(), 3600, gen_random_uuid());
      raise exception 'FAIL: client could insert sessions';
    exception when insufficient_privilege then null;
    end;
  end $$;

  -- cannot write node progress directly
  do $$
  begin
    begin
      insert into public.node_progress (user_id, node_id, status)
      select '10000000-0000-4000-8000-000000000003', n.id, 'landed'
      from public.skill_nodes n
      join public.skill_branches b on b.id = n.branch_id
      where b.skill_id = '20000000-0000-4000-8000-000000000002'
      limit 1;
      raise exception 'FAIL: client could write node_progress';
    exception when insufficient_privilege then null;
    end;
  end $$;

  -- cannot insert a vouch directly
  do $$
  begin
    begin
      insert into public.vouches (voucher_id, vouchee_id, skill_id)
      values ('10000000-0000-4000-8000-000000000003',
              '10000000-0000-4000-8000-000000000001',
              '20000000-0000-4000-8000-000000000002');
      raise exception 'FAIL: client could insert vouches';
    exception when insufficient_privilege then null;
    end;
  end $$;

  -- CAN add a skill to own portfolio, but totals are forced to zero by trigger
  insert into public.user_skills (user_id, skill_id, tier, total_minutes, total_xp, nodes_landed)
  values ('10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002',
          3, 99999, 99999, 12)
  on conflict do nothing;

  do $$
  begin
    assert (select tier from public.user_skills
            where user_id = '10000000-0000-4000-8000-000000000003'
              and skill_id = '20000000-0000-4000-8000-000000000002') = 0,
      'FAIL: tier was not forced to 0 on insert';
    assert (select total_minutes from public.user_skills
            where user_id = '10000000-0000-4000-8000-000000000003'
              and skill_id = '20000000-0000-4000-8000-000000000002') = 0,
      'FAIL: total_minutes was not forced to 0 on insert';
  end $$;

  -- cannot update portfolio totals afterwards either
  do $$
  begin
    begin
      update public.user_skills set total_minutes = 99999
      where user_id = '10000000-0000-4000-8000-000000000003'
        and skill_id = '20000000-0000-4000-8000-000000000002';
      raise exception 'FAIL: client could update user_skills';
    exception when insufficient_privilege then null;
    end;
  end $$;

  -- cannot fabricate notifications
  do $$
  begin
    begin
      insert into public.notifications (recipient_id, type)
      values ('10000000-0000-4000-8000-000000000003', 'system');
      raise exception 'FAIL: client could insert notifications';
    exception when insufficient_privilege then null;
    end;
  end $$;
rollback;

-- cleanup fixture
delete from public.user_skills
where user_id = '10000000-0000-4000-8000-000000000003'
  and skill_id = '20000000-0000-4000-8000-000000000002';
