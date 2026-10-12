-- Feature Pack v2, Phase 3: request board, bundles, skills and request bonuses.

alter table public.item_categories
  add column if not exists hourly_rate_rm numeric(10,2);

alter table public.items
  add column if not exists duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  add column if not exists meeting_facility_id uuid references public.facilities(id) on delete set null,
  add column if not exists meeting_arrangement text not null default 'arranged_by_message',
  add column if not exists guardian_acknowledgement boolean not null default false;

alter table public.items
  drop constraint if exists items_meeting_arrangement_check;
alter table public.items
  add constraint items_meeting_arrangement_check check (
    meeting_arrangement in ('arranged_by_message', 'shared_facility')
  );

alter table public.bookings
  add column if not exists estimated_value_saved_rm numeric(10,2) not null default 0;

update public.bookings b
set estimated_value_saved_rm = coalesce(
  i.estimated_new_price_rm,
  c.typical_new_price_rm,
  0
)
from public.items i
join public.item_categories c on c.id = i.category_id
where b.item_id = i.id
  and b.estimated_value_saved_rm = 0;

create table if not exists public.item_requests (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category_id uuid references public.item_categories(id) on delete set null,
  neighbourhood_id uuid references public.neighbourhoods(id) on delete set null,
  needed_from date,
  needed_until date,
  note text not null default '',
  status text not null default 'open' check (status in ('open', 'offered', 'matched', 'fulfilled', 'expired', 'cancelled')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.item_request_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.item_requests(id) on delete cascade,
  offerer_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  message text not null default '',
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'declined', 'withdrawn')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.item_request_alert_opt_ins (
  user_id uuid not null references auth.users(id) on delete cascade,
  township_id uuid not null references public.townships(id) on delete cascade,
  category_id uuid not null references public.item_categories(id) on delete cascade,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, township_id, category_id)
);

create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  cover_path text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bundle_items (
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  position integer not null default 0,
  is_demo boolean not null default false,
  primary key (bundle_id, item_id)
);

create table if not exists public.booking_groups (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  township_id uuid not null references public.townships(id) on delete cascade,
  borrower_id uuid not null references auth.users(id) on delete cascade,
  lender_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'handed_over', 'completed', 'declined', 'cancelled', 'disputed', 'closed')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings
  add column if not exists item_request_offer_id uuid references public.item_request_offers(id) on delete set null,
  add column if not exists booking_group_id uuid references public.booking_groups(id) on delete set null;

create index if not exists item_requests_township_status_idx
  on public.item_requests (township_id, status, created_at desc);
create index if not exists item_request_offers_request_idx
  on public.item_request_offers (request_id, status);
create index if not exists bookings_group_idx on public.bookings (booking_group_id);

alter table public.item_requests enable row level security;
alter table public.item_request_offers enable row level security;
alter table public.item_request_alert_opt_ins enable row level security;
alter table public.bundles enable row level security;
alter table public.bundle_items enable row level security;
alter table public.booking_groups enable row level security;

drop policy if exists item_requests_select_member on public.item_requests;
drop policy if exists item_request_offers_select_member on public.item_request_offers;
drop policy if exists item_request_alerts_select_own on public.item_request_alert_opt_ins;
drop policy if exists bundles_select_member on public.bundles;
drop policy if exists bundle_items_select_member on public.bundle_items;
drop policy if exists booking_groups_select_participant on public.booking_groups;

create policy item_requests_select_member on public.item_requests
  for select to authenticated using (public.is_active_member(township_id));
create policy item_request_offers_select_member on public.item_request_offers
  for select to authenticated
  using (
    exists (
      select 1 from public.item_requests r
      where r.id = request_id and public.is_active_member(r.township_id)
    )
  );
create policy item_request_alerts_select_own on public.item_request_alert_opt_ins
  for select to authenticated using (user_id = auth.uid());
create policy bundles_select_member on public.bundles
  for select to authenticated using (public.is_active_member(township_id));
create policy bundle_items_select_member on public.bundle_items
  for select to authenticated
  using (
    exists (
      select 1 from public.bundles b
      where b.id = bundle_id and public.is_active_member(b.township_id)
    )
  );
create policy booking_groups_select_participant on public.booking_groups
  for select to authenticated
  using (borrower_id = auth.uid() or lender_id = auth.uid() or public.is_township_admin(township_id));

