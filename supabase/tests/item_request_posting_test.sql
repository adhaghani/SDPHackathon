begin;
create extension if not exists pgtap;
select plan(5);

select id as resident_id from auth.users where email = 'farah@borrowlah.demo' \gset
select id as township_id from public.townships where slug = 'harmoni-heights-demo' \gset
-- Isolate the resident's quota without changing saved demo data.
update public.item_requests set status = 'cancelled' where requester_id = :'resident_id';

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'resident_id', 'role', 'authenticated')::text, true);
select public.create_item_request(jsonb_build_object(
  'township_id', :'township_id', 'title', 'Regression test request'
)) as posted \gset
select ok((:'posted'::jsonb->>'request_id') is not null, 'resident can post a request without optional fields');
select ok((:'posted'::jsonb->>'notifications')::integer > 0, 'matching owners receive notifications');
reset role;
select set_config('request.jwt.claims', '', true);
select is((select requester_id from public.item_requests where id = (:'posted'::jsonb->>'request_id')::uuid), :'resident_id'::uuid, 'request belongs to the resident');
select is((select count(*)::integer from public.notifications where dedupe_key like 'item-request:' || (:'posted'::jsonb->>'request_id') || ':%'), (:'posted'::jsonb->>'notifications')::integer, 'returned notification count matches saved notifications');
select is((select count(*)::integer from public.notifications where user_id = :'resident_id'::uuid and dedupe_key like 'item-request:' || (:'posted'::jsonb->>'request_id') || ':%'), 0, 'requester does not receive their own notification');
select * from finish();
rollback;
