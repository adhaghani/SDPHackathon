-- Return explicit entry and exit times for resident pass rows.

create or replace function public.get_resident_guest_passes()
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
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select coalesce(jsonb_agg(row_to_json(pass_view) order by p.created_at desc), '[]'::jsonb)
  into v_result
  from (
    select
      p.id,
      p.township_id,
      p.visitor_name,
      p.vehicle_plate,
      p.purpose,
      p.valid_from,
      p.valid_until,
      p.max_entries,
      p.entries_used,
      public.guest_pass_effective_status(p.id) as status,
      p.mute_checkout_notifications,
      p.created_at,
      p.revoked_at,
      public.guest_pass_is_inside(p.id) as is_inside,
      (
        select min(l.scanned_at)
        from public.visitor_logs l
        where l.pass_id = p.id
          and l.direction = 'in'
          and l.applied = true
          and l.sync_status = 'applied'
      ) as entry_at,
      (
        select max(l.scanned_at)
        from public.visitor_logs l
        where l.pass_id = p.id
          and l.direction = 'out'
          and l.applied = true
          and l.sync_status = 'applied'
      ) as exit_at,
      (
        select jsonb_build_object('direction', l.direction, 'scanned_at', l.scanned_at)
        from public.visitor_logs l
        where l.pass_id = p.id and l.applied = true and l.sync_status = 'applied'
        order by l.scanned_at desc, l.created_at desc
        limit 1
      ) as latest_log
    from public.visitor_passes p
    where p.host_id = v_user_id
    order by p.created_at desc
    limit 100
  ) pass_view
  join public.visitor_passes p on p.id = pass_view.id;

  return v_result;
end;
$$;

revoke execute on function public.get_resident_guest_passes() from public, anon, authenticated;
grant execute on function public.get_resident_guest_passes() to authenticated;
