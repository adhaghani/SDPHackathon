-- Feature Pack v2, Phase 4: streaks, invites, monthly highlight and carbon goals.

alter table public.profiles
  add column if not exists invited_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists show_in_highlights boolean not null default false;

create table if not exists public.streak_months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  township_id uuid not null references public.townships(id) on delete cascade,
  month_start date not null,
  lend_completed boolean not null default false,
  borrow_completed boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, township_id, month_start)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_highlights (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  month_start date not null,
  resident_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (township_id, month_start)
);

create table if not exists public.township_goals (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  year integer not null check (year between 2020 and 2100),
  target_co2e_kg numeric(12,3) not null check (target_co2e_kg > 0),
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (township_id, year)
);

create index if not exists streak_months_user_township_idx
  on public.streak_months (user_id, township_id, month_start desc);
create index if not exists monthly_highlights_township_month_idx
  on public.monthly_highlights (township_id, month_start desc, status);

alter table public.streak_months enable row level security;
alter table public.invites enable row level security;
alter table public.monthly_highlights enable row level security;
alter table public.township_goals enable row level security;

drop policy if exists streak_months_select_own on public.streak_months;
drop policy if exists invites_select_own on public.invites;
drop policy if exists monthly_highlights_select_member on public.monthly_highlights;
drop policy if exists township_goals_select_member on public.township_goals;

create policy streak_months_select_own on public.streak_months
  for select to authenticated using (user_id = auth.uid());
create policy invites_select_own on public.invites
  for select to authenticated using (inviter_id = auth.uid());
create policy monthly_highlights_select_member on public.monthly_highlights
  for select to authenticated
  using (status = 'approved' and public.is_active_member(township_id));
create policy township_goals_select_member on public.township_goals
  for select to authenticated using (public.is_active_member(township_id));

revoke all on public.streak_months, public.invites,
  public.monthly_highlights, public.township_goals from anon, authenticated;
grant select on public.streak_months, public.invites,
  public.monthly_highlights, public.township_goals to authenticated;

