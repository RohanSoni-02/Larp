-- seed.sql — local development seed, mirroring the mock community in larping-app.html.
-- Runs on `supabase db reset`. All mock users sign in with password: password123
-- Deterministic UUIDs: users 10000000-…, skills 20000000-…, branches 30000000-…,
-- nodes 40000000-…, quests 50000000-…, standards 60000000-…, rooms 70000000-….

-- ═══ temp staging tables (readable seed data) ═══════════════════════════════
create temp table seed_users (idx int, handle text, display_name text, color text, bio text);
insert into seed_users values
  (1,  'maya.lifts',     'Maya R.',  '#E0548A', 'Five months of negatives. Pull-ups now.'),
  (2,  'jonah_keys',     'Jonah K.', '#2F8FDE', 'Week two of piano. Be nice.'),
  (3,  'wickedwax.lena', 'Lena W.',  '#F08A24', 'Small-batch soy candles. Teaching on Saturdays.'),
  (4,  'devpushes',      'Dev P.',   '#7A5CFF', 'Handstands and bad piano.'),
  (5,  'priyaplays',     'Priya S.', '#1E9E62', 'Learning by ear, then reading.'),
  (6,  'theo.melts',     'Theo M.',  '#D35D47', 'First candle tunnelled. Still proud.'),
  (7,  'aisha.lever',    'Aisha B.', '#B23A8F', 'Front lever club. Coach at Pull Studio.'),
  (8,  'marco.chords',   'Marco D.', '#3D7DCA', 'Jazz chords and soy wax.'),
  (9,  'sofia.pours',    'Sofia L.', '#C98A1B', 'Colour layering obsessive.'),
  (10, 'kenji.plays',    'Kenji T.', '#2B59C3', 'Piano teacher. Sight-reading drills daily.'),
  (11, 'hana.flame',     'Hana C.',  '#C2571A', 'Scent blending notes in every caption.'),
  (12, 'ruben.reps',     'Ruben O.', '#5E8C31', 'Day 9. Knee push-ups and that''s fine.'),
  (13, 'zoe.ivories',    'Zoe F.',   '#6A4C93', 'Adult beginner, 34.'),
  (14, 'omar.bar',       'Omar H.',  '#0F7173', 'Bench 185 by spring.'),
  (15, 'grace.wax',      'Grace N.', '#B5838D', 'Candles for friends, Chopin for me.'),
  (16, 'leo.moves',      'Leo V.',   '#8338EC', 'Muscle-ups in progress.'),
  (17, 'strum.sam',      'Sam G.',   '#65A30D', 'Campfire chords, working on barres.'),
  (18, 'nadia.sketches', 'Nadia A.', '#C026D3', 'Daily sketchbook. Still lifes on Sundays.'),
  (19, 'crumb.chris',    'Chris B.', '#CA8A04', 'Sourdough nerd. Crumb shots only.'),
  (20, 'clay.ines',      'Ines R.',  '#C2410C', 'Community studio, Tuesday wheel nights.'),
  (21, 'habla.mateo',    'Mateo P.', '#DC2626', 'Learning Spanish for my partner''s family.'),
  (22, 'spin.kai',       'Kai L.',   '#0891B2', 'Pen spinning between lectures.'),
  (23, 'rina.bakes',     'Rina M.',  '#A16207', 'Laminated dough is my nemesis.'),
  (24, 'wheel.olu',      'Olu A.',   '#9A3412', 'Potter for 12 years, guitar for 12 days.'),
  (25, 'luz.lingo',      'Luz V.',   '#B91C1C', 'Spanish tutor. Weekly conversation rooms.'),
  (26, 'fretboard.finn', 'Finn O.',  '#4D7C0F', 'Session guitarist. Teaching lead basics.'),
  (27, 'pen.yuki',       'Yuki S.',  '#0E7490', 'Day 6. Dropped the pen 400 times.'),
  (28, 'draw.theo',      'Theo K.',  '#86198F', 'Illustrator. Value studies forever.');

