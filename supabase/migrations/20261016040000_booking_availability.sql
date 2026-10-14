-- Residents need occupied dates, never the other borrower's booking record.
create or replace function public.item_booking_windows(p_item_id uuid)
returns table(start_date date, end_date date)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.items i where i.id = p_item_id and i.status = 'active'
      and not i.hidden and public.is_active_member(i.township_id)
  ) then raise exception 'item_not_available'; end if;
  return query select b.start_date, b.end_date from public.bookings b
  where b.item_id = p_item_id and b.status in ('approved', 'handed_over')
  order by b.start_date;
end;
$$;
revoke all on function public.item_booking_windows(uuid) from public, anon;
grant execute on function public.item_booking_windows(uuid) to authenticated;
