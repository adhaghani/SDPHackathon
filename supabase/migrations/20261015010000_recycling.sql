-- Resident recycling estimates, impact factors and community campaign goals.

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

create table if not exists public.recycling_materials (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 80),
  plural_name text not null check (char_length(plural_name) between 1 and 80),
  sort_order integer not null default 0,
  co2e_kg_per_kg numeric(12, 6) check (co2e_kg_per_kg is null or co2e_kg_per_kg >= 0),
  energy_kwh_per_kg numeric(12, 6) check (energy_kwh_per_kg is null or energy_kwh_per_kg >= 0),
  factor_source text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recycling_units (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.recycling_materials(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 100),
  unit_label text not null check (char_length(unit_label) between 1 and 40),
  kg_per_unit numeric(10, 4) not null check (kg_per_unit > 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (material_id, slug)
);

create index if not exists recycling_units_material_idx
  on public.recycling_units (material_id, sort_order, name);

-- ---------------------------------------------------------------------------
-- Resident logs
-- ---------------------------------------------------------------------------

create table if not exists public.recycling_logs (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null check (occurred_on >= date '2020-01-01'),
  method text not null default 'count' check (method in ('count', 'custom_kg')),
  total_kg numeric(12, 3) not null check (total_kg > 0 and total_kg <= 100),
  source text not null default 'self_reported',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recycling_logs_user_township_date_idx
  on public.recycling_logs (user_id, township_id, occurred_on desc);
create index if not exists recycling_logs_township_date_idx
  on public.recycling_logs (township_id, occurred_on desc);

create table if not exists public.recycling_log_items (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.recycling_logs(id) on delete cascade,
  material_id uuid not null references public.recycling_materials(id) on delete restrict,
  unit_id uuid references public.recycling_units(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 500),
  estimated_kg numeric(12, 4) not null check (estimated_kg > 0 and estimated_kg <= 100),
  created_at timestamptz not null default now(),
  constraint recycling_item_unit_requires_count
    check (unit_id is not null or quantity = 1)
);

create index if not exists recycling_log_items_log_idx
  on public.recycling_log_items (log_id);
create index if not exists recycling_log_items_material_idx
  on public.recycling_log_items (material_id);

-- ---------------------------------------------------------------------------
-- Township campaigns
-- ---------------------------------------------------------------------------

create table if not exists public.recycling_campaigns (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  starts_on date not null,
  ends_on date not null,
  target_kg numeric(12, 3) not null check (target_kg > 0),
  status text not null default 'active'
    check (status in ('active', 'completed', 'ended', 'cancelled')),
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recycling_campaign_dates_valid check (ends_on >= starts_on),
  constraint recycling_campaign_completed_timestamp
    check ((status = 'completed') = (completed_at is not null))
);

create index if not exists recycling_campaigns_township_status_idx
  on public.recycling_campaigns (township_id, status, starts_on desc);
create unique index if not exists recycling_campaigns_one_active_uidx
  on public.recycling_campaigns (township_id)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.recycling_materials enable row level security;
alter table public.recycling_units enable row level security;
alter table public.recycling_logs enable row level security;
alter table public.recycling_log_items enable row level security;
alter table public.recycling_campaigns enable row level security;

drop policy if exists recycling_materials_select_authenticated on public.recycling_materials;
create policy recycling_materials_select_authenticated on public.recycling_materials
  for select to authenticated using (active = true);

drop policy if exists recycling_units_select_authenticated on public.recycling_units;
create policy recycling_units_select_authenticated on public.recycling_units
  for select to authenticated using (active = true);

drop policy if exists recycling_logs_select_own on public.recycling_logs;
create policy recycling_logs_select_own on public.recycling_logs
  for select to authenticated using (user_id = auth.uid());

drop policy if exists recycling_log_items_select_own on public.recycling_log_items;
create policy recycling_log_items_select_own on public.recycling_log_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.recycling_logs log
      where log.id = log_id
        and log.user_id = auth.uid()
    )
  );

drop policy if exists recycling_campaigns_select_member on public.recycling_campaigns;
create policy recycling_campaigns_select_member on public.recycling_campaigns
  for select to authenticated using (public.is_active_member(township_id));