create temp table seed_skills (idx int, slug text, name text, category public.skill_category, color text, kudo text, class text, blurb text);
insert into seed_skills values
  (1, 'calisthenics', 'Calisthenics', 'fitness',      '#E0548A', 'Solid form',        'Paladin',      'Push-ups to front levers, plus bench milestones'),
  (2, 'piano',        'Piano',        'music',        '#2F8FDE', 'Great timing',      'Bard',         'Scales, reading and chords'),
  (3, 'candle',       'Candle making','crafts',       '#F08A24', 'Great color choice','Alchemist',    'From first pour to a sell-ready batch'),
  (4, 'guitar',       'Guitar',       'music',        '#65A30D', 'Clean tone',        'Minstrel',     'Open chords to your first solo'),
  (5, 'drawing',      'Drawing',      'visual_art',   '#C026D3', 'Great color choice','Illuminator',  'Lines and forms to still life'),
  (6, 'baking',       'Baking',       'food',         '#CA8A04', 'Great crumb',       'Hearthkeeper', 'First loaf to croissants and tiered cakes'),
  (7, 'pottery',      'Pottery',      'crafts',       '#C2410C', 'Even walls',        'Earthshaper',  'Centering clay to a matching set'),
  (8, 'spanish',      'Spanish',      'mind',         '#DC2626', 'Great accent',      'Polyglot',     'Recorded conversations as proof'),
  (9, 'penspin',      'Pen spinning', 'performance',  '#0891B2', 'Smooth spin',       'Trickster',    'Quirky, fast progress, very shareable');

create temp table seed_trees (skill_slug text, branch text, pos int, nodes text[], video bool default false);
insert into seed_trees values
  ('calisthenics', 'Push',     0, array['Push-ups','Diamond push-ups','Pike push-ups','Handstand push-ups'], false),
  ('calisthenics', 'Pull',     1, array['Dead hangs','Pull-ups','Muscle-ups','Front levers'], false),
  ('calisthenics', 'Strength', 2, array['Bench 135 lb','Bench 185 lb','Bench 225 lb'], true),
  ('piano', 'Technique', 0, array['C major scale','All major scales','Arpeggios'], false),
  ('piano', 'Reading',   1, array['Treble clef','Both clefs','Sight-reading'], false),
  ('piano', 'Chords',    2, array['Triads','Inversions','Improvisation'], false),
  ('candle', 'Basics',   0, array['Container candle','Wick sizing','Clean tops, no sinkholes'], false),
  ('candle', 'Design',   1, array['Colour layering','Scent blending','Three-wick candle'], false),
  ('candle', 'Advanced', 2, array['Pillar candles','Moulded candles','Sell-ready batch'], false),
  ('guitar', 'Chords', 0, array['Open chords','Smooth chord changes','Barre chords'], false),
  ('guitar', 'Rhythm', 1, array['Strumming patterns','Palm muting','Fingerpicking'], false),
  ('guitar', 'Lead',   2, array['Pentatonic scale','Bends and vibrato','First solo'], false),
  ('drawing', 'Basics', 0, array['Confident lines','Basic forms','Perspective boxes'], false),
  ('drawing', 'Figure', 1, array['Gesture drawing','Proportions','Hands'], false),
  ('drawing', 'Value',  2, array['Value scale','Shading a sphere','Still life from life'], false),
  ('baking', 'Bread',      0, array['First loaf','Sourdough starter','Open crumb boule'], false),
  ('baking', 'Pastry',     1, array['Shortcrust','Laminated dough','Croissants'], false),
  ('baking', 'Decorating', 2, array['Piping basics','Smooth buttercream','Tiered cake'], false),
  ('pottery', 'Wheel', 0, array['Centering','Opening','6-inch cylinder'], false),
  ('pottery', 'Forms', 1, array['Bowls','Mugs with handles','Lidded jar'], false),
  ('pottery', 'Glaze', 2, array['Dipping','Layering glazes','Matching set'], false),
  ('spanish', 'Speaking',  0, array['Introduce yourself','2-minute chat','10-minute conversation'], false),
  ('spanish', 'Listening', 1, array['Slow podcasts','Native-speed audio','Film without subtitles'], false),
  ('spanish', 'Writing',   2, array['Daily journal','Past tenses','One-page story'], false),
  ('penspin', 'Basics', 0, array['ThumbAround','Charge','Sonic'], false),
  ('penspin', 'Combos', 1, array['Two-trick combo','Five-trick combo','Fingerless'], false),
  ('penspin', 'Style',  2, array['Smooth links','Ambidextrous','One-minute routine'], false);

