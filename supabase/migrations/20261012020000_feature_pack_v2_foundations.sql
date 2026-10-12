-- Feature Pack v2, Phase 1: search analytics, item value metadata and point reasons.

alter table public.item_categories
  add column if not exists kind text not null default 'item',
  add column if not exists co2e_kg_per_borrow numeric(10,3),
  add column if not exists co2e_source text;

alter table public.item_categories
  drop constraint if exists item_categories_kind_check;
alter table public.item_categories
  add constraint item_categories_kind_check check (kind in ('item', 'skill'));

alter table public.items
  add column if not exists kind text not null default 'item',
  add column if not exists value_source text not null default 'category_default',
  add column if not exists requires_deposit boolean not null default false,
  add column if not exists allow_deposit_waiver boolean not null default false,
  add column if not exists min_trust_tier text;

alter table public.items
  drop constraint if exists items_kind_check,
  drop constraint if exists items_value_source_check,
  drop constraint if exists items_min_trust_tier_check,
  drop constraint if exists items_deposit_requirement_check;
alter table public.items
  add constraint items_kind_check check (kind in ('item', 'skill')),
  add constraint items_value_source_check check (value_source in ('owner', 'suggested', 'category_default')),
  add constraint items_min_trust_tier_check check (
    min_trust_tier is null or min_trust_tier in ('building', 'trusted', 'highly_trusted')
  ),
  add constraint items_deposit_requirement_check check (
    requires_deposit = false and deposit_rm = 0
    or requires_deposit = true
  );

update public.items
set requires_deposit = deposit_rm > 0
where requires_deposit = false and deposit_rm > 0;

update public.items
set value_source = 'owner'
where estimated_new_price_rm is not null and value_source = 'category_default';

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  neighbourhood_id uuid references public.neighbourhoods(id) on delete set null,
  normalized_term text not null default '',
  category_id uuid references public.item_categories(id) on delete set null,
  results_count integer not null default 0 check (results_count >= 0),
  available_count integer not null default 0 check (available_count >= 0),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists search_events_township_created_idx
  on public.search_events (township_id, created_at desc);
create index if not exists search_events_term_idx
  on public.search_events (township_id, normalized_term, created_at desc);
create index if not exists search_events_category_idx
  on public.search_events (township_id, category_id, created_at desc);

alter table public.search_events enable row level security;

drop policy if exists search_events_select_admin on public.search_events;
create policy search_events_select_admin on public.search_events
  for select to authenticated
  using (public.is_township_admin(township_id));

revoke all on public.search_events from anon, authenticated;
grant select on public.search_events to authenticated;