revoke all on public.recycling_materials from anon, authenticated;
revoke all on public.recycling_units from anon, authenticated;
revoke all on public.recycling_logs from anon, authenticated;
revoke all on public.recycling_log_items from anon, authenticated;
revoke all on public.recycling_campaigns from anon, authenticated;
grant select on public.recycling_materials to authenticated;
grant select on public.recycling_units to authenticated;
grant select on public.recycling_logs to authenticated;
grant select on public.recycling_log_items to authenticated;
grant select on public.recycling_campaigns to authenticated;

-- ---------------------------------------------------------------------------
-- Catalogue and cited launch factors
-- ---------------------------------------------------------------------------

-- EPA WARM v16 Summary Data and Summary Data NRG values are reported per
-- short ton. The factors below convert those values to kg/kg and kWh/kg.
insert into public.recycling_materials (
  slug,
  name,
  plural_name,
  sort_order,
  co2e_kg_per_kg,
  energy_kwh_per_kg,
  factor_source
)
values
  (
    'plastic',
    'Plastic',
    'plastic items',
    10,
    1.020203,
    11.317000,
    'US EPA WARM v16 (2023), Summary Data and Summary Data NRG: Mixed Plastics; https://www.epa.gov/waste-reduction-model/documentation-waste-reduction-model'
  ),
  (
    'glass',
    'Glass',
    'glass items',
    20,
    0.304343,
    0.686700,
    'US EPA WARM v16 (2023), Summary Data and Summary Data NRG: Glass; https://www.epa.gov/waste-reduction-model/documentation-waste-reduction-model'
  ),
  (
    'paper',
    'Paper',
    'paper items',
    30,
    3.908200,
    6.644500,
    'US EPA WARM v16 (2023), Summary Data and Summary Data NRG: Mixed Paper (general); https://www.epa.gov/waste-reduction-model/documentation-waste-reduction-model'
  ),
  (
    'cardboard',
    'Cardboard',
    'cardboard items',
    40,
    3.456100,
    4.881000,
    'US EPA WARM v16 (2023), Summary Data and Summary Data NRG: Corrugated Containers; https://www.epa.gov/waste-reduction-model/documentation-waste-reduction-model'
  ),
  (
    'aluminium',
    'Aluminium',
    'aluminium items',
    50,
    10.061100,
    49.365000,
    'US EPA WARM v16 (2023), Summary Data and Summary Data NRG: Aluminum Cans; https://www.epa.gov/waste-reduction-model/documentation-waste-reduction-model'
  ),
  (
    'steel',
    'Steel',
    'steel items',
    60,
    2.019500,
    6.451000,
    'US EPA WARM v16 (2023), Summary Data and Summary Data NRG: Steel Cans; https://www.epa.gov/waste-reduction-model/documentation-waste-reduction-model'
  )
on conflict (slug) do update
set name = excluded.name,
    plural_name = excluded.plural_name,
    sort_order = excluded.sort_order,
    co2e_kg_per_kg = excluded.co2e_kg_per_kg,
    energy_kwh_per_kg = excluded.energy_kwh_per_kg,
    factor_source = excluded.factor_source,
    active = true,
    updated_at = now();

insert into public.recycling_units (
  material_id,
  slug,
  name,
  unit_label,
  kg_per_unit,
  sort_order
)
select
  m.id,
  u.slug,
  u.name,
  u.unit_label,
  u.kg_per_unit,
  u.sort_order
