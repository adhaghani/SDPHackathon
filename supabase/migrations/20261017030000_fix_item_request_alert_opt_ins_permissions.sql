drop policy if exists item_request_alerts_insert_own on public.item_request_alert_opt_ins;
drop policy if exists item_request_alerts_update_own on public.item_request_alert_opt_ins;

create policy item_request_alerts_insert_own on public.item_request_alert_opt_ins
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_active_member(township_id)
  );

create policy item_request_alerts_update_own on public.item_request_alert_opt_ins
  for update to authenticated
  using (
    user_id = auth.uid()
    and public.is_active_member(township_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_active_member(township_id)
  );

grant insert (user_id, township_id, category_id),
  update (user_id, township_id, category_id)
on public.item_request_alert_opt_ins to authenticated;
