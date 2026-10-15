-- Fix request posting and count notifications actually inserted.
create or replace function public.create_item_request(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := (p_payload->>'township_id')::uuid;
  v_category_id uuid := nullif(p_payload->>'category_id', '')::uuid;
  v_request_id uuid;
  v_open_count integer;
  v_title text := trim(coalesce(p_payload->>'title', ''));
begin
  if v_user_id is null or not public.is_active_member(v_township_id) then
    raise exception 'not_active_member';
  end if;
  if char_length(v_title) < 3 or char_length(v_title) > 100 then
    raise exception 'invalid_request_title';
  end if;
  if v_category_id is not null and not exists (
    select 1 from public.item_categories where id = v_category_id
  ) then
    raise exception 'invalid_category';
  end if;

  select count(*)
  into v_open_count
  from public.item_requests
  where requester_id = v_user_id
    and township_id = v_township_id
    and status = 'open'
    and (needed_until is null or needed_until >= current_date);
  if v_open_count >= 3 then
    raise exception 'open_request_limit';
  end if;

  insert into public.item_requests (
    township_id,
    requester_id,
    title,
    category_id,
    neighbourhood_id,
    needed_from,
    needed_until,
    note
  )
  values (
    v_township_id,
    v_user_id,
    v_title,
    v_category_id,
    nullif(p_payload->>'neighbourhood_id', '')::uuid,
    nullif(p_payload->>'needed_from', '')::date,
    nullif(p_payload->>'needed_until', '')::date,
    coalesce(p_payload->>'note', '')
  )
  returning id into v_request_id;

  with recipients as (
    select distinct i.owner_id as user_id
    from public.items i
    where i.township_id = v_township_id
      and i.status = 'active'
      and i.hidden = false
      and i.owner_id <> v_user_id
      and (v_category_id is null or i.category_id = v_category_id)
    union
    select a.user_id
    from public.item_request_alert_opt_ins a
    where a.township_id = v_township_id
      and a.user_id <> v_user_id
      and (v_category_id is null or a.category_id = v_category_id)
  ),
  notices as (
    insert into public.notifications (user_id, type, title, body, link, dedupe_key)
    select
      recipient.user_id,
      'item_request',
      'A neighbour needs ' || v_title,
      'Your listing or alert may match this request.',
      '/borrow/requests',
      'item-request:' || v_request_id::text || ':' || recipient.user_id::text
    from recipients recipient
    on conflict (user_id, dedupe_key) do nothing
    returning id
  )
  select count(*) into v_open_count from notices;

  return jsonb_build_object('request_id', v_request_id, 'notifications', v_open_count);
end;
$$;

