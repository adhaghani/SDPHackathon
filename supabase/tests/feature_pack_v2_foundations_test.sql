begin;

create extension if not exists pgtap;

select plan(17);

select has_table('public', 'search_events', 'search events table exists');
select hasnt_column('public', 'search_events', 'user_id', 'search events never store a user id');
select has_column('public', 'search_events', 'is_demo', 'demo search rows can be labelled');
select has_function('public', 'normalize_borrow_search_term', 'search normalizer exists');
select has_function('public', 'log_borrow_search', 'search logging function exists');
select has_column('public', 'items', 'min_trust_tier', 'items carry the new trust requirement');

select is(
  public.normalize_borrow_search_term('  Gerudi   BESAR '),
  'gerudi besar',
  'normalizer lowercases and collapses whitespace'
);
select is(
  public.normalize_borrow_search_term('TANGGA'),
  'ladder',
  'normalizer maps Malay synonyms'
);
select is(
  public.normalize_borrow_search_term('meja'),
  'table',
  'normalizer maps table synonyms'
);

select is(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'search_events'),
  true,
  'search events has RLS enabled'
);

set local role authenticated;
select is(
  has_table_privilege('authenticated', 'public.search_events', 'insert'),
  false,
  'authenticated clients cannot insert search events directly'
);
reset role;

insert into public.townships (name, slug, join_code, is_demo)
values ('Feature Pack Township', 'feature-pack-v2', 'FEATURE-V2', false)
on conflict (slug) do nothing;

insert into public.neighbourhoods (township_id, name)
select id, 'Feature Pack neighbourhood'
from public.townships
where slug = 'feature-pack-v2'
on conflict (township_id, name) do nothing;

select id as fp_township_id from public.townships where slug = 'feature-pack-v2' \gset
select id as fp_aisyah_id from auth.users where email = 'aisyah@borrowbetter.demo' \gset

insert into public.township_members (township_id, user_id, role, status)
values (:'fp_township_id', :'fp_aisyah_id', 'resident', 'active')
on conflict (township_id, user_id) do nothing;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'fp_aisyah_id', 'role', 'authenticated')::text,
  true
);
select is(
  (public.log_borrow_search(
    :'fp_township_id'::uuid,
    null,
    'drills',
    null,
    4,
    2
  ) ->> 'normalized_term'),
  'drill',
  'active members can log a normalized search'
);
reset role;

select is(
  (select count(*)
   from public.search_events
   where township_id = :'fp_township_id'::uuid
     and normalized_term = 'drill'),
  1::bigint,
  'the normalized search was persisted without a user id'
);

select is(
  (select count(*)
   from public.reward_rules
   where action_type in (
     'item_request_fulfilled',
     'item_guide_added',
     'streak_milestone_3',
     'streak_milestone_6',
     'streak_milestone_12',
     'invite_accepted',
     'neighbour_of_month'
   )),
  7::bigint,
  'all Feature Pack point rules are seeded idempotently'
);

select id as fp_rule_user_id from auth.users where email = 'raj@borrowbetter.demo' \gset
select gen_random_uuid() as fp_award_source \gset

select is(
  (public.award_points(
    :'fp_rule_user_id'::uuid,
    :'fp_township_id'::uuid,
    'item_lent_completed',
    'feature_pack_test',
    :'fp_award_source'::uuid,
    null,
    '{}'::jsonb,
    now()
  ) ->> 'reason'),
  '40 BP · Return confirmed by both sides',
  'new ledger rows include a plain verified reason'
);

select is(
  public.award_points(
    :'fp_rule_user_id'::uuid,
    :'fp_township_id'::uuid,
    'item_lent_completed',
    'feature_pack_test',
    :'fp_award_source'::uuid,
    null,
    '{}'::jsonb,
    now()
  ),
  null,
  'the same verified source cannot award twice'
);

select is(
  (select count(*)
   from public.points_ledger
   where user_id = :'fp_rule_user_id'::uuid
     and source_type = 'feature_pack_test'
     and source_id = :'fp_award_source'::uuid),
  1::bigint,
  'only one ledger row exists for the repeated source'
);

select * from finish();

rollback;
