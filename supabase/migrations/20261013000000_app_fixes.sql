-- Audit fixes: governance actions, selected-township exports and admin workflows.

alter table public.events
  add column if not exists recurrence text not null default 'none',
  add column if not exists recurrence_interval_days integer check (recurrence_interval_days is null or recurrence_interval_days > 0),
  add column if not exists recurrence_until date;

alter table public.events
  drop constraint if exists events_recurrence_check;
alter table public.events
  add constraint events_recurrence_check check (
    recurrence in ('none', 'weekly', 'monthly')
    and (recurrence = 'none' or recurrence_interval_days is not null or recurrence = 'monthly')
  );

alter table public.help_requests
  add column if not exists recurrence text not null default 'none',
  add column if not exists recurrence_interval_days integer check (recurrence_interval_days is null or recurrence_interval_days > 0),
  add column if not exists recurrence_until date;

alter table public.help_requests
  drop constraint if exists help_requests_recurrence_check;
alter table public.help_requests
  add constraint help_requests_recurrence_check check (
    recurrence in ('none', 'weekly', 'monthly')
    and (recurrence = 'none' or recurrence_interval_days is not null or recurrence = 'monthly')
  );

create or replace function public.get_item_history(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.items%rowtype;
  v_township public.townships%rowtype;
  v_is_owner boolean;
  v_count integer;
  v_borrowers integer;
  v_saved numeric;
  v_timeline jsonb;
begin
  select * into v_item from public.items where id = p_item_id;
  if not found or v_item.hidden then
    raise exception 'item_not_found';
  end if;
  if not public.is_active_member(v_item.township_id) then
    raise exception 'not_active_member';
  end if;
  select * into v_township from public.townships where id = v_item.township_id;
  v_is_owner := auth.uid() = v_item.owner_id;

  select
    count(*),
    count(distinct b.borrower_id),
    coalesce(sum(b.estimated_value_saved_rm), 0)
  into v_count, v_borrowers, v_saved
  from public.bookings b
  where b.item_id = v_item.id and b.status = 'completed';

  with events as (
    select v_item.created_at as occurred_at, 'listed' as event_type, null::uuid as booking_id, null::text as display_name, null::text as condition
    union all
    select b.updated_at, case when b.status = 'completed' then 'returned' else 'borrowed' end, b.id,
      case when v_is_owner then coalesce(p.display_name, 'A neighbour') else 'A neighbour in ' || v_township.name end,
      b.return_condition
    from public.bookings b
    left join public.profiles p on p.id = b.borrower_id
    where b.item_id = v_item.id and b.status in ('approved', 'handed_over', 'completed')
    union all
    select g.updated_at, 'guide_added', null::uuid, case when v_is_owner then 'You' else 'The owner' end, null::text
    from public.item_guides g where g.item_id = v_item.id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(occurred_at at time zone 'Asia/Kuala_Lumpur', 'YYYY-MM-DD'),
        'type', event_type,
        'booking_id', booking_id,
        'display_name', display_name,
        'condition', condition
      )
      order by occurred_at
    ),
    '[]'::jsonb
  )
  into v_timeline
  from events;

  return jsonb_build_object(
    'is_owner', v_is_owner,
    'borrow_count', v_count,
    'unique_borrowers', v_borrowers,
    'lifetime_saved_rm', v_saved,
    'timeline', v_timeline
  );
end;
$$;

