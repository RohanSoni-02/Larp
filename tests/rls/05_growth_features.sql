-- 05: Mentorship threads are private to the two participants, templates are
-- per-user, and Larp Check prefs / feedback can only be written through RPCs.
-- The seed has one answered request from user 1 (maya) to user 7 (aisha).

-- ── as user 2 (outsider): cannot read or forge feedback threads ──────────────
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';

  do $$
  begin
    assert (select count(*) from public.feedback_requests) = 0,
      'outsiders must not see feedback threads';
    begin
      insert into public.feedback_requests (requester_id, mentor_id, skill_id, message)
      values ('10000000-0000-4000-8000-000000000002',
              '10000000-0000-4000-8000-000000000007',
              '20000000-0000-4000-8000-000000000001', 'hi');
      raise exception 'direct insert into feedback_requests should be denied';
    exception when insufficient_privilege then null;
    end;
    begin
      insert into public.larp_check_prefs (user_id) values ('10000000-0000-4000-8000-000000000002');
      raise exception 'direct insert into larp_check_prefs should be denied';
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.fire_due_larp_checks();
      raise exception 'clients must not be able to fire Larp Checks';
    exception when insufficient_privilege then null;
    end;
  end $$;

  insert into public.session_templates (name, blocks)
  values ('Mine', '[{"label":"Drill","minutes":10}]');
rollback;

-- ── as users 1 and 7: both participants see the thread ───────────────────────
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  do $$
  begin
    assert (select count(*) from public.feedback_requests) = 1, 'requester sees their request';
  end $$;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000007","role":"authenticated"}';
  do $$
  begin
    assert (select count(*) from public.feedback_requests) = 1, 'mentor sees the request';
  end $$;
rollback;

-- ── templates: another user's template is invisible ──────────────────────────
begin;
  insert into public.session_templates (user_id, name, blocks)
  values ('10000000-0000-4000-8000-000000000001', 'Maya plan', '[{"label":"Drill","minutes":10}]');
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
  do $$
  begin
    assert (select count(*) from public.session_templates where name = 'Maya plan') = 0,
      'templates must be private to their owner';
  end $$;
rollback;
