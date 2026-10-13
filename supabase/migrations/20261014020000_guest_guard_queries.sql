-- Additional guard-only walk-in query for live approval polling.

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

revoke execute on function public.get_guard_walk_ins(uuid, boolean) from public, anon, authenticated;
grant execute on function public.get_guard_walk_ins(uuid, boolean) to authenticated;
