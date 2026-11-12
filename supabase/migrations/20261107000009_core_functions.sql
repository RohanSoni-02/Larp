-- 0009: core server functions — save_session (the anti-cheat core), vouching,
-- Larp Check XP, social notifications, quest progress.
-- Clients can NEVER write progression tables; everything flows through these
-- security-definer functions, which validate input and write the ledger.

-- Sessions gain a label (e.g. "Standard: 225 lb bench", "Co-op: Wheel night").
alter table public.sessions
  add column if not exists label text not null default '' check (char_length(label) <= 80);

-- ─── helpers ─────────────────────────────────────────────────────────────────

-- Recompute the denormalised profile caches from the ledger. Called by every
-- function that writes xp_events / user_skills.
create or replace function public.refresh_profile_caches(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_xp int;
  v_level int := 1;
  v_class text;
begin
  select coalesce(sum(amount), 0) into v_xp
  from public.xp_events where user_id = p_user_id;

  -- Level L starts at 50 · (L − 1) · L XP.
  while 50 * v_level * (v_level + 1) <= v_xp loop
    v_level := v_level + 1;
  end loop;

  -- RPG class = class titles of the two highest-tier skills, tier then XP order.
  select string_agg(s.class_title, ' ' order by us.tier desc, us.total_xp desc, s.name)
  into v_class
  from (
    select us.skill_id, us.tier, us.total_xp
    from public.user_skills us
    where us.user_id = p_user_id
    order by us.tier desc, us.total_xp desc
    limit 2
  ) us
  join public.skills s on s.id = us.skill_id;

  update public.profiles
  set xp_total = v_xp,
      larper_level = v_level,
      class_title = v_class
  where id = p_user_id;
end;
$$;

-- Recompute tier for one (user, skill): hours + nodes landed, node targets
-- capped at the number of nodes in the tree. Writes tier_history on change.
-- Returns the new tier.
create or replace function public.refresh_user_skill_tier(p_user_id uuid, p_skill_id uuid)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hours numeric;
  v_nodes int;
  v_tree int;
  v_old smallint;
  v_new smallint := 0;
begin
  select coalesce(us.total_minutes, 0) / 60.0, coalesce(us.nodes_landed, 0)
  into v_hours, v_nodes
  from public.user_skills us
  where us.user_id = p_user_id and us.skill_id = p_skill_id;
  v_hours := coalesce(v_hours, 0);
  v_nodes := coalesce(v_nodes, 0);

  select count(n.id) into v_tree
  from public.skill_nodes n
  join public.skill_branches b on b.id = n.branch_id
  where b.skill_id = p_skill_id;

  -- Apprentice: 5 h + 2 nodes · Adept: 25 h + 6 nodes · Legit: 100 h + 12 nodes
  if v_hours >= 5  and v_nodes >= least(2,  v_tree) then v_new := 1; end if;
  if v_hours >= 25 and v_nodes >= least(6,  v_tree) then v_new := 2; end if;
  if v_hours >= 100 and v_nodes >= least(12, v_tree) then v_new := 3; end if;

  select us.tier into v_old from public.user_skills us
  where us.user_id = p_user_id and us.skill_id = p_skill_id;

  if v_old is null then
    return 0;  -- skill not in portfolio; nothing to update
  end if;

  if v_new <> v_old then
    update public.user_skills
    set tier = v_new
    where user_id = p_user_id and skill_id = p_skill_id;

    if v_new > v_old then
      insert into public.tier_history (user_id, skill_id, tier)
      values (p_user_id, p_skill_id, v_new)
      on conflict do nothing;

      insert into public.notifications (recipient_id, type, data)
      values (p_user_id, 'tier_up', jsonb_build_object('skill_id', p_skill_id, 'tier', v_new));
    end if;
  end if;

  return v_new;
end;
$$;

-- ─── save_session ────────────────────────────────────────────────────────────
-- The only way a session (and XP, nodes, streaks, tiers) is ever written.
-- Idempotent on (user, client_uuid) so offline retries can't double-grant XP.
create or replace function public.save_session(
  p_client_uuid uuid,
  p_skill_id uuid,
  p_started_at timestamptz,
  p_duration_sec int,
  p_node_id uuid default null,
  p_note text default null,
  p_label text default '',
  p_visibility public.visibility_level default 'public',
  p_landed_node boolean default false,
  p_room_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_session_id uuid;
  v_existing uuid;
  v_minutes int;
  v_xp_session int;
  v_today_xp int;
  v_cap constant int := 240;  -- daily XP cap, anti-farming
  v_tz text;
  v_today date;
  v_node_skill uuid;
  v_sessions_to_land int := 5;
  v_node_name text;
  v_progress public.node_progress%rowtype;
  v_just_landed boolean := false;
  v_streak record;
  v_shield_earned boolean := false;
  v_tier_before smallint := 0;
  v_tier_after smallint := 0;
  v_level_before int;
  v_level_after int;
  v_xp_gained int := 0;
  v_breakdown jsonb := '[]'::jsonb;
  v_grant int;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  -- Idempotency: a retry with the same client_uuid returns the original result.
  select id into v_existing from public.sessions
  where user_id = v_user and client_uuid = p_client_uuid;
  if v_existing is not null then
    return jsonb_build_object('session_id', v_existing, 'already_saved', true, 'xp_gained', 0);
  end if;

  -- ── validate ──
  if p_duration_sec < 60 or p_duration_sec > 43200 then
    raise exception 'duration must be between 1 minute and 12 hours';
  end if;
  if p_started_at > now() + interval '5 minutes' then
    raise exception 'sessions cannot start in the future';
  end if;
  perform 1 from public.skills s
  where s.id = p_skill_id and (s.status = 'approved' or s.created_by = v_user);
  if not found then
    raise exception 'unknown or unavailable skill';
  end if;
  if p_node_id is not null then
    select b.skill_id, n.sessions_to_land, n.name
    into v_node_skill, v_sessions_to_land, v_node_name
    from public.skill_nodes n
    join public.skill_branches b on b.id = n.branch_id
    where n.id = p_node_id;
    if v_node_skill is distinct from p_skill_id then
      raise exception 'node does not belong to this skill';
    end if;
  end if;

  select coalesce(p.timezone, 'UTC'), p.larper_level into v_tz, v_level_before
  from public.profiles p where p.id = v_user;
  v_today := (now() at time zone v_tz)::date;

  -- ── the session itself ──
  insert into public.sessions (
    user_id, skill_id, node_id, room_id, started_at, duration_sec,
    note, label, visibility, landed_node, client_uuid
  ) values (
    v_user, p_skill_id, p_node_id, p_room_id, p_started_at, p_duration_sec,
    nullif(btrim(coalesce(p_note, '')), ''), coalesce(p_label, ''),
    p_visibility, p_landed_node and p_node_id is not null, p_client_uuid
  )
  returning id into v_session_id;

  -- Daily XP already earned (user's timezone day).
  select coalesce(sum(amount), 0) into v_today_xp
  from public.xp_events
  where user_id = v_user
    and (created_at at time zone v_tz)::date = v_today;

  -- ── XP: 1 per minute, minimum 5 per session, daily cap 240 ──
  v_minutes := greatest(1, round(p_duration_sec / 60.0));
  v_xp_session := greatest(5, v_minutes);
  v_grant := least(v_xp_session, greatest(0, v_cap - v_today_xp));
  if v_grant > 0 then
    insert into public.xp_events (user_id, skill_id, amount, reason, source_id)
    values (v_user, p_skill_id, v_grant, 'session', v_session_id);
    v_xp_gained := v_xp_gained + v_grant;
    v_breakdown := v_breakdown || jsonb_build_object('reason', 'session', 'amount', v_grant);
  end if;

  -- ── node progress: in_progress on practise, landed on checkbox or 5 sessions ──
  if p_node_id is not null then
    insert into public.node_progress (user_id, node_id, status, sessions_count)
    values (v_user, p_node_id, 'in_progress', 1)
    on conflict (user_id, node_id)
    do update set sessions_count = public.node_progress.sessions_count + 1
    returning * into v_progress;

    if v_progress.status <> 'landed'
       and (p_landed_node or v_progress.sessions_count >= v_sessions_to_land) then
      update public.node_progress
      set status = 'landed', landed_at = now(), proof_session_id = v_session_id
      where user_id = v_user and node_id = p_node_id;
      v_just_landed := true;

      -- +50 XP, once per node ever (unique ledger constraint).
      v_grant := least(50, greatest(0, v_cap - v_today_xp - v_xp_gained));
      if v_grant > 0 then
        insert into public.xp_events (user_id, skill_id, amount, reason, source_id)
        values (v_user, p_skill_id, v_grant, 'node_landed', p_node_id)
        on conflict do nothing;
        if found then
          v_xp_gained := v_xp_gained + v_grant;
          v_breakdown := v_breakdown || jsonb_build_object('reason', 'node_landed', 'amount', v_grant);
        end if;
      end if;
    end if;
  end if;

  -- ── streaks + shields, in the user's timezone ──
  insert into public.user_streaks (user_id, current_streak, longest_streak, last_activity_local_date, shields)
  values (v_user, 0, 0, null, 0)
  on conflict (user_id) do nothing;

  select * into v_streak from public.user_streaks where user_id = v_user for update;

  if v_streak.last_activity_local_date is distinct from v_today then
    declare
      v_new int;
      v_gap int;
    begin
      v_gap := v_today - coalesce(v_streak.last_activity_local_date, v_today - 1);
      if v_gap = 1 then
        v_new := v_streak.current_streak + 1;
      elsif v_gap = 2 and v_streak.shields > 0 then
        -- A shield covers exactly one missed day, automatically.
        v_new := v_streak.current_streak + 1;
        update public.user_streaks set shields = shields - 1 where user_id = v_user;
        insert into public.streak_shield_events (user_id, kind, local_date)
        values (v_user, 'used', v_today - 1);
      else
        v_new := 1;
      end if;

      update public.user_streaks
      set current_streak = v_new,
          longest_streak = greatest(longest_streak, v_new),
          last_activity_local_date = v_today
      where user_id = v_user;

      -- Every 7 days: +25 XP and a new shield (max 2).
      if v_new > v_streak.current_streak and v_new % 7 = 0 then
        v_grant := least(25, greatest(0, v_cap - v_today_xp - v_xp_gained));
        if v_grant > 0 then
          insert into public.xp_events (user_id, skill_id, amount, reason, source_id)
          values (v_user, p_skill_id, v_grant, 'streak_bonus', v_session_id);
          v_xp_gained := v_xp_gained + v_grant;
          v_breakdown := v_breakdown || jsonb_build_object('reason', 'streak_bonus', 'amount', v_grant);
        end if;
        if v_streak.shields < 2 then
          update public.user_streaks set shields = shields + 1 where user_id = v_user;
          insert into public.streak_shield_events (user_id, kind, local_date)
          values (v_user, 'earned', v_today);
          v_shield_earned := true;
        end if;
      end if;

      v_streak.current_streak := v_new;
    end;
  end if;

  -- ── portfolio totals + tier ──
  select coalesce(us.tier, 0) into v_tier_before
  from public.user_skills us where us.user_id = v_user and us.skill_id = p_skill_id;

  insert into public.user_skills (user_id, skill_id, tier, total_minutes, total_xp, nodes_landed)
  values (v_user, p_skill_id, 0, 0, 0, 0)
  on conflict (user_id, skill_id) do nothing;

  -- Direct UPDATE is revoked from clients; this runs as the function owner.
  update public.user_skills us
  set total_minutes = us.total_minutes + v_minutes,
      total_xp = us.total_xp + v_xp_gained,
      nodes_landed = (
        select count(*) from public.node_progress np
        join public.skill_nodes n on n.id = np.node_id
        join public.skill_branches b on b.id = n.branch_id
        where np.user_id = v_user and b.skill_id = p_skill_id and np.status = 'landed'
      )
  where us.user_id = v_user and us.skill_id = p_skill_id;

  v_tier_after := public.refresh_user_skill_tier(v_user, p_skill_id);

  -- ── weekly quest progress (joined, active, matching skill or any-skill) ──
  update public.quest_participants qp
  set progress_days = sub.days
  from (
    select q.id as quest_id, count(distinct (s.started_at at time zone v_tz)::date) as days
    from public.quests q
    join public.sessions s
      on s.user_id = v_user
     and (q.skill_id is null or q.skill_id = s.skill_id)
     and (s.started_at at time zone v_tz)::date between q.starts_on and q.ends_on
    where q.ends_on >= v_today
    group by q.id
  ) sub
  where qp.quest_id = sub.quest_id and qp.user_id = v_user;

  -- ── profile caches + level-up notification ──
  perform public.refresh_profile_caches(v_user);

  select p.larper_level into v_level_after from public.profiles p where p.id = v_user;
  if v_level_after > v_level_before then
    insert into public.notifications (recipient_id, type, data)
    values (v_user, 'system', jsonb_build_object('kind', 'level_up', 'level', v_level_after));
  end if;

  return jsonb_build_object(
    'session_id', v_session_id,
    'already_saved', false,
    'xp_gained', v_xp_gained,
    'xp_breakdown', v_breakdown,
    'daily_cap_reached', (v_today_xp + v_xp_gained) >= v_cap,
    'just_landed', v_just_landed,
    'node_name', case when v_just_landed then v_node_name else null end,
    'streak', v_streak.current_streak,
    'shield_earned', v_shield_earned,
    'tier_before', v_tier_before,
    'tier_after', v_tier_after,
    'tier_up', v_tier_after > v_tier_before,
    'level_before', v_level_before,
    'level_after', v_level_after,
    'level_up', v_level_after > v_level_before
  );
end;
$$;

-- ─── vouching ────────────────────────────────────────────────────────────────
-- Only users at a HIGHER tier than the vouchee in that skill can vouch.
-- Weight = voucher's tier (full ring detection + history weighting in Phase 7).
create or replace function public.cast_vouch(p_vouchee_id uuid, p_skill_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_my_tier smallint;
  v_their_tier smallint;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if v_user = p_vouchee_id then raise exception 'you cannot vouch for yourself'; end if;

  select coalesce((select us.tier from public.user_skills us
                  where us.user_id = v_user and us.skill_id = p_skill_id), 0)
  into v_my_tier;
  select coalesce((select us.tier from public.user_skills us
                  where us.user_id = p_vouchee_id and us.skill_id = p_skill_id), 0)
  into v_their_tier;

  if v_my_tier <= v_their_tier then
    raise exception 'only members at a higher tier can vouch';
  end if;

  insert into public.vouches (voucher_id, vouchee_id, skill_id, weight)
  values (v_user, p_vouchee_id, p_skill_id, v_my_tier)
  on conflict (voucher_id, vouchee_id, skill_id) do nothing;

  insert into public.notifications (recipient_id, actor_id, type, data)
  values (p_vouchee_id, v_user, 'vouch', jsonb_build_object('skill_id', p_skill_id));
end;
$$;

create or replace function public.remove_vouch(p_vouchee_id uuid, p_skill_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.vouches
  where voucher_id = auth.uid() and vouchee_id = p_vouchee_id and skill_id = p_skill_id;
end;
$$;

-- ─── Larp Check: +10 XP for on-time posts ────────────────────────────────────
create or replace function public.grant_larp_check_xp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.is_late then
    insert into public.xp_events (user_id, skill_id, amount, reason, source_id)
    values (new.user_id, new.skill_id, 10, 'larp_check', new.id)
    on conflict do nothing;
    perform public.refresh_profile_caches(new.user_id);
  end if;
  return new;
end;
$$;

create trigger larp_checks_grant_xp
  after insert on public.larp_checks
  for each row execute function public.grant_larp_check_xp();

-- ─── social notifications (kudos, comments, follows) ────────────────────────
create or replace function public.notify_social()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  if tg_table_name = 'follows' then
    insert into public.notifications (recipient_id, actor_id, type)
    values (new.followee_id, new.follower_id, 'follow');

  elsif tg_table_name = 'kudos' then
    select coalesce(
      (select s.user_id from public.sessions s where s.id = new.session_id),
      (select lc.user_id from public.larp_checks lc where lc.id = new.larp_check_id)
    ) into v_owner;
    if v_owner is not null and v_owner <> new.giver_id then
      insert into public.notifications (recipient_id, actor_id, type, data)
      values (v_owner, new.giver_id, 'kudos',
              jsonb_build_object('label', new.label, 'session_id', new.session_id,
                                 'larp_check_id', new.larp_check_id));
    end if;

  elsif tg_table_name = 'comments' then
    select coalesce(
      (select s.user_id from public.sessions s where s.id = new.session_id),
      (select lc.user_id from public.larp_checks lc where lc.id = new.larp_check_id)
    ) into v_owner;
    if v_owner is not null and v_owner <> new.author_id then
      insert into public.notifications (recipient_id, actor_id, type, data)
      values (v_owner, new.author_id, 'comment',
              jsonb_build_object('body', left(new.body, 120), 'session_id', new.session_id,
                                 'larp_check_id', new.larp_check_id));
    end if;
    -- Replies also notify the parent comment's author.
    if new.parent_id is not null then
      select c.author_id into v_owner from public.comments c where c.id = new.parent_id;
      if v_owner is not null and v_owner <> new.author_id and v_owner is distinct from
         (select coalesce((select s.user_id from public.sessions s where s.id = new.session_id),
                          (select lc.user_id from public.larp_checks lc where lc.id = new.larp_check_id))) then
        insert into public.notifications (recipient_id, actor_id, type, data)
        values (v_owner, new.author_id, 'comment',
                jsonb_build_object('body', left(new.body, 120), 'reply', true,
                                   'session_id', new.session_id, 'larp_check_id', new.larp_check_id));
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger follows_notify
  after insert on public.follows
  for each row execute function public.notify_social();
create trigger kudos_notify
  after insert on public.kudos
  for each row execute function public.notify_social();
create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_social();

-- Recipients read their own notifications; marking read is the only client update.
create or replace function public.mark_notifications_read()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notifications
  set read_at = now()
  where recipient_id = auth.uid() and read_at is null;
end;
$$;
