begin;

create extension if not exists pgtap;

select plan(29);

select has_table('public', 'recycling_materials', 'recycling material table exists');
select has_table('public', 'recycling_units', 'recycling unit table exists');
select has_table('public', 'recycling_logs', 'recycling log table exists');
select has_table('public', 'recycling_log_items', 'recycling log item table exists');
select has_table('public', 'recycling_campaigns', 'recycling campaign table exists');

select id as recycle_township_id from public.townships where slug = 'harmoni-heights-demo' \gset
select id as recycle_aisyah_id from auth.users where email = 'aisyah@borrowlah.demo' \gset
select id as recycle_farah_id from auth.users where email = 'farah@borrowlah.demo' \gset
select id as recycle_office_id from auth.users where email = 'office@borrowlah.demo' \gset
select id as recycle_unit_id from public.recycling_units where slug = 'plastic-500ml-bottle' \gset
select id as recycle_glass_id from public.recycling_materials where slug = 'glass' \gset

delete from public.recycling_logs where township_id = :'recycle_township_id';
delete from public.recycling_campaigns where township_id = :'recycle_township_id';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'recycle_aisyah_id', 'role', 'authenticated')::text,
  true
);

select throws_ok(
  $$
    insert into public.recycling_logs (township_id, user_id, occurred_on, total_kg)
    values (gen_random_uuid(), auth.uid(), current_date, 1)
  $$,
  '42501',
  null,
  'residents cannot insert recycling logs directly'
);

select lives_ok(
  format(
    $sql$select public.log_recycling(jsonb_build_object('township_id', %L, 'method', 'count', 'occurred_on', %L, 'photo_paths', jsonb_build_array(%L), 'lines', jsonb_build_array(jsonb_build_object('unit_id', %L, 'quantity', %L))))$sql$,
    :'recycle_township_id',
    (now() at time zone 'Asia/Kuala_Lumpur')::date::text,
    'https://storage.example.test/recycling/test.webp',
    :'recycle_unit_id',
    '10'
  ),
  'a resident can save a count estimate'
);

select is(
  (public.resident_recycling_summary(:'recycle_township_id', :'recycle_aisyah_id') ->> 'lifetime_kg')::numeric,
  0.2::numeric,
  'count estimates convert to kilograms'
);
select is(
  (public.resident_recycling_summary(:'recycle_township_id', :'recycle_aisyah_id') ->> 'co2e_available')::boolean,
  true,
  'CO2e is available when every material has a source'
);
select is(
  (public.resident_recycling_summary(:'recycle_township_id', :'recycle_aisyah_id') ->> 'energy_available')::boolean,
  true,
  'energy is available when every material has a source'
);
select is(
  jsonb_array_length(public.resident_recycling_summary(:'recycle_township_id', :'recycle_aisyah_id') -> 'recent_logs' -> 0 -> 'photo_paths'),
  1,
  'estimate photos are returned with recent logs'
);

select lives_ok(
  format(
    $sql$select public.log_recycling(jsonb_build_object('township_id', %L, 'method', 'custom_kg', 'occurred_on', %L, 'lines', jsonb_build_array(jsonb_build_object('material_id', %L, 'kg', %L))))$sql$,
    :'recycle_township_id',
    (now() at time zone 'Asia/Kuala_Lumpur')::date::text,
    :'recycle_glass_id',
    '0.7'
  ),
  'a resident can save a custom kilogram estimate'
);
select is(
  (public.resident_recycling_summary(:'recycle_township_id', :'recycle_aisyah_id') ->> 'lifetime_kg')::numeric,
  0.9::numeric,
  'custom estimates add to lifetime kilograms'
);

select throws_ok(
  format(
    $sql$select public.log_recycling(jsonb_build_object('township_id', %L, 'method', 'count', 'occurred_on', %L, 'lines', jsonb_build_array(jsonb_build_object('unit_id', %L, 'quantity', %L))))$sql$,
    :'recycle_township_id',
    ((now() at time zone 'Asia/Kuala_Lumpur')::date + 1)::text,
    :'recycle_unit_id',
    '1'
  ),
  'P0001',
  'invalid_date',
  'future recycling dates are rejected'
);

select throws_ok(
  format(
    $sql$select public.log_recycling(jsonb_build_object('township_id', %L, 'method', 'count', 'occurred_on', %L, 'lines', jsonb_build_array(jsonb_build_object('unit_id', %L, 'quantity', %L))))$sql$,
    :'recycle_township_id',
    ((now() at time zone 'Asia/Kuala_Lumpur')::date - 1)::text,
    :'recycle_unit_id',
    '1'
  ),
  'P0001',
  'invalid_date',
  'past recycling dates are rejected'
);

select throws_ok(
  format(
    $sql$select public.log_recycling(jsonb_build_object('township_id', %L, 'method', 'count', 'occurred_on', %L, 'lines', jsonb_build_array(jsonb_build_object('unit_id', %L, 'quantity', %L))))$sql$,
    :'recycle_township_id',
    (now() at time zone 'Asia/Kuala_Lumpur')::date::text,
    gen_random_uuid()::text,
    '1'
  ),
  'P0001',
  'invalid_unit',
  'unknown recycling units are rejected'
);