create or replace function public.normalize_borrow_search_term(p_term text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when v_term in ('drill', 'drills', 'gerudi') then 'drill'
    when v_term in ('ladder', 'ladders', 'tangga') then 'ladder'
    when v_term in ('table', 'tables', 'meja') then 'table'
    when v_term in ('chair', 'chairs', 'kerusi') then 'chair'
    when v_term in ('pot', 'pots', 'periuk') then 'pot'
    else v_term
  end
  from (
    select regexp_replace(lower(coalesce(trim(p_term), '')), '\s+', ' ', 'g') as v_term
  ) normalized;
$$;

create or replace function public.log_borrow_search(
  p_township_id uuid,
  p_neighbourhood_id uuid default null,
  p_term text default '',
  p_category_id uuid default null,
  p_results_count integer default 0,
  p_available_count integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_search_id uuid;
  v_normalized text;
begin
  if auth.uid() is null or not public.is_active_member(p_township_id) then
    raise exception 'not_active_member';
  end if;

  if p_neighbourhood_id is not null and not exists (
    select 1
    from public.neighbourhoods
    where id = p_neighbourhood_id and township_id = p_township_id
  ) then
    raise exception 'invalid_neighbourhood';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.item_categories where id = p_category_id
  ) then
    raise exception 'invalid_category';
  end if;

  v_normalized := public.normalize_borrow_search_term(p_term);
  insert into public.search_events (
    township_id,
    neighbourhood_id,
    normalized_term,
    category_id,
    results_count,
    available_count
  )
  values (
    p_township_id,
    p_neighbourhood_id,
    v_normalized,
    p_category_id,
    greatest(coalesce(p_results_count, 0), 0),
    greatest(coalesce(p_available_count, 0), 0)
  )
  returning id into v_search_id;

  return jsonb_build_object(
    'search_id',
    v_search_id,
    'normalized_term',
    v_normalized,
    'results_count',
    greatest(coalesce(p_results_count, 0), 0),
    'available_count',
    greatest(coalesce(p_available_count, 0), 0)
  );
end;
$$;

alter table public.reward_rules
  add column if not exists reason_template text not null default 'Verified township activity';

alter table public.points_ledger
  add column if not exists reason text not null default 'Verified township activity';

update public.reward_rules
set reason_template = case action_type
  when 'event_attendance' then
    case when category_slug = 'gotong-royong'
      then 'Verified gotong-royong check-in'
      else 'Verified event check-in'
    end
  when 'item_lent_completed' then 'Return confirmed by both sides'
  when 'item_returned_on_time' then 'Returned on time and confirmed'
  when 'event_hosted' then 'Event completed with at least three verified attendees'
  when 'help_completed' then 'Help completed and confirmed'
  when 'event_volunteer' then 'Volunteer hours verified by event staff'
  else 'Verified township activity'
end
where reason_template = 'Verified township activity';

update public.points_ledger
set reason = format(
  '%s BP · %s',
  delta,
  case
    when action_type = 'redemption' then 'Reward redeemed'
    when action_type = 'event_attendance' and coalesce(metadata->>'counts_as_sustainability', 'false') = 'true'
      then 'Verified gotong-royong check-in'
    when action_type = 'event_attendance' then 'Verified event check-in'
    when action_type = 'item_lent_completed' then 'Return confirmed by both sides'
    when action_type = 'item_returned_on_time' then 'Returned on time and confirmed'
    when action_type = 'event_hosted' then 'Event completed with at least three verified attendees'
    when action_type = 'help_completed' then 'Help completed and confirmed'
    when action_type = 'event_volunteer' then 'Volunteer hours verified by event staff'
    else 'Verified township activity'
  end
)
where reason = 'Verified township activity';

insert into public.reward_rules (
  township_id,
  action_type,
  category_slug,
  points,
  reason_template
)
values
  (null, 'item_request_fulfilled', null, 15, 'Request fulfilled and confirmed by both sides'),
  (null, 'item_guide_added', null, 5, 'How-to guide added to an item'),
  (null, 'streak_milestone_3', null, 25, 'Three-month sharing streak reached'),
  (null, 'streak_milestone_6', null, 60, 'Six-month sharing streak reached'),
  (null, 'streak_milestone_12', null, 150, 'Twelve-month sharing streak reached'),
  (null, 'invite_accepted', null, 30, 'Neighbour joined and completed a first borrow'),
  (null, 'neighbour_of_month', null, 100, 'Selected as Neighbour of the month')
on conflict (township_id, action_type, category_slug) do nothing;

create or replace function public.award_points(
  p_user_id uuid,
  p_township_id uuid,
  p_action_type text,
  p_source_type text,
  p_source_id uuid,
  p_category_slug text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_township public.townships%rowtype;
  v_rule public.reward_rules%rowtype;
  v_existing public.points_ledger%rowtype;
  v_delta integer;
  v_reason text;
  v_day_start timestamptz;
  v_week_start timestamptz;
  v_period_total integer;
begin
  select * into v_township from public.townships where id = p_township_id;
  if not found or v_township.rewards_enabled = false then
    return null;
  end if;

  select *
  into v_rule
  from public.reward_rules
  where active = true
    and action_type = p_action_type
    and (township_id is null or township_id = p_township_id)
    and (category_slug is null or category_slug = p_category_slug)
  order by (township_id is not null) desc, (category_slug is not null) desc
  limit 1;

  if not found then
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text || ':' || p_action_type));
  v_delta := v_rule.points;
  v_reason := format(
    '%s BP · %s',
    v_delta,
    coalesce(nullif(trim(v_rule.reason_template), ''), 'Verified township activity')
  );
  v_day_start := date_trunc('day', p_occurred_at at time zone v_township.timezone) at time zone v_township.timezone;
  v_week_start := date_trunc('week', p_occurred_at at time zone v_township.timezone) at time zone v_township.timezone;

  if v_rule.daily_cap is not null then
    select count(*)
    into v_period_total
    from public.points_ledger
    where user_id = p_user_id
      and township_id = p_township_id
      and action_type = p_action_type
      and created_at >= v_day_start;
    if v_period_total >= v_rule.daily_cap then
      return null;
    end if;
  end if;

  if v_rule.weekly_cap is not null then
    select count(*)
    into v_period_total
    from public.points_ledger
    where user_id = p_user_id
      and township_id = p_township_id
      and action_type = p_action_type
      and created_at >= v_week_start;
    if v_period_total >= v_rule.weekly_cap then
      return null;
    end if;
  end if;

  if v_delta <= 0 then
    return null;
  end if;

  insert into public.points_ledger (
    township_id,
    user_id,
    delta,
    action_type,
    source_type,
    source_id,
    rule_id,
    metadata,
    reason,
    created_at
  )
  values (
    p_township_id,
    p_user_id,
    v_delta,
    p_action_type,
    p_source_type,
    p_source_id,
    v_rule.id,
    p_metadata,
    v_reason,
    p_occurred_at
  )
  on conflict (user_id, action_type, source_type, source_id) do nothing
  returning * into v_existing;

  if not found then
    return null;
  end if;

  perform public.evaluate_badges(p_user_id, p_township_id);
  perform public.update_challenge_progress(
    p_user_id,
    p_township_id,
    p_action_type,
    p_category_slug,
    p_occurred_at
  );

  insert into public.notifications (user_id, type, title, body, link, dedupe_key, created_at)
  values (
    p_user_id,
    'points_awarded',
    'BetterPoints earned',
    v_reason,
    '/rewards',
    'points:' || v_existing.id::text,
    p_occurred_at
  )
  on conflict (user_id, dedupe_key) do nothing;

  return to_jsonb(v_existing);
end;
$$;

revoke execute on function public.normalize_borrow_search_term(text) from public, anon, authenticated, service_role;
revoke execute on function public.log_borrow_search(uuid, uuid, text, uuid, integer, integer) from public, anon, authenticated, service_role;
grant execute on function public.normalize_borrow_search_term(text) to service_role;
grant execute on function public.log_borrow_search(uuid, uuid, text, uuid, integer, integer) to authenticated, service_role;
