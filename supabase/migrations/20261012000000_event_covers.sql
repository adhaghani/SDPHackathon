-- Event cover support for newly created events.
create or replace function public.create_event(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := (p_payload->>'township_id')::uuid;
  v_category_id uuid := (p_payload->>'category_id')::uuid;
  v_role text;
  v_status text;
  v_event_id uuid;
  v_start timestamptz := (p_payload->>'starts_at')::timestamptz;
  v_end timestamptz := (p_payload->>'ends_at')::timestamptz;
begin
  if v_user_id is null or not public.is_active_member(v_township_id) then
    raise exception 'not_active_member';
  end if;

  if v_start <= now() and coalesce(auth.uid(), v_user_id) is not null and v_user_id is not null then
    -- Service-role seeds may backdate events; residents cannot create past events.
    if current_setting('request.jwt.claims', true) is not null then
      raise exception 'event_in_past';
    end if;
  end if;

  select role into v_role
  from public.township_members
  where township_id = v_township_id and user_id = v_user_id and status = 'active';

  v_status := case
    when v_role in ('organiser', 'township_admin') then 'published'
    when exists (
      select 1 from public.townships t
      where t.id = v_township_id and t.require_event_approval = false
    ) then 'published'
    else 'pending_approval'
  end;

  insert into public.events (
    township_id,
    host_id,
    title,
    description,
    category_id,
    starts_at,
    ends_at,
    location_text,
    facility_id,
    neighbourhood_id,
    capacity,
    volunteer_slots,
    accessibility_tags,
    languages,
    status,
    cover_path
  )
  values (
    v_township_id,
    v_user_id,
    trim(p_payload->>'title'),
    coalesce(p_payload->>'description', ''),
    v_category_id,
    v_start,
    v_end,
    coalesce(p_payload->>'location_text', 'Shared township space'),
    nullif(p_payload->>'facility_id', '')::uuid,
    nullif(p_payload->>'neighbourhood_id', '')::uuid,
    nullif(p_payload->>'capacity', '')::integer,
    nullif(p_payload->>'volunteer_slots', '')::integer,
    coalesce(
      array(select jsonb_array_elements_text(p_payload->'accessibility_tags')),
      '{}'
    ),
    coalesce(
      array(select jsonb_array_elements_text(p_payload->'languages')),
      array['English']
    ),
    v_status,
    nullif(p_payload->>'cover_path', '')
  )
  returning id into v_event_id;

  insert into public.event_staff (event_id, user_id)
  values (v_event_id, v_user_id)
  on conflict do nothing;

  return jsonb_build_object('event_id', v_event_id, 'status', v_status);
end;
$$;
