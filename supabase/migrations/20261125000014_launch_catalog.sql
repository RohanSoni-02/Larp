-- 0014: launch catalogue — the nine approved starter skills and their trees.
--
-- Until now these only existed in seed.sql, so a hosted project started with
-- no approved skills at all: every skill a new user added became a pending
-- custom skill, and the feed had nothing to anchor to. Migrations run on every
-- environment, so the catalogue now ships with the schema (seed.sql no longer
-- creates it).
--
-- Idempotent: a skill that already exists (by slug, or by approved name) is
-- left alone, and a skill that already has a tree does not get a second one.
-- The ids are deterministic so the RLS tests and seed data can refer to them.

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

insert into public.skills (id, slug, name, lower_name, category, color, kudo_label, class_title, blurb, is_custom, status)
select
  ('20000000-0000-4000-8000-' || lpad(to_hex(s.idx), 12, '0'))::uuid,
  s.slug, s.name, lower(s.name), s.category, s.color, s.kudo, s.class, s.blurb, false, 'approved'
from seed_skills s
where not exists (
  select 1 from public.skills x
  where x.slug = s.slug
     or (x.status = 'approved' and lower(x.lower_name) = lower(s.name))
);

-- Skills that already have branches keep them untouched.
create temp table skills_with_trees as
  select distinct skill_id from public.skill_branches;

do $$
declare
  t record;
  n_idx int;
  branch_id uuid;
  node_ids uuid[];
  prev_id uuid;
  counter int := 0;
  skip boolean;
begin
  for t in select st.*, s.id as skill_id
           from seed_trees st
           join public.skills s on s.slug = st.skill_slug
           order by s.slug, st.pos loop
    counter := counter + 1;
    branch_id := ('30000000-0000-4000-8000-' || lpad(to_hex(counter), 12, '0'))::uuid;
    skip := exists (select 1 from skills_with_trees w where w.skill_id = t.skill_id);

    if skip then
      -- Keep the id counter in step so ids match a fresh database.
      counter := counter + array_length(t.nodes, 1);
      continue;
    end if;

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
