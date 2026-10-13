-- Ensure guest-pass admin metrics never expose bucket counts below k = 5.
create or replace function public.guest_pass_stats(
  p_township_id uuid,
  p_from date default null,
  p_to date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_from date := coalesce(p_from, (now() at time zone 'Asia/Kuala_Lumpur')::date - 29);
  v_to date := coalesce(p_to, (now() at time zone 'Asia/Kuala_Lumpur')::date);
  v_start timestamptz;
  v_end timestamptz;
  v_daily jsonb;
  v_weekly jsonb;
  v_hours jsonb;
  v_gates jsonb;
  v_avg_stay numeric;
  v_avg_subjects integer;
  v_overstay_count integer;
  v_walk_in_total integer;
  v_walk_in_approved integer;
begin
  if v_user_id is null or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;
  if v_from > v_to then
    raise exception 'invalid_date_range';
  end if;

  v_start := ((v_from)::timestamp at time zone 'Asia/Kuala_Lumpur');
  v_end := (((v_to + 1))::timestamp at time zone 'Asia/Kuala_Lumpur');

  select coalesce(jsonb_agg(row_to_json(day_view)), '[]'::jsonb)
  into v_daily
  from (
    select
      d.day,
      case when count(distinct l.pass_id) >= 5 then count(distinct l.pass_id) else null end as visitors,
      count(distinct l.pass_id) < 5 as suppressed
    from generate_series(v_from, v_to, interval '1 day') d(day)
    left join public.visitor_logs l
      on l.township_id = p_township_id
      and l.scanned_at >= (d.day at time zone 'Asia/Kuala_Lumpur')
      and l.scanned_at < ((d.day + interval '1 day') at time zone 'Asia/Kuala_Lumpur')
      and l.sync_status in ('applied', 'needs_review')
    group by d.day
  ) day_view;

  select coalesce(jsonb_agg(row_to_json(week_view)), '[]'::jsonb)
  into v_weekly
  from (
    select
      date_trunc('week', d.day)::date as week_start,
      case when count(distinct l.pass_id) >= 5 then count(distinct l.pass_id) else null end as visitors,
      count(distinct l.pass_id) < 5 as suppressed
    from generate_series(v_from, v_to, interval '1 day') d(day)
    left join public.visitor_logs l
      on l.township_id = p_township_id
      and l.scanned_at >= (d.day at time zone 'Asia/Kuala_Lumpur')
      and l.scanned_at < ((d.day + interval '1 day') at time zone 'Asia/Kuala_Lumpur')
      and l.sync_status in ('applied', 'needs_review')
    group by date_trunc('week', d.day)
  ) week_view;

  select coalesce(jsonb_agg(row_to_json(hour_view)), '[]'::jsonb)
  into v_hours
  from (
    select
      extract(hour from l.scanned_at at time zone 'Asia/Kuala_Lumpur')::integer as hour,
      case when count(distinct l.pass_id) >= 5 then count(distinct l.pass_id) else null end as visitors,
      count(distinct l.pass_id) < 5 as suppressed
    from public.visitor_logs l
    where l.township_id = p_township_id
      and l.scanned_at >= v_start
      and l.scanned_at < v_end
      and l.sync_status in ('applied', 'needs_review')
    group by 1
    order by 1
  ) hour_view;

  select coalesce(jsonb_agg(row_to_json(gate_view)), '[]'::jsonb)
  into v_gates
  from (
    select
      g.name,
      case when count(distinct l.pass_id) >= 5 then count(distinct l.pass_id) else null end as passes,
      count(distinct l.pass_id) < 5 as suppressed
    from public.gates g
    left join public.visitor_logs l
      on l.gate_id = g.id
      and l.township_id = p_township_id
      and l.scanned_at >= v_start
      and l.scanned_at < v_end
      and l.sync_status in ('applied', 'needs_review')
    where g.township_id = p_township_id
    group by g.id, g.name
  ) gate_view;

  select
    avg(stay_seconds),
    count(distinct pass_id)
  into v_avg_stay, v_avg_subjects
  from (
    select
      p.id as pass_id,
      extract(epoch from (max(case when l.direction = 'out' then l.scanned_at end) - min(case when l.direction = 'in' then l.scanned_at end))) as stay_seconds
    from public.visitor_logs l
    join public.visitor_passes p on p.id = l.pass_id
    where l.township_id = p_township_id
      and l.scanned_at >= v_start
      and l.scanned_at < v_end
      and l.sync_status = 'applied'
      and l.applied = true
    group by p.id
    having min(case when l.direction = 'in' then l.scanned_at end) is not null
      and max(case when l.direction = 'out' then l.scanned_at end) is not null
  ) stays;

  select count(distinct p.id)
  into v_overstay_count
  from public.visitor_passes p
  where p.township_id = p_township_id
    and p.valid_until >= v_start
    and p.valid_until < v_end
    and public.guest_pass_is_inside(p.id)
    and now() > p.valid_until;

  select count(*), count(*) filter (where status = 'approved')
  into v_walk_in_total, v_walk_in_approved
  from public.walk_in_requests
  where township_id = p_township_id
    and requested_at >= v_start
    and requested_at < v_end
    and status in ('approved', 'denied');

  return jsonb_build_object(
    'range', jsonb_build_object('from', v_from, 'to', v_to),
    'visitors_per_day', coalesce(v_daily, '[]'::jsonb),
    'visitors_per_week', coalesce(v_weekly, '[]'::jsonb),
    'peak_hours', coalesce(v_hours, '[]'::jsonb),
    'passes_per_gate', coalesce(v_gates, '[]'::jsonb),
    'average_stay_seconds', case when coalesce(v_avg_subjects, 0) >= 5 then v_avg_stay else null end,
    'average_stay_suppressed', coalesce(v_avg_subjects, 0) < 5,
    'overstay_count', case when v_overstay_count >= 5 then v_overstay_count else null end,
    'overstay_suppressed', v_overstay_count < 5,
    'walk_in_approval_rate', case when v_walk_in_total >= 5 then round((v_walk_in_approved::numeric / nullif(v_walk_in_total, 0)) * 100, 1) else null end,
    'walk_in_approval_suppressed', v_walk_in_total < 5,
    'suppression_threshold', 5
  );
end;
$$;

revoke execute on function public.guest_pass_stats(uuid, date, date) from public, anon, authenticated;
grant execute on function public.guest_pass_stats(uuid, date, date) to authenticated;