from (values
  ('plastic', 'plastic-500ml-bottle', '500ml bottle', 'bottle', 0.0200, 10),
  ('plastic', 'plastic-1500ml-bottle', '1.5L bottle', 'bottle', 0.0500, 20),
  ('plastic', 'plastic-container', 'Plastic container', 'container', 0.0300, 30),
  ('glass', 'glass-300ml-bottle', '300ml bottle', 'bottle', 0.2200, 10),
  ('glass', 'glass-750ml-bottle', '750ml bottle', 'bottle', 0.4500, 20),
  ('glass', 'glass-jar', 'Glass jar', 'jar', 0.3500, 30),
  ('paper', 'paper-newspaper-bundle', 'Newspaper bundle', 'bundle', 2.0000, 10),
  ('paper', 'paper-magazine-stack', 'Magazine stack', 'stack', 1.5000, 20),
  ('cardboard', 'cardboard-medium-box', 'Flattened medium box', 'box', 0.5000, 10),
  ('cardboard', 'cardboard-cereal-box', 'Cereal box', 'box', 0.0500, 20),
  ('aluminium', 'aluminium-can', 'Drink can', 'can', 0.0140, 10),
  ('steel', 'steel-food-can', 'Food can', 'can', 0.0500, 10)
) as u(material_slug, slug, name, unit_label, kg_per_unit, sort_order)
join public.recycling_materials m on m.slug = u.material_slug
on conflict (material_id, slug) do update
set name = excluded.name,
    unit_label = excluded.unit_label,
    kg_per_unit = excluded.kg_per_unit,
    sort_order = excluded.sort_order,
    active = true,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- Reward rule
-- ---------------------------------------------------------------------------

insert into public.reward_rules (
  township_id,
  action_type,
  category_slug,
  points,
  daily_cap,
  weekly_cap,
  active,
  reason_template
)
values (
  null,
  'recycling_goal_completed',
  null,
  50,
  null,
  null,
  true,
  'Township recycling goal completed'
)
on conflict (township_id, action_type, category_slug) do update
set points = excluded.points,
    daily_cap = excluded.daily_cap,
    weekly_cap = excluded.weekly_cap,
    active = excluded.active,
    reason_template = excluded.reason_template;

-- ---------------------------------------------------------------------------
-- Resident log RPC
-- ---------------------------------------------------------------------------

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
  v_line jsonb;
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
    or v_occurred_on > (now() at time zone 'Asia/Kuala_Lumpur')::date
    or v_occurred_on < date '2020-01-01' then
    raise exception 'invalid_date';
  end if;

  if jsonb_typeof(v_lines) <> 'array'
    or jsonb_array_length(v_lines) < 1
    or jsonb_array_length(v_lines) > 20 then
    raise exception 'invalid_lines';
  end if;

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
    total_kg
  )
  values (
    v_township_id,
    v_user_id,
    v_occurred_on,
    v_method,
    round(v_total_kg, 3)
  )
  returning id into v_log_id;

  -- Insert the item rows after the parent row exists.
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
    'estimated',
    true
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Campaign refresh and resident summaries
-- ---------------------------------------------------------------------------

