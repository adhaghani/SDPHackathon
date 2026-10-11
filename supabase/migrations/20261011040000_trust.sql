create or replace function public.open_booking_dispute(
  p_booking_id uuid,
  p_reason text default 'issue',
  p_details text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_dispute_id uuid;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;
  if v_user_id is null or not (v_booking.borrower_id = v_user_id or v_booking.lender_id = v_user_id) then
    raise exception 'not_booking_participant';
  end if;
  if v_booking.status not in ('handed_over', 'completed') then
    raise exception 'transition_not_allowed';
  end if;

  update public.bookings set status = 'disputed', updated_at = now() where id = v_booking.id;

  insert into public.disputes (booking_id, opened_by, reason, details, status)
  values (v_booking.id, v_user_id, coalesce(nullif(trim(p_reason), ''), 'issue'), coalesce(p_details, ''), 'open')
  returning id into v_dispute_id;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_booking.township_id, v_user_id, 'dispute_opened', 'booking', v_booking.id, jsonb_build_object('dispute_id', v_dispute_id));

  return jsonb_build_object('dispute_id', v_dispute_id, 'status', 'disputed');
end;
$$;

create or replace function public.resolve_booking_dispute(
  p_dispute_id uuid,
  p_resolution text,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_dispute public.disputes%rowtype;
  v_booking public.bookings%rowtype;
  v_category public.item_categories%rowtype;
  v_points jsonb;
begin
  select * into v_dispute from public.disputes where id = p_dispute_id for update;
  if not found or not public.is_township_admin((select township_id from public.bookings where id = v_dispute.booking_id)) then
    raise exception 'admin_required';
  end if;
  if p_resolution not in ('completed', 'closed') then
    raise exception 'invalid_resolution';
  end if;

  select * into v_booking from public.bookings where id = v_dispute.booking_id for update;
  select * into v_category from public.item_categories where id = (select category_id from public.items where id = v_booking.item_id);

  update public.disputes
  set status = 'resolved', resolution = p_resolution, resolution_note = p_note, resolved_by = v_user_id, resolved_at = now()
  where id = v_dispute.id;

  update public.bookings
  set status = p_resolution, updated_at = now()
  where id = v_booking.id;

  if p_resolution = 'completed' then
    v_points := public.award_points(
      v_booking.lender_id,
      v_booking.township_id,
      'item_lent_completed',
      'booking',
      v_booking.id,
      v_category.slug,
      jsonb_build_object('dispute_id', v_dispute.id, 'resolution', 'completed'),
      now()
    );
  end if;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_booking.township_id, v_user_id, 'dispute_resolved', 'dispute', v_dispute.id, jsonb_build_object('resolution', p_resolution, 'booking_id', v_booking.id));

  return jsonb_build_object('dispute_id', v_dispute.id, 'resolution', p_resolution, 'points', v_points);
end;
$$;

create or replace function public.delete_my_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted_memberships integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  with removed as (
    delete from public.township_members where user_id = v_user_id returning township_id
  )
  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  select township_id, v_user_id, 'account_deleted', 'township_member', v_user_id, '{}'::jsonb
  from removed;
  get diagnostics v_deleted_memberships = row_count;

  update public.profiles
  set display_name = 'Deleted neighbour',
      avatar_path = null,
      interests = '{}',
      comfort_prefs = '{}'::jsonb,
      recognition_opt_in = false,
      deleted_at = now(),
      updated_at = now()
  where id = v_user_id;

  return jsonb_build_object('user_id', v_user_id, 'memberships_removed', v_deleted_memberships);
end;
$$;

grant execute on function public.open_booking_dispute(uuid, text, text), public.resolve_booking_dispute(uuid, text, text), public.delete_my_account() to authenticated;
