begin;
create extension if not exists pgtap;
select plan(33);

insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('00000000-0000-4000-9000-000000000001','platform-test@example.test',now(),'{"role":"superadmin"}'),
 ('00000000-0000-4000-9000-000000000002','manager-test@example.test',now(),'{}'),
 ('00000000-0000-4000-9000-000000000003','resident-test@example.test',now(),'{"role":"superadmin"}'),
 ('00000000-0000-4000-9000-000000000004','invite-test@example.test',now(),'{}');
insert into public.platform_admins(user_id) values('00000000-0000-4000-9000-000000000001');
select ok(not has_function_privilege('anon','public.platform_save_township(jsonb,uuid)','execute'),'anonymous users cannot provision townships');
select ok(not has_function_privilege('authenticated','public._platform_boundary(jsonb)','execute'),'geometry helper is private');
select ok(not has_table_privilege('authenticated','public.platform_admins','insert'),'authenticated users cannot grant superadmin');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000003","role":"authenticated"}',true);
select is(public.is_platform_admin(),false,'user metadata cannot grant platform privileges');
select throws_ok($$select public.platform_save_township('{}')$$,'P0001','platform_admin_required','residents cannot create townships');
select is((select count(*)::integer from public.platform_admins),0,'residents cannot discover platform owners');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000001","role":"authenticated"}',true);
select is(public.is_platform_admin(),true,'trusted grant enables platform access');

