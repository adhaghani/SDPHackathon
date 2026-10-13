-- Lazy retention trigger for admin and guard reads when pg_cron is unavailable.

create or replace function public.run_guest_pass_lazy_purge()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select township_id into v_township_id
  from public.township_members
  where user_id = v_user_id
    and status = 'active'
  order by created_at
  limit 1;

  if v_township_id is null
     or not (public.is_township_admin(v_township_id) or public.is_township_guard(v_township_id)) then
    raise exception 'maintenance_forbidden';
  end if;

  return public.purge_guest_personal_data();
end;
$$;

revoke execute on function public.run_guest_pass_lazy_purge() from public, anon;
grant execute on function public.run_guest_pass_lazy_purge() to authenticated;
