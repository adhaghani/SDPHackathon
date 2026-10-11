begin;

create extension if not exists pgtap;

select plan(2);

select has_function('public', 'health_check', 'health check function exists');
select is(
  (public.health_check() ->> 'ok')::boolean,
  true,
  'health check reports ok'
);
select * from finish();

rollback;
