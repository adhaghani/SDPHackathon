begin;

create extension if not exists pgtap;

select plan(4);

select id as guide_township_id
from public.townships
where slug = 'harmoni-heights-demo'
\gset

select id as guide_user_id
from auth.users
where email = 'aisyah@borrowlah.demo'
\gset

delete from public.points_ledger
where user_id = :'guide_user_id'::uuid
  and township_id = :'guide_township_id'::uuid
  and action_type = 'recycling_guide_completed';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'guide_user_id', 'role', 'authenticated')::text,
  true
);

select lives_ok(
  format(
    'select public.complete_recycling_guide(%L)',
    :'guide_township_id'::uuid
  ),
  'an active resident can complete the recycling guide'
);

select is(
  (
    select count(*)::integer
    from public.points_ledger
    where user_id = :'guide_user_id'::uuid
      and township_id = :'guide_township_id'::uuid
      and action_type = 'recycling_guide_completed'
  ),
  1,
  'guide completion creates one ledger entry'
);

select is(
  (
    select delta
    from public.points_ledger
    where user_id = :'guide_user_id'::uuid
      and township_id = :'guide_township_id'::uuid
      and action_type = 'recycling_guide_completed'
  ),
  5,
  'guide completion awards five BetterPoints'
);

select public.complete_recycling_guide(:'guide_township_id'::uuid);

select is(
  (
    select count(*)::integer
    from public.points_ledger
    where user_id = :'guide_user_id'::uuid
      and township_id = :'guide_township_id'::uuid
      and action_type = 'recycling_guide_completed'
  ),
  1,
  'repeating completion cannot award the guide twice'
);

select * from finish();
rollback;
