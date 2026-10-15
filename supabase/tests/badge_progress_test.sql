begin;
create extension if not exists pgtap;
select no_plan();
select gen_random_uuid() as badge_user \gset
select id as badge_township from public.townships where slug = 'harmoni-heights-demo' \gset
select user_id as badge_admin from public.township_members where role = 'township_admin' and status = 'active' limit 1 \gset
select id as badge_lender from auth.users where email = 'raj@borrowlah.demo' \gset
select id as badge_item from public.items where owner_id = :'badge_lender'::uuid and kind = 'item' limit 1 \gset
insert into auth.users(id, email) values (:'badge_user', 'badge-check@example.test');
insert into public.profiles(id) values (:'badge_user') on conflict do nothing;
insert into public.township_members(user_id, township_id, status) values (:'badge_user', :'badge_township', 'active');
insert into public.points_ledger(user_id, township_id, delta, action_type, source_type, source_id, metadata)
select :'badge_user', :'badge_township', 1, 'badge_test_action', 'badge_test', gen_random_uuid(),
  jsonb_build_object('counts_as_sustainability', i <> 1) from generate_series(1,1005) i;
select is((public._badge_progress(:'badge_user', :'badge_township', '{"type":"count","threshold":2000,"action_types":["badge_test_action"]}')->'requirements'->0->>'current')::integer, 1005, 'progress counts beyond the former 1000-row UI limit');
select is((public._badge_progress(:'badge_user', :'badge_township', '{"type":"count","threshold":1005,"action_types":["badge_test_action"],"metadata":{"counts_as_sustainability":true}}')->'requirements'->0->>'current')::integer, 1004, 'metadata requirements exclude non-qualifying actions');
select is((public._badge_progress(:'badge_user', :'badge_township', '{"type":"count","threshold":5,"action_types":["badge_test_action"]}')->>'percent')::integer, 100, 'completed requirements reach 100 percent without a 95-percent cap');
select ok(public._badge_progress(:'badge_user', :'badge_township', '{"type":"manual"}')->>'percent' is null, 'manual awards have no numeric progress');
select is((public._badge_progress(:'badge_user', :'badge_township', '{"type":"sustained","min_types":2,"min_active_weeks":2,"window_weeks":4}')->>'eligible')::boolean, false, 'sustained progress requires both variety and active weeks');
insert into public.points_ledger(user_id, township_id, delta, action_type, source_type, source_id, created_at)
select :'badge_user', :'badge_township', 1, 'badge_test_second', 'badge_test', gen_random_uuid(), now()-make_interval(weeks=>i) from generate_series(1,2) i;
select is((public._badge_progress(:'badge_user', :'badge_township', '{"type":"sustained","min_types":2,"min_active_weeks":2,"window_weeks":4}')->>'eligible')::boolean, true, 'sustained progress becomes eligible when both requirements are met');
select ok(not has_function_privilege('authenticated', 'public._badge_progress(uuid,uuid,jsonb)', 'execute'), 'private progress helper cannot inspect another resident');
select ok(not has_function_privilege('anon', 'public.get_my_badge_progress(uuid)', 'execute'), 'anonymous users cannot inspect progress');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'badge_user', 'role', 'authenticated')::text, true);
select ok(jsonb_array_length(public.get_my_badge_progress(:'badge_township')) > 0, 'an active resident can retrieve their own progress');
select throws_ok($$select public.get_my_badge_progress('00000000-0000-0000-0000-000000000000')$$, 'P0001', 'not_active_member', 'progress is unavailable for a township without membership');
select throws_ok($$select public.save_badge_definition('test-count','Test count','Test description','award','{"type":"count","threshold":2,"action_types":["badge_test_action"]}')$$, 'P0001', 'township_admin_required', 'residents cannot change badge definitions');
select set_config('request.jwt.claims', json_build_object('sub', :'badge_admin', 'role', 'authenticated')::text, true);
select public.save_badge_definition('test-count','Test count','Test description','award','{"type":"count","threshold":2,"action_types":["badge_test_action"]}') as badge_count_id \gset
select public.save_badge_definition('test-count','Updated count','Updated description','award');
select is((select criteria->>'threshold' from public.badges where id=:'badge_count_id'), '2', 'copy-only edits preserve the existing threshold');
select throws_ok($$select public.save_badge_definition('test-bad','Bad rule','Test description','award','{"type":"count","threshold":0,"action_types":[]}')$$, 'P0001', 'invalid_badge_criteria', 'direct RPC calls cannot bypass rule validation');
select throws_ok($$select public.save_badge_definition('test-bad','Bad rule','Test description','award','{"type":"sustained","min_types":3,"min_active_weeks":8,"window_weeks":4}')$$, 'P0001', 'invalid_badge_criteria', 'impossible sustained rules are rejected');
reset role;
select public.evaluate_badges(:'badge_user', :'badge_township');
select is((select criteria_snapshot->>'threshold' from public.user_badges where user_id=:'badge_user' and badge_id=:'badge_count_id'), '2', 'earning records retain a snapshot of the original rule');
update public.badges set criteria='{"type":"count","threshold":2000,"action_types":["badge_test_action"]}' where id=:'badge_count_id';
select is((select criteria_snapshot->>'threshold' from public.user_badges where user_id=:'badge_user' and badge_id=:'badge_count_id'), '2', 'later rule changes do not rewrite earned history');
select public.evaluate_badges(:'badge_user', :'badge_township');
select is((select count(*)::integer from public.user_badges where user_id=:'badge_user' and badge_id=:'badge_count_id'), 1, 're-evaluation does not duplicate or revoke existing awards');
select gen_random_uuid() as badge_booking_one, gen_random_uuid() as badge_booking_two \gset
insert into public.bookings(id,item_id,township_id,borrower_id,lender_id,start_date,end_date,status,updated_at)
values (:'badge_booking_one',:'badge_item',:'badge_township',:'badge_user',:'badge_lender',current_date,current_date,'completed',now()+interval '1 minute'),
(:'badge_booking_two',:'badge_item',:'badge_township',:'badge_user',:'badge_lender',current_date,current_date,'completed',now()+interval '2 minutes');
insert into public.points_ledger(user_id,township_id,delta,action_type,source_type,source_id)
values (:'badge_user',:'badge_township',1,'item_returned_on_time','booking',:'badge_booking_one');
select is((public._badge_progress(:'badge_user',:'badge_township','{"type":"consecutive_recent","threshold":3,"action_type":"item_returned_on_time"}')->'requirements'->0->>'current')::integer, 0, 'a latest return without on-time credit resets the run');
insert into public.points_ledger(user_id,township_id,delta,action_type,source_type,source_id)
values (:'badge_user',:'badge_township',1,'item_returned_on_time','booking',:'badge_booking_two');
select is((public._badge_progress(:'badge_user',:'badge_township','{"type":"consecutive_recent","threshold":3,"action_type":"item_returned_on_time"}')->'requirements'->0->>'current')::integer, 2, 'an uninterrupted latest run counts both credited returns');
insert into public.badges(slug,name,description,icon,criteria) values ('test-one-month','One month test','Test streak','award','{"type":"streak","threshold":1}');
select public.evaluate_user_streak(:'badge_user', :'badge_township');
select ok(exists(select 1 from public.user_badges ub join public.badges b on b.id=ub.badge_id where ub.user_id=:'badge_user' and b.slug='test-one-month'), 'custom streak requirements award through the same evaluator as progress');
update public.profiles set show_in_highlights = true where id = :'badge_user';
update public.badges set criteria = '{"type":"count","threshold":9999,"action_types":["neighbour_of_month"]}' where slug = 'neighbour-of-month';
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'badge_admin', 'role', 'authenticated')::text, true);
select public.approve_monthly_highlight(date_trunc('month',now())::date, :'badge_user', 'Verified helpful activity');
reset role;
select ok(not exists(select 1 from public.user_badges ub join public.badges b on b.id=ub.badge_id where ub.user_id=:'badge_user' and b.slug='neighbour-of-month'), 'office selection cannot bypass a changed automatic badge rule');
update public.badges set criteria = '{"type":"manual"}' where slug = 'neighbour-of-month';
set local role authenticated;
select public.approve_monthly_highlight(date_trunc('month',now())::date, :'badge_user', 'Verified helpful activity');
reset role;
select is((select criteria_snapshot->>'type' from public.user_badges ub join public.badges b on b.id=ub.badge_id where ub.user_id=:'badge_user' and b.slug='neighbour-of-month'), 'manual', 'office-selected awards retain their manual criteria snapshot');
select * from finish();
rollback;