create or replace function public._user_streak(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cursor date;
  v_count integer := 0;
  v_current_active boolean;
  v_has_activity boolean;
begin
  v_cursor := date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur')::date;
  select exists (
    select 1
    from public.bookings
    where status = 'completed'
      and (borrower_id = p_user_id or lender_id = p_user_id)
      and date_trunc('month', updated_at at time zone 'Asia/Kuala_Lumpur')::date = v_cursor
  ) into v_current_active;

  if not v_current_active then
    v_cursor := (v_cursor - interval '1 month')::date;
  end if;

  loop
    select exists (
      select 1
      from public.bookings
      where status = 'completed'
        and (borrower_id = p_user_id or lender_id = p_user_id)
        and date_trunc('month', updated_at at time zone 'Asia/Kuala_Lumpur')::date = v_cursor
    ) into v_has_activity;
    exit when not v_has_activity;
    v_count := v_count + 1;
    v_cursor := (v_cursor - interval '1 month')::date;
    exit when v_count >= 120;
  end loop;

  return jsonb_build_object(
    'streak_months', v_count,
    'current_month_active', v_current_active,
    'at_risk', not v_current_active and v_count > 0,
    'next_deadline',
    ((date_trunc('month', (now() at time zone 'Asia/Kuala_Lumpur') + interval '1 month'))::date - 1)
  );
end;
$$;

create or replace function public.compute_user_streak(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not_self';
  end if;
  return public._user_streak(p_user_id);
end;
$$;

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
    insert into public.user_badges (user_id, badge_id, township_id)
    select p_user_id, b.id, p_township_id from public.badges b where b.slug = 'year-of-sharing'
    on conflict do nothing;
  elsif v_count >= 6 then
    v_source_id := md5(p_user_id::text || p_township_id::text || v_month::text || '6')::uuid;
    v_points := public.award_points(p_user_id, p_township_id, 'streak_milestone_6', 'streak_award', v_source_id, null, jsonb_build_object('streak_months', v_count), now());
    insert into public.user_badges (user_id, badge_id, township_id)
    select p_user_id, b.id, p_township_id from public.badges b where b.slug = 'half-year-neighbour'
    on conflict do nothing;
  elsif v_count >= 3 then
    v_source_id := md5(p_user_id::text || p_township_id::text || v_month::text || '3')::uuid;
    v_points := public.award_points(p_user_id, p_township_id, 'streak_milestone_3', 'streak_award', v_source_id, null, jsonb_build_object('streak_months', v_count), now());
    insert into public.user_badges (user_id, badge_id, township_id)
    select p_user_id, b.id, p_township_id from public.badges b where b.slug = 'three-month-regular'
    on conflict do nothing;
  end if;

  return jsonb_build_object('streak', v_streak, 'points', v_points);
end;
$$;

create or replace function public.award_streak_on_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform public.evaluate_user_streak(new.borrower_id, new.township_id);
    perform public.evaluate_user_streak(new.lender_id, new.township_id);
  end if;
  return new;
end;
$$;

drop trigger if exists award_streak_on_completion on public.bookings;
create trigger award_streak_on_completion
after update of status on public.bookings
for each row
execute function public.award_streak_on_completion();

insert into public.badges (slug, name, description, icon, criteria)
values
  ('three-month-regular', '3-month regular', 'Three consecutive months of lending or borrowing.', 'calendar-check', '{"type":"streak","threshold":3}'::jsonb),
  ('half-year-neighbour', 'Half-year neighbour', 'Six consecutive months of lending or borrowing.', 'calendar-heart', '{"type":"streak","threshold":6}'::jsonb),
  ('year-of-sharing', 'Year of sharing', 'Twelve consecutive months of lending or borrowing.', 'calendar-star', '{"type":"streak","threshold":12}'::jsonb),
  ('neighbour-of-month', 'Neighbour of the month', 'Selected by the township office for verified helpful action.', 'star', '{"type":"manual"}'::jsonb)
on conflict (slug) do nothing;

create or replace function public.get_or_create_invite()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.invites%rowtype;
  v_code text;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  select * into v_invite from public.invites where inviter_id = v_user_id order by created_at limit 1;
  if found then
    return jsonb_build_object('code', v_invite.code, 'invite_id', v_invite.id);
  end if;

  loop
    v_code := upper(encode(gen_random_bytes(6), 'hex'));
    exit when not exists (select 1 from public.invites where code = v_code);
  end loop;
  insert into public.invites (code, inviter_id) values (v_code, v_user_id) returning * into v_invite;
  return jsonb_build_object('code', v_invite.code, 'invite_id', v_invite.id);
end;
$$;

create or replace function public.resolve_profile_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_inviter uuid;
begin
  if new.invited_by_user_id is null then
    select raw_user_meta_data->>'invite_code' into v_code from auth.users where id = new.id;
    if v_code is not null then
      select inviter_id into v_inviter from public.invites where code = upper(trim(v_code));
      if v_inviter is not null and v_inviter <> new.id then
        new.invited_by_user_id := v_inviter;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists resolve_profile_invite on public.profiles;
create trigger resolve_profile_invite
before insert on public.profiles
for each row
execute function public.resolve_profile_invite();

create or replace function public.award_invite_on_first_borrow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inviter uuid;
  v_invite_id uuid;
  v_prior_borrows integer;
  v_month_rewards integer;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    select invited_by_user_id into v_inviter from public.profiles where id = new.borrower_id;
    select id into v_invite_id from public.invites where inviter_id = v_inviter limit 1;
    if v_inviter is not null and v_inviter <> new.lender_id and v_invite_id is not null then
      select count(*) into v_prior_borrows
      from public.bookings
      where borrower_id = new.borrower_id
        and status = 'completed'
        and id <> new.id;
      if v_prior_borrows = 0 then
        select count(*) into v_month_rewards
        from public.points_ledger
        where user_id = v_inviter
          and action_type = 'invite_accepted'
          and created_at >= date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur') at time zone 'Asia/Kuala_Lumpur'
          and created_at < (date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur') + interval '1 month') at time zone 'Asia/Kuala_Lumpur';
        if v_month_rewards < 10 then
          perform public.award_points(new.borrower_id, new.township_id, 'invite_accepted', 'invite', v_invite_id, null, jsonb_build_object('inviter_id', v_inviter), now());
          perform public.award_points(v_inviter, new.township_id, 'invite_accepted', 'invite', v_invite_id, null, jsonb_build_object('invitee_id', new.borrower_id), now());
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists award_invite_on_first_borrow on public.bookings;
create trigger award_invite_on_first_borrow
after update of status on public.bookings
for each row
execute function public.award_invite_on_first_borrow();

create or replace function public.get_monthly_highlight_candidates(p_month_start date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_township_id uuid;
  v_month_start date := date_trunc('month', p_month_start::timestamptz)::date;
  v_previous_start date := (v_month_start - interval '1 month')::date;
  v_previous_end date := v_month_start - 1;
begin
  select township_id into v_township_id
  from public.township_members
  where user_id = auth.uid() and status = 'active' and role in ('organiser', 'township_admin')
  order by created_at
  limit 1;
  if v_township_id is null or not public.is_township_admin(v_township_id) then
    raise exception 'admin_required';
  end if;

  return coalesce(
    jsonb_agg(value order by value->>'score' desc),
    '[]'::jsonb
  )
  from (
    select jsonb_build_object(
      'resident_id', p.id,
      'display_name', p.display_name,
      'score', count(distinct l.source_type || ':' || l.source_id::text),
      'reason', format(
        'Shared through %s verified actions in %s',
        count(distinct l.source_type || ':' || l.source_id::text),
        to_char(v_previous_start, 'Month YYYY')
      )
    ) as value
    from public.profiles p
    join public.township_members m on m.user_id = p.id and m.township_id = v_township_id and m.status = 'active'
    left join public.points_ledger l
      on l.user_id = p.id
     and l.township_id = v_township_id
     and l.delta > 0
     and l.action_type in ('item_lent_completed', 'item_request_fulfilled', 'help_completed')
     and l.created_at >= v_previous_start
     and l.created_at < v_previous_end + 1
    where p.show_in_highlights = true
      and public._trust_score(p.id)->>'tier' in ('trusted', 'highly_trusted')
      and not exists (
        select 1
        from public.disputes d
        join public.bookings b on b.id = d.booking_id
        where d.status = 'open'
          and (b.borrower_id = p.id or b.lender_id = p.id)
      )
    group by p.id, p.display_name
    having count(distinct l.source_type || ':' || l.source_id::text) > 0
    order by count(distinct l.source_type || ':' || l.source_id::text) desc
    limit 5
  ) candidates;
end;
$$;

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
  select p_resident_id, b.id, v_township_id from public.badges b where b.slug = 'neighbour-of-month'
  on conflict do nothing;

  return jsonb_build_object('highlight_id', v_highlight_id, 'points', v_points);
end;
$$;

create or replace function public.set_township_goal(
  p_year integer,
  p_target_co2e_kg numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_township_id uuid;
  v_goal_id uuid;
begin
  select township_id into v_township_id
  from public.township_members
  where user_id = auth.uid() and status = 'active' and role = 'township_admin'
  order by created_at
  limit 1;
  if v_township_id is null then
    raise exception 'admin_required';
  end if;
  if p_target_co2e_kg <= 0 then
    raise exception 'invalid_goal';
  end if;
  insert into public.township_goals (township_id, year, target_co2e_kg, created_by)
  values (v_township_id, p_year, p_target_co2e_kg, auth.uid())
  on conflict (township_id, year) do update
  set target_co2e_kg = excluded.target_co2e_kg,
      updated_at = now()
  returning id into v_goal_id;
  return jsonb_build_object('goal_id', v_goal_id);
end;
$$;

create or replace function public.township_carbon_progress(p_township_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year integer := extract(year from now() at time zone 'Asia/Kuala_Lumpur')::integer;
  v_goal public.township_goals%rowtype;
  v_total integer;
  v_covered integer;
  v_avoided numeric;
  v_percent numeric;
  v_threshold integer;
begin
  if auth.uid() is null or not public.is_active_member(p_township_id) then
    raise exception 'not_active_member';
  end if;
  select * into v_goal
  from public.township_goals
  where township_id = p_township_id and year = v_year;
  if not found then
    return jsonb_build_object('has_goal', false, 'available', false, 'year', v_year);
  end if;

  select
    count(*),
    count(*) filter (where c.co2e_kg_per_borrow is not null and c.co2e_source is not null),
    coalesce(sum(case when c.co2e_kg_per_borrow is not null and c.co2e_source is not null then c.co2e_kg_per_borrow else 0 end), 0)
  into v_total, v_covered, v_avoided
  from public.bookings b
  join public.items i on i.id = b.item_id
  join public.item_categories c on c.id = i.category_id
  where b.township_id = p_township_id
    and b.status = 'completed'
    and extract(year from b.updated_at at time zone 'Asia/Kuala_Lumpur')::integer = v_year;

  v_percent := case when v_goal.target_co2e_kg > 0 then least(100, round(v_avoided / v_goal.target_co2e_kg * 100, 1)) else 0 end;
  if v_total = v_covered then
    foreach v_threshold in array array[25, 50, 75, 100] loop
      if v_percent >= v_threshold then
        insert into public.notifications (user_id, type, title, body, link, dedupe_key)
        select m.user_id,
          'carbon_goal',
          'Township carbon goal reached ' || v_threshold || '%',
          'The township has reached ' || v_threshold || '% of its yearly estimated CO₂e goal.',
          '/home',
          'carbon:' || p_township_id::text || ':' || v_year::text || ':' || v_threshold::text
        from public.township_members m
        where m.township_id = p_township_id and m.status = 'active'
        on conflict (user_id, dedupe_key) do nothing;
      end if;
    end loop;
  end if;

  return jsonb_build_object(
    'has_goal', true,
    'available', v_total = v_covered,
    'year', v_year,
    'target_co2e_kg', v_goal.target_co2e_kg,
    'avoided_co2e_kg', case when v_total = v_covered then v_avoided else null end,
    'percent', case when v_total = v_covered then v_percent else null end,
    'partial_data', v_total > 0 and v_total <> v_covered,
    'estimated', true
  );
end;
$$;

create or replace function public.update_profile(
  p_display_name text,
  p_interests text[] default '{}',
  p_comfort_prefs jsonb default '{}'::jsonb,
  p_recognition_opt_in boolean default false,
  p_show_in_highlights boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  insert into public.profiles (
    id, display_name, interests, comfort_prefs, recognition_opt_in, show_in_highlights, updated_at
  )
  values (
    v_user_id,
    nullif(trim(p_display_name), ''),
    coalesce(p_interests, '{}'),
    coalesce(p_comfort_prefs, '{}'::jsonb),
    coalesce(p_recognition_opt_in, false),
    coalesce(p_show_in_highlights, false),
    now()
  )
  on conflict (id) do update
  set display_name = coalesce(excluded.display_name, public.profiles.display_name),
      interests = excluded.interests,
      comfort_prefs = excluded.comfort_prefs,
      recognition_opt_in = excluded.recognition_opt_in,
      show_in_highlights = excluded.show_in_highlights,
      updated_at = now()
  returning * into v_profile;

  return to_jsonb(v_profile);
end;
$$;

revoke execute on function public._user_streak(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.compute_user_streak(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.get_or_create_invite() from public, anon, authenticated, service_role;
revoke execute on function public.get_monthly_highlight_candidates(date) from public, anon, authenticated, service_role;
revoke execute on function public.approve_monthly_highlight(date, uuid, text) from public, anon, authenticated, service_role;
revoke execute on function public.set_township_goal(integer, numeric) from public, anon, authenticated, service_role;
revoke execute on function public.township_carbon_progress(uuid) from public, anon, authenticated, service_role;
grant execute on function public.compute_user_streak(uuid) to authenticated;
grant execute on function public.get_or_create_invite() to authenticated;
grant execute on function public.get_monthly_highlight_candidates(date) to authenticated;
grant execute on function public.approve_monthly_highlight(date, uuid, text) to authenticated;
grant execute on function public.set_township_goal(integer, numeric) to authenticated;
grant execute on function public.township_carbon_progress(uuid) to authenticated;
grant execute on function public.update_profile(text, text[], jsonb, boolean, boolean) to authenticated;
