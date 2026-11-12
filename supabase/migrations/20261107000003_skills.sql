-- 0003: skills, branches, nodes, edges (skill trees as a DAG)

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  lower_name text not null,                        -- "piano" — used in portfolio lines
  category public.skill_category not null,
  color text not null default '#5B3DF5',
  kudo_label text not null default 'Clean technique',  -- skill-specific kudos label
  class_title text not null default 'Larper',          -- RPG class title, e.g. "Bard"
  blurb text,
  is_custom boolean not null default false,
  status public.skill_status not null default 'approved',
  merged_into uuid references public.skills (id),
  created_by uuid references public.profiles (id),     -- null = curated launch skill
  created_at timestamptz not null default now()
);

alter table public.skills enable row level security;

-- Approved skills are public; pending custom skills are visible to their creator
-- (usable immediately by them, hidden from everyone else until review).
create policy "approved skills are public; creators see their own"
  on public.skills for select
  using (status = 'approved' or created_by = auth.uid());

create policy "users create custom skills as pending"
  on public.skills for insert
  with check (
    auth.uid() = created_by
    and is_custom
    and status = 'pending'
  );

create policy "creators edit their own pending skills"
  on public.skills for update
  using (created_by = auth.uid() and status = 'pending')
  with check (created_by = auth.uid());

-- Near-duplicate detection ("crochet" vs "crocheting") and fast search.
create index skills_name_trgm on public.skills using gin (lower_name gin_trgm_ops);
-- A merged skill frees its name; approved/pending names stay unique case-insensitively.
create unique index skills_unique_lower_name
  on public.skills (lower(lower_name))
  where status <> 'merged';

-- ─── branches ───────────────────────────────────────────────────────────────
create table public.skill_branches (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills (id) on delete cascade,
  name text not null,                                -- "Push", "Reading", "Glaze"
  color text,
  position smallint not null default 0,
  unique (skill_id, name)
);

alter table public.skill_branches enable row level security;

create policy "branches follow skill visibility"
  on public.skill_branches for select
  using (
    exists (
      select 1 from public.skills s
      where s.id = skill_id
        and (s.status = 'approved' or s.created_by = auth.uid())
    )
  );

create policy "creators manage branches of own pending skills"
  on public.skill_branches for all
  using (
    exists (
      select 1 from public.skills s
      where s.id = skill_id and s.created_by = auth.uid() and s.status = 'pending'
    )
  )
  with check (
    exists (
      select 1 from public.skills s
      where s.id = skill_id and s.created_by = auth.uid() and s.status = 'pending'
    )
  );

-- ─── nodes ──────────────────────────────────────────────────────────────────
create table public.skill_nodes (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.skill_branches (id) on delete cascade,
  name text not null,                                -- "Muscle-ups", "6-inch cylinder"
  description text,
  position smallint not null default 0,
  is_milestone boolean not null default false,       -- last node of a branch, drawn larger
  requires_video boolean not null default false,     -- e.g. bench milestones need a clip to count
  sessions_to_land smallint not null default 5 check (sessions_to_land between 1 and 20),
  unique (branch_id, name)
);

alter table public.skill_nodes enable row level security;

create policy "nodes follow skill visibility"
  on public.skill_nodes for select
  using (
    exists (
      select 1 from public.skill_branches b
      join public.skills s on s.id = b.skill_id
      where b.id = branch_id
        and (s.status = 'approved' or s.created_by = auth.uid())
    )
  );

create policy "creators manage nodes of own pending skills"
  on public.skill_nodes for all
  using (
    exists (
      select 1 from public.skill_branches b
      join public.skills s on s.id = b.skill_id
      where b.id = branch_id and s.created_by = auth.uid() and s.status = 'pending'
    )
  )
  with check (
    exists (
      select 1 from public.skill_branches b
      join public.skills s on s.id = b.skill_id
      where b.id = branch_id and s.created_by = auth.uid() and s.status = 'pending'
    )
  );

-- ─── edges (a DAG, not a strict tree) ────────────────────────────────────────
create table public.skill_node_edges (
  parent_id uuid not null references public.skill_nodes (id) on delete cascade,
  child_id uuid not null references public.skill_nodes (id) on delete cascade,
  primary key (parent_id, child_id),
  check (parent_id <> child_id)
);

alter table public.skill_node_edges enable row level security;

create policy "edges follow skill visibility"
  on public.skill_node_edges for select
  using (
    exists (
      select 1 from public.skill_nodes n
      join public.skill_branches b on b.id = n.branch_id
      join public.skills s on s.id = b.skill_id
      where n.id = parent_id
        and (s.status = 'approved' or s.created_by = auth.uid())
    )
  );

create policy "creators manage edges of own pending skills"
  on public.skill_node_edges for all
  using (
    exists (
      select 1 from public.skill_nodes n
      join public.skill_branches b on b.id = n.branch_id
      join public.skills s on s.id = b.skill_id
      where n.id = parent_id and s.created_by = auth.uid() and s.status = 'pending'
    )
  )
  with check (
    exists (
      select 1 from public.skill_nodes n
      join public.skill_branches b on b.id = n.branch_id
      join public.skills s on s.id = b.skill_id
      where n.id = parent_id and s.created_by = auth.uid() and s.status = 'pending'
    )
  );

-- Reject edges that would create a cycle.
create or replace function public.prevent_skill_cycle()
returns trigger
language plpgsql
as $$
begin
  if exists (
    with recursive ancestors as (
      select parent_id from public.skill_node_edges where child_id = new.child_id
      union
      select e.parent_id
      from public.skill_node_edges e
      join ancestors a on e.child_id = a.parent_id
    )
    select 1 from ancestors where parent_id = new.parent_id
  ) then
    raise exception 'skill graph must stay acyclic';
  end if;
  return new;
end;
$$;

create trigger skill_node_edges_acyclic
  before insert on public.skill_node_edges
  for each row execute function public.prevent_skill_cycle();
