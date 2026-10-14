-- Optional EXIF-stripped evidence photos for self-reported recycling estimates.

alter table public.recycling_logs
  add column if not exists photo_paths text[] not null default '{}';

create or replace function public.log_recycling(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := nullif(p_payload->>'township_id', '')::uuid;
  v_method text := coalesce(p_payload->>'method', 'count');
  v_occurred_on date := coalesce(
    nullif(p_payload->>'occurred_on', '')::date,
    (now() at time zone 'Asia/Kuala_Lumpur')::date
  );
  v_lines jsonb := coalesce(p_payload->'lines', '[]'::jsonb);
  v_photo_paths_json jsonb := coalesce(p_payload->'photo_paths', '[]'::jsonb);
  v_photo_paths text[];
  v_line jsonb;
  v_photo_path text;
  v_unit public.recycling_units%rowtype;
  v_material public.recycling_materials%rowtype;
  v_quantity integer;
  v_custom_kg numeric;
  v_line_kg numeric;
  v_total_kg numeric := 0;
  v_existing_kg numeric;
  v_log_id uuid;
begin
  if v_user_id is null or v_township_id is null or not public.is_active_member(v_township_id) then
    raise exception 'not_active_member';
  end if;

  if v_method not in ('count', 'custom_kg') then
    raise exception 'invalid_method';
  end if;

  if v_occurred_on is null
    or v_occurred_on <> (now() at time zone 'Asia/Kuala_Lumpur')::date then
    raise exception 'invalid_date';
  end if;

  if jsonb_typeof(v_lines) <> 'array'
    or jsonb_array_length(v_lines) < 1
    or jsonb_array_length(v_lines) > 20 then
    raise exception 'invalid_lines';
  end if;

  if jsonb_typeof(v_photo_paths_json) <> 'array'
    or jsonb_array_length(v_photo_paths_json) > 3 then
    raise exception 'invalid_photos';
  end if;

  select coalesce(array_agg(value #>> '{}'), '{}')
  into v_photo_paths
  from jsonb_array_elements(v_photo_paths_json);

  foreach v_photo_path in array v_photo_paths
  loop
    if coalesce(char_length(trim(v_photo_path)), 0) < 10
      or char_length(v_photo_path) > 2048
      or v_photo_path not like 'http%' then
      raise exception 'invalid_photo_path';
    end if;
  end loop;

  for v_line in select value from jsonb_array_elements(v_lines)
  loop
    if v_method = 'count' then
      begin
        select * into v_unit
        from public.recycling_units
        where id = (v_line->>'unit_id')::uuid
          and active = true;
      exception when invalid_text_representation then
        raise exception 'invalid_unit';
      end;

      if not found then
        raise exception 'invalid_unit';
      end if;

      begin
        v_quantity := (v_line->>'quantity')::integer;
      exception when invalid_text_representation or numeric_value_out_of_range then
        raise exception 'invalid_quantity';
      end;

      if v_quantity is null or v_quantity < 1 or v_quantity > 500 then
        raise exception 'invalid_quantity';
      end if;

      v_line_kg := round(v_quantity * v_unit.kg_per_unit, 4);
      v_total_kg := v_total_kg + v_line_kg;
    else
      begin
        select * into v_material
        from public.recycling_materials
        where id = (v_line->>'material_id')::uuid
          and active = true;
      exception when invalid_text_representation then
        raise exception 'invalid_material';
      end;

      if not found then
        raise exception 'invalid_material';
      end if;

      begin
        v_custom_kg := (v_line->>'kg')::numeric;
      exception when invalid_text_representation or numeric_value_out_of_range then
        raise exception 'invalid_custom_kg';
      end;

      if v_custom_kg is null or v_custom_kg <= 0 or v_custom_kg > 100 then
        raise exception 'invalid_custom_kg';
      end if;

      v_line_kg := round(v_custom_kg, 3);
      v_total_kg := v_total_kg + v_line_kg;
    end if;
  end loop;

  if v_total_kg <= 0 or v_total_kg > 100 then
    raise exception 'invalid_total';
  end if;

  select coalesce(sum(total_kg), 0)
  into v_existing_kg
  from public.recycling_logs
  where user_id = v_user_id
    and township_id = v_township_id
    and occurred_on = v_occurred_on;

  if v_existing_kg + v_total_kg > 100 then
    raise exception 'daily_limit';
  end if;

  insert into public.recycling_logs (
    township_id,
    user_id,
    occurred_on,
    method,
    total_kg,
    photo_paths
  )
  values (
    v_township_id,
    v_user_id,
    v_occurred_on,
    v_method,
    round(v_total_kg, 3),
    v_photo_paths
  )
  returning id into v_log_id;

  if v_method = 'count' then
    for v_line in select value from jsonb_array_elements(v_lines)
    loop
      select * into v_unit
      from public.recycling_units
      where id = (v_line->>'unit_id')::uuid
        and active = true;
      v_quantity := (v_line->>'quantity')::integer;
      v_line_kg := round(v_quantity * v_unit.kg_per_unit, 4);
      insert into public.recycling_log_items (log_id, material_id, unit_id, quantity, estimated_kg)
      values (v_log_id, v_unit.material_id, v_unit.id, v_quantity, v_line_kg);
    end loop;
  else
    for v_line in select value from jsonb_array_elements(v_lines)
    loop
      select * into v_material
      from public.recycling_materials
      where id = (v_line->>'material_id')::uuid
        and active = true;
      v_line_kg := round((v_line->>'kg')::numeric, 3);
      insert into public.recycling_log_items (log_id, material_id, unit_id, quantity, estimated_kg)
      values (v_log_id, v_material.id, null, 1, v_line_kg);
    end loop;
  end if;

  perform public._recycling_refresh_campaign(v_township_id);

  return jsonb_build_object(
    'log_id',
    v_log_id,
    'total_kg',
    round(v_total_kg, 3),
    'occurred_on',
    v_occurred_on,
    'photo_count',
    coalesce(array_length(v_photo_paths, 1), 0),
    'estimated',
    true
  );
end;
$$;

create or replace function public.resident_recycling_summary(
  p_township_id uuid,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := coalesce(p_user_id, auth.uid());
  v_month_start date := date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur')::date;
  v_month_end date := (v_month_start + interval '1 month')::date;
  v_lifetime_kg numeric;
  v_month_kg numeric;
  v_co2e_kg numeric;
  v_energy_kwh numeric;
  v_co2e_available boolean;
  v_energy_available boolean;
  v_materials jsonb;
  v_recent jsonb;
begin
  if auth.uid() is null or v_user_id is distinct from auth.uid() then
    raise exception 'not_allowed';
  end if;
  if p_township_id is null or not public.is_active_member(p_township_id) then
    raise exception 'not_active_member';
  end if;

  select coalesce(sum(item.estimated_kg), 0)
  into v_lifetime_kg
  from public.recycling_logs log
  join public.recycling_log_items item on item.log_id = log.id
  where log.township_id = p_township_id
    and log.user_id = v_user_id;

  select coalesce(sum(log.total_kg), 0)
  into v_month_kg
  from public.recycling_logs log
  where log.township_id = p_township_id
    and log.user_id = v_user_id
    and log.occurred_on >= v_month_start
    and log.occurred_on < v_month_end;

  if not exists (
    select 1
    from public.recycling_logs log
    join public.recycling_log_items item on item.log_id = log.id
    where log.township_id = p_township_id
      and log.user_id = v_user_id
  ) then
    v_co2e_available := true;
    v_energy_available := true;
  else
    select
      coalesce(bool_and(material.co2e_kg_per_kg is not null and nullif(trim(material.factor_source), '') is not null), false),
      coalesce(bool_and(material.energy_kwh_per_kg is not null and nullif(trim(material.factor_source), '') is not null), false)
    into v_co2e_available, v_energy_available
    from public.recycling_materials material
    where material.id in (
      select distinct item.material_id
      from public.recycling_logs log
      join public.recycling_log_items item on item.log_id = log.id
      where log.township_id = p_township_id
        and log.user_id = v_user_id
    );
  end if;

  if v_co2e_available then
    select sum(item.estimated_kg * material.co2e_kg_per_kg)
    into v_co2e_kg
    from public.recycling_logs log
    join public.recycling_log_items item on item.log_id = log.id
    join public.recycling_materials material on material.id = item.material_id
    where log.township_id = p_township_id
      and log.user_id = v_user_id;
  end if;

  if v_energy_available then
    select sum(item.estimated_kg * material.energy_kwh_per_kg)
    into v_energy_kwh
    from public.recycling_logs log
    join public.recycling_log_items item on item.log_id = log.id
    join public.recycling_materials material on material.id = item.material_id
    where log.township_id = p_township_id
      and log.user_id = v_user_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'slug',
        breakdown.slug,
        'name',
        breakdown.name,
        'plural_name',
        breakdown.plural_name,
        'kg',
        breakdown.kg
      )
      order by breakdown.sort_order
    ),
    '[]'::jsonb
  )
  into v_materials
  from (
    select
      material.slug,
      material.name,
      material.plural_name,
      material.sort_order,
      round(sum(item.estimated_kg), 3) as kg
    from public.recycling_logs log
    join public.recycling_log_items item on item.log_id = log.id
    join public.recycling_materials material on material.id = item.material_id
    where log.township_id = p_township_id
      and log.user_id = v_user_id
    group by
      material.id,
      material.slug,
      material.name,
      material.plural_name,
      material.sort_order
  ) breakdown;

  if v_materials is null then
    v_materials := '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',
        log.id,
        'occurred_on',
        log.occurred_on,
        'method',
        log.method,
        'total_kg',
        log.total_kg,
        'photo_paths',
        coalesce(log.photo_paths, '{}')
      )
      order by log.occurred_on desc, log.created_at desc
    ),
    '[]'::jsonb
  )
  into v_recent
  from (
    select *
    from public.recycling_logs
    where township_id = p_township_id
      and user_id = v_user_id
    order by occurred_on desc, created_at desc
    limit 10
  ) log;

  return jsonb_build_object(
    'lifetime_kg',
    coalesce(v_lifetime_kg, 0),
    'month_kg',
    coalesce(v_month_kg, 0),
    'co2e_kg',
    case when v_co2e_available then coalesce(v_co2e_kg, 0) else null end,
    'energy_kwh',
    case when v_energy_available then coalesce(v_energy_kwh, 0) else null end,
    'co2e_available',
    v_co2e_available,
    'energy_available',
    v_energy_available,
    'material_breakdown',
    v_materials,
    'recent_logs',
    v_recent,
    'estimated',
    true
  );
end;
$$;

revoke execute on function public.log_recycling(jsonb) from public, anon, authenticated, service_role;
revoke execute on function public.resident_recycling_summary(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.log_recycling(jsonb) to authenticated;
grant execute on function public.resident_recycling_summary(uuid, uuid) to authenticated;
