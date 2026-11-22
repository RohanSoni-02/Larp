-- 06: Direct messages are private to the two people in the conversation,
-- each pair gets exactly one thread, created_at can't be forged, and a block
-- in either direction stops new messages.
-- Users: 1 = maya, 3 = lena (the conversation), 2 = jonah (outsider).

begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';

  create temp table t_conv on commit drop as
    select public.start_conversation('10000000-0000-4000-8000-000000000003') as id;

  do $$
  declare
    v_id uuid := (select id from t_conv);
  begin
    assert public.start_conversation('10000000-0000-4000-8000-000000000003') = v_id,
      'starting again must reopen the same conversation';
    assert not exists (select 1 from public.list_conversations() where conversation_id = v_id),
      'a conversation with no messages stays out of the inbox';
    begin
      perform public.start_conversation('10000000-0000-4000-8000-000000000001');
      raise exception 'messaging yourself should be rejected';
    exception when raise_exception then
      if sqlerrm not like 'Pick someone else%' then raise; end if;
    end;
    begin
      insert into public.conversation_members (conversation_id, user_id)
      values (v_id, '10000000-0000-4000-8000-000000000002');
      raise exception 'clients must not add conversation members directly';
    exception when insufficient_privilege then null;
    end;
    begin
      insert into public.messages (conversation_id, sender_id, body, created_at)
      values (v_id, '10000000-0000-4000-8000-000000000001', 'from the past', now() - interval '1 day');
      raise exception 'clients must not set created_at';
    exception when insufficient_privilege then null;
    end;
    insert into public.messages (conversation_id, sender_id, body)
    values (v_id, '10000000-0000-4000-8000-000000000001', 'hey lena, candle tips?');
    assert (select unread_count from public.list_conversations() where conversation_id = v_id) = 0,
      'my own message is not unread for me';
  end $$;

  -- Lena joined at the same transaction timestamp; push her read marker back
  -- so the message counts as new for her.
  reset role;
  update public.conversation_members set last_read_at = now() - interval '1 minute'
  where user_id = '10000000-0000-4000-8000-000000000003';
  set local role authenticated;

  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}';
  do $$
  declare
    v_id uuid := (select id from t_conv);
  begin
    assert public.start_conversation('10000000-0000-4000-8000-000000000001') = v_id,
      'either person opens the same thread';
    assert (select count(*) from public.messages where conversation_id = v_id) = 1, 'lena reads the thread';
    assert (select unread_count from public.list_conversations() where conversation_id = v_id) = 1,
      'the message is unread for lena';
    assert (select other_id from public.list_conversations() where conversation_id = v_id)
      = '10000000-0000-4000-8000-000000000001', 'lena sees maya as the other person';
    perform public.mark_conversation_read(v_id);
  end $$;

  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
  do $$
  declare
    v_id uuid := (select id from t_conv);
  begin
    assert not exists (select 1 from public.conversations where id = v_id), 'outsiders see no conversation';
    assert not exists (select 1 from public.conversation_members where conversation_id = v_id),
      'outsiders see no members';
    assert not exists (select 1 from public.messages where conversation_id = v_id), 'outsiders read no messages';
    assert not exists (select 1 from public.list_conversations() where conversation_id = v_id),
      'outsiders don''t get the thread in their inbox';
    begin
      insert into public.messages (conversation_id, sender_id, body)
      values (v_id, '10000000-0000-4000-8000-000000000002', 'let me in');
      raise exception 'outsiders must not post into a conversation';
    exception when insufficient_privilege then null;
    end;
  end $$;

  -- Lena blocks Maya: Maya can no longer send or reopen, and the thread leaves both inboxes.
  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}';
  insert into public.blocks (blocker_id, blocked_id)
  values ('10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001');
  do $$
  declare
    v_id uuid := (select id from t_conv);
  begin
    assert not exists (select 1 from public.list_conversations() where conversation_id = v_id),
      'blocked threads leave the blocker''s inbox';
  end $$;

  set local "request.jwt.claims" = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
  do $$
  declare
    v_id uuid := (select id from t_conv);
  begin
    assert not exists (select 1 from public.list_conversations() where conversation_id = v_id),
      'blocked threads leave the blocked person''s inbox';
    begin
      insert into public.messages (conversation_id, sender_id, body)
      values (v_id, '10000000-0000-4000-8000-000000000001', 'still there?');
      raise exception 'a blocked sender must not be able to message';
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.start_conversation('10000000-0000-4000-8000-000000000003');
      raise exception 'a blocked sender must not reopen the conversation';
    exception when raise_exception then
      if sqlerrm not like 'You can''t message%' then raise; end if;
    end;
  end $$;
rollback;
