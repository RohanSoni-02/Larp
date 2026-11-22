-- 0012: pending custom skills are visible only to their creator, so a single
-- global unique name meant the second person to add e.g. "Ukulele" hit a
-- duplicate-key error for a skill they could not see or pick. Approved names
-- stay unique; pending names are unique per creator and duplicates are merged
-- into one skill at review.

drop index public.skills_unique_lower_name;

create unique index skills_unique_approved_name
  on public.skills (lower(lower_name))
  where status = 'approved';

create unique index skills_unique_pending_name_per_creator
  on public.skills (created_by, lower(lower_name))
  where status = 'pending';