select '{"name":"Platform Test Town","slug":"platform-test-town","join_code":"TEST-PLATFORM","state":"Selangor","district":"Petaling","description":"Test","lifecycle":"draft","auto_approve_members":false,"require_event_approval":true,"neighbourhoods":["North","South"],"boundary":{"type":"Polygon","coordinates":[[[101,3],[101.01,3],[101.01,3.01],[101,3.01],[101,3]]]}}'::jsonb as town_data \gset
select throws_ok(format('select public.platform_save_township(%L::jsonb)',jsonb_set(:'town_data'::jsonb,'{boundary}','{"type":"Polygon","coordinates":[[[101,3],[101.01,3.01],[101.01,3],[101,3.01],[101,3]]]}')),'P0001','invalid_boundary','self crossing boundary rejected');
select throws_ok(format('select public.platform_save_township(%L::jsonb)',jsonb_set(:'town_data'::jsonb,'{boundary}','{"type":"Polygon","coordinates":[[[181,3],[182,3],[182,4],[181,3]]]}')),'P0001','invalid_boundary','out of range coordinates rejected');
select throws_ok(format('select public.platform_save_township(%L::jsonb)',jsonb_set(:'town_data'::jsonb,'{neighbourhoods}','[]')),'P0001','neighbourhoods_required','neighbourhood required');
select is((select count(*)::integer from public.townships where slug='platform-test-town'),0,'invalid creation leaves no partial township');
select public.platform_save_township(:'town_data'::jsonb) as town_id \gset
select is((select count(*)::integer from public.neighbourhoods where township_id=:'town_id'),2,'neighbourhoods created in provisioning transaction');
select is(public.get_join_details('TEST-PLATFORM')->>'error','invalid_join_code','drafts cannot be discovered with join code');
select throws_ok(format('select public.platform_save_township(%L::jsonb,%L::uuid)',jsonb_set(:'town_data'::jsonb,'{lifecycle}','"active"'),:'town_id'),'P0001','manager_required_before_activation','activation needs a manager');
select public.platform_prepare_manager(:'town_id','manager-test@example.test','Town Manager') as manager \gset
select is(:'manager'::jsonb->>'status','accepted','verified account is appointed immediately');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000002","role":"authenticated"}',true);
select is((select lifecycle from public.townships where id=:'town_id'),'draft','appointed manager can read draft identity for the preparation screen');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000001","role":"authenticated"}',true);
select public.platform_prepare_manager(:'town_id','new-platform-test@example.test','New Manager') as invitation \gset
select is(:'invitation'::jsonb->>'status','pending','new account waits for delivery');
select public.platform_record_delivery((:'invitation'::jsonb->>'id')::uuid,false);
select is((select status from public.platform_manager_invitations where id=(:'invitation'::jsonb->>'id')::uuid),'failed','failed delivery is visible and retryable');
select public.platform_prepare_manager(:'town_id','new-platform-test@example.test','New Manager') as invitation \gset
select public.platform_record_delivery((:'invitation'::jsonb->>'id')::uuid,true);
select public.platform_revoke_manager((:'invitation'::jsonb->>'id')::uuid);
select is((select status from public.platform_manager_invitations where id=(:'invitation'::jsonb->>'id')::uuid),'revoked','pending invitation can be revoked');
select public.platform_save_township(jsonb_set(:'town_data'::jsonb,'{lifecycle}','"active"'),:'town_id');
select throws_ok(format('select public.platform_revoke_manager(%L::uuid)',:'manager'::jsonb->>'id'),'P0001','last_active_manager','last active manager is protected');
select is(jsonb_array_length(public.platform_boundary_overlaps(:'town_data'::jsonb->'boundary')),1,'overlapping township boundary is detected');
select is(jsonb_array_length(public.platform_boundary_overlaps(:'town_data'::jsonb->'boundary',:'town_id')),0,'township does not overlap itself');
select throws_ok(format('select public.platform_save_township(%L::jsonb)',(:'town_data'::jsonb || '{"slug":"overlap-platform-town","join_code":"TEST-OVERLAP"}')),'P0001','boundary_overlap_confirmation_required','overlap requires explicit acknowledgement');
select public.platform_prepare_manager(:'town_id','another-new-platform@example.test','Pending Manager') as pending_invitation \gset
select public.platform_record_delivery((:'pending_invitation'::jsonb->>'id')::uuid,true);
reset role;
update public.platform_manager_invitations set email='invite-test@example.test',status='revoked' where id=(:'pending_invitation'::jsonb->>'id')::uuid;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000004","role":"authenticated"}',true);
select is(jsonb_array_length(public.my_manager_invitations()),0,'verified recipient cannot discover a revoked appointment');
select throws_ok('select public.accept_manager_invitations()','P0001','no_pending_manager_invitation','revoked link cannot grant manager access');
reset role;
update public.platform_manager_invitations set status='sent' where id=(:'pending_invitation'::jsonb->>'id')::uuid;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000003","role":"authenticated"}',true);
select is(jsonb_array_length(public.my_manager_invitations()),0,'another account cannot see manager invitations');
select throws_ok('select public.accept_manager_invitations()','P0001','no_pending_manager_invitation','another account cannot accept an invitation');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000004","role":"authenticated"}',true);
select is(public.accept_manager_invitations(),:'town_id'::uuid,'verified recipient can accept their appointment');
select is(public.is_township_admin(:'town_id'),true,'accepted appointment grants scoped manager access');
select is(public.is_platform_admin(),false,'township manager is not a platform admin');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000001","role":"authenticated"}',true);
select public.platform_save_township(jsonb_set(:'town_data'::jsonb,'{lifecycle}','"archived"'),:'town_id');
select is(public.get_join_details('TEST-PLATFORM')->>'error','invalid_join_code','archived township cannot be discovered');
select id as platform_neighbourhood_id from public.neighbourhoods where township_id=:'town_id' limit 1 \gset
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000003","role":"authenticated"}',true);
select throws_ok(format('select public.join_township(%L,%L::uuid)', 'TEST-PLATFORM', :'platform_neighbourhood_id'),'P0001','township_not_available','direct join RPC cannot bypass archived status');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-9000-000000000004","role":"authenticated"}',true);
select is(public.is_township_admin(:'town_id'),false,'archiving disables township role access without deleting records');
select * from finish();
rollback;
