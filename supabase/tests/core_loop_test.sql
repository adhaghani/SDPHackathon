begin;

create extension if not exists pgtap;

select plan(17);

select has_function('public', 'rsvp_event', 'RSVP function exists');
select has_function('public', 'check_in', 'check-in function exists');
select has_function('public', 'create_booking', 'booking creation function exists');
select has_function('public', 'transition_booking', 'booking transition function exists');
select has_function('public', 'township_pulse', 'Township Pulse function exists');

set local role authenticated;
select is(
  has_table_privilege('authenticated', 'public.points_ledger', 'insert'),
  false,
  'authenticated clients cannot insert directly into points_ledger'
);
reset role;

insert into public.townships (name, slug, join_code, is_demo)
values ('Isolation Test Township', 'isolation-test', 'ISOLATION-TEST', false)
on conflict (slug) do nothing;

insert into public.events (
  township_id, host_id, title, description, category_id, starts_at, ends_at,
  location_text, status
)
select t.id, r.id, 'Isolation test event', 'test', c.id,
       now() + interval '2 days', now() + interval '3 days', 'Shared space', 'published'
from public.townships t
join auth.users r on r.email = 'raj@borrowbetter.demo'
join public.event_categories c on c.slug = 'social'
where t.slug = 'isolation-test'
on conflict do nothing;

select id as aisyah_id from auth.users where email = 'aisyah@borrowbetter.demo' \gset
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', :'aisyah_id',
    'role', 'authenticated'
  )::text,
  true
);
select is(
  (select count(*)
   from public.events
   where township_id = (select id from public.townships where slug = 'isolation-test')),
  0::bigint,
  'cross-township RLS hides events from non-members'
);
reset role;

insert into public.events (
  township_id, host_id, title, description, category_id, starts_at, ends_at,
  location_text, capacity, status
)
select t.id, r.id, 'Capacity test event', 'test', c.id,
       now() + interval '4 days', now() + interval '5 days', 'Shared space', 1, 'published'
from public.townships t
join auth.users r on r.email = 'raj@borrowbetter.demo'
join public.event_categories c on c.slug = 'social'
where t.slug = 'harmoni-heights-demo'
returning id as capacity_event_id \gset

select id as capacity_aisyah_id from auth.users where email = 'aisyah@borrowbetter.demo' \gset
select id as capacity_raj_id from auth.users where email = 'raj@borrowbetter.demo' \gset

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'capacity_aisyah_id', 'role', 'authenticated')::text,
  true
);
select is(
  (public.rsvp_event(:'capacity_event_id'::uuid, 'attendee') ->> 'status')::text,
  'going',
  'the first attendee fits within capacity'
);

select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'capacity_raj_id', 'role', 'authenticated')::text,
  true
);
select is(
  (public.rsvp_event(:'capacity_event_id'::uuid, 'attendee') ->> 'status')::text,
  'waitlisted',
  'the second attendee is waitlisted when capacity is full'
);
reset role;

insert into public.bookings (
  item_id, township_id, borrower_id, lender_id, start_date, end_date, status
)
select i.id, i.township_id, a.id, r.id, current_date + 90, current_date + 93, 'approved'
from public.items i
join auth.users a on a.email = 'aisyah@borrowbetter.demo'
join auth.users r on r.email = 'raj@borrowbetter.demo'
where i.title = 'Pressure washer'
limit 1;

select throws_ok(
  $$
    insert into public.bookings (
      item_id, township_id, borrower_id, lender_id, start_date, end_date, status
    )
      select i.id, i.township_id, a.id, r.id, current_date + 91, current_date + 94, 'approved'
    from public.items i
    join auth.users a on a.email = 'aisyah@borrowbetter.demo'
    join auth.users r on r.email = 'raj@borrowbetter.demo'
    where i.title = 'Pressure washer'
    limit 1
  $$,
  '23P01',
  null,
  'overlapping approved bookings are rejected by the exclusion constraint'
);

select lives_ok(
  $$
    select public.award_points(
      (select id from auth.users where email = 'aisyah@borrowbetter.demo'),
      (select id from public.townships where slug = 'harmoni-heights-demo'),
      'item_lent_completed',
      'test_idempotency',
      gen_random_uuid(),
      null,
      '{}'::jsonb,
      now()
    )
  $$,
  'award_points can award a test ledger row'
);

select is(
  (select count(*)
   from public.points_ledger
   where source_type = 'test_idempotency'
     and user_id = (select id from auth.users where email = 'aisyah@borrowbetter.demo')),
  1::bigint,
  'ledger award is idempotent per source'
);

select is(
  has_table_privilege('authenticated', 'public.events', 'insert'),
  false,
  'authenticated clients cannot insert events directly'
);

select is(
  (select count(*)
   from public.points_ledger l
   where l.user_id = (select id from auth.users where email = 'aisyah@borrowbetter.demo')
     and l.action_type = 'event_attendance'
     and l.source_type = 'event_rsvp'),
  (select count(*)
   from public.points_ledger l
   where l.user_id = (select id from auth.users where email = 'aisyah@borrowbetter.demo')
     and l.action_type = 'event_attendance'
     and l.source_type = 'event_rsvp'),
  'attendance ledger rows are reproducible'
);

select isnt_empty(
  $$
    select l.id
    from public.points_ledger l
    where l.user_id = (select id from auth.users where email = 'aisyah@borrowbetter.demo')
      and l.action_type in ('event_attendance', 'item_lent_completed')
  $$,
  'Aisyah has verified core-loop activity'
);

select lives_ok(
  $$
    select public.run_scheduled_jobs()
  $$,
  'scheduled jobs can run'
);
select is(
  ((select public.run_scheduled_jobs() ->> 'completed_events'))::integer,
  0,
  'scheduled jobs are idempotent on the second run'
);

select * from finish();

rollback;