create or replace function public._recycling_refresh_campaign(p_township_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign public.recycling_campaigns%rowtype;
  v_total_kg numeric;
  v_percent numeric;
  v_contributor uuid;
  v_award jsonb;
begin
  select *
  into v_campaign
  from public.recycling_campaigns
  where township_id = p_township_id
    and status = 'active'
  order by starts_on desc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('has_campaign', false);
  end if;

  select coalesce(sum(log.total_kg), 0)
  into v_total_kg
  from public.recycling_logs log
  where log.township_id = p_township_id
    and log.occurred_on between v_campaign.starts_on and v_campaign.ends_on;

  v_percent := least(
    100,
    round((v_total_kg / v_campaign.target_kg) * 100, 1)
  );

  if v_campaign.completed_at is null and v_total_kg >= v_campaign.target_kg then
    update public.recycling_campaigns
    set status = 'completed',
        completed_at = now(),
        updated_at = now()
    where id = v_campaign.id;

    for v_contributor in
      select distinct log.user_id
      from public.recycling_logs log
      where log.township_id = p_township_id
        and log.occurred_on between v_campaign.starts_on and v_campaign.ends_on
        and exists (
          select 1
          from public.township_members member
          where member.township_id = p_township_id
            and member.user_id = log.user_id
            and member.status = 'active'
        )
      order by log.user_id
    loop
      v_award := public.award_points(
        v_contributor,
        p_township_id,
        'recycling_goal_completed',
        'recycling_campaign',
        v_campaign.id,
        null,
        jsonb_build_object(
          'campaign_id',
          v_campaign.id,
          'target_kg',
          v_campaign.target_kg
        ),
        now()
      );
    end loop;
  end if;

  return jsonb_build_object(
    'campaign_id',
    v_campaign.id,
    'current_kg',
    v_total_kg,
    'percent',
    v_percent,
    'completed',
    v_campaign.completed_at is not null or v_total_kg >= v_campaign.target_kg
  );
end;
$$;

create or replace function public.township_recycling_progress(p_township_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_campaign public.recycling_campaigns%rowtype;
  v_total_kg numeric;
  v_percent numeric;
  v_reward_bp integer;
  v_rewards_enabled boolean;
  v_is_contributor boolean := false;
begin
  if v_user_id is null or not public.is_active_member(p_township_id) then
    raise exception 'not_active_member';
  end if;

  perform public._recycling_refresh_campaign(p_township_id);

  select *
  into v_campaign
  from public.recycling_campaigns
  where township_id = p_township_id
    and status in ('active', 'completed', 'ended')
  order by case when status = 'active' then 0 when status = 'completed' then 1 else 2 end,
           starts_on desc
  limit 1;

  if not found then
    return jsonb_build_object('has_campaign', false, 'estimated', true);
  end if;

  select exists (
    select 1
    from public.recycling_logs log
    where log.township_id = p_township_id
      and log.user_id = v_user_id
      and log.occurred_on between v_campaign.starts_on and v_campaign.ends_on
  )
  into v_is_contributor;

  select coalesce(sum(log.total_kg), 0)
  into v_total_kg
  from public.recycling_logs log
  where log.township_id = p_township_id
    and log.occurred_on between v_campaign.starts_on and v_campaign.ends_on;

  v_percent := least(
    100,
    round((v_total_kg / v_campaign.target_kg) * 100, 1)
  );

  select rewards_enabled
  into v_rewards_enabled
  from public.townships
  where id = p_township_id;

  select points
  into v_reward_bp
  from public.reward_rules
  where action_type = 'recycling_goal_completed'
    and category_slug is null
    and active = true
    and (township_id is null or township_id = p_township_id)
  order by (township_id is not null) desc
  limit 1;

  if coalesce(v_rewards_enabled, false) = false or v_reward_bp is null then
    v_reward_bp := null;
  end if;

  return jsonb_build_object(
    'has_campaign',
    true,
    'campaign_id',
    v_campaign.id,
    'title',
    v_campaign.title,
    'starts_on',
    v_campaign.starts_on,
    'ends_on',
    v_campaign.ends_on,
    'target_kg',
    v_campaign.target_kg,
    'current_kg',
    v_total_kg,
    'percent',
    v_percent,
    'status',
    v_campaign.status,
    'completed',
    v_campaign.status = 'completed' or v_campaign.completed_at is not null,
    'days_remaining',
    greatest(0, v_campaign.ends_on - (now() at time zone 'Asia/Kuala_Lumpur')::date),
    'reward_bp',
    v_reward_bp,
    'is_contributor',
    v_is_contributor,
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

  -- jsonb_agg over grouped rows still needs a wrapper for an empty result.
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
        log.total_kg
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

-- ---------------------------------------------------------------------------
-- Admin configuration RPCs
-- ---------------------------------------------------------------------------

create or replace function public.set_recycling_campaign(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := nullif(p_payload->>'township_id', '')::uuid;
  v_campaign_id uuid := nullif(p_payload->>'campaign_id', '')::uuid;
  v_title text := trim(coalesce(p_payload->>'title', ''));
  v_starts_on date := nullif(p_payload->>'starts_on', '')::date;
  v_ends_on date := nullif(p_payload->>'ends_on', '')::date;
  v_target_kg numeric := nullif(p_payload->>'target_kg', '')::numeric;
  v_status text := coalesce(p_payload->>'status', 'active');
  v_campaign public.recycling_campaigns%rowtype;
begin
  if v_user_id is null or v_township_id is null or not public.is_township_admin(v_township_id) then
    raise exception 'admin_required';
  end if;
  if char_length(v_title) < 3 or char_length(v_title) > 120 then
    raise exception 'invalid_title';
  end if;
  if v_starts_on is null or v_ends_on is null or v_ends_on < v_starts_on then
    raise exception 'invalid_dates';
  end if;
  if v_target_kg is null or v_target_kg <= 0 or v_target_kg > 1000000 then
    raise exception 'invalid_target';
  end if;
  if v_status not in ('active', 'cancelled') then
    raise exception 'invalid_status';
  end if;

  if v_campaign_id is not null then
    select * into v_campaign
    from public.recycling_campaigns
    where id = v_campaign_id
      and township_id = v_township_id
    for update;
    if not found then
      raise exception 'campaign_not_found';
    end if;
    if v_campaign.status not in ('active', 'cancelled') then
      raise exception 'campaign_locked';
    end if;
    if v_status = 'active' and exists (
      select 1
      from public.recycling_campaigns
      where township_id = v_township_id
        and status = 'active'
        and id <> v_campaign.id
    ) then
      raise exception 'active_campaign_exists';
    end if;
    update public.recycling_campaigns
    set title = v_title,
        starts_on = v_starts_on,
        ends_on = v_ends_on,
        target_kg = v_target_kg,
        status = v_status,
        updated_at = now()
    where id = v_campaign.id
    returning * into v_campaign;
  else
    if v_status = 'active' and exists (
      select 1
      from public.recycling_campaigns
      where township_id = v_township_id
        and status = 'active'
    ) then
      raise exception 'active_campaign_exists';
    end if;
    insert into public.recycling_campaigns (
      township_id,
      title,
      starts_on,
      ends_on,
      target_kg,
      status,
      created_by
    )
    values (
      v_township_id,
      v_title,
      v_starts_on,
      v_ends_on,
      v_target_kg,
      v_status,
      v_user_id
    )
    returning * into v_campaign;
  end if;

  return jsonb_build_object(
    'campaign_id',
    v_campaign.id,
    'status',
    v_campaign.status,
    'target_kg',
    v_campaign.target_kg
  );
end;
$$;

create or replace function public.set_recycling_material_factor(
  p_slug text,
  p_co2e_kg_per_kg numeric,
  p_energy_kwh_per_kg numeric,
  p_source text,
  p_township_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_material public.recycling_materials%rowtype;
begin
  if v_user_id is null or p_township_id is null or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;
  if p_co2e_kg_per_kg is null or p_co2e_kg_per_kg < 0
    or p_energy_kwh_per_kg is null or p_energy_kwh_per_kg < 0 then
    raise exception 'invalid_factor';
  end if;
  if char_length(coalesce(trim(p_source), '')) < 3 then
    raise exception 'invalid_factor_source';
  end if;

  update public.recycling_materials
  set co2e_kg_per_kg = p_co2e_kg_per_kg,
      energy_kwh_per_kg = p_energy_kwh_per_kg,
      factor_source = trim(p_source),
      updated_at = now()
  where slug = p_slug
  returning * into v_material;

  if not found then
    raise exception 'material_not_found';
  end if;

  return jsonb_build_object(
    'slug',
    v_material.slug,
    'co2e_kg_per_kg',
    v_material.co2e_kg_per_kg,
    'energy_kwh_per_kg',
    v_material.energy_kwh_per_kg,
    'factor_source',
    v_material.factor_source
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke execute on function public.log_recycling(jsonb) from public, anon, authenticated, service_role;
revoke execute on function public._recycling_refresh_campaign(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.township_recycling_progress(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.resident_recycling_summary(uuid, uuid) from public, anon, authenticated, service_role;
revoke execute on function public.set_recycling_campaign(jsonb) from public, anon, authenticated, service_role;
revoke execute on function public.set_recycling_material_factor(text, numeric, numeric, text, uuid) from public, anon, authenticated, service_role;

grant execute on function public.log_recycling(jsonb) to authenticated;
grant execute on function public.township_recycling_progress(uuid) to authenticated;
grant execute on function public.resident_recycling_summary(uuid, uuid) to authenticated;
grant execute on function public.set_recycling_campaign(jsonb) to authenticated;
grant execute on function public.set_recycling_material_factor(text, numeric, numeric, text, uuid) to authenticated;
