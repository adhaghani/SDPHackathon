begin;
create extension if not exists pgtap;
select plan(26);
select id as township from public.townships where slug = 'harmoni-heights-demo' \gset
select id as resident from auth.users where email = 'aisyah@borrowlah.demo' \gset
select id as lender from auth.users where email = 'raj@borrowlah.demo' \gset
select id as office from auth.users where email = 'office@borrowlah.demo' \gset
select id as category from public.item_categories where slug = 'home-tools' \gset
insert into public.townships(name,slug,join_code) values ('Privacy isolation','readiness-isolation','READINESS-ISOLATION') returning id as other_township \gset

-- Twenty searches by one resident must never appear as twenty residents.
insert into public.search_events(township_id,normalized_term,category_id,results_count,available_count,is_demo)
select :'township', 'readiness drill', :'category', 100, 0, true from generate_series(1,20);
insert into public.borrow_demand_residents(township_id,resident_id,normalized_term,category_id)
values (:'township', :'resident', 'readiness drill', :'category');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'resident','role','authenticated')::text, true);
select is((select count(*) from public.township_members where user_id = :'lender'), 0::bigint, 'resident cannot read another unit label');
select is((select count(*) from public.profiles where id = :'lender'), 0::bigint, 'resident cannot read another private profile');
select is((select count(*) from public.public_profiles where id = :'lender'), 1::bigint, 'co-member display name remains available');
select is((select count(*) from public.points_ledger where user_id <> :'resident'), 0::bigint, 'resident cannot read another ledger');
select throws_ok(format('select public.admin_supply_outcomes(%L)', :'township'), 'P0001', 'admin_required', 'resident cannot read admin supply outcomes');
select throws_ok('select * from public.borrow_demand_residents', '42501', 'permission denied for table borrow_demand_residents', 'resident search identities are not client-readable');
select lives_ok(format('select public.log_borrow_search(%L, null, %L, %L, 0, 0)', :'township', 'readiness drill', :'category'), 'zero-result searches can be logged');
reset role;
select is((select count(*) from public.borrow_demand_residents where normalized_term = 'readiness drill'), 1::bigint, 'repeat search updates one resident demand record');
select is((select count(*) from public.search_events where normalized_term = 'readiness drill'), 21::bigint, 'search count is independent of returned result count');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'office','role','authenticated')::text, true);
select is((select count(*) from public.township_members where user_id = :'resident' and township_id = :'township'), 1::bigint, 'own-township admin can read membership for verification');
select is((select count(*) from public.points_ledger where user_id <> :'office'), 0::bigint, 'admin cannot bypass audited review with a direct ledger read');
select is((select count(*) from public.recycling_logs where user_id <> :'office'), 0::bigint, 'admin cannot read private recycling logs');
select throws_ok('select * from public.borrow_demand_residents', '42501', 'permission denied for table borrow_demand_residents', 'admin cannot read resident search identities');
select is((public.admin_demand_gaps(:'township') @> '[{"key":"readiness drill"}]'), false, 'one resident demand is suppressed despite repeated searches');
select throws_ok(format('select public.admin_supply_outcomes(%L)', :'other_township'), 'P0001', 'admin_required', 'cross-township admin reporting denied');
select lives_ok(format('select public.admin_ledger_candidates(%L)', :'township'), 'authorised raw ledger review succeeds');
reset role;
select ok(exists(select 1 from public.audit_log where actor_id = :'office' and action = 'raw_ledger_access' and township_id = :'township'), 'raw ledger review writes an audit record');
select is((select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'public_profiles'), 2::bigint, 'shared profiles expose only ID and display name');
select ok(not has_table_privilege('anon', 'public.public_profiles','select'), 'anonymous users cannot read shared profiles');
insert into public.borrow_demand_residents(township_id,resident_id,normalized_term,category_id)
select :'township', user_id, 'readiness drill', :'category' from public.township_members
where township_id = :'township' and status = 'active' and user_id <> :'resident' limit 4;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'office','role','authenticated')::text, true);
select public.admin_demand_gaps(:'township') as new_gaps \gset
select is((select (value->>'searches')::integer from jsonb_array_elements(:'new_gaps') where value->>'key' = 'readiness drill'), 21, 'published searches count events rather than results');
select is((select (value->>'unique_residents')::integer from jsonb_array_elements(:'new_gaps') where value->>'key' = 'readiness drill'), 5, 'five distinct residents can be reported');
select ok((public.admin_supply_outcomes(:'township')->>'programme_cost_rm')::numeric >= 0, 'supply outcomes include recorded programme costs');
select ok(jsonb_array_length(public.admin_supply_outcomes(:'township')->'categories') > 0, 'supply outcomes include category-level equipment and loan measures');
reset role;
-- The date-only availability function must be useful without exposing private loans.
select id as window_item from public.items where title = 'Pressure washer for the next clean-up' limit 1 \gset
update public.bookings set status = 'approved' where item_id = :'window_item' and status = 'requested';
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'office','role','authenticated')::text, true);
select ok((select count(*) from public.item_booking_windows(:'window_item')) > 0, 'active member can discover occupied dates');
select is((select count(*) from information_schema.parameters where specific_schema = 'public' and specific_name like 'item_booking_windows_%' and parameter_mode = 'OUT'), 2::bigint, 'availability exposes exactly two date fields');
select throws_ok(format('select * from public.item_booking_windows(%L)', '00000000-0000-0000-0000-000000000000'), 'P0001', 'item_not_available', 'unknown item availability denied');
reset role;
select * from finish();
rollback;
