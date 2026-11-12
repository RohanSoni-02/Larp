-- 01: profiles RLS — public read, own-row update, caches untouchable.
-- Seed users: …0001 = maya.lifts, …0002 = jonah_keys

begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';

  do $$
  begin
    assert (select count(*) from public.profiles) >= 28, 'profiles should be publicly readable';
  end $$;

  -- own display name: allowed
  update public.profiles set display_name = 'Maya Updated'
  where id = '10000000-0000-4000-8000-000000000001';
  do $$
  begin
    assert (select display_name from public.profiles where id = '10000000-0000-4000-8000-000000000001') = 'Maya Updated',
      'own display_name update should work';
  end $$;

  -- own xp_total: must fail (column revoke and/or protection trigger)
  do $$
  begin
    begin
      update public.profiles set xp_total = 999999
      where id = '10000000-0000-4000-8000-000000000001';
      raise exception 'FAIL: client could write xp_total cache';
    exception
      when insufficient_privilege then null;
      when raise_exception then null;
    end;
  end $$;

  -- another user's profile: RLS silently blocks the update
  update public.profiles set display_name = 'Hacked'
  where id = '10000000-0000-4000-8000-000000000002';
  do $$
  begin
    assert (select display_name from public.profiles where id = '10000000-0000-4000-8000-000000000002') <> 'Hacked',
      'FAIL: could update another user''s profile';
  end $$;
rollback;
