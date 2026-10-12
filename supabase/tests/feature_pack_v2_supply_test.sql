begin;

create extension if not exists pgtap;

select plan(22);

select has_table('public', 'item_requests', 'item request table exists');
select has_table('public', 'item_request_offers', 'item request offer table exists');
select has_table('public', 'item_request_alert_opt_ins', 'request alert table exists');
select has_table('public', 'bundles', 'bundle table exists');
select has_table('public', 'bundle_items', 'bundle item table exists');
select has_table('public', 'booking_groups', 'booking group table exists');

select id as supply_township_id from public.townships where slug = 'harmoni-heights-demo' \gset
select id as supply_aisyah_id from auth.users where email = 'aisyah@borrowbetter.demo' \gset
select id as supply_farah_id from auth.users where email = 'farah@borrowbetter.demo' \gset
select id as supply_offer_id
from public.item_request_offers
where is_demo and status = 'proposed' and item_id is not null
limit 1 \gset
select id as supply_camping_bundle_id from public.bundles where title = 'Camping kit' limit 1 \gset
select id as supply_kenduri_bundle_id from public.bundles where title = 'Kenduri set' limit 1 \gset

set local role authenticated;
select is(
  has_table_privilege('authenticated', 'public.item_requests', 'insert'),
  false,
  'authenticated clients cannot insert requests directly'
);

select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'supply_farah_id', 'role', 'authenticated')::text,
  true
);
select public.get_item_requests() as supply_requests \gset
select is(
  (:'supply_requests'::jsonb @> '[{"title":"Need a cordless drill this weekend","status":"open"}]'),
  true,
  'residents can read their township request board'
);
reset role;
select set_config('request.jwt.claims', '', true);

insert into public.item_requests (
  township_id,
  requester_id,
  title,
  needed_until,
  status,
  is_demo
)
values (
  :'supply_township_id',
  :'supply_farah_id',
  'Expired demo request',
  current_date - 1,
  'open',
  true
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'supply_farah_id', 'role', 'authenticated')::text,
  true
);
select public.get_item_requests() as supply_requests_with_expired \gset
select is(
  (:'supply_requests_with_expired'::jsonb @> '[{"title":"Expired demo request","status":"expired"}]'),
  true,
  'past requests are expired when read'
);

select public.accept_item_request_offer(
  :'supply_offer_id'::uuid,
  current_date + 2,
  current_date + 4
) as accepted_offer \gset
select is(
  (:'accepted_offer'::jsonb ->> 'request_status'),
  'matched',
  'requester can accept an attached offer'
);
reset role;
select set_config('request.jwt.claims', '', true);

select id as supply_request_booking_id
from public.bookings
where item_request_offer_id = :'supply_offer_id'::uuid
limit 1 \gset
select is(
  (select count(*) from public.bookings where id = :'supply_request_booking_id'::uuid),
  1::bigint,
  'accepting an offer creates one linked booking'
);

select public.transition_booking(
  :'supply_request_booking_id'::uuid,
  'approve',
  '{}'::jsonb,
  :'supply_aisyah_id'::uuid,
  now()
);
select public.transition_booking(
  :'supply_request_booking_id'::uuid,
  'confirm_handover',
  '{"guide_acknowledged":true}'::jsonb,
  :'supply_farah_id'::uuid,
  now()
);
select public.transition_booking(
  :'supply_request_booking_id'::uuid,
  'confirm_handover',
  '{}'::jsonb,
  :'supply_aisyah_id'::uuid,
  now()
);
select public.transition_booking(
  :'supply_request_booking_id'::uuid,
  'mark_returned',
  '{"would_have_bought":"no"}'::jsonb,
  :'supply_farah_id'::uuid,
  now()
);
select public.transition_booking(
  :'supply_request_booking_id'::uuid,
  'confirm_return',
  '{"return_condition":"good"}'::jsonb,
  :'supply_aisyah_id'::uuid,
  now()
);

select is(
  (select count(*)
   from public.points_ledger
   where action_type = 'item_request_fulfilled'
     and source_id = :'supply_request_booking_id'::uuid),
  1::bigint,
  'completed request booking awards the 15 BP bonus once'
);

