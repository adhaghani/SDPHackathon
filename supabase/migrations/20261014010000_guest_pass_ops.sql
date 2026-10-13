-- Guest pass guard cache and walk-in scan operations.

-- ---------------------------------------------------------------------------
-- Guard cache, walk-in host lookup and walk-in scans
-- ---------------------------------------------------------------------------

create or replace function public.get_guard_pass_cache(
  p_township_id uuid,
  p_start_date date default null,
  p_end_date date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_start date := coalesce(p_start_date, (now() at time zone 'Asia/Kuala_Lumpur')::date);
  v_end date := coalesce(p_end_date, v_start + 1);
  v_result jsonb;
begin
  if v_user_id is null or not public.is_guest_gate_operator(p_township_id) then
    raise exception 'guard_required';
  end if;

  select coalesce(jsonb_agg(row_to_json(cache_view)), '[]'::jsonb)
  into v_result
  from (
    select
      p.id as pass_id,
      encode(p.token_hash, 'hex') as token_hash,
      p.visitor_name,
      p.vehicle_plate,
      p.valid_from,
      p.valid_until,
      p.status,
      public.guest_pass_effective_status(p.id) as effective_status,
      public.guest_pass_is_inside(p.id) as is_inside,
      m.unit_label as host_unit
    from public.visitor_passes p
    left join public.township_members m
      on m.township_id = p.township_id and m.user_id = p.host_id
    where p.township_id = p_township_id
      and p.status = 'active'
      and p.valid_until >= ((v_start)::timestamptz at time zone 'Asia/Kuala_Lumpur')
      and p.valid_from < (((v_end + 1))::timestamptz at time zone 'Asia/Kuala_Lumpur')
    order by p.valid_from
  ) cache_view;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke execute on function public.get_guard_pass_cache(uuid, date, date) from public, anon, authenticated;
grant execute on function public.get_guard_pass_cache(uuid, date, date) to authenticated;

create or replace function public.lookup_walk_in_hosts(
  p_township_id uuid,
  p_unit_label text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_unit text := nullif(trim(coalesce(p_unit_label, '')), '');
  v_hosts jsonb;
begin
  if v_user_id is null or not public.is_guest_gate_operator(p_township_id) then
    raise exception 'guard_required';
  end if;
  if v_unit is null or char_length(v_unit) > 80 then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(row_to_json(host_view)), '[]'::jsonb)
  into v_hosts
  from (
    select m.id, m.unit_label, pr.display_name
    from public.township_members m
    left join public.profiles pr on pr.id = m.user_id
    where m.township_id = p_township_id
      and m.status = 'active'
      and m.role <> 'guard'
      and m.unit_label is not null
      and lower(m.unit_label) = lower(v_unit)
    order by m.created_at
    limit 5
  ) host_view;

  return coalesce(v_hosts, '[]'::jsonb);
end;
$$;

revoke execute on function public.lookup_walk_in_hosts(uuid, text) from public, anon, authenticated;
grant execute on function public.lookup_walk_in_hosts(uuid, text) to authenticated;

create or replace function public.record_walk_in_scan(
  p_direction text,
  p_gate_id uuid,
  p_walk_in_request_id uuid,
  p_id_sighted boolean default false,
  p_note text default null,
  p_device_scanned_at timestamptz default now(),
  p_client_event_id uuid default null,
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
  v_gate public.gates%rowtype;
  v_existing public.visitor_logs%rowtype;
  v_inside boolean;
  v_log_id uuid;
  v_host_user_id uuid;
  v_host_unit text;
  v_gate_name text;
  v_first_name text;
  v_local_time text;
begin
  if v_user_id is null or not public.is_guest_gate_operator(p_township_id) then
    raise exception 'guard_required';
  end if;
  if p_direction not in ('in', 'out') then
    raise exception 'invalid_direction';
  end if;
  if p_device_scanned_at is null
     or p_device_scanned_at > now() + interval '2 minutes'
     or p_device_scanned_at < now() - interval '30 days' then
    raise exception 'invalid_scan_time';
  end if;

  if p_client_event_id is not null then
    select * into v_existing from public.visitor_logs where client_event_id = p_client_event_id;
    if found then
      return jsonb_build_object('duplicate', true, 'log_id', v_existing.id, 'sync_status', v_existing.sync_status, 'applied', v_existing.applied);
    end if;
  end if;

  select * into v_request
  from public.walk_in_requests
  where id = p_walk_in_request_id and township_id = p_township_id
  for update;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'invalid');
  end if;

  select * into v_gate
  from public.gates
  where id = p_gate_id and township_id = p_township_id and active = true;

  if not found then
    raise exception 'invalid_gate';
  end if;

  select m.user_id, m.unit_label into v_host_user_id, v_host_unit
  from public.township_members m
  where m.id = v_request.host_member_id;

  select exists (
    select 1
    from public.visitor_logs l
    where l.walk_in_request_id = v_request.id
      and l.applied = true
      and l.sync_status = 'applied'
      and l.scanned_at = (
        select max(l2.scanned_at)
        from public.visitor_logs l2
        where l2.walk_in_request_id = v_request.id
          and l2.applied = true
          and l2.sync_status = 'applied'
      )
      and l.direction = 'in'
  ) into v_inside;

  if p_direction = 'in' then
    if v_request.status <> 'approved' then
      return jsonb_build_object('valid', false, 'reason', case when v_request.status = 'denied' then 'denied' else 'not_approved' end);
    end if;
    if v_inside then
      return jsonb_build_object('valid', false, 'reason', 'already_inside');
    end if;
  else
    if not v_inside then
      return jsonb_build_object('valid', false, 'reason', 'not_inside');
    end if;
  end if;

  insert into public.visitor_logs (
    pass_id, walk_in_request_id, township_id, gate_id, guard_id,
    direction, scanned_at, synced_at, id_sighted, note,
    client_event_id, sync_status, applied, review_reason
  )
  values (
    null, v_request.id, p_township_id, p_gate_id, v_user_id,
    p_direction, p_device_scanned_at, now(), coalesce(p_id_sighted, false), nullif(trim(coalesce(p_note, '')), ''),
    coalesce(p_client_event_id, gen_random_uuid()), 'applied', true, null
  )
  returning id into v_log_id;

  if p_direction = 'in' then
    update public.walk_in_requests set entry_log_id = v_log_id where id = v_request.id;
  else
    update public.walk_in_requests set exit_log_id = v_log_id where id = v_request.id;
  end if;

  v_gate_name := v_gate.name;
  v_first_name := coalesce(nullif(split_part(v_request.visitor_name, ' ', 1), ''), v_request.visitor_name);
  v_local_time := to_char(p_device_scanned_at at time zone 'Asia/Kuala_Lumpur', 'HH12:MI AM');

  insert into public.notifications (user_id, type, title, body, link, dedupe_key)
  values (
    v_host_user_id,
    'guest_walk_in_' || p_direction,
    case when p_direction = 'in' then 'Walk-in checked in' else 'Walk-in checked out' end,
    case
      when p_direction = 'in' then v_first_name || ' checked in at ' || v_gate_name || ', ' || v_local_time
      else v_first_name || ' checked out at ' || v_gate_name || ', ' || v_local_time
    end,
    '/guests?walkIn=' || v_request.id,
    'guest-walk-in-' || p_direction || ':' || v_request.id || ':' || v_log_id
  );

  return jsonb_build_object(
    'valid', true,
    'log_id', v_log_id,
    'direction', p_direction,
    'walk_in_request_id', v_request.id,
    'visitor_name', v_request.visitor_name,
    'vehicle_plate', v_request.vehicle_plate,
    'host_display_name', (
      select pr.display_name from public.profiles pr
      join public.township_members m on m.user_id = pr.id
      where m.id = v_request.host_member_id
    ),
    'destination_unit', v_host_unit
  );
end;
$$;

revoke execute on function public.record_walk_in_scan(text, uuid, uuid, boolean, text, timestamptz, uuid, uuid) from public, anon, authenticated;
grant execute on function public.record_walk_in_scan(text, uuid, uuid, boolean, text, timestamptz, uuid, uuid) to authenticated;
