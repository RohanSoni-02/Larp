-- 0010: node in-progress RPC, Larp Check media linking, dev Larp Check trigger.

-- "Mark as in progress" without logging a session yet. node_progress writes
-- stay revoked from clients; this is the only path besides save_session.
create or replace function public.mark_node_in_progress(p_node_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.node_progress (user_id, node_id, status, sessions_count)
  values (auth.uid(), p_node_id, 'in_progress', 0)
  on conflict (user_id, node_id) do nothing;
end;
$$;

-- Clients may link media to THEIR OWN larp check (only those two columns).
grant update (work_media_id, selfie_media_id) on public.larp_checks to authenticated;

create policy "users link media to their own larp check"
  on public.larp_checks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Hidden developer menu: fire a live Larp Check window right now.
create or replace function public.dev_trigger_larp_check(p_region text default 'au-vic')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.larp_check_windows (region, window_date, fired_at)
  values (p_region, current_date, now())
  on conflict (region, window_date)
  do update set fired_at = now()
  returning id into v_id;
  return v_id;
end;
$$;
