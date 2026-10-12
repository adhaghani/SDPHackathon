create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Identity and township membership
-- ---------------------------------------------------------------------------

create table if not exists public.townships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  join_code text not null unique,
  auto_approve_members boolean not null default true,
  require_event_approval boolean not null default true,
  timezone text not null default 'Asia/Kuala_Lumpur',
  rewards_enabled boolean not null default true,
  pilot_start_date date,
  is_demo boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.neighbourhoods (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (township_id, name)
);

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  name text not null,
  kind text not null,
  capacity integer,
  weekly_available_hours numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (township_id, name)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Neighbour',
  avatar_path text,
  interests text[] not null default '{}',
  language text not null default 'en',
  comfort_prefs jsonb not null default '{}'::jsonb,
  recognition_opt_in boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.township_members (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'resident' check (role in ('resident', 'organiser', 'township_admin')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'rejected')),
  neighbourhood_id uuid references public.neighbourhoods(id) on delete set null,
  unit_label text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (township_id, user_id)
);

create index if not exists township_members_user_idx
  on public.township_members (user_id, status);
create index if not exists township_members_township_status_idx
  on public.township_members (township_id, status);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_township_created_idx
  on public.audit_log (township_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  counts_as_sustainability boolean not null default false,
  icon text not null default 'calendar'
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  category_id uuid not null references public.event_categories(id),
  cover_path text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location_text text not null,
  facility_id uuid references public.facilities(id) on delete set null,
  neighbourhood_id uuid references public.neighbourhoods(id) on delete set null,
  capacity integer check (capacity is null or capacity > 0),
  volunteer_slots integer check (volunteer_slots is null or volunteer_slots >= 0),
  accessibility_tags text[] not null default '{}',
  languages text[] not null default '{English}',
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'published', 'cancelled', 'completed', 'rejected')),
  hidden boolean not null default false,
  cost_rm numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_dates_valid check (ends_at > starts_at)
);

create index if not exists events_township_status_starts_idx
  on public.events (township_id, status, starts_at);
create index if not exists events_category_idx on public.events (category_id);

create table if not exists public.event_staff (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'attendee' check (role in ('attendee', 'volunteer')),
  status text not null default 'going' check (status in ('going', 'waitlisted', 'cancelled', 'checked_in', 'no_show')),
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users(id) on delete set null,
  check_in_method text check (check_in_method is null or check_in_method in ('qr', 'manual')),
  volunteer_hours_verified numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists event_rsvps_event_status_idx
  on public.event_rsvps (event_id, status);

-- ---------------------------------------------------------------------------
-- Borrow and share
-- ---------------------------------------------------------------------------

create table if not exists public.item_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  typical_new_price_rm numeric(10,2) not null default 0
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  category_id uuid not null references public.item_categories(id),
  condition text not null default 'good' check (condition in ('like_new', 'good', 'fair')),
  photo_paths text[] not null default '{}',
  neighbourhood_id uuid references public.neighbourhoods(id) on delete set null,
  estimated_new_price_rm numeric(10,2),
  deposit_rm numeric(10,2) not null default 0,
  max_loan_days integer not null default 3 check (max_loan_days > 0),
  handover_options text[] not null default '{Meet in a shared space}',
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_township_status_idx
  on public.items (township_id, status, hidden);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  township_id uuid not null references public.townships(id) on delete cascade,
  borrower_id uuid not null references auth.users(id) on delete cascade,
  lender_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'declined', 'cancelled', 'handed_over', 'completed', 'disputed', 'closed')),
  handover_method text not null default 'Meet in a shared space',
  handover_note text,
  lender_handover_confirmed_at timestamptz,
  borrower_handover_confirmed_at timestamptz,
  borrower_return_marked_at timestamptz,
  lender_return_confirmed_at timestamptz,
  return_note text,
  handover_photo_paths text[] not null default '{}',
  return_photo_paths text[] not null default '{}',
  borrower_would_have_bought text check (borrower_would_have_bought is null or borrower_would_have_bought in ('yes', 'no', 'unsure')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_participants_different check (borrower_id <> lender_id),
  constraint booking_dates_valid check (start_date <= end_date)
);

create index if not exists bookings_item_dates_idx
  on public.bookings (item_id, start_date, end_date);
create index if not exists bookings_township_status_idx
  on public.bookings (township_id, status, created_at desc);

alter table public.bookings
  add constraint no_double_booking
  exclude using gist (
    item_id with =,
    daterange(start_date, end_date, '[]') with &&
  )
  where (status in ('approved', 'handed_over'));

create table if not exists public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists booking_messages_booking_created_idx
  on public.booking_messages (booking_id, created_at);

-- ---------------------------------------------------------------------------
-- Gamification
-- ---------------------------------------------------------------------------

create table if not exists public.reward_rules (
  id uuid primary key default gen_random_uuid(),
  township_id uuid references public.townships(id) on delete cascade,
  action_type text not null,
  category_slug text,
  points integer not null check (points <> 0),
  params jsonb not null default '{}'::jsonb,
  daily_cap integer,
  weekly_cap integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique nulls not distinct (township_id, action_type, category_slug)
);

create index if not exists reward_rules_lookup_idx
  on public.reward_rules (township_id, action_type, category_slug, active);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null check (delta <> 0),
  action_type text not null,
  source_type text not null,
  source_id uuid not null,
  rule_id uuid references public.reward_rules(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, action_type, source_type, source_id)
);

create index if not exists points_ledger_user_created_idx
  on public.points_ledger (user_id, created_at desc);
create index if not exists points_ledger_township_action_idx
  on public.points_ledger (township_id, action_type, created_at);