create temp table seed_user_skills (handle text, skill_slug text, tier int);
insert into seed_user_skills values
  ('maya.lifts','calisthenics',1), ('jonah_keys','piano',0), ('wickedwax.lena','candle',3),
  ('devpushes','calisthenics',2), ('devpushes','piano',0), ('priyaplays','piano',1),
  ('theo.melts','candle',0), ('aisha.lever','calisthenics',3), ('marco.chords','piano',2),
  ('marco.chords','candle',1), ('sofia.pours','candle',1), ('kenji.plays','piano',3),
  ('hana.flame','candle',2), ('ruben.reps','calisthenics',0), ('zoe.ivories','piano',0),
  ('omar.bar','calisthenics',1), ('omar.bar','candle',0), ('grace.wax','candle',1),
  ('grace.wax','piano',1), ('leo.moves','calisthenics',2), ('strum.sam','guitar',1),
  ('nadia.sketches','drawing',2), ('crumb.chris','baking',3), ('clay.ines','pottery',1),
  ('habla.mateo','spanish',0), ('spin.kai','penspin',2), ('spin.kai','drawing',0),
  ('rina.bakes','baking',1), ('rina.bakes','drawing',0), ('wheel.olu','pottery',3),
  ('wheel.olu','guitar',0), ('luz.lingo','spanish',3), ('fretboard.finn','guitar',3),
  ('pen.yuki','penspin',0), ('draw.theo','drawing',3);

-- ═══ auth users (trigger creates their profiles) ═════════════════════════════
do $$
declare
  u record;
  uid uuid;
begin
  for u in select * from seed_users loop
    uid := ('10000000-0000-4000-8000-' || lpad(to_hex(u.idx), 12, '0'))::uuid;
    -- Token columns must be '' (not NULL): GoTrue scans them into Go strings
    -- and 500s on NULL ("converting NULL to string is unsupported").
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      confirmation_token, recovery_token, reauthentication_token,
      email_change, email_change_token_new, email_change_token_current,
      phone_change, phone_change_token,
      email_change_confirm_status, is_sso_user, is_anonymous,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      u.handle || '@larping.dev', crypt('password123', gen_salt('bf')),
      now(), now() - (u.idx || ' days')::interval, now() - (u.idx || ' days')::interval,
      '', '', '',
      '', '', '',
      '', '',
      0, false, false,
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('display_name', u.display_name)
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), uid, u.handle || '@larping.dev',
      jsonb_build_object('sub', uid::text, 'email', u.handle || '@larping.dev'),
      'email', now(), now(), now()
    );
    update public.profiles
      set handle = u.handle,
          display_name = u.display_name,
          bio = u.bio,
          avatar_color = u.color,
          timezone = 'Australia/Melbourne',
          onboarded_at = now() - (u.idx || ' days')::interval
      where id = uid;
  end loop;
end $$;

-- ═══ skills, branches, nodes, edges ══════════════════════════════════════════
insert into public.skills (id, slug, name, lower_name, category, color, kudo_label, class_title, blurb, is_custom, status)
select
  ('20000000-0000-4000-8000-' || lpad(to_hex(s.idx), 12, '0'))::uuid,
  s.slug, s.name, lower(s.name), s.category, s.color, s.kudo, s.class, s.blurb, false, 'approved'
from seed_skills s;

do $$
declare
  t record;
  n_idx int;
  branch_id uuid;
  node_ids uuid[];
  prev_id uuid;
  counter int := 0;