revoke all on public.item_requests, public.item_request_offers,
  public.item_request_alert_opt_ins, public.bundles, public.bundle_items,
  public.booking_groups from anon, authenticated;
grant select on public.item_requests, public.item_request_offers,
  public.item_request_alert_opt_ins, public.bundles, public.bundle_items,
  public.booking_groups to authenticated;

insert into public.item_categories (slug, name, kind, typical_new_price_rm, hourly_rate_rm)
values
  ('repairs', 'Repairs', 'skill', 0, 40.00),
  ('tuition', 'Tuition', 'skill', 0, 60.00),
  ('sewing-skills', 'Sewing', 'skill', 0, 35.00),
  ('cooking-skills', 'Cooking', 'skill', 0, 45.00),
  ('tech-help', 'Tech help', 'skill', 0, 50.00)
on conflict (slug) do nothing;

create or replace function public.get_item_requests()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_township_id uuid;
begin
  select township_id into v_township_id
  from public.township_members
  where user_id = auth.uid() and status = 'active'
  order by created_at
  limit 1;
  if v_township_id is null then
    raise exception 'not_active_member';
  end if;

  return coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'requester_id', r.requester_id,
        'title', r.title,
        'category_id', r.category_id,
        'category_name', c.name,
        'neighbourhood_id', r.neighbourhood_id,
        'needed_from', r.needed_from,
        'needed_until', r.needed_until,
        'note', r.note,
        'status', case
          when r.status = 'open' and r.needed_until is not null and r.needed_until < current_date then 'expired'
          else r.status
        end,
        'is_demo', r.is_demo,
        'created_at', r.created_at
      )
      order by r.created_at desc
    ),
    '[]'::jsonb
  )
  from public.item_requests r
  left join public.item_categories c on c.id = r.category_id
  where r.township_id = v_township_id
    and r.status not in ('cancelled');
end;
$$;

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
    from recipients
    on conflict (user_id, dedupe_key) do nothing
  )
  select count(*) into v_open_count from notices;

  return jsonb_build_object('request_id', v_request_id, 'notifications', v_open_count);
end;
$$;