create table if not exists public.levels (
  level integer primary key,
  name text not null,
  min_lifetime_points integer not null
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text not null default 'award',
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  township_id uuid not null references public.townships(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link text,
  dedupe_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create or replace view public.v_member_points
with (security_invoker = true) as
select
  user_id,
  township_id,
  sum(delta) as balance,
  sum(delta) filter (where action_type <> 'redemption') as lifetime_points,
  max(created_at) as last_activity_at
from public.points_ledger
group by user_id, township_id;

grant select on public.v_member_points to authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_active_member(p_township_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.township_members
    where township_id = p_township_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.has_role(p_township_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.township_members
    where township_id = p_township_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any (p_roles)
  );
$$;

create or replace function public.is_township_admin(p_township_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(p_township_id, array['township_admin']);
$$;

create or replace function public.is_event_staff(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    left join public.event_staff s
      on s.event_id = e.id and s.user_id = auth.uid()
    where e.id = p_event_id
      and (e.host_id = auth.uid() or s.user_id is not null or public.is_township_admin(e.township_id))
  );
$$;

create or replace function public.can_read_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and e.hidden = false
      and (
        (e.status = 'published' and public.is_active_member(e.township_id))
        or e.host_id = auth.uid()
        or public.is_township_admin(e.township_id)
      )
  );
$$;

create or replace function public.is_booking_participant(p_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = p_booking_id
      and (
        b.borrower_id = auth.uid()
        or b.lender_id = auth.uid()
        or public.is_township_admin(b.township_id)
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Membership and events
-- ---------------------------------------------------------------------------

create or replace function public.get_join_details(p_join_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_township public.townships%rowtype;
  v_neighbourhoods jsonb;
begin
  select * into v_township from public.townships where join_code = upper(trim(p_join_code));
  if not found then
    return jsonb_build_object('error', 'invalid_join_code');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'name', n.name) order by n.name), '[]'::jsonb)
  into v_neighbourhoods
  from public.neighbourhoods n
  where n.township_id = v_township.id;

  return jsonb_build_object(
    'township_id', v_township.id,
    'name', v_township.name,
    'auto_approve_members', v_township.auto_approve_members,
    'neighbourhoods', v_neighbourhoods
  );
end;
$$;

create or replace function public.join_township(
  p_join_code text,
  p_neighbourhood_id uuid,
  p_unit_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_township public.townships%rowtype;
  v_neighbourhood public.neighbourhoods%rowtype;
  v_user_id uuid := auth.uid();
  v_existing public.township_members%rowtype;
  v_member_id uuid;
  v_status text;
  v_display_name text;
  v_metadata jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_township from public.townships where join_code = upper(trim(p_join_code));
  if not found then
    raise exception 'invalid_join_code';
  end if;

  select * into v_neighbourhood
  from public.neighbourhoods
  where id = p_neighbourhood_id and township_id = v_township.id;
  if not found then
    raise exception 'invalid_neighbourhood';
  end if;

  select raw_user_meta_data into v_metadata from auth.users where id = v_user_id;
  v_display_name := coalesce(nullif(v_metadata->>'display_name', ''), 'Neighbour');

  insert into public.profiles (id, display_name, terms_accepted_at, privacy_accepted_at, updated_at)
  values (
    v_user_id,
    v_display_name,
    coalesce((v_metadata->>'terms_accepted_at')::timestamptz, now()),
    coalesce((v_metadata->>'privacy_accepted_at')::timestamptz, now()),
    now()
  )
  on conflict (id) do update
    set display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name),
        updated_at = now();

  select * into v_existing
  from public.township_members
  where township_id = v_township.id and user_id = v_user_id;

  if found and v_existing.status in ('active', 'pending') then
    return jsonb_build_object(
      'member_id', v_existing.id,
      'status', v_existing.status,
      'township_id', v_township.id,
      'township_name', v_township.name
    );
  end if;

  v_status := case when v_township.auto_approve_members then 'active' else 'pending' end;

  insert into public.township_members (
    township_id,
    user_id,
    neighbourhood_id,
    unit_label,
    status,
    approved_at
  )
  values (
    v_township.id,
    v_user_id,
    v_neighbourhood.id,
    nullif(trim(coalesce(p_unit_label, '')), ''),
    v_status,
    case when v_status = 'active' then now() else null end
  )
  on conflict (township_id, user_id) do update
    set neighbourhood_id = excluded.neighbourhood_id,
        unit_label = excluded.unit_label,
        status = excluded.status,
        approved_at = excluded.approved_at
  returning id into v_member_id;

  return jsonb_build_object(
    'member_id', v_member_id,
    'status', v_status,
    'township_id', v_township.id,
    'township_name', v_township.name
  );
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

  if v_start <= now() and coalesce(auth.uid(), v_user_id) is not null and v_user_id is not null then
    -- Service-role seeds may backdate events; residents cannot create past events.
    if current_setting('request.jwt.claims', true) is not null then
      raise exception 'event_in_past';
    end if;
  end if;

  select role into v_role
  from public.township_members
  where township_id = v_township_id and user_id = v_user_id and status = 'active';

  v_status := case
    when v_role in ('organiser', 'township_admin') then 'published'
    when exists (
      select 1 from public.townships t
      where t.id = v_township_id and t.require_event_approval = false
    ) then 'published'
    else 'pending_approval'
  end;

  insert into public.events (
    township_id,
    host_id,
    title,
    description,
    category_id,
    starts_at,
    ends_at,
    location_text,
    facility_id,
    neighbourhood_id,
    capacity,
    volunteer_slots,
    accessibility_tags,
    languages,
    status,
    cover_path
  )
  values (
    v_township_id,
    v_user_id,
    trim(p_payload->>'title'),
    coalesce(p_payload->>'description', ''),
    v_category_id,
    v_start,
    v_end,
    coalesce(p_payload->>'location_text', 'Shared township space'),
    nullif(p_payload->>'facility_id', '')::uuid,
    nullif(p_payload->>'neighbourhood_id', '')::uuid,
    nullif(p_payload->>'capacity', '')::integer,
    nullif(p_payload->>'volunteer_slots', '')::integer,
    coalesce(
      array(select jsonb_array_elements_text(p_payload->'accessibility_tags')),
      '{}'
    ),
    coalesce(
      array(select jsonb_array_elements_text(p_payload->'languages')),
      array['English']
    ),
    v_status,
    nullif(p_payload->>'cover_path', '')
  )
  returning id into v_event_id;

  insert into public.event_staff (event_id, user_id)
  values (v_event_id, v_user_id)
  on conflict do nothing;

  return jsonb_build_object('event_id', v_event_id, 'status', v_status);
end;
$$;

create or replace function public.rsvp_event(
  p_event_id uuid,
  p_role text default 'attendee',
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_event public.events%rowtype;
  v_rsvp public.event_rsvps%rowtype;
  v_attending integer;
  v_volunteering integer;
  v_status text;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  if p_occurred_at is not null and v_user_id is not null then
    p_occurred_at := now();
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.hidden or v_event.status <> 'published' or v_event.starts_at <= p_occurred_at then
    raise exception 'event_not_available';
  end if;

  if not public.is_active_member(v_event.township_id) then
    raise exception 'not_active_member';
  end if;

  if p_role not in ('attendee', 'volunteer') then
    raise exception 'invalid_role';
  end if;

  select * into v_rsvp from public.event_rsvps where event_id = p_event_id and user_id = v_user_id;
  if found and v_rsvp.status in ('going', 'checked_in') then
    return to_jsonb(v_rsvp);
  end if;

  select count(*) into v_attending
  from public.event_rsvps
  where event_id = p_event_id and role = 'attendee' and status in ('going', 'checked_in');

  select count(*) into v_volunteering
  from public.event_rsvps
  where event_id = p_event_id and role = 'volunteer' and status in ('going', 'checked_in');

  v_status := 'going';
  if p_role = 'volunteer' and v_event.volunteer_slots is not null and v_volunteering >= v_event.volunteer_slots then
    v_status := 'waitlisted';
  elsif p_role = 'attendee' and v_event.capacity is not null and v_attending >= v_event.capacity then
    v_status := 'waitlisted';
  end if;

  insert into public.event_rsvps (event_id, user_id, role, status, updated_at)
  values (p_event_id, v_user_id, p_role, v_status, p_occurred_at)
  on conflict (event_id, user_id) do update
    set role = excluded.role,
        status = excluded.status,
        updated_at = excluded.updated_at
  returning * into v_rsvp;

  return to_jsonb(v_rsvp);
end;
$$;

create or replace function public.cancel_rsvp(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_rsvp public.event_rsvps%rowtype;
  v_promoted public.event_rsvps%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_rsvp
  from public.event_rsvps
  where event_id = p_event_id and user_id = v_user_id
  for update;

  if not found or v_rsvp.status not in ('going', 'waitlisted') then
    raise exception 'rsvp_not_cancellable';
  end if;

  update public.event_rsvps
  set status = 'cancelled', updated_at = now()
  where id = v_rsvp.id
  returning * into v_rsvp;

  select * into v_promoted
  from public.event_rsvps
  where event_id = p_event_id and status = 'waitlisted'
  order by created_at
  limit 1
  for update;

  if found then
    update public.event_rsvps
    set status = 'going', updated_at = now()
    where id = v_promoted.id;
  end if;

  return to_jsonb(v_rsvp);
end;
$$;

create or replace function public.check_in(
  p_rsvp_id uuid,
  p_method text default 'manual',
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_rsvp public.event_rsvps%rowtype;
  v_event public.events%rowtype;
  v_category public.event_categories%rowtype;
  v_attendee_name text;
  v_points jsonb;
begin
  if p_method not in ('qr', 'manual') then
    raise exception 'invalid_check_in_method';
  end if;

  select * into v_rsvp from public.event_rsvps where id = p_rsvp_id for update;
  if not found then
    raise exception 'rsvp_not_found';
  end if;

  select * into v_event from public.events where id = v_rsvp.event_id;
  if not found or v_event.hidden or v_event.status not in ('published', 'completed') then
    raise exception 'event_not_available';
  end if;

  if v_caller is not null and not public.is_event_staff(v_event.id) then
    raise exception 'not_event_staff';
  end if;

  if v_caller is not null and v_caller = v_rsvp.user_id then
    raise exception 'cannot_self_check_in';
  end if;

  if p_occurred_at is not null and v_caller is not null then
    p_occurred_at := now();
  end if;

  if p_occurred_at < v_event.starts_at - interval '30 minutes'
     or p_occurred_at > v_event.ends_at + interval '60 minutes' then
    raise exception 'outside_check_in_window';
  end if;

  if v_rsvp.status = 'checked_in' then
    select display_name into v_attendee_name from public.profiles where id = v_rsvp.user_id;
    return jsonb_build_object(
      'status', 'already_checked_in',
      'display_name', coalesce(v_attendee_name, 'Neighbour'),
      'checked_in_at', v_rsvp.checked_in_at
    );
  end if;

  if v_rsvp.status <> 'going' then
    raise exception 'rsvp_not_eligible';
  end if;

  update public.event_rsvps
  set status = 'checked_in',
      checked_in_at = p_occurred_at,
      checked_in_by = v_caller,
      check_in_method = p_method,
      updated_at = p_occurred_at
  where id = v_rsvp.id
  returning * into v_rsvp;

  select c.* into v_category
  from public.event_categories c
  where c.id = v_event.category_id;

  select display_name into v_attendee_name from public.profiles where id = v_rsvp.user_id;

  v_points := public.award_points(
    v_rsvp.user_id,
    v_event.township_id,
    'event_attendance',
    'event_rsvp',
    v_rsvp.id,
    v_category.slug,
    jsonb_build_object(
      'event_id', v_event.id,
      'counts_as_sustainability', v_category.counts_as_sustainability
    ),
    p_occurred_at
  );

  return jsonb_build_object(
    'status', 'checked_in',
    'display_name', coalesce(v_attendee_name, 'Neighbour'),
    'checked_in_at', v_rsvp.checked_in_at,
    'points', v_points
  );
end;
$$;

create or replace function public.complete_event(
  p_event_id uuid,
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_event public.events%rowtype;
  v_verified integer;
  v_points jsonb;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found then
    raise exception 'event_not_found';
  end if;

  if v_caller is not null and not public.is_event_staff(v_event.id) then
    raise exception 'not_event_staff';
  end if;

  if p_occurred_at is not null and v_caller is not null then
    p_occurred_at := now();
  end if;

  if p_occurred_at <= v_event.ends_at then
    raise exception 'event_not_finished';
  end if;

  update public.event_rsvps
  set status = 'no_show', updated_at = p_occurred_at
  where event_id = p_event_id and status = 'going';

  select count(*) into v_verified
  from public.event_rsvps
  where event_id = p_event_id and status = 'checked_in' and user_id <> v_event.host_id;

  update public.events
  set status = 'completed', updated_at = p_occurred_at
  where id = p_event_id;

  if v_verified >= 3 then
    v_points := public.award_points(
      v_event.host_id,
      v_event.township_id,
      'event_hosted',
      'event',
      v_event.id,
      null,
      jsonb_build_object('verified_attendees', v_verified),
      p_occurred_at
    );
  end if;

  return jsonb_build_object(
    'status', 'completed',
    'verified_attendees', v_verified,
    'points', v_points
  );
end;
$$;

create or replace function public.verify_volunteer_hours(
  p_rsvp_id uuid,
  p_hours numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_rsvp public.event_rsvps%rowtype;
  v_event public.events%rowtype;
  v_points jsonb;
begin
  if p_hours is null or p_hours <= 0 or p_hours > 4 then
    raise exception 'invalid_volunteer_hours';
  end if;

  select * into v_rsvp from public.event_rsvps where id = p_rsvp_id for update;
  if not found or v_rsvp.role <> 'volunteer' or v_rsvp.status <> 'checked_in' then
    raise exception 'volunteer_rsvp_not_available';
  end if;

  select * into v_event from public.events where id = v_rsvp.event_id;
  if v_caller is not null and not public.is_event_staff(v_event.id) then
    raise exception 'not_event_staff';
  end if;

  update public.event_rsvps
  set volunteer_hours_verified = p_hours, updated_at = now()
  where id = v_rsvp.id
  returning * into v_rsvp;

  v_points := public.award_points(
    v_rsvp.user_id,
    v_event.township_id,
    'event_volunteer',
    'event_rsvp',
    v_rsvp.id,
    null,
    jsonb_build_object('hours', p_hours),
    now()
  );

  return jsonb_build_object('rsvp_id', v_rsvp.id, 'hours', p_hours, 'points', v_points);
end;
$$;

-- ---------------------------------------------------------------------------
-- Borrowing
-- ---------------------------------------------------------------------------

create or replace function public.create_booking(
  p_item_id uuid,
  p_start_date date,
  p_end_date date,
  p_handover_method text default 'Meet in a shared space',
  p_borrower_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := coalesce(auth.uid(), p_borrower_id);
  v_item public.items%rowtype;
  v_booking_id uuid;
  v_conflict_count integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_item from public.items where id = p_item_id for update;
  if not found or v_item.hidden or v_item.status <> 'active' then
    raise exception 'item_not_available';
  end if;

  if not public.is_active_member(v_item.township_id) then
    raise exception 'not_active_member';
  end if;

  if v_item.owner_id = v_user_id then
    raise exception 'cannot_book_own_item';
  end if;

  if p_start_date > p_end_date then
    raise exception 'invalid_dates';
  end if;

  if (p_end_date - p_start_date + 1) > v_item.max_loan_days then
    raise exception 'loan_too_long';
  end if;

  select count(*)
  into v_conflict_count
  from public.bookings
  where item_id = p_item_id
    and status in ('approved', 'handed_over')
    and daterange(start_date, end_date, '[]') && daterange(p_start_date, p_end_date, '[]');

  if v_conflict_count > 0 then
    raise exception 'dates_unavailable';
  end if;

  insert into public.bookings (
    item_id,
    township_id,
    borrower_id,
    lender_id,
    start_date,
    end_date,
    handover_method,
    status
  )
  values (
    p_item_id,
    v_item.township_id,
    v_user_id,
    v_item.owner_id,
    p_start_date,
    p_end_date,
    coalesce(nullif(trim(p_handover_method), ''), 'Meet in a shared space'),
    'requested'
  )
  returning id into v_booking_id;

  return jsonb_build_object('booking_id', v_booking_id, 'status', 'requested');
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
  v_item_id uuid;
begin
  if v_user_id is null or not public.is_active_member(v_township_id) then
    raise exception 'not_active_member';
  end if;

  if not exists (select 1 from public.item_categories where id = v_category_id) then
    raise exception 'invalid_category';
  end if;

  insert into public.items (
    township_id,
    owner_id,
    title,
    description,
    category_id,
    condition,
    photo_paths,
    estimated_new_price_rm,
    deposit_rm,
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
    coalesce(p_payload->>'condition', 'good'),
    coalesce(
      array(select jsonb_array_elements_text(p_payload->'photo_paths')),
      array['/demo/item-placeholder.svg']
    ),
    nullif(p_payload->>'estimated_new_price_rm', '')::numeric,
    coalesce(nullif(p_payload->>'deposit_rm', '')::numeric, 0),
    coalesce(nullif(p_payload->>'max_loan_days', '')::integer, 3),
    coalesce(
      array(select jsonb_array_elements_text(p_payload->'handover_options')),
      array['Meet in a shared space']
    ),
    'active',
    false
  )
  returning id into v_item_id;

  return jsonb_build_object('item_id', v_item_id, 'status', 'active');
end;
$$;

create or replace function public.update_profile(
  p_display_name text,
  p_interests text[] default '{}',
  p_comfort_prefs jsonb default '{}'::jsonb,
  p_recognition_opt_in boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  insert into public.profiles (id, display_name, interests, comfort_prefs, recognition_opt_in, updated_at)
  values (v_user_id, nullif(trim(p_display_name), ''), coalesce(p_interests, '{}'), coalesce(p_comfort_prefs, '{}'::jsonb), coalesce(p_recognition_opt_in, false), now())
  on conflict (id) do update
    set display_name = coalesce(excluded.display_name, public.profiles.display_name),
        interests = excluded.interests,
        comfort_prefs = excluded.comfort_prefs,
        recognition_opt_in = excluded.recognition_opt_in,
        updated_at = now()
  returning * into v_profile;

  return to_jsonb(v_profile);
end;
$$;

create or replace function public.transition_booking(
  p_booking_id uuid,
  p_action text,
  p_payload jsonb default '{}'::jsonb,
  p_actor_id uuid default null,
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth uuid := auth.uid();
  v_actor uuid := case when v_auth is not null then v_auth else p_actor_id end;
  v_booking public.bookings%rowtype;
  v_item public.items%rowtype;
  v_category public.item_categories%rowtype;
  v_status text;
  v_lender_points jsonb;
  v_borrower_points jsonb;
begin
  if v_actor is null then
    raise exception 'authentication_required';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_item from public.items where id = v_booking.item_id;
  select * into v_category from public.item_categories where id = v_item.category_id;

  if v_auth is not null then
    p_occurred_at := now();
  end if;

  case p_action
    when 'approve' then
      if v_booking.status <> 'requested' or (v_auth is not null and v_actor <> v_booking.lender_id) then
        raise exception 'transition_not_allowed';
      end if;
      v_status := 'approved';
    when 'decline' then
      if v_booking.status <> 'requested' or (v_auth is not null and v_actor <> v_booking.lender_id) then
        raise exception 'transition_not_allowed';
      end if;
      v_status := 'declined';
    when 'cancel' then
      if v_booking.status not in ('requested', 'approved') then
        raise exception 'transition_not_allowed';
      end if;
      if v_auth is not null and not (v_actor = v_booking.borrower_id or (v_actor = v_booking.lender_id and v_booking.status = 'approved')) then
        raise exception 'transition_not_allowed';
      end if;
      v_status := 'cancelled';
    when 'confirm_handover' then
      if v_booking.status <> 'approved' or (v_auth is not null and v_actor not in (v_booking.borrower_id, v_booking.lender_id)) then
        raise exception 'transition_not_allowed';
      end if;
      if v_actor = v_booking.borrower_id then
        update public.bookings
        set borrower_handover_confirmed_at = p_occurred_at,
            handover_note = coalesce(nullif(trim(p_payload->>'handover_note'), ''), handover_note)
        where id = v_booking.id;
      else
        update public.bookings
        set lender_handover_confirmed_at = p_occurred_at,
            handover_note = coalesce(nullif(trim(p_payload->>'handover_note'), ''), handover_note)
        where id = v_booking.id;
      end if;
      select * into v_booking from public.bookings where id = p_booking_id;
      if v_booking.borrower_handover_confirmed_at is not null and v_booking.lender_handover_confirmed_at is not null then
        v_status := 'handed_over';
      else
        v_status := v_booking.status;
      end if;
    when 'mark_returned' then
      if v_booking.status <> 'handed_over' or (v_auth is not null and v_actor <> v_booking.borrower_id) then
        raise exception 'transition_not_allowed';
      end if;
      update public.bookings
      set borrower_return_marked_at = p_occurred_at,
          borrower_would_have_bought = coalesce(nullif(p_payload->>'would_have_bought', ''), 'unsure'),
          return_note = coalesce(nullif(trim(p_payload->>'return_note'), ''), return_note)
      where id = v_booking.id;
      v_status := 'handed_over';
    when 'confirm_return' then
      if v_booking.status <> 'handed_over'
         or v_booking.borrower_return_marked_at is null
         or (v_auth is not null and v_actor <> v_booking.lender_id) then
        raise exception 'transition_not_allowed';
      end if;
      update public.bookings
      set lender_return_confirmed_at = p_occurred_at,
          status = 'completed',
          updated_at = p_occurred_at
      where id = v_booking.id;
      v_status := 'completed';
      v_lender_points := public.award_points(
        v_booking.lender_id,
        v_booking.township_id,
        'item_lent_completed',
        'booking',
        v_booking.id,
        v_category.slug,
        jsonb_build_object('item_id', v_item.id, 'would_have_bought', v_booking.borrower_would_have_bought),
        p_occurred_at
      );
      if v_booking.end_date >= (p_occurred_at at time zone 'Asia/Kuala_Lumpur')::date then
        v_borrower_points := public.award_points(
          v_booking.borrower_id,
          v_booking.township_id,
          'item_returned_on_time',
          'booking',
          v_booking.id,
          v_category.slug,
          jsonb_build_object('item_id', v_item.id),
          p_occurred_at
        );
      end if;
    when 'open_dispute' then
      if v_booking.status not in ('handed_over', 'completed')
         or (v_auth is not null and v_actor not in (v_booking.borrower_id, v_booking.lender_id))
         or p_occurred_at > v_booking.end_date + interval '7 days' then
        raise exception 'transition_not_allowed';
      end if;
      v_status := 'disputed';
    when 'resolve_dispute' then
      if v_booking.status <> 'disputed'
         or (v_auth is not null and not public.is_township_admin(v_booking.township_id)) then
        raise exception 'transition_not_allowed';
      end if;
      if coalesce(p_payload->>'resolution', 'closed') not in ('completed', 'closed') then
        raise exception 'invalid_resolution';
      end if;
      v_status := p_payload->>'resolution';
      if v_status = 'completed' then
        v_lender_points := public.award_points(
          v_booking.lender_id,
          v_booking.township_id,
          'item_lent_completed',
          'booking',
          v_booking.id,
          v_category.slug,
          jsonb_build_object('item_id', v_item.id, 'dispute_resolution', 'completed'),
          p_occurred_at
        );
      end if;
    else
      raise exception 'invalid_action';
  end case;

  update public.bookings
  set status = v_status,
      updated_at = p_occurred_at
  where id = v_booking.id;

  select * into v_booking from public.bookings where id = p_booking_id;
  return jsonb_build_object(
    'booking_id', v_booking.id,
    'status', v_booking.status,
    'lender_points', v_lender_points,
    'borrower_points', v_borrower_points
  );
end;
$$;

create or replace function public.expire_stale_booking_requests(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.bookings
    set status = 'cancelled', updated_at = p_now
    where status = 'requested'
      and created_at < p_now - interval '72 hours'
    returning id, borrower_id, lender_id
  ),
  notices as (
    insert into public.notifications (user_id, type, title, body, link, dedupe_key, created_at)
    select user_id, 'booking_expired', 'Borrow request expired',
           'A borrow request expired after 72 hours without approval.',
           '/borrow/mine', 'booking-expired:' || id::text, p_now
    from expired
    cross join lateral (values (expired.borrower_id), (expired.lender_id)) as recipients(user_id)
    on conflict (user_id, dedupe_key) do nothing
  )
  select count(*) into v_count from expired;

  return v_count;
end;
$$;

create or replace function public.township_pulse(
  p_township_id uuid,
  p_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_township public.townships%rowtype;
  v_start timestamptz;
  v_active integer;
  v_metrics jsonb;
  v_weekly jsonb;
  v_attendance jsonb;
  v_mix jsonb;
  v_borrowing jsonb;
begin
  select * into v_township from public.townships where id = p_township_id;
  if not found or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;

  v_start := now() - make_interval(days => greatest(coalesce(p_days, 30), 1));

  with active_actions as (
    select distinct user_id
    from public.points_ledger
    where township_id = p_township_id
      and created_at >= v_start
      and action_type in ('event_attendance', 'item_lent_completed', 'item_returned_on_time', 'help_completed', 'redemption', 'event_hosted')
    union
    select distinct user_id from public.event_rsvps r
    join public.events e on e.id = r.event_id
    where e.township_id = p_township_id and r.status = 'checked_in' and r.checked_in_at >= v_start
    union
    select distinct borrower_id from public.bookings
    where township_id = p_township_id and status in ('approved', 'handed_over', 'completed') and updated_at >= v_start
    union
    select distinct lender_id from public.bookings
    where township_id = p_township_id and status in ('approved', 'handed_over', 'completed') and updated_at >= v_start
  )
  select count(*) into v_active from active_actions;

  select jsonb_build_object(
    'active_residents', v_active,
    'repeat_event_attendance', coalesce((
      select count(*) from (
        select r.user_id
        from public.event_rsvps r
        join public.events e on e.id = r.event_id
        where e.township_id = p_township_id
          and r.status = 'checked_in'
          and r.checked_in_at >= now() - interval '90 days'
        group by r.user_id
        having count(distinct r.event_id) >= 2
      ) repeat_users
    ), 0),
    'verified_volunteer_hours', coalesce((
      select sum(r.volunteer_hours_verified)
      from public.event_rsvps r
      join public.events e on e.id = r.event_id
      where e.township_id = p_township_id and r.checked_in_at >= v_start
    ), 0),
    'completed_borrowing_transactions', coalesce((
      select count(*) from public.bookings
      where township_id = p_township_id and status = 'completed' and updated_at >= v_start
    ), 0),
    'items_reused', coalesce((
      select count(distinct item_id) from public.bookings
      where township_id = p_township_id and status = 'completed' and updated_at >= v_start
    ), 0),
    'reuse_count', coalesce((
      select count(*) from public.bookings
      where township_id = p_township_id and status = 'completed' and updated_at >= v_start
    ), 0),
    'estimated_purchases_avoided_rm', coalesce((
      select sum(coalesce(i.estimated_new_price_rm, c.typical_new_price_rm, 0))
      from public.bookings b
      join public.items i on i.id = b.item_id
      join public.item_categories c on c.id = i.category_id
      where b.township_id = p_township_id
        and b.status = 'completed'
        and b.updated_at >= v_start
        and b.borrower_would_have_bought = 'yes'
    ), 0),
    'points_issued', coalesce((
      select sum(delta) from public.points_ledger
      where township_id = p_township_id and delta > 0 and created_at >= v_start
    ), 0),
    'points_redeemed', coalesce((
      select abs(sum(delta)) from public.points_ledger
      where township_id = p_township_id and delta < 0 and created_at >= v_start
    ), 0),
    'cost_per_active_resident_rm', 0
  ) into v_metrics;

  select coalesce(jsonb_agg(value order by value), '[]'::jsonb)
  into v_weekly
  from (
    select jsonb_build_object(
      'week', to_char(w.start_at, 'YYYY-MM-DD'),
      'active_residents', (
        select count(distinct user_id)
        from public.points_ledger l
        where l.township_id = p_township_id
          and l.created_at >= w.start_at
          and l.created_at < w.start_at + interval '7 days'
      )
    ) as value
    from generate_series(
      date_trunc('week', v_start at time zone v_township.timezone) at time zone v_township.timezone,
      date_trunc('week', now() at time zone v_township.timezone) at time zone v_township.timezone,
      interval '7 days'
    ) w(start_at)
  ) weeks;

  select coalesce(jsonb_agg(value), '[]'::jsonb)
  into v_attendance
  from (
    select jsonb_build_object(
      'category', c.name,
      'count', count(*)
    ) as value
    from public.event_rsvps r
    join public.events e on e.id = r.event_id
    join public.event_categories c on c.id = e.category_id
    where e.township_id = p_township_id
      and r.status = 'checked_in'
      and r.checked_in_at >= v_start
    group by c.name
    having count(distinct r.user_id) >= 5
    order by count(*) desc
  ) attendance;

  select coalesce(jsonb_agg(value), '[]'::jsonb)
  into v_mix
  from (
    select jsonb_build_object('action_type', action_type, 'count', count(*)) as value
    from public.points_ledger
    where township_id = p_township_id and created_at >= v_start
    group by action_type
    having count(distinct user_id) >= 5
    order by count(*) desc
  ) mix;

  select coalesce(jsonb_agg(value order by value->>'week'), '[]'::jsonb)
  into v_borrowing
  from (
    select jsonb_build_object(
      'week', to_char(date_trunc('week', b.updated_at at time zone v_township.timezone) at time zone v_township.timezone, 'YYYY-MM-DD'),
      'completed', count(*)
    ) as value
    from public.bookings b
    where b.township_id = p_township_id
      and b.status = 'completed'
      and b.updated_at >= v_start
    group by date_trunc('week', b.updated_at at time zone v_township.timezone)
  ) borrowing;

  return jsonb_build_object(
    'township_id', p_township_id,
    'period_days', greatest(coalesce(p_days, 30), 1),
    'metrics', v_metrics,
    'weekly_active_residents', v_weekly,
    'attendance_by_category', v_attendance,
    'activity_mix', v_mix,
    'borrowing_trend', v_borrowing,
    'suppression_rule', 'Breakdowns with fewer than 5 residents are suppressed.'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.townships enable row level security;
alter table public.neighbourhoods enable row level security;
alter table public.facilities enable row level security;
alter table public.profiles enable row level security;
alter table public.township_members enable row level security;
alter table public.audit_log enable row level security;
alter table public.event_categories enable row level security;
alter table public.events enable row level security;
alter table public.event_staff enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.item_categories enable row level security;
alter table public.items enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_messages enable row level security;
alter table public.reward_rules enable row level security;
alter table public.points_ledger enable row level security;
alter table public.levels enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.notifications enable row level security;

create policy townships_select_member on public.townships
  for select to authenticated
  using (public.is_active_member(id) or public.is_township_admin(id));

create policy neighbourhoods_select_member on public.neighbourhoods
  for select to authenticated
  using (public.is_active_member(township_id));

create policy facilities_select_member on public.facilities
  for select to authenticated
  using (public.is_active_member(township_id));

create policy profiles_select_own_or_comember on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.township_members mine
      join public.township_members theirs
        on theirs.township_id = mine.township_id
       and theirs.status = 'active'
      where mine.user_id = auth.uid()
        and mine.status = 'active'
        and theirs.user_id = profiles.id
    )
  );

create policy township_members_select_own on public.township_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_township_admin(township_id));

create policy audit_log_select_admin on public.audit_log
  for select to authenticated
  using (public.is_township_admin(township_id));

create policy event_categories_select_authenticated on public.event_categories
  for select to authenticated
  using (true);

create policy item_categories_select_authenticated on public.item_categories
  for select to authenticated
  using (true);

create policy levels_select_authenticated on public.levels
  for select to authenticated
  using (true);

create policy badges_select_authenticated on public.badges
  for select to authenticated
  using (true);

create policy events_select_visible on public.events
  for select to authenticated
  using (
    (
      status = 'published'
      and hidden = false
      and public.is_active_member(township_id)
    )
    or host_id = auth.uid()
    or public.is_township_admin(township_id)
  );

create policy event_staff_select_event on public.event_staff
  for select to authenticated
  using (public.is_event_staff(event_id));

create policy event_rsvps_select_participant on public.event_rsvps
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_event_staff(event_id)
    or exists (
      select 1 from public.events e
      where e.id = event_id and public.is_township_admin(e.township_id)
    )
  );

create policy items_select_visible on public.items
  for select to authenticated
  using (
    (
      status = 'active'
      and hidden = false
      and public.is_active_member(township_id)
    )
    or owner_id = auth.uid()
    or public.is_township_admin(township_id)
  );

create policy bookings_select_participant on public.bookings
  for select to authenticated
  using (public.is_booking_participant(id));

create policy booking_messages_select_participant on public.booking_messages
  for select to authenticated
  using (public.is_booking_participant(booking_id));

create policy reward_rules_select_member on public.reward_rules
  for select to authenticated
  using (township_id is null or public.is_active_member(township_id));

create policy points_ledger_select_own on public.points_ledger
  for select to authenticated
  using (user_id = auth.uid());

create policy user_badges_select_own on public.user_badges
  for select to authenticated
  using (user_id = auth.uid());

create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

insert into public.event_categories (slug, name, counts_as_sustainability, icon)
values
  ('gotong-royong', 'Gotong-royong clean-up', true, 'sparkles'),
  ('sports', 'Sports and fitness', false, 'activity'),
  ('workshop', 'Workshop', false, 'wrench'),
  ('market', 'Neighbourhood market', false, 'store'),
  ('gardening', 'Gardening', true, 'sprout'),
  ('repair', 'Repair and reuse', true, 'hammer'),
  ('kids', 'Kids and family', false, 'users'),
  ('seniors', 'Seniors and wellbeing', false, 'heart-handshake'),
  ('social', 'Social', false, 'coffee')
on conflict (slug) do nothing;

insert into public.item_categories (slug, name, typical_new_price_rm)
values
  ('home-tools', 'Home tools', 250.00),
  ('cleaning', 'Cleaning equipment', 400.00),
  ('events', 'Event equipment', 300.00),
  ('sports', 'Sports equipment', 180.00),
  ('kids', 'Kids and family', 150.00),
  ('kitchen', 'Kitchen and hosting', 200.00)
on conflict (slug) do nothing;

insert into public.levels (level, name, min_lifetime_points)
values
  (1, 'Newcomer', 0),
  (2, 'Neighbour', 200),
  (3, 'Contributor', 600),
  (4, 'Builder', 1500),
  (5, 'Champion', 3500)
on conflict (level) do nothing;

insert into public.badges (slug, name, description, icon, criteria)
values
  (
    'eco-warrior',
    'Eco Warrior',
    'Five verified sustainability activities.',
    'leaf',
    '{"type":"count","action_types":["event_attendance","item_lent_completed"],"metadata":{"counts_as_sustainability":true},"threshold":5}'::jsonb
  ),
  (
    'good-neighbour',
    'Good Neighbour',
    'Ten completed lends or helps.',
    'hand-heart',
    '{"type":"count","action_types":["item_lent_completed","help_completed"],"threshold":10}'::jsonb
  ),
  (
    'community-builder',
    'Community Builder',
    'Host three successful events.',
    'users-round',
    '{"type":"count","action_types":["event_hosted"],"threshold":3}'::jsonb
  ),
  (
    'community-champion',
    'Community Champion',
    'Sustained participation across activities.',
    'award',
    '{"type":"sustained","min_types":3,"min_active_weeks":6,"window_weeks":12}'::jsonb
  )
on conflict (slug) do nothing;

insert into public.reward_rules (township_id, action_type, category_slug, points, daily_cap, weekly_cap)
values
  (null, 'event_attendance', null, 50, null, null),
  (null, 'event_attendance', 'gotong-royong', 100, null, null),
  (null, 'item_lent_completed', null, 40, null, null),
  (null, 'event_hosted', null, 100, null, null),
  (null, 'item_returned_on_time', null, 10, null, null),
  (null, 'help_completed', null, 30, 2, null),
  (null, 'event_volunteer', null, 30, null, 120)
on conflict (township_id, action_type, category_slug) do nothing;

-- ---------------------------------------------------------------------------
-- Points and badges
-- ---------------------------------------------------------------------------

create or replace function public.evaluate_badges(p_user_id uuid, p_township_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_badge record;
  v_count integer;
  v_distinct_types integer;
  v_distinct_weeks integer;
  v_window_start timestamptz;
  v_awarded integer := 0;
begin
  for v_badge in select * from public.badges loop
    if v_badge.criteria->>'type' = 'count' then
      select count(*)
      into v_count
      from public.points_ledger l
      where l.user_id = p_user_id
        and l.township_id = p_township_id
        and l.action_type = any (select jsonb_array_elements_text(v_badge.criteria->'action_types'))
        and (
          v_badge.criteria->'metadata' is null
          or l.metadata->>'counts_as_sustainability'
             = coalesce(v_badge.criteria->'metadata'->>'counts_as_sustainability', 'false')
        );

      if v_count >= coalesce((v_badge.criteria->>'threshold')::integer, 1) then
        insert into public.user_badges (user_id, badge_id, township_id)
        select p_user_id, v_badge.id, p_township_id
        where not exists (
          select 1 from public.user_badges ub
          where ub.user_id = p_user_id and ub.badge_id = v_badge.id
        );

        if found then
          v_awarded := v_awarded + 1;
        end if;
      end if;
    elsif v_badge.criteria->>'type' = 'sustained' then
      v_window_start := now() - make_interval(weeks => coalesce((v_badge.criteria->>'window_weeks')::integer, 12));

      select count(distinct l.action_type), count(distinct date_trunc('week', l.created_at))
      into v_distinct_types, v_distinct_weeks
      from public.points_ledger l
      where l.user_id = p_user_id
        and l.township_id = p_township_id
        and l.created_at >= v_window_start;

      if v_distinct_types >= coalesce((v_badge.criteria->>'min_types')::integer, 3)
         and v_distinct_weeks >= coalesce((v_badge.criteria->>'min_active_weeks')::integer, 6) then
        insert into public.user_badges (user_id, badge_id, township_id)
        select p_user_id, v_badge.id, p_township_id
        where not exists (
          select 1 from public.user_badges ub
          where ub.user_id = p_user_id and ub.badge_id = v_badge.id
        );

        if found then
          v_awarded := v_awarded + 1;
        end if;
      end if;
    end if;
  end loop;

  return v_awarded;
end;
$$;

create or replace function public.award_points(
  p_user_id uuid,
  p_township_id uuid,
  p_action_type text,
  p_source_type text,
  p_source_id uuid,
  p_category_slug text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_township public.townships%rowtype;
  v_rule public.reward_rules%rowtype;
  v_existing public.points_ledger%rowtype;
  v_delta integer;
  v_day_start timestamptz;
  v_week_start timestamptz;
  v_period_total integer;
begin
  select * into v_township from public.townships where id = p_township_id;
  if not found or v_township.rewards_enabled = false then
    return null;
  end if;

  select *
  into v_rule
  from public.reward_rules
  where active = true
    and action_type = p_action_type
    and (township_id is null or township_id = p_township_id)
    and (category_slug is null or category_slug = p_category_slug)
  order by (township_id is not null) desc, (category_slug is not null) desc
  limit 1;

  if not found then
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text || ':' || p_action_type));
  v_delta := v_rule.points;
  v_day_start := date_trunc('day', p_occurred_at at time zone v_township.timezone) at time zone v_township.timezone;
  v_week_start := date_trunc('week', p_occurred_at at time zone v_township.timezone) at time zone v_township.timezone;

  if v_rule.daily_cap is not null then
    select count(*)
    into v_period_total
    from public.points_ledger
    where user_id = p_user_id
      and township_id = p_township_id
      and action_type = p_action_type
      and created_at >= v_day_start;
    if v_period_total >= v_rule.daily_cap then
      return null;
    end if;
  end if;

  if v_rule.weekly_cap is not null then
    select count(*)
    into v_period_total
    from public.points_ledger
    where user_id = p_user_id
      and township_id = p_township_id
      and action_type = p_action_type
      and created_at >= v_week_start;
    if v_period_total >= v_rule.weekly_cap then
      return null;
    end if;
  end if;

  if v_delta <= 0 then
    return null;
  end if;

  insert into public.points_ledger (
    township_id,
    user_id,
    delta,
    action_type,
    source_type,
    source_id,
    rule_id,
    metadata,
    created_at
  )
  values (
    p_township_id,
    p_user_id,
    v_delta,
    p_action_type,
    p_source_type,
    p_source_id,
    v_rule.id,
    p_metadata,
    p_occurred_at
  )
  on conflict (user_id, action_type, source_type, source_id) do nothing
  returning * into v_existing;

  if not found then
    return null;
  end if;

  perform public.evaluate_badges(p_user_id, p_township_id);
  perform public.update_challenge_progress(
    p_user_id,
    p_township_id,
    p_action_type,
    p_category_slug,
    p_occurred_at
  );

  insert into public.notifications (user_id, type, title, body, link, dedupe_key, created_at)
  values (
    p_user_id,
    'points_awarded',
    'BetterPoints earned',
    format('%s BP for %s.', v_delta, replace(p_action_type, '_', ' ')),
    '/rewards',
    'points:' || v_existing.id::text,
    p_occurred_at
  )
  on conflict (user_id, dedupe_key) do nothing;

  return to_jsonb(v_existing);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
grant select on public.townships, public.neighbourhoods, public.facilities,
  public.profiles, public.township_members, public.event_categories,
  public.events, public.event_staff, public.event_rsvps,
  public.item_categories, public.items, public.bookings,
  public.booking_messages, public.reward_rules, public.points_ledger,
  public.levels, public.badges, public.user_badges,
  public.notifications, public.audit_log
to authenticated;
grant select on public.v_member_points to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated, service_role;
grant execute on function public.health_check() to anon, authenticated;
grant execute on function public.is_active_member(uuid), public.has_role(uuid, text[]), public.is_township_admin(uuid), public.is_event_staff(uuid), public.can_read_event(uuid), public.is_booking_participant(uuid) to authenticated;
grant execute on function public.get_join_details(text), public.join_township(text, uuid, text), public.create_event(jsonb), public.rsvp_event(uuid, text, timestamptz), public.cancel_rsvp(uuid), public.check_in(uuid, text, timestamptz), public.complete_event(uuid, timestamptz), public.verify_volunteer_hours(uuid, numeric), public.create_item(jsonb), public.create_booking(uuid, date, date, text, uuid), public.transition_booking(uuid, text, jsonb, uuid, timestamptz), public.update_profile(text, text[], jsonb, boolean), public.township_pulse(uuid, integer) to authenticated;
grant execute on function public.award_points(uuid, uuid, text, text, uuid, text, jsonb, timestamptz), public.evaluate_badges(uuid, uuid), public.check_in(uuid, text, timestamptz), public.complete_event(uuid, timestamptz), public.create_booking(uuid, date, date, text, uuid), public.transition_booking(uuid, text, jsonb, uuid, timestamptz), public.expire_stale_booking_requests(timestamptz) to service_role;