create or replace function public.set_item_category_co2e(
  p_slug text,
  p_factor numeric,
  p_source text,
  p_township_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text;
  v_factor numeric;
  v_source text;
begin
  if auth.uid() is null or p_township_id is null or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;
  if p_factor is null or p_factor < 0 then
    raise exception 'invalid_co2e_factor';
  end if;
  if char_length(coalesce(trim(p_source), '')) < 3 then
    raise exception 'invalid_co2e_source';
  end if;
  update public.item_categories
  set co2e_kg_per_borrow = p_factor,
      co2e_source = trim(p_source)
  where slug = p_slug
  returning slug, co2e_kg_per_borrow, co2e_source into v_slug, v_factor, v_source;
  if v_slug is null then
    raise exception 'category_not_found';
  end if;
  return jsonb_build_object(
    'slug', v_slug,
    'co2e_kg_per_borrow', v_factor,
    'co2e_source', v_source
  );
end;
$$;

create or replace function public.set_calendar_event_verification(
  p_event_id uuid,
  p_status text,
  p_note text default '',
  p_township_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated_id uuid;
begin
  if p_status not in ('needs_review', 'verified', 'rejected') then
    raise exception 'invalid_verification_status';
  end if;
  if auth.uid() is null or p_township_id is null or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;
  update public.calendar_events
  set verification_status = p_status,
      verification_note = coalesce(nullif(trim(p_note), ''), verification_note)
  where id = p_event_id
  returning id into v_updated_id;
  if v_updated_id is null then
    raise exception 'calendar_event_not_found';
  end if;
  return jsonb_build_object('event_id', p_event_id, 'verification_status', p_status);
end;
$$;

create or replace function public.resolve_support_ticket(
  p_ticket_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.support_tickets%rowtype;
begin
  if p_status not in ('open', 'in_progress', 'resolved') then
    raise exception 'invalid_ticket_status';
  end if;
  select * into v_ticket from public.support_tickets where id = p_ticket_id for update;
  if not found or not public.is_township_admin(v_ticket.township_id) then
    raise exception 'admin_required';
  end if;
  update public.support_tickets
  set status = p_status,
      updated_at = now()
  where id = p_ticket_id;
  return jsonb_build_object('ticket_id', p_ticket_id, 'status', p_status);
end;
$$;

create or replace function public.trust_tier_distribution(p_township_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;
  with scored as (
    select (public._trust_score(m.user_id)->>'tier') as tier
    from public.township_members m
    where m.township_id = p_township_id
      and m.status = 'active'
  ),
  counts as (
    select tier, count(*) as residents
    from scored
    group by tier
  )
  select jsonb_build_object(
    'building', max(case when tier = 'building' and residents >= 5 then residents end),
    'trusted', max(case when tier = 'trusted' and residents >= 5 then residents end),
    'highly_trusted', max(case when tier = 'highly_trusted' and residents >= 5 then residents end),
    'suppression_rule', 'Tiers with fewer than five residents are hidden.'
  )
  into v_result
  from counts;
  return coalesce(v_result, jsonb_build_object(
    'building', null,
    'trusted', null,
    'highly_trusted', null,
    'suppression_rule', 'Tiers with fewer than five residents are hidden.'
  ));
end;
$$;

create or replace function public.create_event(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := (p_payload->>'township_id')::uuid;
  v_category_id uuid := (p_payload->>'category_id')::uuid;
  v_role text;
  v_status text;
  v_event_id uuid;
  v_start timestamptz := (p_payload->>'starts_at')::timestamptz;
  v_end timestamptz := (p_payload->>'ends_at')::timestamptz;
begin
  if v_user_id is null or not public.is_active_member(v_township_id) then
    raise exception 'not_active_member';
  end if;
  if v_start <= now() and current_setting('request.jwt.claims', true) is not null then
    raise exception 'event_in_past';
  end if;
  select role into v_role
  from public.township_members
  where township_id = v_township_id and user_id = v_user_id and status = 'active';
  v_status := case
    when v_role in ('organiser', 'township_admin') then 'published'
    when exists (select 1 from public.townships t where t.id = v_township_id and t.require_event_approval = false) then 'published'
    else 'pending_approval'
  end;
  insert into public.events (
    township_id, host_id, title, description, category_id, starts_at, ends_at,
    location_text, facility_id, neighbourhood_id, capacity, volunteer_slots,
    accessibility_tags, languages, status, cover_path, recurrence,
    recurrence_interval_days, recurrence_until
  )
  values (
    v_township_id, v_user_id, trim(p_payload->>'title'), coalesce(p_payload->>'description', ''),
    v_category_id, v_start, v_end, coalesce(p_payload->>'location_text', 'Shared township space'),
    nullif(p_payload->>'facility_id', '')::uuid, nullif(p_payload->>'neighbourhood_id', '')::uuid,
    nullif(p_payload->>'capacity', '')::integer, nullif(p_payload->>'volunteer_slots', '')::integer,
    coalesce(array(select jsonb_array_elements_text(p_payload->'accessibility_tags')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p_payload->'languages')), array['English']),
    v_status, nullif(p_payload->>'cover_path', ''),
    coalesce(p_payload->>'recurrence', 'none'),
    nullif(p_payload->>'recurrence_interval_days', '')::integer,
    nullif(p_payload->>'recurrence_until', '')::date
  )
  returning id into v_event_id;
  insert into public.event_staff (event_id, user_id) values (v_event_id, v_user_id) on conflict do nothing;
  return jsonb_build_object('event_id', v_event_id, 'status', v_status);
end;
$$;

create or replace function public.create_help_request(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := (p_payload->>'township_id')::uuid;
  v_request_id uuid;
begin
  if v_user_id is null or not public.is_active_member(v_township_id) then
    raise exception 'not_active_member';
  end if;
  insert into public.help_requests (
    township_id, requester_id, title, details, kind, neighbourhood_id, needed_by,
    recurrence, recurrence_interval_days, recurrence_until
  )
  values (
    v_township_id, v_user_id, trim(p_payload->>'title'), coalesce(p_payload->>'details', ''),
    coalesce(p_payload->>'kind', 'other'), nullif(p_payload->>'neighbourhood_id', '')::uuid,
    nullif(p_payload->>'needed_by', '')::date,
    coalesce(p_payload->>'recurrence', 'none'),
    nullif(p_payload->>'recurrence_interval_days', '')::integer,
    nullif(p_payload->>'recurrence_until', '')::date
  )
  returning id into v_request_id;
  return jsonb_build_object('request_id', v_request_id);
end;
$$;

create or replace function public.attach_item_to_offer(
  p_offer_id uuid,
  p_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_offer public.item_request_offers%rowtype;
  v_item public.items%rowtype;
  v_request public.item_requests%rowtype;
begin
  select * into v_offer from public.item_request_offers where id = p_offer_id for update;
  if not found or v_offer.offerer_id <> v_user_id or v_offer.status <> 'proposed' then
    raise exception 'not_allowed';
  end if;
  select * into v_item from public.items where id = p_item_id for update;
  if not found or v_item.owner_id <> v_user_id or v_item.status <> 'active' or v_item.hidden then
    raise exception 'item_not_available';
  end if;
  select * into v_request from public.item_requests where id = v_offer.request_id for update;
  if v_request.status <> 'open' then
    raise exception 'request_not_available';
  end if;
  if v_request.category_id is not null and v_item.category_id <> v_request.category_id then
    raise exception 'offer_category_mismatch';
  end if;
  update public.item_request_offers
  set item_id = p_item_id,
      updated_at = now()
  where id = p_offer.id;
  return jsonb_build_object('offer_id', p_offer.id, 'item_id', p_item_id);
end;
$$;

create or replace function public.create_bundle(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := (p_payload->>'township_id')::uuid;
  v_title text := trim(coalesce(p_payload->>'title', ''));
  v_description text := coalesce(p_payload->>'description', '');
  v_item_ids uuid[];
  v_bundle_id uuid;
  v_item_id uuid;
  v_count integer;
begin
  if v_user_id is null or not public.is_active_member(v_township_id) then
    raise exception 'not_active_member';
  end if;
  if char_length(v_title) < 3 or char_length(v_title) > 120 then
    raise exception 'invalid_bundle_title';
  end if;
  select array_agg(value::uuid)
  into v_item_ids
  from jsonb_array_elements_text(coalesce(p_payload->'item_ids', '[]'::jsonb)) value;
  select count(*) into v_count from unnest(v_item_ids);
  if v_count < 2 or v_count > 12 then
    raise exception 'invalid_bundle_items';
  end if;
  for v_item_id in select unnest(v_item_ids)
  loop
    if not exists (
      select 1 from public.items
      where id = v_item_id
        and township_id = v_township_id
        and owner_id = v_user_id
        and status = 'active'
        and hidden = false
    ) then
      raise exception 'bundle_item_unavailable';
    end if;
  end loop;
  insert into public.bundles (township_id, owner_id, title, description)
  values (v_township_id, v_user_id, v_title, v_description)
  returning id into v_bundle_id;
  insert into public.bundle_items (bundle_id, item_id, position)
  select v_bundle_id, value::uuid, ordinality
  from jsonb_array_elements_text(coalesce(p_payload->'item_ids', '[]'::jsonb)) with ordinality
  order by ordinality;
  return jsonb_build_object('bundle_id', v_bundle_id, 'item_count', v_count);
end;
$$;

create or replace function public.update_bundle(
  p_bundle_id uuid,
  p_title text,
  p_description text default '',
  p_item_ids jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_bundle public.bundles%rowtype;
  v_item_ids uuid[];
  v_count integer;
  v_item_id uuid;
begin
  select * into v_bundle from public.bundles where id = p_bundle_id for update;
  if not found or v_bundle.owner_id <> v_user_id then
    raise exception 'not_allowed';
  end if;
  if char_length(trim(coalesce(p_title, ''))) < 3 then
    raise exception 'invalid_bundle_title';
  end if;
  select array_agg(value::uuid)
  into v_item_ids
  from jsonb_array_elements_text(coalesce(p_item_ids, '[]'::jsonb)) value;
  select count(*) into v_count from unnest(v_item_ids);
  if v_count < 2 or v_count > 12 then
    raise exception 'invalid_bundle_items';
  end if;
  for v_item_id in select unnest(v_item_ids)
  loop
    if not exists (
      select 1 from public.items
      where id = v_item_id
        and township_id = v_bundle.township_id
        and owner_id = v_user_id
        and status = 'active'
        and hidden = false
    ) then
      raise exception 'bundle_item_unavailable';
    end if;
  end loop;
  update public.bundles
  set title = trim(p_title),
      description = coalesce(p_description, ''),
      updated_at = now()
  where id = p_bundle_id;
  delete from public.bundle_items where bundle_id = p_bundle_id;
  insert into public.bundle_items (bundle_id, item_id, position)
  select p_bundle_id, value::uuid, ordinality
  from jsonb_array_elements_text(coalesce(p_item_ids, '[]'::jsonb)) with ordinality
  order by ordinality;
  return jsonb_build_object('bundle_id', p_bundle_id, 'item_count', v_count);
end;
$$;

create or replace function public.delete_bundle(p_bundle_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_bundle public.bundles%rowtype;
begin
  select * into v_bundle from public.bundles where id = p_bundle_id for update;
  if not found or v_bundle.owner_id <> v_user_id then
    raise exception 'not_allowed';
  end if;
  delete from public.bundles where id = p_bundle_id;
  return jsonb_build_object('bundle_id', p_bundle_id, 'deleted', true);
end;
$$;

revoke execute on function public.set_item_category_co2e(text, numeric, text, uuid) from public, anon, authenticated, service_role;
revoke execute on function public.set_calendar_event_verification(uuid, text, text, uuid) from public, anon, authenticated, service_role;
revoke execute on function public.resolve_support_ticket(uuid, text) from public, anon, authenticated, service_role;
revoke execute on function public.trust_tier_distribution(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.attach_item_to_offer(uuid, uuid) from public, anon, authenticated, service_role;
revoke execute on function public.create_bundle(jsonb) from public, anon, authenticated, service_role;
revoke execute on function public.update_bundle(uuid, text, text, jsonb) from public, anon, authenticated, service_role;
revoke execute on function public.delete_bundle(uuid) from public, anon, authenticated, service_role;
grant execute on function public.set_item_category_co2e(text, numeric, text, uuid) to authenticated;
grant execute on function public.set_calendar_event_verification(uuid, text, text, uuid) to authenticated;
grant execute on function public.resolve_support_ticket(uuid, text) to authenticated;
grant execute on function public.trust_tier_distribution(uuid) to authenticated;
grant execute on function public.attach_item_to_offer(uuid, uuid) to authenticated;
grant execute on function public.create_bundle(jsonb) to authenticated;
grant execute on function public.update_bundle(uuid, text, text, jsonb) to authenticated;
grant execute on function public.delete_bundle(uuid) to authenticated;
