-- One source of truth for badge progress and automatic eligibility.
alter table public.user_badges add column criteria_snapshot jsonb;

create or replace function public.capture_badge_criteria()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select criteria into new.criteria_snapshot from public.badges where id = new.badge_id;
  return new;
end;
$$;
revoke all on function public.capture_badge_criteria() from public, anon, authenticated, service_role;
create trigger capture_badge_criteria before insert on public.user_badges
for each row execute function public.capture_badge_criteria();

create or replace function public._badge_progress(p_user_id uuid, p_township_id uuid, p_criteria jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text := p_criteria->>'type';
  v_target integer := 1;
  v_current integer := 0;
  v_types integer := 0;
  v_weeks integer := 0;
  v_min_types integer;
  v_min_weeks integer;
  v_window integer;
  v_percent integer;
  v_eligible boolean := false;
  v_label text;
  v_requirements jsonb := '[]'::jsonb;
begin
  if v_type in ('count', 'streak', 'consecutive_recent') then
    v_target := greatest(coalesce((p_criteria->>'threshold')::integer, 1), 1);
  end if;
  if v_type = 'count' then
    select count(*) into v_current from public.points_ledger l
    where l.user_id = p_user_id and l.township_id = p_township_id
      and l.action_type = any (select jsonb_array_elements_text(p_criteria->'action_types'))
      and (p_criteria->'metadata' is null or l.metadata @> (p_criteria->'metadata'));
    v_label := case when p_criteria->'metadata'->>'counts_as_sustainability' = 'true'
      then 'qualifying sustainability activities' else 'qualifying activities' end;
  elsif v_type = 'streak' then
    -- Preserve the existing resident-wide sharing-streak definition.
    v_current := coalesce((public._user_streak(p_user_id)->>'streak_months')::integer, 0);
    v_label := 'consecutive months of completed borrowing or lending';
  elsif v_type = 'consecutive_recent' then
    -- A failed return resets progress; count only the uninterrupted latest run.
    -- Like the existing return award, this examines the resident's borrowing history.
    with recent as (
      select b.id, b.updated_at,
        exists (select 1 from public.points_ledger l where l.user_id = p_user_id
          and l.action_type = p_criteria->>'action_type' and l.source_type = 'booking' and l.source_id = b.id) as credited
      from public.bookings b where b.borrower_id = p_user_id and b.status = 'completed'
      order by b.updated_at desc, b.id desc limit v_target
    ), runs as (
      select count(*) filter (where not credited) over (order by updated_at desc, id desc) as failures from recent
    ) select count(*) filter (where failures = 0) into v_current from runs;
    v_label := 'consecutive on-time returns';
  elsif v_type = 'sustained' then
    v_min_types := greatest(coalesce((p_criteria->>'min_types')::integer, 3), 1);
    v_min_weeks := greatest(coalesce((p_criteria->>'min_active_weeks')::integer, 6), 1);
    v_window := greatest(coalesce((p_criteria->>'window_weeks')::integer, 12), 1);
    select count(distinct l.action_type), count(distinct date_trunc('week', l.created_at))
    into v_types, v_weeks from public.points_ledger l
    where l.user_id = p_user_id and l.township_id = p_township_id
      and l.created_at >= now() - make_interval(weeks => v_window);
    v_percent := floor(50 * least(v_types::numeric / v_min_types, 1) + 50 * least(v_weeks::numeric / v_min_weeks, 1));
    v_eligible := v_types >= v_min_types and v_weeks >= v_min_weeks;
    v_requirements := jsonb_build_array(
      jsonb_build_object('current', v_types, 'target', v_min_types, 'label', 'different activity types'),
      jsonb_build_object('current', v_weeks, 'target', v_min_weeks, 'label', 'active weeks in the last ' || v_window || ' weeks')
    );
  elsif v_type = 'manual' then
    return jsonb_build_object('type', v_type, 'percent', null, 'eligible', false, 'requirements', v_requirements,
      'note', 'Selected by the township office for verified helpful action.');
  else
    return jsonb_build_object('type', 'unknown', 'percent', null, 'eligible', false, 'requirements', v_requirements,
      'note', 'Ask the township office about the requirements for this award.');
  end if;
  if v_type in ('count', 'streak', 'consecutive_recent') then
    v_percent := least(100, floor(100 * v_current::numeric / v_target));
    v_eligible := v_current >= v_target;
    v_requirements := jsonb_build_array(jsonb_build_object('current', v_current, 'target', v_target, 'label', v_label));
  end if;
  return jsonb_build_object('type', v_type, 'percent', v_percent, 'eligible', v_eligible, 'requirements', v_requirements);
end;
$$;
revoke all on function public._badge_progress(uuid, uuid, jsonb) from public, anon, authenticated, service_role;

create or replace function public.evaluate_badges(p_user_id uuid, p_township_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_badge record;
  v_awarded integer := 0;
begin
  for v_badge in select * from public.badges loop
    if (public._badge_progress(p_user_id, p_township_id, v_badge.criteria)->>'eligible')::boolean then
      insert into public.user_badges(user_id, badge_id, township_id)
      values (p_user_id, v_badge.id, p_township_id) on conflict (user_id, badge_id) do nothing;
      if found then v_awarded := v_awarded + 1; end if;
    end if;
  end loop;
  return v_awarded;
end;
$$;

create or replace function public.get_my_badge_progress(p_township_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if not exists (select 1 from public.township_members where user_id = auth.uid()
    and township_id = p_township_id and status = 'active') then raise exception 'not_active_member'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'badge_id', b.id, 'progress', public._badge_progress(auth.uid(), p_township_id, b.criteria)
  ) order by b.created_at, b.id) from public.badges b), '[]'::jsonb);
