create extension if not exists pg_trgm;
create extension if not exists btree_gist;

-- pg_cron is optional in local/CI environments.
do $$
begin
  create extension if not exists pg_cron;
exception
  when others then
    raise notice 'pg_cron unavailable: %', sqlerrm;
end
$$;

create or replace function public.health_check()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'ok', true,
    'database', current_database(),
    'checked_at', now()
  );
$$;

revoke execute on function public.health_check() from public, anon, authenticated;
grant execute on function public.health_check() to anon, authenticated;
