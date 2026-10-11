create or replace function public.admin_insights(
  p_township_id uuid,
  p_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_township public.townships%rowtype;
  v_start timestamptz;
  v_grid jsonb;
  v_cohorts jsonb;
  v_neighbourhoods jsonb;
  v_facilities jsonb;
  v_suggestions jsonb := '[]'::jsonb;
begin
  select * into v_township from public.townships where id = p_township_id;
  if not found or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;

  v_start := now() - make_interval(days => greatest(coalesce(p_days, 30), 1));

  select coalesce(jsonb_agg(value order by value->>'weekday', value->>'slot'), '[]'::jsonb)
  into v_grid
  from (
    select jsonb_build_object(
      'weekday', to_char(e.starts_at at time zone v_township.timezone, 'Dy'),
      'slot', case
        when extract(hour from e.starts_at at time zone v_township.timezone) < 12 then 'Morning'
        when extract(hour from e.starts_at at time zone v_township.timezone) < 17 then 'Afternoon'
        else 'Evening'
      end,
      'count', count(*)
    ) as value
    from public.event_rsvps r
    join public.events e on e.id = r.event_id
    where e.township_id = p_township_id
      and r.status = 'checked_in'
      and r.checked_in_at >= v_start
    group by
      to_char(e.starts_at at time zone v_township.timezone, 'Dy'),
      case
        when extract(hour from e.starts_at at time zone v_township.timezone) < 12 then 'Morning'
        when extract(hour from e.starts_at at time zone v_township.timezone) < 17 then 'Afternoon'
        else 'Evening'
      end
  ) grid;

  select coalesce(jsonb_agg(value), '[]'::jsonb)
  into v_cohorts
  from (
    select jsonb_build_object(
      'label', case when checked_in_events = 1 then '1 event' when checked_in_events = 2 then '2 events' else '3+ events' end,
      'residents', count(*)
    ) as value
    from (
      select r.user_id, least(count(distinct r.event_id), 3) as checked_in_events
      from public.event_rsvps r
      join public.events e on e.id = r.event_id
      where e.township_id = p_township_id
        and r.status = 'checked_in'
        and r.checked_in_at >= now() - interval '90 days'
      group by r.user_id
    ) cohorts
    group by checked_in_events
    order by checked_in_events
  ) cohort_rows;

  select coalesce(jsonb_agg(value), '[]'::jsonb)
  into v_neighbourhoods
  from (
    select jsonb_build_object(
      'neighbourhood', n.name,
      'residents', count(distinct m.user_id)
    ) as value
    from public.neighbourhoods n
    join public.township_members m on m.neighbourhood_id = n.id and m.status = 'active'
    left join public.event_rsvps r on r.user_id = m.user_id and r.status = 'checked_in'
    left join public.events e on e.id = r.event_id and e.township_id = n.township_id and e.starts_at >= v_start
    where n.township_id = p_township_id
    group by n.id, n.name
    having count(distinct case when e.id is not null then m.user_id end) >= 5
    order by count(distinct case when e.id is not null then m.user_id end) desc
  ) neighbourhood_rows;

  select coalesce(jsonb_agg(value), '[]'::jsonb)
  into v_facilities
  from (
    select jsonb_build_object(
      'facility', f.name,
      'event_hours', round(coalesce(sum(case when e.starts_at <= now() then extract(epoch from (least(e.ends_at, now()) - greatest(e.starts_at, v_start))) / 3600 else 0 end), 0), 2),
      'available_hours', round(f.weekly_available_hours * greatest(extract(epoch from (now() - v_start)) / 604800, 1), 2),
      'underused', coalesce(sum(case when e.starts_at <= now() then extract(epoch from (least(e.ends_at, now()) - greatest(e.starts_at, v_start))) / 3600 else 0 end), 0) < (f.weekly_available_hours * greatest(extract(epoch from (now() - v_start)) / 604800, 1) * 0.25)
    ) as value
    from public.facilities f
    left join public.events e on e.facility_id = f.id and e.township_id = f.township_id and e.starts_at >= v_start
    where f.township_id = p_township_id
    group by f.id, f.name, f.weekly_available_hours
  ) facility_rows;

  if (select count(*) from public.event_rsvps r join public.events e on e.id = r.event_id where e.township_id = p_township_id and r.status = 'checked_in' and r.checked_in_at >= v_start) < 5 then
    v_suggestions := v_suggestions || jsonb_build_array('Add a shared event to create a measurable attendance baseline.');
  end if;
  if (select count(*) from public.facilities f where f.township_id = p_township_id) > 0 and (select count(*) from jsonb_array_elements(v_facilities) where (value->>'underused')::boolean) > 0 then
    v_suggestions := v_suggestions || jsonb_build_array('Review underused facilities when planning the next programme.');
  end if;

  return jsonb_build_object(
    'attendance_grid', v_grid,
    'repeat_cohorts', v_cohorts,
    'neighbourhood_participation', v_neighbourhoods,
    'facility_utilisation', v_facilities,
    'suggestions', v_suggestions,
    'suppression_rule', 'Neighbourhood breakdowns with fewer than 5 residents are suppressed.'
  );
end;
$$;

create or replace function public.admin_budget(
  p_township_id uuid,
  p_month date default date_trunc('month', now())::date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_active integer;
  v_programme_cost numeric(12,2);
  v_reward_cost numeric(12,2);
begin
  if not exists (select 1 from public.townships where id = p_township_id) or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;

  select count(distinct user_id) into v_active
  from public.points_ledger
  where township_id = p_township_id
    and created_at >= greatest(p_month::timestamptz, now() - interval '30 days')
    and action_type in ('event_attendance', 'item_lent_completed', 'item_returned_on_time', 'help_completed', 'redemption', 'event_hosted');

  select coalesce(sum(amount_rm), 0) into v_programme_cost
  from public.programme_costs
  where township_id = p_township_id and month = p_month;

  select coalesce(sum(r.cost_bp * rw.unit_cost_rm), 0) into v_reward_cost
  from public.redemptions r
  join public.rewards rw on rw.id = r.reward_id
  where r.township_id = p_township_id
    and r.created_at >= p_month::timestamptz
    and rw.funded_by = 'operator';

  return jsonb_build_object(
    'month', p_month,
    'active_residents', v_active,
    'programme_cost_rm', v_programme_cost,
    'operator_reward_cost_rm', v_reward_cost,
    'cost_per_active_resident_rm', case when v_active > 0 then round((v_programme_cost + v_reward_cost) / v_active, 2) else 0 end,
    'allocation_note', 'Indicative allocation only. Sponsor-funded rewards are excluded.'
  );
end;
$$;

create or replace function public.admin_rewards_economy(
  p_township_id uuid,
  p_days integer default 90
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_start timestamptz;
  v_issued integer;
  v_redeemed integer;
  v_outstanding integer;
  v_redemption_rate numeric;
  v_manual_share numeric;
  v_pair_loans integer;
begin
  if not exists (select 1 from public.townships where id = p_township_id) or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;

  v_start := now() - make_interval(days => greatest(coalesce(p_days, 90), 1));
  select coalesce(sum(delta), 0) into v_issued from public.points_ledger where township_id = p_township_id and delta > 0 and created_at >= v_start;
  select coalesce(abs(sum(delta)), 0) into v_redeemed from public.points_ledger where township_id = p_township_id and delta < 0 and created_at >= v_start;
  select coalesce(sum(delta), 0) into v_outstanding from public.points_ledger where township_id = p_township_id and delta > 0;
  select case when count(distinct user_id) > 0 then round(count(distinct case when redemption_count > 0 then user_id end)::numeric / count(distinct user_id), 3) else 0 end into v_redemption_rate
  from (
    select l.user_id, count(*) filter (where l.delta < 0) as redemption_count
    from public.points_ledger l
    where l.township_id = p_township_id and l.created_at >= v_start
    group by l.user_id
  ) residents;
  select case when count(*) > 0 then round(count(*) filter (where check_in_method = 'manual')::numeric / count(*), 3) else 0 end into v_manual_share
  from public.event_rsvps r
  join public.events e on e.id = r.event_id
  where e.township_id = p_township_id and r.status = 'checked_in' and r.checked_in_at >= v_start;
  select coalesce(sum(pair_count - 1), 0) into v_pair_loans
  from (
    select count(*) as pair_count
    from public.bookings
    where township_id = p_township_id and status = 'completed' and updated_at >= v_start
    group by borrower_id, lender_id
    having count(*) >= 2
  ) pairs;

  return jsonb_build_object(
    'points_issued', v_issued,
    'points_redeemed', v_redeemed,
    'points_outstanding', v_outstanding,
    'redemption_rate', v_redemption_rate,
    'manual_checkin_share', v_manual_share,
    'repeated_pair_loans', v_pair_loans
  );
end;
$$;

create or replace function public.reverse_points(
  p_ledger_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ledger public.points_ledger%rowtype;
  v_reversal_id uuid;
begin
  select * into v_ledger from public.points_ledger where id = p_ledger_id for update;
  if not found or not public.is_township_admin(v_ledger.township_id) then
    raise exception 'admin_required';
  end if;
  if v_ledger.delta <= 0 then
    raise exception 'reversal_not_allowed';
  end if;

  insert into public.points_ledger (township_id, user_id, delta, action_type, source_type, source_id, metadata, created_at)
  values (v_ledger.township_id, v_ledger.user_id, -v_ledger.delta, 'reversal', 'ledger_reversal', v_ledger.id, jsonb_build_object('reason', p_reason, 'original_ledger_id', v_ledger.id), now())
  returning id into v_reversal_id;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_ledger.township_id, auth.uid(), 'points_reversed', 'points_ledger', v_ledger.id, jsonb_build_object('reversal_id', v_reversal_id, 'reason', p_reason));

  return jsonb_build_object('reversal_id', v_reversal_id, 'original_ledger_id', v_ledger.id);
end;
$$;

create or replace function public.save_programme_cost(
  p_month date,
  p_label text,
  p_amount_rm numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid;
  v_id uuid;
begin
  select township_id into v_township_id
  from public.township_members
  where user_id = v_user_id and role = 'township_admin' and status = 'active'
  limit 1;

  if v_township_id is null or p_amount_rm is null or p_amount_rm < 0 or length(trim(coalesce(p_label, ''))) = 0 then
    raise exception 'admin_required';
  end if;

  insert into public.programme_costs (township_id, month, label, amount_rm)
  values (v_township_id, p_month, trim(p_label), p_amount_rm)
  on conflict (township_id, month, label)
  do update set amount_rm = excluded.amount_rm
  returning id into v_id;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_township_id, v_user_id, 'programme_cost_saved', 'programme_cost', v_id, jsonb_build_object('month', p_month, 'label', p_label, 'amount_rm', p_amount_rm));

  return jsonb_build_object('programme_cost_id', v_id);
end;
$$;

create or replace function public.admin_ledger_candidates(
  p_township_id uuid,
  p_limit integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows jsonb;
begin
  if not exists (select 1 from public.townships where id = p_township_id) or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_township_id, auth.uid(), 'raw_ledger_access', 'points_ledger', p_township_id, jsonb_build_object('reason', 'suspicious_activity_review'));

  select coalesce(jsonb_agg(value), '[]'::jsonb)
  into v_rows
  from (
    select jsonb_build_object(
      'ledger_id', l.id,
      'user_id', l.user_id,
      'action_type', l.action_type,
      'delta', l.delta,
      'created_at', l.created_at,
      'reason', case when r.check_in_method = 'manual' then 'manual_check_in' else 'repeated_pair_or_review' end
    ) as value
    from public.points_ledger l
    left join public.event_rsvps r on r.id = l.source_id and l.source_type = 'event_rsvp'
    where l.township_id = p_township_id
      and l.delta > 0
      and (r.check_in_method = 'manual' or l.user_id in (
        select borrower_id from public.bookings
        where township_id = p_township_id and status = 'completed'
        group by borrower_id, lender_id having count(*) >= 2
      ))
    order by l.created_at desc
    limit greatest(least(coalesce(p_limit, 20), 100), 1)
  ) candidates;

  return v_rows;
end;
$$;

grant execute on function public.admin_insights(uuid, integer), public.admin_budget(uuid, date), public.admin_rewards_economy(uuid, integer), public.reverse_points(uuid, text), public.save_programme_cost(date, text, numeric), public.admin_ledger_candidates(uuid, integer) to authenticated;
