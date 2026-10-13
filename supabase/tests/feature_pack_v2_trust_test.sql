begin;

create extension if not exists pgtap;

select plan(20);

select has_function('public', 'compute_trust_score', 'trust score function exists');
select has_function('public', 'get_incoming_request_trust', 'incoming trust tier function exists');
select has_function('public', 'save_item_guide', 'guide save function exists');
select has_function('public', 'get_item_history', 'item history function exists');

select id as trust_aisyah_id from auth.users where email = 'aisyah@borrowlah.demo' \gset
select id as trust_raj_id from auth.users where email = 'raj@borrowlah.demo' \gset
select id as trust_township_id from public.townships where slug = 'harmoni-heights-demo' \gset
select id as trust_item_id from public.items where title = 'Pressure washer for the next clean-up' limit 1 \gset
select id as trust_history_item_id from public.items where title = 'Pressure washer' limit 1 \gset
select id as trust_booking_id
from public.bookings
where status = 'requested'
  and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')
limit 1 \gset

set local role authenticated;
select is(
  has_table_privilege('authenticated', 'public.item_guides', 'insert'),
  false,
  'authenticated clients cannot insert item guides directly'
);

select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'trust_aisyah_id', 'role', 'authenticated')::text,
  true
);
select is(
  (public.compute_trust_score(:'trust_aisyah_id'::uuid) ->> 'score')::integer >= 0,
  true,
  'a resident can read their own trust score'
);
select throws_ok(
  $$
    select public.save_item_guide(
      (select id from public.items where title = 'Pressure washer for the next clean-up' limit 1),
      'Not my item',
      '',
      '{}'
    )
  $$,
  'P0001',
  'not_item_owner',
  'non-owners cannot save an item guide'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'trust_raj_id', 'role', 'authenticated')::text,
  true
);
select is(
  (public.get_incoming_request_trust(:'trust_item_id'::uuid, :'trust_aisyah_id'::uuid) ->> 'tier') is not null,
  true,
  'an owner receives only the requester tier'
);

select public.save_item_guide(
  :'trust_item_id'::uuid,
  'Check both locks before climbing.',
  'Keep the ladder on level ground.',
  '{}'
) as first_guide_result \gset
select is(
  (:'first_guide_result'::jsonb -> 'points' ->> 'delta')::integer,
  5,
  'the first guide earns 5 BP'
);

select public.save_item_guide(
  :'trust_item_id'::uuid,
  'Check both locks before climbing. Add the stabiliser bar.',
  'Keep the ladder on level ground.',
  '{}'
) as second_guide_result \gset
select is(
  (:'second_guide_result'::jsonb ->> 'first_guide')::boolean,
  false,
  'later guide edits do not award again'
);

select public.get_item_history(:'trust_history_item_id'::uuid) as trust_history \gset
select is(
  (:'trust_history'::jsonb ->> 'borrow_count')::integer >= 1,
  true,
  'item history exposes an aggregate lifetime summary'
);
select is(
  (:'trust_history'::jsonb ->> 'lifetime_saved_rm')::numeric >= 0,
  true,
  'item history includes estimated value shared'
);
reset role;
select set_config('request.jwt.claims', '', true);

select lives_ok(
  $$
    select public.transition_booking(
      (select id from public.bookings
       where status = 'requested'
         and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      'approve',
      '{}'::jsonb,
      (select id from auth.users where email = 'raj@borrowlah.demo'),
      now()
    )
  $$,
  'the lender approves the booking before handover'
);

select throws_ok(
  $$
    select public.transition_booking(
      (select id from public.bookings
       where status = 'approved'
         and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      'confirm_handover',
      '{"guide_acknowledged": false}'::jsonb,
      (select id from auth.users where email = 'aisyah@borrowlah.demo'),
      now()
    )
  $$,
  'P0001',
  'guide_ack_required',
  'borrowers must acknowledge an existing guide before handover'
);

select lives_ok(
  $$
    select public.transition_booking(
      (select id from public.bookings
       where status = 'approved'
         and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      'confirm_handover',
      '{"guide_acknowledged": true}'::jsonb,
      (select id from auth.users where email = 'aisyah@borrowlah.demo'),
      now()
    )
  $$,
  'guide acknowledgement completes the borrower handover proof'
);

select lives_ok(
  $$
    select public.transition_booking(
      (select id from public.bookings
       where status = 'approved'
         and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      'confirm_handover',
      '{}'::jsonb,
      (select id from auth.users where email = 'raj@borrowlah.demo'),
      now()
    )
  $$,
  'the lender can complete the handover'
);

select lives_ok(
  $$
    select public.transition_booking(
      (select id from public.bookings
       where status = 'handed_over'
         and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      'mark_returned',
      '{"would_have_bought":"no"}'::jsonb,
      (select id from auth.users where email = 'aisyah@borrowlah.demo'),
      now()
    )
  $$,
  'the borrower can mark the item returned'
);

select throws_ok(
  $$
    select public.transition_booking(
      (select id from public.bookings
       where status = 'handed_over'
         and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      'confirm_return',
      '{"return_condition":"damaged","return_condition_reason":""}'::jsonb,
      (select id from auth.users where email = 'raj@borrowlah.demo'),
      now()
    )
  $$,
  'P0001',
  'condition_reason_required',
  'a damaged condition requires a short reason'
);

select public.transition_booking(
  (select id from public.bookings
   where status = 'handed_over'
     and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
  'confirm_return',
  '{"return_condition":"damaged","return_condition_reason":"Latch is bent"}'::jsonb,
  :'trust_raj_id'::uuid,
  now()
) as condition_completion \gset
select is(
  (:'condition_completion'::jsonb ->> 'status'),
  'completed',
  'a reasoned damaged condition can complete the return'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'trust_aisyah_id', 'role', 'authenticated')::text,
  true
);
select public.contest_return_condition(
  (select id from public.bookings
   where status = 'completed'
     and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
  'The latch was already loose.'
) as condition_contest \gset
select is(
  (:'condition_contest'::jsonb ->> 'status'),
  'disputed',
  'the borrower can contest a damaged rating within 72 hours'
);
reset role;

select * from finish();

rollback;