begin
  for t in select st.*, s.id as skill_id
           from seed_trees st
           join public.skills s on s.slug = st.skill_slug
           order by s.slug, st.pos loop
    counter := counter + 1;
    branch_id := ('30000000-0000-4000-8000-' || lpad(to_hex(counter), 12, '0'))::uuid;
    insert into public.skill_branches (id, skill_id, name, position)
    values (branch_id, t.skill_id, t.branch, t.pos);

    node_ids := array[]::uuid[];
    prev_id := null;
    for n_idx in 1 .. array_length(t.nodes, 1) loop
      counter := counter + 1;
      node_ids := node_ids || ('40000000-0000-4000-8000-' || lpad(to_hex(counter), 12, '0'))::uuid;
      insert into public.skill_nodes (id, branch_id, name, position, is_milestone, requires_video)
      values (
        node_ids[n_idx], branch_id, t.nodes[n_idx], n_idx - 1,
        n_idx = array_length(t.nodes, 1),
        t.video
      );
      if prev_id is not null then
        insert into public.skill_node_edges (parent_id, child_id) values (prev_id, node_ids[n_idx]);
      end if;
      prev_id := node_ids[n_idx];
    end loop;
  end loop;
end $$;

-- ═══ portfolios (user_skills) + tiers ════════════════════════════════════════
do $$
declare
  us record;
  mins int;
  nodes_wanted int;
  total_nodes int;
  landed int;
begin
  for us in
    select su.*, p.id as user_id, s.id as skill_id
    from seed_user_skills su
    join public.profiles p on p.handle = su.handle
    join public.skills s on s.slug = su.skill_slug
  loop
    mins := case us.tier
      when 0 then 90 + (random() * 120)::int
      when 1 then 360 + (random() * 300)::int      -- 6–11 h (Apprentice needs 5 h)
      when 2 then 1700 + (random() * 400)::int     -- 28–35 h (Adept needs 25 h)
      else 6300 + (random() * 600)::int            -- 105+ h (Legit needs 100 h)
    end;

    select count(*) into total_nodes
    from public.skill_nodes n
    join public.skill_branches b on b.id = n.branch_id
    where b.skill_id = us.skill_id;

    nodes_wanted := case us.tier
      when 0 then 0
      when 1 then least(3, total_nodes)
      when 2 then least(7, total_nodes)
      else total_nodes                              -- Legit: whole tree (capped requirement)
    end;

    insert into public.user_skills (user_id, skill_id, tier, total_minutes, total_xp, nodes_landed)
    values (us.user_id, us.skill_id, us.tier, mins, mins + nodes_wanted * 50, nodes_wanted);

    insert into public.tier_history (user_id, skill_id, tier, achieved_at)
    values (us.user_id, us.skill_id, us.tier, now() - ((random() * 30)::int || ' days')::interval)
    on conflict do nothing;

    -- XP ledger summary row (source_id null: seed summary, not a real session).
    insert into public.xp_events (user_id, skill_id, amount, reason, source_id, created_at)
    values (us.user_id, us.skill_id, mins + nodes_wanted * 50, 'session', null,
            now() - ((random() * 40)::int || ' days')::interval);

    -- Land the first N nodes of the tree in branch order.
    landed := 0;
    if nodes_wanted > 0 then
      insert into public.node_progress (user_id, node_id, status, sessions_count, landed_at)
      select us.user_id, n.id, 'landed', 5, now() - ((random() * 30)::int || ' days')::interval
      from (
        select n2.id
        from public.skill_nodes n2
        join public.skill_branches b2 on b2.id = n2.branch_id
        where b2.skill_id = us.skill_id
        order by b2.position, n2.position
        limit nodes_wanted
      ) n;
      get diagnostics landed = row_count;
    end if;
  end loop;
end $$;

