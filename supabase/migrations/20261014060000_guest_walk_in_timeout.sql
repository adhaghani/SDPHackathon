-- Guard walk-in timeout support and manual follow-up recording.

create or replace function public.get_guard_walk_ins(
  p_township_id uuid,
  p_include_closed boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null or not public.is_guest_gate_operator(p_township_id) then
    raise exception 'guard_required';
  end if;

  select coalesce(jsonb_agg(row_to_json(walk_view) order by walk_view.requested_at desc), '[]'::jsonb)
  into v_result
  from (
    select
      w.id,
      w.status,
      w.visitor_name,
      w.vehicle_plate,
      w.requested_at,
      w.responded_at,
      w.outcome_note,
      (public.get_guest_pass_settings(w.township_id) ->> 'walk_in_timeout_minutes')::integer as timeout_minutes,
      w.gate_id,
      g.name as gate_name,
      m.unit_label as destination_unit,
      pr.display_name as host_display_name
    from public.walk_in_requests w
    join public.gates g on g.id = w.gate_id
    join public.township_members m on m.id = w.host_member_id
    left join public.profiles pr on pr.id = m.user_id
    where w.township_id = p_township_id
      and w.guard_id = v_user_id
      and (p_include_closed or w.status in ('pending', 'approved'))
    order by w.requested_at desc
    limit 100
  ) walk_view;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

create or replace function public.mark_walk_in_manual(
  p_request_id uuid,
  p_note text default null,
  p_township_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.walk_in_requests%rowtype;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if v_user_id is null or not public.is_guest_gate_operator(p_township_id) then
    raise exception 'guard_required';
  end if;

  select * into v_request
  from public.walk_in_requests
  where id = p_request_id and township_id = p_township_id
  for update;

  if not found or v_request.status <> 'pending' then
    raise exception 'walk_in_not_pending';
  end if;

  update public.walk_in_requests
  set status = 'manual_follow_up',
      responded_at = now(),
      responded_by = v_user_id,
      outcome_note = coalesce(v_note, 'No host response within the configured timeout.')
  where id = v_request.id
  returning * into v_request;

  return to_jsonb(v_request);
end;
$$;

revoke execute on function public.mark_walk_in_manual(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.mark_walk_in_manual(uuid, text, uuid) to authenticated;
