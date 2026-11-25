-- 07: Official larpr guides. Clients can't make themselves official, give
-- themselves a photo avatar, point media at the public bucket, or message a
-- guide. Guides are kept off the leaderboards and hold no earned progress.
-- Needs migration 0015 applied. User 1 = maya (a normal client).

begin;
  create temp table t_guide on commit drop as
    select id from public.profiles where is_official order by handle limit 1;

  do $$
  begin
    assert exists (select 1 from t_guide), 'migration 0015 should have created official guides';
    assert (select count(*) from public.profiles where is_official and show_on_leaderboards) = 0,
      'official guides must stay off the leaderboards';
    assert (select count(*) from public.user_skills us
              join public.profiles p on p.id = us.user_id
             where p.is_official and (us.total_xp > 0 or us.tier > 0)) = 0,
      'official guides must not hold earned XP or tiers';
  end $$;

  grant select on t_guide to authenticated;

  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';

  do $$
  declare
    v_guide uuid := (select id from t_guide);
    v_session uuid;
    v_public text;
  begin
    -- A client can't promote itself or set a photo avatar.
    begin
      update public.profiles set is_official = true
       where id = '10000000-0000-4000-8000-000000000001';
      raise exception 'clients must not set is_official';
    exception when raise_exception then
      if sqlerrm not like 'official and avatar fields%' then raise; end if;
    end;
    begin
      update public.profiles set avatar_path = 'avatars/piano.jpg'
       where id = '10000000-0000-4000-8000-000000000001';
      raise exception 'clients must not set avatar_path';
    exception when raise_exception then
      if sqlerrm not like 'official and avatar fields%' then raise; end if;
    end;

    -- Ordinary profile edits still work.
    update public.profiles set bio = 'still editable'
     where id = '10000000-0000-4000-8000-000000000001';

    -- A client can't aim its media at the public bucket.
    select id into v_session from public.sessions
     where user_id = '10000000-0000-4000-8000-000000000001' limit 1;
    insert into public.media (owner_id, session_id, kind, storage_key, public_path)
    values ('10000000-0000-4000-8000-000000000001', v_session, 'image',
            '10000000-0000-4000-8000-000000000001/rls07.jpg', 'posts/piano-1.jpg')
    returning public_path into v_public;
    assert v_public is null, 'client-supplied public_path must be discarded';

    -- Nobody can open a chat with a guide.
    begin
      perform public.start_conversation(v_guide);
      raise exception 'messaging a guide should be rejected';
    exception when raise_exception then
      if sqlerrm not like 'Official larpr accounts%' then raise; end if;
    end;
  end $$;
rollback;
