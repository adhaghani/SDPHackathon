begin;

create extension if not exists pgtap;

select plan(20);

select has_table('public', 'gates', 'guest gates table exists');
select has_table('public', 'visitor_passes', 'visitor pass table exists');
select has_table('public', 'visitor_logs', 'visitor log table exists');
select has_table('public', 'walk_in_requests', 'walk-in request table exists');

select is(
  has_table_privilege('authenticated', 'public.gates', 'insert'),
  false,
  'authenticated clients cannot insert gates directly'
);
select is(
  has_table_privilege('authenticated', 'public.visitor_passes', 'insert'),
  false,
  'authenticated clients cannot insert visitor passes directly'
);
select is(
  has_table_privilege('authenticated', 'public.visitor_logs', 'insert'),
  false,
  'authenticated clients cannot insert visitor logs directly'
);
select is(
  has_table_privilege('authenticated', 'public.walk_in_requests', 'insert'),
  false,
  'authenticated clients cannot insert walk-ins directly'
);

select id as guest_township_id from public.townships where slug = 'harmoni-heights-demo' \gset
select id as guest_other_township_id from public.townships where slug = 'damai-harmoni-demo' \gset
select id as guest_aisyah_id from auth.users where email = 'aisyah@borrowlah.demo' \gset
select id as guest_guard_id from auth.users where email = 'guard@borrowlah.demo' \gset
select id as guest_office_id from auth.users where email = 'office@borrowlah.demo' \gset

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'guest_aisyah_id', 'role', 'authenticated')::text,
  true
);

select is(
  (select count(*) from public.visitor_passes where host_id = :'guest_aisyah_id') >= 1,
  true,
  'resident can read their own guest pass through RLS'
);

select is(
  (select count(*) from public.visitor_passes where host_id <> :'guest_aisyah_id'),
  0::bigint,
  'resident cannot read another resident guest pass through RLS'
);

select is(
  (jsonb_path_exists(
    public.resolve_guest_pass('sample-guest-token-128bit'),
    '$.unit'
  )),
  false,
  'public visitor page result never contains a unit'
);

select is(
  (jsonb_path_exists(
    public.resolve_guest_pass('sample-guest-token-128bit'),
    '$.host_full_name'
  )),
  false,
  'public visitor page result never contains a host full name'
);

select is(
  (public.resolve_guest_pass('definitely-not-a-real-token')->>'valid')::boolean,
  false,
  'invalid public token uses generic invalid response'
);

reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'guest_guard_id', 'role', 'authenticated')::text,
  true
);

select public.get_guard_guest_lists(:'guest_township_id'::uuid);
select ok(true, 'guard can read their township guard lists');

select throws_ok(
  format('select public.get_guard_guest_lists(%L::uuid)', :'guest_other_township_id'),
  'P0001',
  'guard_required',
  'guard cannot read another township'
);

reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'guest_office_id', 'role', 'authenticated')::text,
  true
);

select is(
  jsonb_path_exists(
    public.guest_pass_stats(:'guest_township_id'::uuid),
    '$.visitor_name'
  ),
  false,
  'admin aggregate stats never expose visitor names'
);

select is(
  jsonb_path_exists(
    public.guest_pass_stats(:'guest_township_id'::uuid),
    '$.unit_label'
  ),
  false,
  'admin aggregate stats never expose units'
);

reset role;

select is(
  (select octet_length(token_hash) from public.visitor_passes where token_hash is not null limit 1),
  32,
  'stored guest tokens are hashes rather than raw tokens'
);

select is(
  (select count(*) from public.gates where township_id = :'guest_township_id'),
  2::bigint,
  'sample gates are seeded for the demo township'
);

-- Retention removes personal data while preserving the pass row and logs.
insert into public.visitor_passes (
  host_id, township_id, visitor_name, visitor_phone, vehicle_plate, purpose,
  valid_from, valid_until, max_entries, entries_used, status, source,
  token_hash, short_code_hash, ended_at
)
values (
  :'guest_aisyah_id', :'guest_township_id', 'Retention Visitor', '0123456789', 'RETENTION123', 'Retention test',
  now() - interval '100 days', now() - interval '99 days', 1, 1, 'completed', 'resident',
  decode(repeat('11', 32), 'hex'), decode(repeat('22', 32), 'hex'), now() - interval '99 days'
)
returning id as guest_retention_id\gset

select public.purge_guest_personal_data(30);

select is(
  (select visitor_name is null and visitor_phone is null and vehicle_plate is null and token_hash is null
   from public.visitor_passes
   where id = :'guest_retention_id'::uuid),
  true,
  'retention purge removes visitor personal data'
);

select * from finish();

rollback;