update public.bookings
set status = 'completed', updated_at = now()
where id = :'supply_request_booking_id'::uuid;
select is(
  (select count(*)
   from public.points_ledger
   where action_type = 'item_request_fulfilled'
     and source_id = :'supply_request_booking_id'::uuid),
  1::bigint,
  'repeating completion cannot award the request bonus twice'
);

select is(
  (select count(*)
   from public.points_ledger
   where action_type = 'item_lent_completed'
     and source_id = :'supply_request_booking_id'::uuid),
  1::bigint,
  'the normal lender award exists once after completion'
);
update public.bookings
set status = 'handed_over'
where id = :'supply_request_booking_id'::uuid
  and borrower_return_marked_at is not null;
select lives_ok(
  $$
    select public.transition_booking(
      (select id from public.bookings
       where status = 'handed_over'
         and item_request_offer_id is not null),
      'confirm_return',
      '{"return_condition":"good"}'::jsonb,
      (select id from auth.users where email = 'raj@borrowbetter.demo'),
      now()
    )
  $$,
  'a repeated return confirmation is accepted as an idempotent retry'
);
select is(
  (select count(*)
   from public.points_ledger
   where action_type = 'item_lent_completed'
     and source_id = :'supply_request_booking_id'::uuid),
  1::bigint,
  'completing the same booking twice still awards the lender only once'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'supply_farah_id', 'role', 'authenticated')::text,
  true
);
select public.create_bundle_booking(
  :'supply_camping_bundle_id'::uuid,
  current_date + 20,
  current_date + 22,
  'Clubhouse lobby'
) as camping_bundle_booking \gset
select is(
  jsonb_array_length(:'camping_bundle_booking'::jsonb -> 'booking_ids'),
  2,
  'bundle booking creates one child booking per item'
);
reset role;
select set_config('request.jwt.claims', '', true);

select is(
  (select count(distinct booking_group_id)
   from public.bookings
   where booking_group_id = (:'camping_bundle_booking'::jsonb ->> 'booking_group_id')::uuid),
  1::bigint,
  'all bundle children share one booking group'
);

update public.items
set status = 'paused'
where title = 'Periuk besar';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'supply_farah_id', 'role', 'authenticated')::text,
  true
);
select throws_ok(
  $$
    select public.create_bundle_booking(
      (select id from public.bundles where title = 'Kenduri set'),
      current_date + 30,
      current_date + 32,
      'Clubhouse lobby'
    )
  $$,
  'P0001',
  'bundle_item_unavailable',
  'one unavailable item fails the entire bundle request'
);
reset role;
select set_config('request.jwt.claims', '', true);

select is(
  (select count(*) from public.booking_groups where bundle_id = :'supply_kenduri_bundle_id'::uuid),
  1::bigint,
  'a failed bundle request creates no group beyond the seeded demo group'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'supply_aisyah_id', 'role', 'authenticated')::text,
  true
);
select throws_ok(
  $$
    select public.create_item(jsonb_build_object(
      'township_id', (select id from public.townships where slug = 'harmoni-heights-demo'),
      'title', 'Unacknowledged tuition demo',
      'category_id', (select id from public.item_categories where slug = 'tuition'),
      'kind', 'skill',
      'condition', 'good',
      'photo_paths', '["/demo/item-placeholder.svg"]'::jsonb,
      'duration_minutes', 60,
      'meeting_arrangement', 'arranged_by_message',
      'guardian_acknowledgement', false
    ))
  $$,
  'P0001',
  'guardian_acknowledgement_required',
  'tuition requires the guardian acknowledgement'
);

select lives_ok(
  $$
    select public.create_item(jsonb_build_object(
      'township_id', (select id from public.townships where slug = 'harmoni-heights-demo'),
      'title', 'Acknowledged tuition demo',
      'category_id', (select id from public.item_categories where slug = 'tuition'),
      'kind', 'skill',
      'condition', 'good',
      'photo_paths', '["/demo/item-placeholder.svg"]'::jsonb,
      'duration_minutes', 60,
      'meeting_arrangement', 'arranged_by_message',
      'guardian_acknowledgement', true
    ))
  $$,
  'an acknowledged tuition session can be listed'
);
reset role;
select set_config('request.jwt.claims', '', true);

select * from finish();

rollback;