create or replace function public.offer_item_request(
  p_request_id uuid,
  p_item_id uuid default null,
  p_message text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.item_requests%rowtype;
  v_item public.items%rowtype;
  v_offer_id uuid;
begin
  select * into v_request from public.item_requests where id = p_request_id for update;
  if not found or not public.is_active_member(v_request.township_id) then
    raise exception 'request_not_found';
  end if;
  if v_request.status <> 'open'
     or (v_request.needed_until is not null and v_request.needed_until < current_date) then
    raise exception 'request_not_available';
  end if;
  if v_request.requester_id = v_user_id then
    raise exception 'cannot_offer_own_request';
  end if;
  if p_item_id is not null then
    select * into v_item from public.items where id = p_item_id for update;
    if not found or v_item.owner_id <> v_user_id or v_item.status <> 'active' or v_item.hidden then
      raise exception 'item_not_available';
    end if;
    if v_request.category_id is not null and v_item.category_id <> v_request.category_id then
      raise exception 'offer_category_mismatch';
    end if;
  end if;

  insert into public.item_request_offers (request_id, offerer_id, item_id, message)
  values (p_request_id, v_user_id, p_item_id, coalesce(trim(p_message), ''))
  returning id into v_offer_id;

  update public.item_requests set status = 'offered', updated_at = now() where id = p_request_id;

  insert into public.notifications (user_id, type, title, body, link, dedupe_key)
  values (
    v_request.requester_id,
    'item_request_offer',
    'A neighbour offered something',
    'Review the offer for ' || v_request.title || '.',
    '/borrow/requests',
    'request-offer:' || v_offer_id::text
  )
  on conflict (user_id, dedupe_key) do nothing;

  return jsonb_build_object('offer_id', v_offer_id, 'status', 'proposed');
end;
$$;

create or replace function public.accept_item_request_offer(
  p_offer_id uuid,
  p_start_date date default null,
  p_end_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_offer public.item_request_offers%rowtype;
  v_request public.item_requests%rowtype;
  v_item public.items%rowtype;
  v_booking_id uuid;
  v_conflicts integer;
  v_start_date date;
  v_end_date date;
begin
  select * into v_offer from public.item_request_offers where id = p_offer_id for update;
  if not found then
    raise exception 'offer_not_found';
  end if;
  select * into v_request from public.item_requests where id = v_offer.request_id for update;
  if v_request.requester_id <> v_user_id or v_offer.status <> 'proposed' then
    raise exception 'not_allowed';
  end if;
  if v_offer.item_id is null then
    raise exception 'offer_has_no_item';
  end if;
  select * into v_item from public.items where id = v_offer.item_id for update;
  if not found or v_item.status <> 'active' or v_item.hidden or v_item.owner_id <> v_offer.offerer_id then
    raise exception 'item_not_available';
  end if;

  v_start_date := coalesce(p_start_date, v_request.needed_from, current_date);
  v_end_date := coalesce(
    p_end_date,
    v_request.needed_until,
    v_start_date + make_interval(days => greatest(v_item.max_loan_days - 1, 0))
  );
  if v_end_date < v_start_date or v_end_date - v_start_date + 1 > v_item.max_loan_days then
    raise exception 'loan_too_long';
  end if;

  select count(*) into v_conflicts
  from public.bookings
  where item_id = v_item.id
    and status in ('approved', 'handed_over')
    and daterange(start_date, end_date, '[]') && daterange(
      v_start_date,
      v_end_date,
      '[]'
    );
  if v_conflicts > 0 then
    raise exception 'dates_unavailable';
  end if;

  update public.item_request_offers
  set status = 'accepted', updated_at = now()
  where id = v_offer.id;
  update public.item_requests
  set status = 'matched', updated_at = now()
  where id = v_request.id;

  insert into public.bookings (
    item_id,
    township_id,
    borrower_id,
    lender_id,
    start_date,
    end_date,
    handover_method,
    item_request_offer_id,
    deposit_amount_rm,
    deposit_waived,
    status
  )
  values (
    v_item.id,
    v_request.township_id,
    v_user_id,
    v_item.owner_id,
    v_start_date,
    v_end_date,
    coalesce(v_item.handover_options[1], 'Meet in a shared space'),
    v_offer.id,
    case when v_item.requires_deposit then v_item.deposit_rm else 0 end,
    false,
    'requested'
  )
  returning id into v_booking_id;

  return jsonb_build_object('booking_id', v_booking_id, 'request_status', 'matched');
end;
$$;

create or replace function public.create_bundle_booking(
  p_bundle_id uuid,
  p_start_date date,
  p_end_date date,
  p_handover_method text default 'Meet in a shared space'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_bundle public.bundles%rowtype;
  v_group_id uuid;
  v_item record;
  v_booking_ids uuid[] := '{}';
  v_booking_id uuid;
  v_conflicts integer;
begin
  select * into v_bundle from public.bundles where id = p_bundle_id for update;
  if not found or not public.is_active_member(v_bundle.township_id) then
    raise exception 'bundle_not_found';
  end if;
  if v_bundle.owner_id = v_user_id then
    raise exception 'cannot_book_own_bundle';
  end if;
  if p_start_date > p_end_date or p_end_date - p_start_date + 1 > 30 then
    raise exception 'invalid_bundle_dates';
  end if;

  for v_item in
    select i.*
    from public.bundle_items bi
    join public.items i on i.id = bi.item_id
    where bi.bundle_id = p_bundle_id
    order by bi.position, i.title
  loop
    if v_item.owner_id <> v_bundle.owner_id or v_item.status <> 'active' or v_item.hidden then
      raise exception 'bundle_item_unavailable';
    end if;
    if p_end_date - p_start_date + 1 > v_item.max_loan_days then
      raise exception 'loan_too_long';
    end if;
    select count(*) into v_conflicts
    from public.bookings
    where item_id = v_item.id
      and status in ('approved', 'handed_over')
      and daterange(start_date, end_date, '[]') && daterange(p_start_date, p_end_date, '[]');
    if v_conflicts > 0 then
      raise exception 'dates_unavailable';
    end if;
  end loop;

  insert into public.booking_groups (
    bundle_id,
    township_id,
    borrower_id,
    lender_id,
    start_date,
    end_date
  )
  values (p_bundle_id, v_bundle.township_id, v_user_id, v_bundle.owner_id, p_start_date, p_end_date)
  returning id into v_group_id;

  for v_item in
    select i.*
    from public.bundle_items bi
    join public.items i on i.id = bi.item_id
    where bi.bundle_id = p_bundle_id
    order by bi.position, i.title
  loop
    insert into public.bookings (
      item_id,
      township_id,
      borrower_id,
      lender_id,
      start_date,
      end_date,
      handover_method,
      booking_group_id,
      deposit_amount_rm,
      status
    )
    values (
      v_item.id,
      v_bundle.township_id,
      v_user_id,
      v_bundle.owner_id,
      p_start_date,
      p_end_date,
      coalesce(nullif(trim(p_handover_method), ''), 'Meet in a shared space'),
      v_group_id,
      case when v_item.requires_deposit then v_item.deposit_rm else 0 end,
      'requested'
    )
    returning id into v_booking_id;
    v_booking_ids := v_booking_ids || v_booking_id;
  end loop;

  return jsonb_build_object(
    'booking_group_id', v_group_id,
    'booking_ids', to_jsonb(v_booking_ids),
    'status', 'requested'
  );
end;
$$;

create or replace function public.create_item(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := (p_payload->>'township_id')::uuid;
  v_category_id uuid := (p_payload->>'category_id')::uuid;
  v_kind text := coalesce(p_payload->>'kind', 'item');
  v_facility_id uuid := nullif(p_payload->>'meeting_facility_id', '')::uuid;
  v_item_id uuid;
  v_category_kind text;
begin
  if v_user_id is null or not public.is_active_member(v_township_id) then
    raise exception 'not_active_member';
  end if;
  select kind into v_category_kind from public.item_categories where id = v_category_id;
  if v_category_kind is null then
    raise exception 'invalid_category';
  end if;
  if v_kind <> v_category_kind then
    raise exception 'category_kind_mismatch';
  end if;
  if v_kind = 'skill' then
    if coalesce((p_payload->>'duration_minutes')::integer, 0) <= 0 then
      raise exception 'invalid_skill_duration';
    end if;
    if coalesce(p_payload->>'meeting_arrangement', 'arranged_by_message') = 'shared_facility' then
      if v_facility_id is null or not exists (
        select 1 from public.facilities where id = v_facility_id and township_id = v_township_id
      ) then
        raise exception 'invalid_shared_space';
      end if;
    end if;
    if v_category_id = (select id from public.item_categories where slug = 'tuition')
       and coalesce((p_payload->>'guardian_acknowledgement')::boolean, false) = false then
      raise exception 'guardian_acknowledgement_required';
    end if;
  end if;

  insert into public.items (
    township_id,
    owner_id,
    title,
    description,
    category_id,
    kind,
    condition,
    photo_paths,
    estimated_new_price_rm,
    value_source,
    requires_deposit,
    deposit_rm,
    allow_deposit_waiver,
    min_trust_tier,
    duration_minutes,
    meeting_facility_id,
    meeting_arrangement,
    guardian_acknowledgement,
    max_loan_days,
    handover_options,
    status,
    hidden
  )
  values (
    v_township_id,
    v_user_id,
    trim(p_payload->>'title'),
    coalesce(p_payload->>'description', ''),
    v_category_id,
    v_kind,
    coalesce(p_payload->>'condition', 'good'),
    coalesce(
      array(select jsonb_array_elements_text(p_payload->'photo_paths')),
      array['/demo/item-placeholder.svg']
    ),
    nullif(p_payload->>'estimated_new_price_rm', '')::numeric,
    coalesce(p_payload->>'value_source', 'category_default'),
    coalesce((p_payload->>'requires_deposit')::boolean, false),
    case when coalesce((p_payload->>'requires_deposit')::boolean, false)
      then coalesce(nullif(p_payload->>'deposit_rm', '')::numeric, 0)
      else 0
    end,
    coalesce((p_payload->>'allow_deposit_waiver')::boolean, false),
    nullif(p_payload->>'min_trust_tier', ''),
    case when v_kind = 'skill' then (p_payload->>'duration_minutes')::integer else null end,
    case when v_kind = 'skill' then v_facility_id else null end,
    case when v_kind = 'skill' then coalesce(p_payload->>'meeting_arrangement', 'arranged_by_message') else 'arranged_by_message' end,
    coalesce((p_payload->>'guardian_acknowledgement')::boolean, false),
    coalesce(nullif(p_payload->>'max_loan_days', '')::integer, 3),
    coalesce(
      array(select jsonb_array_elements_text(p_payload->'handover_options')),
      array['Meet in a shared space']
    ),
    'active',
    false
  )
  returning id into v_item_id;

  return jsonb_build_object('item_id', v_item_id, 'status', 'active', 'kind', v_kind);
end;
$$;

create or replace function public.award_item_request_bonus()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.item_request_offers%rowtype;
begin
  if new.status = 'completed'
     and (old.status is distinct from 'completed')
     and new.item_request_offer_id is not null then
    select * into v_offer from public.item_request_offers where id = new.item_request_offer_id;
    if found then
      perform public.award_points(
        new.lender_id,
        new.township_id,
        'item_request_fulfilled',
        'booking',
        new.id,
        null,
        jsonb_build_object('request_id', v_offer.request_id, 'offer_id', v_offer.id),
        new.updated_at
      );
      update public.item_requests set status = 'fulfilled', updated_at = now() where id = v_offer.request_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists award_item_request_bonus on public.bookings;
create trigger award_item_request_bonus
after update of status on public.bookings
for each row
execute function public.award_item_request_bonus();

create or replace function public.set_booking_estimated_value()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.items%rowtype;
  v_category public.item_categories%rowtype;
begin
  select * into v_item from public.items where id = new.item_id;
  select * into v_category from public.item_categories where id = v_item.category_id;
  if v_item.kind = 'skill' then
    new.estimated_value_saved_rm := round(
      coalesce(v_category.hourly_rate_rm, 0) * coalesce(v_item.duration_minutes, 60) / 60.0,
      2
    );
  else
    new.estimated_value_saved_rm := coalesce(
      v_item.estimated_new_price_rm,
      v_category.typical_new_price_rm,
      0
    );
  end if;
  return new;
end;
$$;

drop trigger if exists set_booking_estimated_value on public.bookings;
create trigger set_booking_estimated_value
before insert or update of item_id on public.bookings
for each row
execute function public.set_booking_estimated_value();

update public.bookings b
set estimated_value_saved_rm = round(
  case
    when i.kind = 'skill' then coalesce(c.hourly_rate_rm, 0) * coalesce(i.duration_minutes, 60) / 60.0
    else coalesce(i.estimated_new_price_rm, c.typical_new_price_rm, 0)
  end,
  2
)
from public.items i
join public.item_categories c on c.id = i.category_id
where b.item_id = i.id;

create or replace function public.township_value_shared(
  p_township_id uuid,
  p_days integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz;
  v_total numeric;
  v_count integer;
begin
  if auth.uid() is null or not public.is_active_member(p_township_id) then
    raise exception 'not_active_member';
  end if;
  if p_days is not null then
    v_start := now() - make_interval(days => greatest(p_days, 1));
  end if;

  select coalesce(sum(estimated_value_saved_rm), 0), count(*)
  into v_total, v_count
  from public.bookings
  where township_id = p_township_id
    and status = 'completed'
    and (v_start is null or updated_at >= v_start);

  return jsonb_build_object(
    'estimated_value_shared_rm', v_total,
    'completed_borrows', v_count,
    'estimated', true
  );
end;
$$;

revoke execute on function public.get_item_requests() from public, anon, authenticated, service_role;
revoke execute on function public.create_item_request(jsonb) from public, anon, authenticated, service_role;
revoke execute on function public.offer_item_request(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke execute on function public.accept_item_request_offer(uuid, date, date) from public, anon, authenticated, service_role;
revoke execute on function public.create_bundle_booking(uuid, date, date, text) from public, anon, authenticated, service_role;
grant execute on function public.get_item_requests() to authenticated;
grant execute on function public.create_item_request(jsonb) to authenticated;
grant execute on function public.offer_item_request(uuid, uuid, text) to authenticated;
grant execute on function public.accept_item_request_offer(uuid, date, date) to authenticated;
grant execute on function public.create_bundle_booking(uuid, date, date, text) to authenticated;