select throws_ok(
  format(
    $sql$select public.log_recycling(jsonb_build_object('township_id', %L, 'method', 'count', 'occurred_on', %L, 'photo_paths', jsonb_build_array(%L,%L,%L,%L), 'lines', jsonb_build_array(jsonb_build_object('unit_id', %L, 'quantity', %L))))$sql$,
    :'recycle_township_id',
    (now() at time zone 'Asia/Kuala_Lumpur')::date::text,
    'https://storage.example.test/recycling/1.webp',
    'https://storage.example.test/recycling/2.webp',
    'https://storage.example.test/recycling/3.webp',
    'https://storage.example.test/recycling/4.webp',
    :'recycle_unit_id',
    '1'
  ),
  'P0001',
  'invalid_photos',
  'more than three recycling photos are rejected'
);

select throws_ok(
  format(
    $sql$select public.log_recycling(jsonb_build_object('township_id', %L, 'method', 'custom_kg', 'occurred_on', %L, 'lines', jsonb_build_array(jsonb_build_object('material_id', %L, 'kg', %L))))$sql$,
    :'recycle_township_id',
    (now() at time zone 'Asia/Kuala_Lumpur')::date::text,
    (select id from public.recycling_materials where slug = 'plastic')::text,
    '100'
  ),
  'P0001',
  'daily_limit',
  'the 100 kg daily integrity cap is enforced'
);

reset role;
select set_config('request.jwt.claims', '', true);

update public.recycling_materials
set co2e_kg_per_kg = null
where slug = 'plastic';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'recycle_aisyah_id', 'role', 'authenticated')::text,
  true
);
select is(
  (public.resident_recycling_summary(:'recycle_township_id', :'recycle_aisyah_id') ->> 'co2e_available')::boolean,
  false,
  'missing factors hide CO2e totals'
);
select is(
  (public.resident_recycling_summary(:'recycle_township_id', :'recycle_aisyah_id') ->> 'lifetime_kg')::numeric,
  0.9::numeric,
  'kilogram totals remain visible without factors'
);
reset role;
select set_config('request.jwt.claims', '', true);

update public.recycling_materials
set co2e_kg_per_kg = 1.020203
where slug = 'plastic';

delete from public.recycling_logs where township_id = :'recycle_township_id';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'recycle_office_id', 'role', 'authenticated')::text,
  true
);
select (public.set_recycling_campaign(jsonb_build_object(
  'township_id', :'recycle_township_id',
  'title', 'Test recycling goal',
  'starts_on', (now() at time zone 'Asia/Kuala_Lumpur')::date::text,
  'ends_on', ((now() at time zone 'Asia/Kuala_Lumpur')::date + 30)::text,
  'target_kg', 0.2,
  'status', 'active'
)) ->> 'campaign_id') as campaign_id \gset recycle_campaign_
select is(
  (select status from public.recycling_campaigns where id = :'recycle_campaign_campaign_id'),
  'active',
  'an admin can create an active recycling campaign'
);

reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'recycle_aisyah_id', 'role', 'authenticated')::text,
  true
);
select throws_ok(
  format(
    $sql$select public.set_recycling_campaign(jsonb_build_object('township_id', %L, 'title', 'Resident campaign', 'starts_on', %L, 'ends_on', %L, 'target_kg', %L, 'status', 'active'))$sql$,
    :'recycle_township_id',
    current_date::text,
    (current_date + 1)::text,
    '1'
  ),
  'P0001',
  'admin_required',
  'residents cannot create recycling campaigns'
);

select is(
  (public.township_recycling_progress(:'recycle_township_id') ->> 'percent')::numeric,
  0::numeric,
  'a new campaign starts at zero percent'
);

select lives_ok(
  format(
    $sql$select public.log_recycling(jsonb_build_object('township_id', %L, 'method', 'count', 'occurred_on', %L, 'lines', jsonb_build_array(jsonb_build_object('unit_id', %L, 'quantity', %L))))$sql$,
    :'recycle_township_id',
    (now() at time zone 'Asia/Kuala_Lumpur')::date::text,
    :'recycle_unit_id',
    '10'
  ),
  'a contributor can log during the campaign'
);

select is(
  (public.township_recycling_progress(:'recycle_township_id') ->> 'completed')::boolean,
  true,
  'crossing the target completes the campaign'
);

select is(
  (
    select count(*)
    from public.points_ledger
    where user_id = :'recycle_aisyah_id'
      and action_type = 'recycling_goal_completed'
      and source_id = :'recycle_campaign_campaign_id'
  ),
  1::bigint,
  'the contributor receives the 50 BP goal reward once'
);

select public.township_recycling_progress(:'recycle_township_id');
select is(
  (
    select count(*)
    from public.points_ledger
    where user_id = :'recycle_aisyah_id'
      and action_type = 'recycling_goal_completed'
      and source_id = :'recycle_campaign_campaign_id'
  ),
  1::bigint,
  'repeated progress refreshes cannot duplicate the reward'
);

select is(
  (
    select count(*)
    from public.points_ledger
    where user_id = :'recycle_farah_id'
      and action_type = 'recycling_goal_completed'
      and source_id = :'recycle_campaign_campaign_id'
  ),
  0::bigint,
  'non-contributors do not receive the goal reward'
);

select throws_ok(
  format(
    $sql$select public.set_recycling_material_factor('plastic', 1, 1, 'test source', %L)$sql$,
    :'recycle_township_id'
  ),
  'P0001',
  'admin_required',
  'residents cannot change recycling factors'
);

reset role;
select set_config('request.jwt.claims', '', true);

select * from finish();

rollback;
