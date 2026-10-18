begin;
create extension if not exists pgtap;
select no_plan();

select gen_random_uuid() as perf_user, gen_random_uuid() as perf_owner \gset
select id as perf_township from public.townships where slug = 'harmoni-heights-demo' \gset
insert into auth.users(id,email) values
  (:'perf_user','performance-borrower@example.test'),
  (:'perf_owner','performance-lender@example.test');
insert into public.township_members(user_id,township_id,status) values
  (:'perf_user',:'perf_township','active'), (:'perf_owner',:'perf_township','active');
insert into public.items(township_id,owner_id,title,category_id)
select :'perf_township',:'perf_owner','Performance fixture',id from public.item_categories limit 1
returning id as perf_item \gset
insert into public.bookings(item_id,township_id,borrower_id,lender_id,start_date,end_date,status,estimated_value_saved_rm)
values (:'perf_item',:'perf_township',:'perf_user',:'perf_owner',current_date-3,current_date-2,'completed',42)
returning estimated_value_saved_rm as perf_expected_value \gset
insert into public.bookings(item_id,township_id,borrower_id,lender_id,start_date,end_date,status)
values (:'perf_item',:'perf_township',:'perf_user',:'perf_owner',current_date+1,current_date+2,'requested')
returning id as perf_booking \gset
insert into public.points_ledger(user_id,township_id,delta,action_type,source_type,source_id)
select :'perf_user',:'perf_township',1,'performance_action','performance_test',gen_random_uuid()
from generate_series(1,1005);
insert into public.points_ledger(user_id,township_id,delta,action_type,source_type,source_id)
values (:'perf_owner',:'perf_township',1,'other_person_action','performance_test',gen_random_uuid());

select ok(not has_function_privilege('anon','public.get_my_reward_stats(uuid)','execute'),'anonymous callers cannot read reward statistics');
select ok(not has_function_privilege('anon','public.get_my_incoming_request_trust(uuid[])','execute'),'anonymous callers cannot read incoming trust');

set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',:'perf_user','role','authenticated')::text,true);
select is((public.get_my_reward_stats(:'perf_township')->'action_counts'->>'performance_action')::integer,1005,'reward counts include more than 1000 ledger rows');
select is(public.get_my_reward_stats(:'perf_township')->'action_counts'->>'other_person_action',null,'reward counts exclude other residents');
select is((public.get_my_reward_stats(:'perf_township')->>'estimated_shared_rm')::numeric,:'perf_expected_value'::numeric,'estimated value uses the stored booking snapshot');
select throws_ok($$select public.get_my_reward_stats('00000000-0000-0000-0000-000000000000')$$,'P0001','active_membership_required','reward statistics require active membership');
select is((select count(*)::integer from public.get_my_incoming_request_trust(array[:'perf_booking'::uuid])),0,'borrowers cannot read a lender-only trust summary');

select set_config('request.jwt.claims',json_build_object('sub',:'perf_owner','role','authenticated')::text,true);
select is((select count(*)::integer from public.get_my_incoming_request_trust(array[:'perf_booking'::uuid])),1,'lenders receive trust for their incoming request');
select is((select tier from public.get_my_incoming_request_trust(array[:'perf_booking'::uuid])),public.get_incoming_request_trust(:'perf_item',:'perf_user')->>'tier','batch trust agrees with the existing permission-checked RPC');
select is((select count(*)::integer from public.get_my_incoming_request_trust(array[]::uuid[])),0,'an empty batch returns no rows');
reset role;
update public.bookings set status='declined' where id=:'perf_booking';
set local role authenticated;
select is((select count(*)::integer from public.get_my_incoming_request_trust(array[:'perf_booking'::uuid])),0,'resolved requests are excluded');

select * from finish();
rollback;
