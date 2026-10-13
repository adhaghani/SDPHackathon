begin;

create extension if not exists pgtap;

select plan(21);

select has_table('public', 'streak_months', 'streak month table exists');
select has_table('public', 'invites', 'invite table exists');
select has_table('public', 'monthly_highlights', 'monthly highlight table exists');
select has_table('public', 'township_goals', 'township goal table exists');

select id as engage_township_id from public.townships where slug = 'harmoni-heights-demo' \gset
select id as engage_aisyah_id from auth.users where email = 'aisyah@borrowlah.demo' \gset
select id as engage_raj_id from auth.users where email = 'raj@borrowlah.demo' \gset
select id as engage_farah_id from auth.users where email = 'farah@borrowlah.demo' \gset
select id as engage_office_id from auth.users where email = 'office@borrowlah.demo' \gset
select id as engage_item_id from public.items where title = 'Pressure washer' limit 1 \gset

set local role authenticated;
select is(
  has_table_privilege('authenticated', 'public.invites', 'insert'),
  false,
  'authenticated clients cannot insert invite codes directly'
);

select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'engage_aisyah_id', 'role', 'authenticated')::text,
  true
);
select public.get_or_create_invite() as engage_invite \gset
select is(
  (:'engage_invite'::jsonb ->> 'code') is not null,
  true,
  'a resident can get a shareable invite code'
);

select public.compute_user_streak(:'engage_aisyah_id'::uuid) as engage_initial_streak \gset
select is(
  (:'engage_initial_streak'::jsonb ->> 'streak_months')::integer >= 0,
  true,
  'a resident can compute their own streak'
);
reset role;
select set_config('request.jwt.claims', '', true);

select lives_ok(
  $$
    insert into public.bookings (
      item_id, township_id, borrower_id, lender_id,
      start_date, end_date, status, updated_at
    )
    select
      (select id from public.items where title = 'Pressure washer' limit 1),
      (select id from public.townships where slug = 'harmoni-heights-demo'),
      (select id from auth.users where email = 'aisyah@borrowlah.demo'),
      (select id from auth.users where email = 'raj@borrowlah.demo'),
      (date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur') - (i || ' months')::interval)::date,
      (date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur') - (i || ' months')::interval + interval '2 days')::date,
      'completed',
      (date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur') - (i || ' months')::interval + interval '2 days') at time zone 'Asia/Kuala_Lumpur'
    from generate_series(0, 11) as i
  $$,
  'twelve months of completed borrow rows can be prepared'
);

select public.evaluate_user_streak(
  :'engage_aisyah_id'::uuid,
  :'engage_township_id'::uuid
) as engage_evaluated_streak \gset
select is(
  (:'engage_evaluated_streak'::jsonb -> 'streak' ->> 'streak_months')::integer,
  12,
  'twelve active calendar months produce a twelve-month streak'
);
select is(
  (select count(*)
   from public.streak_months
   where user_id = :'engage_aisyah_id'::uuid
     and month_start = date_trunc('month', now() at time zone 'Asia/Kuala_Lumpur')::date),
  1::bigint,
  'evaluation stores the current calendar month once'
);
select is(
  (select count(*)
   from public.points_ledger
   where user_id = :'engage_aisyah_id'::uuid
     and action_type = 'streak_milestone_12'),
  1::bigint,
  'the twelve-month milestone awards once'
);

select public.evaluate_user_streak(
  :'engage_aisyah_id'::uuid,
  :'engage_township_id'::uuid
) as engage_repeated_streak \gset
select is(
  (:'engage_repeated_streak'::jsonb -> 'streak' ->> 'streak_months')::integer,
  12,
  'recomputing the streak is stable'
);
select is(
  (select count(*)
   from public.points_ledger
   where user_id = :'engage_aisyah_id'::uuid
     and action_type = 'streak_milestone_12'),
  1::bigint,
  'recomputing cannot duplicate the streak award'
);
select is(
  (select count(*)
   from public.user_badges ub
   join public.badges b on b.id = ub.badge_id
   where ub.user_id = :'engage_aisyah_id'::uuid
     and b.slug = 'year-of-sharing'),
  1::bigint,
  'the twelve-month badge is earned'
);

update public.profiles
set show_in_highlights = true
where id = :'engage_aisyah_id';
select is(
  (select show_in_highlights from public.profiles where id = :'engage_aisyah_id'),
  true,
  'highlight opt-in can be enabled'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'engage_office_id', 'role', 'authenticated')::text,
  true
);
select public.approve_monthly_highlight(
  date_trunc('month', now())::date,
  :'engage_aisyah_id'::uuid,
  'Shared through verified actions last month'
) as engage_highlight \gset
select is(
  (:'engage_highlight'::jsonb ->> 'highlight_id') is not null,
  true,
  'an admin can approve a monthly highlight'
);
select public.approve_monthly_highlight(
  date_trunc('month', now())::date,
  :'engage_aisyah_id'::uuid,
  'Shared through verified actions last month'
) as engage_highlight_repeat \gset
reset role;
select set_config('request.jwt.claims', '', true);
select is(
  (select count(*)
   from public.points_ledger
   where user_id = :'engage_aisyah_id'::uuid
     and action_type = 'neighbour_of_month'),
  1::bigint,
  'approving the same highlight twice cannot duplicate its 100 BP award'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'engage_aisyah_id', 'role', 'authenticated')::text,
  true
);
select public.township_carbon_progress(:'engage_township_id'::uuid) as engage_carbon_before \gset
select is(
  (:'engage_carbon_before'::jsonb ->> 'available')::boolean,
  false,
  'carbon progress stays hidden without documented category factors'
);
reset role;
select set_config('request.jwt.claims', '', true);

update public.item_categories
set co2e_kg_per_borrow = 1.5, co2e_source = 'test-only source';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'engage_aisyah_id', 'role', 'authenticated')::text,
  true
);
select public.township_carbon_progress(:'engage_township_id'::uuid) as engage_carbon_after \gset
select is(
  (:'engage_carbon_after'::jsonb ->> 'available')::boolean,
  true,
  'carbon progress becomes available when every category has a factor and source'
);
reset role;
select set_config('request.jwt.claims', '', true);

update public.profiles
set invited_by_user_id = :'engage_raj_id'
where id = :'engage_farah_id';

insert into public.bookings (
  item_id, township_id, borrower_id, lender_id,
  start_date, end_date, status
)
values (
  :'engage_item_id',
  :'engage_township_id',
  :'engage_farah_id',
  :'engage_aisyah_id',
  current_date + 40,
  current_date + 42,
  'requested'
);
select id as engage_invite_booking_id
from public.bookings
where borrower_id = :'engage_farah_id'
  and status = 'requested'
order by created_at desc
limit 1 \gset

update public.bookings
set status = 'completed', updated_at = now()
where id = :'engage_invite_booking_id'::uuid;

select is(
  (select count(*)
   from public.points_ledger
   where action_type = 'invite_accepted'
     and source_id = (
       select id from public.invites where inviter_id = :'engage_raj_id'::uuid limit 1
     )),
  2::bigint,
  'the invitee and inviter each receive 30 BP once'
);

update public.bookings
set updated_at = now()
where id = :'engage_invite_booking_id'::uuid;
select is(
  (select count(*)
   from public.points_ledger
   where action_type = 'invite_accepted'
     and source_id = (
       select id from public.invites where inviter_id = :'engage_raj_id'::uuid limit 1
     )),
  2::bigint,
  'repeating completion cannot duplicate invite rewards'
);

select * from finish();

rollback;
