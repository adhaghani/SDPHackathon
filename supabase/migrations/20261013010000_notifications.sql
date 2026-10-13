-- Resident convenience action for clearing their notification inbox.

create or replace function public.mark_all_notifications_read()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_updated integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  update public.notifications
  set read_at = coalesce(read_at, now())
  where user_id = v_user_id
    and read_at is null;

  get diagnostics v_updated = row_count;

  return jsonb_build_object('updated_count', v_updated);
end;
$$;

revoke execute on function public.mark_all_notifications_read() from public, anon, authenticated, service_role;
grant execute on function public.mark_all_notifications_read() to authenticated;
