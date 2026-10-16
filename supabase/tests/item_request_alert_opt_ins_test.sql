begin;

create extension if not exists pgtap;

select plan(3);

select id as alert_township_id
from public.townships
where slug = 'harmoni-heights-demo'
\gset

select id as alert_user_id
from auth.users
where email = 'farah@borrowlah.demo'
\gset

select id as alert_other_user_id
from auth.users
where email = 'aisyah@borrowlah.demo'
\gset

select id as alert_category_id
from public.item_categories
where slug = 'home-tools'
\gset

delete from public.item_request_alert_opt_ins
where user_id = :'alert_user_id'::uuid
  and township_id = :'alert_township_id'::uuid
  and category_id = :'alert_category_id'::uuid;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'alert_user_id', 'role', 'authenticated')::text,
  true
);

select lives_ok(
  format(
    'insert into public.item_request_alert_opt_ins (user_id, township_id, category_id) values (%L, %L, %L)',
    :'alert_user_id'::uuid,
    :'alert_township_id'::uuid,
    :'alert_category_id'::uuid
  ),
  'a resident can opt in to alerts for their township'
);

select lives_ok(
  format(
    'insert into public.item_request_alert_opt_ins (user_id, township_id, category_id) values (%L, %L, %L) on conflict (user_id, township_id, category_id) do update set category_id = excluded.category_id',
    :'alert_user_id'::uuid,
    :'alert_township_id'::uuid,
    :'alert_category_id'::uuid
  ),
  'repeating the opt-in upsert is allowed'
);

select throws_ok(
  format(
    'insert into public.item_request_alert_opt_ins (user_id, township_id, category_id) values (%L, %L, %L)',
    :'alert_other_user_id'::uuid,
    :'alert_township_id'::uuid,
    :'alert_category_id'::uuid
  ),
  '42501',
  'new row violates row-level security policy for table "item_request_alert_opt_ins"',
  'a resident cannot opt in another user'
);

select * from finish();
rollback;
