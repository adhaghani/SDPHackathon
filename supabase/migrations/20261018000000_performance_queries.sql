-- Small, caller-scoped result sets replace ledger downloads and per-row HTTP RPCs.
create or replace function public.get_my_reward_stats(p_township_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_active_member(p_township_id) then
    raise exception 'active_membership_required';
  end if;

  return jsonb_build_object(
    'action_counts', (
      select coalesce(jsonb_object_agg(counts.action_type, counts.total), '{}'::jsonb)
      from (
        select action_type, count(*) as total
        from public.points_ledger
        where user_id = auth.uid() and township_id = p_township_id and delta > 0
        group by action_type
      ) counts
    ),
    'estimated_shared_rm', (
      select coalesce(sum(estimated_value_saved_rm), 0)
      from public.bookings
      where borrower_id = auth.uid() and township_id = p_township_id and status = 'completed'
    )
  );
end;
$$;

create or replace function public.get_my_incoming_request_trust(p_booking_ids uuid[])
returns table(booking_id uuid, tier text)
language sql
stable
security invoker
set search_path = ''
as $$
  select b.id, public.get_incoming_request_trust(b.item_id, b.borrower_id)->>'tier'
  from public.bookings b
  where b.id = any(p_booking_ids)
    and b.lender_id = auth.uid()
    and b.status = 'requested'
    and public.is_active_member(b.township_id);
$$;

revoke all on function public.get_my_reward_stats(uuid) from public, anon;
revoke all on function public.get_my_incoming_request_trust(uuid[]) from public, anon;
grant execute on function public.get_my_reward_stats(uuid) to authenticated;
grant execute on function public.get_my_incoming_request_trust(uuid[]) to authenticated;

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read_at is null;
create index if not exists items_visible_created_idx
  on public.items (township_id, created_at desc) where status = 'active' and hidden = false;
create index if not exists bookings_borrower_township_created_idx
  on public.bookings (borrower_id, township_id, created_at desc);
create index if not exists bookings_lender_township_created_idx
  on public.bookings (lender_id, township_id, created_at desc);
create index if not exists items_owner_township_created_idx
  on public.items (owner_id, township_id, created_at desc);