-- ═══ sessions (recent practice, with the prototype's notes) ══════════════════
do $$
declare
  us record;
  i int;
  notes text[];
  note text;
begin
  for us in
    select p.id as user_id, s.id as skill_id, s.slug, p.handle
    from public.user_skills usk
    join public.profiles p on p.id = usk.user_id
    join public.skills s on s.id = usk.skill_id
  loop
    notes := case us.slug
      when 'calisthenics' then array['Negatives felt smoother today','Wrists sore, cut it short','Held the hollow body longer than last week','Elbows flaring on push-ups, fixing it','Felt strong, added a set','Bench felt heavy, form held up','Three sets of dead hangs, grip is improving']
      when 'piano' then array['Struggled with bar 12 again','Left hand finally keeping time','Slowed the metronome to 60, much cleaner','Scales warm-up then the new piece','Sight-reading is still slow but less painful','Inversions are starting to click']
      when 'candle' then array['Poured my first soy container candle','Wick too small again, it tunnelled','Layered lavender over cream, clean line this time','Second pour fixed the sinkhole','Testing a 10% fragrance load','Three wicks, even melt pool at two hours']
      else array['Slowly getting the hang of it','Day one energy','Showed up even though I did not feel like it','Small win today','Practice over motivation']
    end;

    for i in 1 .. (2 + (floor(random() * 3))::int) loop
      note := notes[1 + (floor(random() * array_length(notes, 1)))::int];
      insert into public.sessions (user_id, skill_id, started_at, duration_sec, note, visibility, client_uuid, created_at)
      values (
        us.user_id, us.skill_id,
        now() - ((random() * 40)::int || ' days ' || (floor(random() * 12))::int || ' hours')::interval,
        600 + (random() * 3900)::int,
        note, 'public', gen_random_uuid(),
        now() - ((random() * 40)::int || ' days')::interval
      );
    end loop;
  end loop;
end $$;

-- ═══ follows (a ring so everyone follows five others) ════════════════════════
do $$
declare
  a record;
  k int;
  target_idx int;
begin
  for a in select idx, handle from seed_users loop
    for k in 1 .. 5 loop
      target_idx := ((a.idx + k * 5 - 1) % 28) + 1;
      insert into public.follows (follower_id, followee_id)
      values (
        ('10000000-0000-4000-8000-' || lpad(to_hex(a.idx), 12, '0'))::uuid,
        ('10000000-0000-4000-8000-' || lpad(to_hex(target_idx), 12, '0'))::uuid
      )
      on conflict do nothing;
    end loop;
  end loop;
end $$;

-- ═══ kudos + comments on sessions ════════════════════════════════════════════
do $$
declare
  s record;
  owner_idx int;
  giver1 int;
  giver2 int;
  comments text[] := array['How long did that take you?','Day one energy, keep going','The progress since last month is wild','Saving this for later','Respect for posting the attempt','Teach me your ways'];
begin
  for s in
    select se.id, se.user_id, sk.kudo_label, su.idx as owner_idx
    from public.sessions se
    join public.skills sk on sk.id = se.skill_id
    join public.profiles p on p.id = se.user_id
    join seed_users su on su.handle = p.handle
  loop
    owner_idx := s.owner_idx;
    giver1 := ((owner_idx + 6) % 28) + 1;
    giver2 := ((owner_idx + 12) % 28) + 1;

    insert into public.kudos (giver_id, session_id, label)
    values (('10000000-0000-4000-8000-' || lpad(to_hex(giver1), 12, '0'))::uuid, s.id, s.kudo_label)
    on conflict do nothing;

    insert into public.kudos (giver_id, session_id, label)
    values (('10000000-0000-4000-8000-' || lpad(to_hex(giver2), 12, '0'))::uuid, s.id, 'I learned something')
    on conflict do nothing;

    if owner_idx % 2 = 0 then
      insert into public.kudos (giver_id, session_id, label)
      values (('10000000-0000-4000-8000-' || lpad(to_hex(((owner_idx + 18) % 28) + 1), 12, '0'))::uuid,
              s.id, 'Clean technique')
      on conflict do nothing;
    end if;

    if random() < 0.5 then
      insert into public.comments (author_id, session_id, body)
      values (
        ('10000000-0000-4000-8000-' || lpad(to_hex(giver1), 12, '0'))::uuid,
        s.id, comments[1 + (floor(random() * array_length(comments, 1)))::int]
      );
    end if;
  end loop;
end $$;

-- ═══ Side Quests (current week) + participants ═══════════════════════════════
do $$
declare
  week_start date := date_trunc('week', current_date)::date;
  q record;
  q_idx int := 0;
  u_idx int;
begin
  for q in
    select * from (values
      ('candle',       'One color only',        'Pour on 3 days this week using a single dye.', 3),
      ('piano',        'Learn a song in 7 days','Pick any song and practise it on 5 days.', 5),
      ('calisthenics', 'Grease the groove',     'Short pull-up or push-up sets on 5 days.', 5),
      (null,           'Show up 4 days',        'Any skill, any length. Log 4 days this week.', 4),
      ('drawing',      'One color only',        'Three drawings this week with a single colour.', 3),
      ('spanish',      'Speak every day',       'Record a short voice note in Spanish on 5 days.', 5),
      ('penspin',      'Learn a trick in 7 days','Pick a new trick and practise it on 4 days.', 4)
    ) as v(slug, title, descr, goal)
  loop
    q_idx := q_idx + 1;
    insert into public.quests (id, skill_id, title, description, goal_days, starts_on, ends_on)
    values (
      ('50000000-0000-4000-8000-' || lpad(to_hex(q_idx), 12, '0'))::uuid,
      (select id from public.skills where slug = q.slug),
      q.title, q.descr, q.goal, week_start, week_start + 6
    );

    for u_idx in 1 .. 28 loop
      if (u_idx + q_idx) % 2 = 0 then
        insert into public.quest_participants (quest_id, user_id, progress_days)
        values (
          ('50000000-0000-4000-8000-' || lpad(to_hex(q_idx), 12, '0'))::uuid,
          ('10000000-0000-4000-8000-' || lpad(to_hex(u_idx), 12, '0'))::uuid,
          u_idx % 3
        );
      end if;
    end loop;
  end loop;
end $$;

-- ═══ Standards (shared benchmarks with graded result ladders) ════════════════
do $$
declare
  st record;
  st_idx int := 0;
  attempt record;
begin
  for st in
    select * from (values
      ('candle',       'The three-wick candle',   'A 3-wick 16 oz container with an even melt pool.', '["Tunnelled on one side","Even pool, slight soot","Clean pool at 2 h","Full pool in 3 h, no soot"]'),
      ('piano',        'Für Elise, A section',    'Bars 1 to 22, hands together, 60 bpm or faster.', '["Bars 1 to 8 at 50 bpm","Full A section at 55 bpm","64 bpm, two slips","72 bpm, clean"]'),
      ('calisthenics', '225 lb bench',            'One clean rep, filmed side-on, pause at the chest.', '["95 lb for 5","155 lb for 1","205 lb for 1","225 lb for 3"]'),
      ('calisthenics', 'First strict pull-up',    'Dead hang start, chin over the bar, no kip.', '["5 s negatives","1 rep with a pause","8 reps","15 reps strict"]'),
      ('pottery',      '6-inch cylinder',         '6 inches tall from 1 lb of clay, even walls.', '["3 in, thick base","4.5 in, slight lean","6 in, walls a bit heavy","6.5 in, even 5 mm walls"]'),
      ('baking',       'The sourdough boule',     'One boule with an ear and an open crumb.', '["Flat but tasty","Some oven spring","Good ear, tight crumb","Big ear, open crumb"]'),
      ('guitar',       'Clean chord changes',     'G, C, D and Em, one change per beat at 80 bpm.', '["60 bpm with pauses","70 bpm, a few buzzes","80 bpm, clean","100 bpm, clean"]'),
      ('drawing',      'The apple from life',     'One apple under a single lamp, 30 minutes.', '["Outline only","Some shading","Clear light and shadow","Cast shadow and reflected light"]'),
      ('spanish',      '2-minute introduction',   'Record yourself introducing yourself, no notes.', '["40 s with notes","90 s, some English","2 min, steady","3 min, natural"]'),
      ('penspin',      'Sonic in 10 tries',       'Land a Sonic, filmed from above.', '["2 of 10","5 of 10","8 of 10","10 of 10, both hands"]')
    ) as v(slug, title, descr, ladder)
  loop
    st_idx := st_idx + 1;
    insert into public.standards (id, skill_id, title, description, result_ladder)
    values (
      ('60000000-0000-4000-8000-' || lpad(to_hex(st_idx), 12, '0'))::uuid,
      (select id from public.skills where slug = st.slug),
      st.title, st.descr, st.ladder::jsonb
    );

    -- a couple of attempts per standard from users of that skill
    for attempt in
      select se.id as session_id, se.user_id, usk.tier
      from public.sessions se
      join public.skills sk on sk.id = se.skill_id and sk.slug = st.slug
      join public.user_skills usk on usk.user_id = se.user_id and usk.skill_id = se.skill_id
      limit 2
    loop
      insert into public.standard_attempts (standard_id, user_id, session_id, result_index, tier_at_attempt)
      values (
        ('60000000-0000-4000-8000-' || lpad(to_hex(st_idx), 12, '0'))::uuid,
        attempt.user_id, attempt.session_id, (random() * 3)::int, attempt.tier
      );
    end loop;
  end loop;
end $$;

-- ═══ Co-op rooms (live now) ══════════════════════════════════════════════════
insert into public.coop_rooms (id, skill_id, title, created_by, started_at)
select
  ('70000000-0000-4000-8000-' || lpad(to_hex(r.rn), 12, '0'))::uuid,
  (select id from public.skills where slug = r.slug),
  r.title,
  (select id from public.profiles where handle = r.host),
  now() - (r.mins || ' minutes')::interval
from (values
  (1, 'piano',        'Quiet scales room',     'kenji.plays',  23),
  (2, 'candle',       'Sunday pour-along',     'hana.flame',   41),
  (3, 'calisthenics', 'Morning push session',  'leo.moves',    12),
  (4, 'pottery',      'Wheel night',           'clay.ines',    55),
  (5, 'drawing',      'Quiet sketch hour',     'nadia.sketches', 17)
) as r(rn, slug, title, host, mins);

-- ═══ IRL guilds + one event each + RSVPs ═════════════════════════════════════
do $$
declare
  g record;
  g_idx int := 0;
  gid uuid;
  k int;
begin
  for g in
    select * from (values
      ('Toronto Candle Collective',     'candle',       'Toronto',  'Wick & Co. studio, Queen St W',            6, '14:00', 'wickedwax.lena'),
      ('Adult Beginners Piano Night',   'piano',        'Toronto',  'Harbourfront community centre',            3, '19:00', 'kenji.plays'),
      ('Trinity Bellwoods Bar Crew',    'calisthenics', 'Toronto',  'Outdoor bars, Trinity Bellwoods Park',     2, '09:00', 'aisha.lever'),
      ('Toronto Potters',               'pottery',      'Toronto',  'Clay Commons studio, Dundas St W',         4, '18:30', 'wheel.olu'),
      ('Café en Español',               'spanish',      'Toronto',  'Little Portugal café, College St',         5, '11:00', 'luz.lingo')
    ) as v(name, slug, city, place, days_ahead, at_time, host)
  loop
    g_idx := g_idx + 1;
    gid := ('80000000-0000-4000-8000-' || lpad(to_hex(g_idx), 12, '0'))::uuid;

    insert into public.guilds (id, name, skill_id, city, place, created_by)
    values (
      gid, g.name,
      (select id from public.skills where slug = g.slug),
      g.city, g.place,
      (select id from public.profiles where handle = g.host)
    );

    insert into public.events (guild_id, title, place, starts_at)
    values (
      gid, g.name, g.place,
      (current_date + g.days_ahead + g.at_time::time) at time zone 'America/Toronto'
    );

    for k in 1 .. 9 loop
      insert into public.rsvps (event_id, user_id, status)
      select e.id,
             ('10000000-0000-4000-8000-' || lpad(to_hex(((g_idx * 5 + k) % 28) + 1), 12, '0'))::uuid,
             (case when k % 4 = 0 then 'maybe' else 'going' end)::public.rsvp_status
      from public.events e
      where e.guild_id = gid
      on conflict do nothing;
    end loop;
  end loop;
end $$;

-- ═══ streaks (dev visuals) ═══════════════════════════════════════════════════
insert into public.user_streaks (user_id, current_streak, longest_streak, last_activity_local_date, shields)
select
  id,
  (su.idx % 12),
  (su.idx % 12) + (su.idx % 5),
  current_date - (su.idx % 2),
  least(su.idx % 3, 2)
from public.profiles p
join seed_users su on su.handle = p.handle;

-- ═══ one Larp Check window (today, fired 2 h ago) + a few checks ═════════════
insert into public.larp_check_windows (id, region, window_date, fired_at)
values ('82000000-0000-4000-8000-000000000001', 'au-vic', current_date, now() - interval '2 hours');

insert into public.larp_checks (user_id, window_id, skill_id, posted_at)
select p.id, '82000000-0000-4000-8000-000000000001', s.id, now() - interval '1 hour'
from public.profiles p
join seed_users su on su.handle = p.handle and su.handle in ('maya.lifts', 'kenji.plays', 'wickedwax.lena')
join public.skills s on s.slug = (case su.handle
  when 'maya.lifts' then 'calisthenics'
  when 'kenji.plays' then 'piano'
  else 'candle'
end);

-- ═══ profile caches: xp_total, larper level, RPG class ═══════════════════════
update public.profiles p
set xp_total = coalesce((
  select sum(total_xp) from public.user_skills us where us.user_id = p.id
), 0);

do $$
declare
  r record;
  lvl int;
begin
  for r in select id, xp_total from public.profiles loop
    lvl := 1;
    while 50 * lvl * (lvl + 1) <= r.xp_total loop
      lvl := lvl + 1;
    end loop;
    update public.profiles set larper_level = lvl where id = r.id;
  end loop;
end $$;

do $$
declare
  r record;
  titles text;
begin
  for r in select id from public.profiles loop
    select string_agg(s.class_title, ' ') into titles
    from (
      select us.tier, us.skill_id
      from public.user_skills us
      where us.user_id = r.id
      order by us.tier desc, us.started_at
      limit 2
    ) top
    join public.skills s on s.id = top.skill_id;
    update public.profiles set class_title = coalesce(titles, 'Larper') where id = r.id;
  end loop;
end $$;

-- Growth features: guild membership, mentors, a sample feedback thread
insert into public.guild_members (guild_id, user_id)
select g.id, g.created_by from public.guilds g where g.created_by is not null
union
select e.guild_id, r.user_id from public.rsvps r join public.events e on e.id = r.event_id
union
select g.id, us.user_id from public.guilds g join public.user_skills us on us.skill_id = g.skill_id
on conflict do nothing;

update public.user_skills set open_to_feedback = true where tier >= 2;

insert into public.feedback_requests (requester_id, mentor_id, skill_id, session_id, message, status, response, responded_at)
select maya.id, aisha.id, s.id, sess.id,
  'Can you check my scap pulls? I feel like my shoulders shrug up at the top.',
  'answered',
  'Good start! Think "shoulders into back pockets" before you pull, and hold the top for 2s. Film from the side next time.',
  now() - interval '3 hours'
from public.profiles maya, public.profiles aisha, public.skills s
cross join lateral (
  select id from public.sessions where user_id = maya.id and skill_id = s.id order by started_at desc limit 1
) sess
where maya.handle = 'maya.lifts' and aisha.handle = 'aisha.lever' and s.name = 'Calisthenics';