end;
$$;
revoke all on function public.get_my_badge_progress(uuid) from public, anon, authenticated, service_role;
grant execute on function public.get_my_badge_progress(uuid) to authenticated;

create or replace function public._valid_badge_criteria(p_criteria jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare v_action text;
begin
  if p_criteria is null or jsonb_typeof(p_criteria) <> 'object' then return false; end if;
  if p_criteria->>'type' = 'manual' then return true; end if;
  if p_criteria->>'type' = 'sustained' then
    return coalesce((p_criteria->>'min_types')::integer between 1 and 20
      and (p_criteria->>'min_active_weeks')::integer between 1 and 104
      and (p_criteria->>'window_weeks')::integer between 1 and 104
      and (p_criteria->>'min_active_weeks')::integer <= (p_criteria->>'window_weeks')::integer, false);
  end if;
  if not coalesce((p_criteria->>'threshold')::integer between 1 and 10000, false) then return false; end if;
  if p_criteria->>'type' = 'streak' then return (p_criteria->>'threshold')::integer <= 120; end if;
  if p_criteria->>'type' = 'consecutive_recent' then
    return coalesce(p_criteria->>'action_type' = 'item_returned_on_time', false);
  end if;
  if p_criteria->>'type' = 'count' then
    if jsonb_typeof(p_criteria->'action_types') <> 'array' or p_criteria->'action_types' is null then return false; end if;
    if jsonb_array_length(p_criteria->'action_types') not between 1 and 20 then return false; end if;
    for v_action in select jsonb_array_elements_text(p_criteria->'action_types') loop
      if v_action is null or v_action !~ '^[a-z][a-z_]{1,79}$' then return false; end if;
    end loop;
    return p_criteria->'metadata' is null or jsonb_typeof(p_criteria->'metadata') = 'object';
  end if;
  return false;
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end;
$$;
revoke all on function public._valid_badge_criteria(jsonb) from public, anon, authenticated, service_role;

create or replace function public.save_badge_definition(p_slug text, p_name text, p_description text, p_icon text, p_criteria jsonb default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.township_members
    where user_id = auth.uid() and role = 'township_admin' and status = 'active') then
    raise exception 'township_admin_required';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9-]{3,80}$' or p_name is null or char_length(trim(p_name)) not between 3 and 80
    or p_description is null or char_length(trim(p_description)) not between 3 and 240
    or p_icon is null or p_icon !~ '^[a-z-]{1,50}$' then raise exception 'invalid_badge_fields'; end if;
  if p_criteria is not null and not public._valid_badge_criteria(p_criteria) then raise exception 'invalid_badge_criteria'; end if;
  if p_criteria is null then
    -- A copy-only update must never change an existing earning rule.
    update public.badges set name = trim(p_name), description = trim(p_description), icon = p_icon
    where slug = p_slug returning id into v_id;
    if v_id is null then raise exception 'badge_criteria_required'; end if;
  else
    insert into public.badges(slug, name, description, icon, criteria)
    values(p_slug, trim(p_name), trim(p_description), p_icon, p_criteria)
    on conflict (slug) do update set name = excluded.name, description = excluded.description,
      icon = excluded.icon, criteria = excluded.criteria returning id into v_id;
  end if;
  return v_id;
end;
$$;
revoke all on function public.save_badge_definition(text, text, text, text, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.save_badge_definition(text, text, text, text, jsonb) to authenticated;

-- Keep streak BP milestones; badge eligibility now follows the configured rule.
create or replace function public.evaluate_user_streak(p_user_id uuid, p_township_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month date := date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur')::date;
  v_streak jsonb;
  v_count integer;
  v_lend boolean;
  v_borrow boolean;
  v_source_id uuid;
  v_points jsonb;
begin
  v_streak := public._user_streak(p_user_id);
  v_count := (v_streak->>'streak_months')::integer;

  select exists (
    select 1 from public.bookings
    where status = 'completed' and lender_id = p_user_id
      and date_trunc('month', updated_at at time zone 'Asia/Kuala_Lumpur')::date = v_month
  ) into v_lend;
  select exists (
    select 1 from public.bookings
    where status = 'completed' and borrower_id = p_user_id
      and date_trunc('month', updated_at at time zone 'Asia/Kuala_Lumpur')::date = v_month
  ) into v_borrow;

  insert into public.streak_months (user_id, township_id, month_start, lend_completed, borrow_completed)
  values (p_user_id, p_township_id, v_month, v_lend, v_borrow)
  on conflict (user_id, township_id, month_start) do update
  set lend_completed = public.streak_months.lend_completed or excluded.lend_completed,
      borrow_completed = public.streak_months.borrow_completed or excluded.borrow_completed,
      updated_at = now();

  if v_count >= 12 then
    v_source_id := md5(p_user_id::text || p_township_id::text || v_month::text || '12')::uuid;
    v_points := public.award_points(p_user_id, p_township_id, 'streak_milestone_12', 'streak_award', v_source_id, null, jsonb_build_object('streak_months', v_count), now());
  elsif v_count >= 6 then
    v_source_id := md5(p_user_id::text || p_township_id::text || v_month::text || '6')::uuid;
    v_points := public.award_points(p_user_id, p_township_id, 'streak_milestone_6', 'streak_award', v_source_id, null, jsonb_build_object('streak_months', v_count), now());
  elsif v_count >= 3 then
    v_source_id := md5(p_user_id::text || p_township_id::text || v_month::text || '3')::uuid;
    v_points := public.award_points(p_user_id, p_township_id, 'streak_milestone_3', 'streak_award', v_source_id, null, jsonb_build_object('streak_months', v_count), now());
  end if;

  perform public.evaluate_badges(p_user_id, p_township_id);
  return jsonb_build_object('streak', v_streak, 'points', v_points);
end;
$$;


-- Office selection must not bypass a badge changed to an automatic rule.
create or replace function public.approve_monthly_highlight(
  p_month_start date,
  p_resident_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month date := date_trunc('month', p_month_start::timestamptz)::date;
  v_township_id uuid;
  v_highlight_id uuid;
  v_points jsonb;
begin
  select township_id into v_township_id
  from public.township_members
  where user_id = auth.uid() and status = 'active' and role in ('organiser', 'township_admin')
  order by created_at
  limit 1;
  if v_township_id is null or not public.is_township_admin(v_township_id) then
    raise exception 'admin_required';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_resident_id and show_in_highlights = true
  ) then
    raise exception 'candidate_not_eligible';
  end if;

  insert into public.monthly_highlights (
    township_id, month_start, resident_id, reason, status, approved_by, approved_at
  )
  values (v_township_id, v_month, p_resident_id, trim(p_reason), 'approved', auth.uid(), now())
  on conflict (township_id, month_start) do update
  set resident_id = excluded.resident_id,
      reason = excluded.reason,
      status = 'approved',
      approved_by = excluded.approved_by,
      approved_at = now()
  returning id into v_highlight_id;

  v_points := public.award_points(
    p_resident_id,
    v_township_id,
    'neighbour_of_month',
    'monthly_highlight',
    v_highlight_id,
    null,
    jsonb_build_object('month_start', v_month),
    now()
  );
  insert into public.user_badges (user_id, badge_id, township_id)
  select p_resident_id, b.id, v_township_id from public.badges b where b.slug = 'neighbour-of-month' and b.criteria->>'type' = 'manual'
  on conflict do nothing;

  return jsonb_build_object('highlight_id', v_highlight_id, 'points', v_points);
end;
$$;

