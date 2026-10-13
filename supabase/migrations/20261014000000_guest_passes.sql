-- BorrowLah Guest Access QR
-- Adds township-scoped guest passes, gates, guard operations, walk-ins,
-- offline-safe logs, aggregate-only admin metrics and retention.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------

alter table public.township_members drop constraint if exists township_members_role_check;
alter table public.township_members
  add constraint township_members_role_check
  check (role in ('resident', 'organiser', 'township_admin', 'guard'));

create or replace function public.is_township_guard(p_township_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(p_township_id, array['guard']);
$$;

create or replace function public.is_guest_pass_assigner(p_township_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(p_township_id, array['organiser', 'township_admin']);
$$;

create or replace function public.is_guest_gate_operator(p_township_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_township_guard(p_township_id);
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.gates (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (township_id, name)
);

create index if not exists gates_township_idx
  on public.gates (township_id, active, name);

create table if not exists public.visitor_passes (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  township_id uuid not null references public.townships(id) on delete cascade,
  visitor_name text check (visitor_name is null or char_length(visitor_name) between 1 and 100),
  visitor_phone text check (visitor_phone is null or char_length(visitor_phone) <= 40),
  vehicle_plate text check (vehicle_plate is null or char_length(vehicle_plate) <= 24),
  purpose text check (purpose is null or char_length(purpose) <= 80),
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  max_entries integer not null default 1 check (max_entries > 0 and max_entries <= 100),
  entries_used integer not null default 0 check (entries_used >= 0),
  status text not null default 'active'
    check (status in ('active', 'revoked', 'expired', 'completed')),
  source text not null default 'resident' check (source in ('resident', 'walk_in')),
  token_hash bytea check (token_hash is null or octet_length(token_hash) = 32),
  short_code_hash bytea check (short_code_hash is null or octet_length(short_code_hash) = 32),
  mute_checkout_notifications boolean not null default false,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  ended_at timestamptz,
  constraint visitor_pass_dates_valid check (valid_until > valid_from),
  constraint visitor_pass_entries_valid check (entries_used <= max_entries)
);

create unique index if not exists visitor_passes_token_hash_uidx
  on public.visitor_passes (token_hash)
  where token_hash is not null;
create unique index if not exists visitor_passes_short_code_hash_uidx
  on public.visitor_passes (short_code_hash)
  where short_code_hash is not null;
create index if not exists visitor_passes_host_idx
  on public.visitor_passes (host_id, created_at desc);
create index if not exists visitor_passes_township_validity_idx
  on public.visitor_passes (township_id, valid_from, valid_until);
create index if not exists visitor_passes_status_idx
  on public.visitor_passes (township_id, status, valid_until);

create table if not exists public.walk_in_requests (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  gate_id uuid not null references public.gates(id) on delete restrict,
  guard_id uuid not null references auth.users(id) on delete cascade,
  host_member_id uuid not null references public.township_members(id) on delete cascade,
  visitor_name text not null check (char_length(visitor_name) between 1 and 100),
  vehicle_plate text check (vehicle_plate is null or char_length(vehicle_plate) <= 24),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied', 'timed_out', 'manual_follow_up')),
  client_request_id uuid not null unique default gen_random_uuid(),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  responded_by uuid references auth.users(id) on delete set null,
  outcome_note text check (outcome_note is null or char_length(outcome_note) <= 300),
  entry_log_id uuid,
  exit_log_id uuid
);

create index if not exists walk_in_requests_township_idx
  on public.walk_in_requests (township_id, status, requested_at desc);
create index if not exists walk_in_requests_host_idx
  on public.walk_in_requests (host_member_id, status, requested_at desc);

create table if not exists public.visitor_logs (
  id uuid primary key default gen_random_uuid(),
  pass_id uuid references public.visitor_passes(id) on delete cascade,
  walk_in_request_id uuid references public.walk_in_requests(id) on delete cascade,
  township_id uuid not null references public.townships(id) on delete cascade,
  gate_id uuid not null references public.gates(id) on delete restrict,
  guard_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  scanned_at timestamptz not null,
  synced_at timestamptz not null default now(),
  id_sighted boolean not null default false,
  note text check (note is null or char_length(note) <= 300),
  client_event_id uuid not null unique default gen_random_uuid(),
  sync_status text not null default 'applied'
    check (sync_status in ('pending', 'applied', 'needs_review', 'rejected')),
  applied boolean not null default true,
  review_reason text check (review_reason is null or char_length(review_reason) <= 120),
  created_at timestamptz not null default now(),
  constraint visitor_logs_subject_one check (
    (pass_id is not null)::integer + (walk_in_request_id is not null)::integer = 1
  ),
  constraint visitor_logs_scan_time_sane check (
    scanned_at <= now() + interval '2 minutes'
    and scanned_at >= now() - interval '30 days'
  )
);

create index if not exists visitor_logs_pass_time_idx
  on public.visitor_logs (pass_id, scanned_at desc);
create index if not exists visitor_logs_township_time_idx
  on public.visitor_logs (township_id, scanned_at desc);
create index if not exists visitor_logs_guard_time_idx
  on public.visitor_logs (guard_id, scanned_at desc);
create index if not exists visitor_logs_walk_in_idx
  on public.visitor_logs (walk_in_request_id, scanned_at desc);

create table if not exists public.guest_access_attempts (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('token_lookup', 'short_code', 'pass_create')),
  subject_hash bytea not null check (octet_length(subject_hash) = 32),
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  unique (scope, subject_hash, window_started_at)
);

create index if not exists guest_access_attempts_cleanup_idx
  on public.guest_access_attempts (updated_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.gates enable row level security;
alter table public.visitor_passes enable row level security;
alter table public.walk_in_requests enable row level security;
alter table public.visitor_logs enable row level security;
alter table public.guest_access_attempts enable row level security;

revoke all on public.gates from anon, public;
revoke all on public.visitor_passes from anon, public;
revoke all on public.walk_in_requests from anon, public;
revoke all on public.visitor_logs from anon, public;
revoke all on public.guest_access_attempts from anon, public;

revoke all on public.gates from authenticated;
revoke all on public.visitor_passes from authenticated;
grant select on public.visitor_passes to authenticated;
revoke all on public.walk_in_requests from authenticated;
revoke all on public.visitor_logs from authenticated;
revoke all on public.guest_access_attempts from authenticated;

drop policy if exists gates_select_member on public.gates;
create policy gates_select_member
  on public.gates for select to authenticated
  using (public.is_active_member(township_id));

drop policy if exists visitor_passes_select_host_guard on public.visitor_passes;
create policy visitor_passes_select_host_guard
  on public.visitor_passes for select to authenticated
  using (
    host_id = auth.uid()
    or public.is_guest_gate_operator(township_id)
  );

drop policy if exists visitor_logs_select_host_guard on public.visitor_logs;
create policy visitor_logs_select_host_guard
  on public.visitor_logs for select to authenticated
  using (
    exists (
      select 1 from public.visitor_passes p
      where p.id = visitor_logs.pass_id
        and p.host_id = auth.uid()
    )
    or guard_id = auth.uid()
    or public.is_guest_gate_operator(township_id)
  );

drop policy if exists walk_in_requests_select_host_guard on public.walk_in_requests;
create policy walk_in_requests_select_host_guard
  on public.walk_in_requests for select to authenticated
  using (
    exists (
      select 1 from public.township_members m
      where m.id = walk_in_requests.host_member_id
        and m.user_id = auth.uid()
    )
    or guard_id = auth.uid()
    or public.is_guest_gate_operator(township_id)
  );

-- No direct insert/update/delete policies: all mutations use SECURITY DEFINER RPCs.
-- Direct table privileges remain revoked for authenticated users.

-- ---------------------------------------------------------------------------
-- Utility helpers
-- ---------------------------------------------------------------------------

create or replace function public.guest_hash_equal(p_left bytea, p_right bytea)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_result boolean := true;
  v_len integer;
  v_index integer;
begin
  if p_left is null or p_right is null then
    return false;
  end if;
  v_len := octet_length(p_left);
  if v_len <> octet_length(p_right) then
    return false;
  end if;
  for v_index in 0 .. v_len - 1 loop
    v_result := v_result and (get_byte(p_left, v_index) = get_byte(p_right, v_index));
  end loop;
  return v_result;
end;
$$;

revoke execute on function public.guest_hash_equal(bytea, bytea) from public, anon, authenticated, service_role;

create or replace function public.normalize_vehicle_plate(p_plate text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(upper(regexp_replace(coalesce(p_plate, ''), '\s+', '', 'g')), '');
$$;

create or replace function public.get_guest_pass_settings(p_township_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_settings jsonb;
begin
  select coalesce(settings -> 'guest_pass', '{}'::jsonb)
  into v_settings
  from public.townships
  where id = p_township_id;

  return jsonb_build_object(
    'max_validity_days', coalesce(nullif((v_settings ->> 'max_validity_days')::integer, 0), 7),
    'max_active_passes_per_resident', coalesce(nullif((v_settings ->> 'max_active_passes_per_resident')::integer, 0), 10),
    'max_days_ahead', coalesce(nullif((v_settings ->> 'max_days_ahead')::integer, 0), 30),
    'max_creates_per_resident_per_day', coalesce(nullif((v_settings ->> 'max_creates_per_resident_per_day')::integer, 0), 20),
    'retention_days', coalesce(nullif((v_settings ->> 'retention_days')::integer, 0), 90),
    'overstay_grace_minutes', coalesce(nullif((v_settings ->> 'overstay_grace_minutes')::integer, 0), 30),
    'walk_in_timeout_minutes', coalesce(nullif((v_settings ->> 'walk_in_timeout_minutes')::integer, 0), 5),
    'short_code_max_attempts_per_minute', coalesce(nullif((v_settings ->> 'short_code_max_attempts_per_minute')::integer, 0), 5),
    'token_lookup_max_attempts_per_minute', coalesce(nullif((v_settings ->> 'token_lookup_max_attempts_per_minute')::integer, 0), 60)
  );
end;
$$;

revoke execute on function public.get_guest_pass_settings(uuid) from public, anon, authenticated;
grant execute on function public.get_guest_pass_settings(uuid) to authenticated;

create or replace function public.guest_pass_latest_direction(p_pass_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select direction
  from public.visitor_logs
  where pass_id = p_pass_id
    and applied = true
    and sync_status = 'applied'
  order by scanned_at desc, created_at desc
  limit 1;
$$;

revoke execute on function public.guest_pass_latest_direction(uuid) from public, anon, authenticated, service_role;

create or replace function public.guest_pass_effective_status(p_pass_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_pass public.visitor_passes%rowtype;
  v_inside boolean;
begin
  select * into v_pass from public.visitor_passes where id = p_pass_id;
  if not found then
    return 'invalid';
  end if;
  if v_pass.status = 'revoked' then
    return 'revoked';
  end if;
  select exists (
    select 1
    from (
      select direction, scanned_at, created_at
      from public.visitor_logs
      where pass_id = p_pass_id
        and applied = true
        and sync_status = 'applied'
      order by scanned_at desc, created_at desc
    ) latest
    where latest.direction = 'in'
      and not exists (
        select 1
        from public.visitor_logs later
        where later.pass_id = p_pass_id
          and later.applied = true
          and later.sync_status = 'applied'
          and (later.scanned_at, later.created_at) > (latest.scanned_at, latest.created_at)
          and later.direction = 'out'
      )
  ) into v_inside;

  if v_pass.entries_used >= v_pass.max_entries and coalesce(v_inside, false) = false then
    return 'completed';
  end if;
  if v_pass.status = 'completed' and coalesce(v_inside, false) = false then
    return 'completed';
  end if;
  if now() > v_pass.valid_until and coalesce(v_inside, false) = false then
    return 'expired';
  end if;
  return 'active';
end;
$$;

revoke execute on function public.guest_pass_effective_status(uuid) from public, anon, authenticated, service_role;

create or replace function public.guest_pass_is_inside(p_pass_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.guest_pass_latest_direction(p_pass_id) = 'in';
$$;

revoke execute on function public.guest_pass_is_inside(uuid) from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Attempt limits
-- ---------------------------------------------------------------------------

create or replace function public.record_guest_access_attempt(
  p_scope text,
  p_subject_hash bytea,
  p_max_attempts integer,
  p_window_seconds integer default 60
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.guest_access_attempts%rowtype;
  v_now timestamptz := now();
  v_window timestamptz;
begin
  if p_scope not in ('token_lookup', 'short_code', 'pass_create') then
    raise exception 'invalid_attempt_scope';
  end if;
  if p_subject_hash is null or octet_length(p_subject_hash) <> 32 then
    raise exception 'invalid_attempt_subject';
  end if;
  if p_max_attempts <= 0 or p_window_seconds <= 0 then
    raise exception 'invalid_attempt_limit';
  end if;

  v_window := date_trunc('second', v_now) - make_interval(secs => p_window_seconds);

  select * into v_row
  from public.guest_access_attempts
  where scope = p_scope
    and subject_hash = p_subject_hash
    and window_started_at >= v_window
  order by window_started_at desc
  limit 1
  for update;

  if not found then
    insert into public.guest_access_attempts (scope, subject_hash, window_started_at, attempts, updated_at)
    values (p_scope, p_subject_hash, v_now, 1, v_now)
    returning * into v_row;
    return jsonb_build_object('allowed', true, 'attempts', 1, 'remaining', greatest(p_max_attempts - 1, 0), 'locked', false);
  end if;

  if v_row.locked_until is not null and v_row.locked_until > v_now then
    return jsonb_build_object('allowed', false, 'attempts', v_row.attempts, 'remaining', 0, 'locked', true, 'locked_until', v_row.locked_until);
  end if;

  if v_row.window_started_at <= v_window then
    update public.guest_access_attempts
    set window_started_at = v_now,
        attempts = 1,
        locked_until = null,
        updated_at = v_now
    where id = v_row.id
    returning * into v_row;
    return jsonb_build_object('allowed', true, 'attempts', 1, 'remaining', greatest(p_max_attempts - 1, 0), 'locked', false);
  end if;

  update public.guest_access_attempts
  set attempts = attempts + 1,
      updated_at = v_now,
      locked_until = case when attempts + 1 >= p_max_attempts then v_now + make_interval(secs => p_window_seconds) else locked_until end
  where id = v_row.id
  returning * into v_row;

  return jsonb_build_object(
    'allowed', v_row.attempts <= p_max_attempts,
    'attempts', v_row.attempts,
    'remaining', greatest(p_max_attempts - v_row.attempts, 0),
    'locked', v_row.locked_until is not null and v_row.locked_until > v_now,
    'locked_until', v_row.locked_until
  );
end;
$$;

revoke execute on function public.record_guest_access_attempt(text, bytea, integer, integer) from public;
grant execute on function public.record_guest_access_attempt(text, bytea, integer, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Resident pass operations
-- ---------------------------------------------------------------------------

create or replace function public.create_visitor_pass(
  p_token_hash bytea,
  p_short_code_hash bytea,
  p_visitor_name text,
  p_valid_from timestamptz,
  p_valid_until timestamptz,
  p_max_entries integer default 1,
  p_visitor_phone text default null,
  p_vehicle_plate text default null,
  p_purpose text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_member public.township_members%rowtype;
  v_settings jsonb;
  v_active_count integer;
  v_created_today integer;
  v_local_day date;
  v_pass_id uuid;
  v_name text := nullif(trim(coalesce(p_visitor_name, '')), '');
  v_phone text := nullif(trim(coalesce(p_visitor_phone, '')), '');
  v_plate text := public.normalize_vehicle_plate(p_vehicle_plate);
  v_purpose text := nullif(trim(coalesce(p_purpose, '')), '');
  v_max integer := coalesce(p_max_entries, 1);
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if v_name is null or char_length(v_name) > 100 then
    raise exception 'invalid_visitor_name';
  end if;
  if v_phone is not null and char_length(v_phone) > 40 then
    raise exception 'invalid_visitor_phone';
  end if;
  if v_plate is not null and char_length(v_plate) > 24 then
    raise exception 'invalid_vehicle_plate';
  end if;
  if v_purpose is not null and char_length(v_purpose) > 80 then
    raise exception 'invalid_purpose';
  end if;
  if p_token_hash is null or octet_length(p_token_hash) <> 32
     or p_short_code_hash is null or octet_length(p_short_code_hash) <> 32 then
    raise exception 'invalid_token';
  end if;
  if v_max < 1 or v_max > 100 then
    raise exception 'invalid_max_entries';
  end if;

  select * into v_member
  from public.township_members
  where township_id is not null
    and user_id = v_user_id
    and status = 'active'
    and role <> 'guard'
  order by created_at
  limit 1;

  if not found then
    raise exception 'not_active_member';
  end if;

  v_settings := public.get_guest_pass_settings(v_member.township_id);
  v_local_day := (now() at time zone 'Asia/Kuala_Lumpur')::date;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':guest-pass:' || v_local_day::text));

  if p_valid_from is null or p_valid_until is null or p_valid_until <= p_valid_from then
    raise exception 'invalid_validity';
  end if;
  if p_valid_from > now() + make_interval(days => (v_settings ->> 'max_days_ahead')::integer) then
    raise exception 'valid_from_too_far';
  end if;
  if p_valid_until - p_valid_from > make_interval(days => (v_settings ->> 'max_validity_days')::integer) then
    raise exception 'validity_too_long';
  end if;

  select count(*) into v_active_count
  from public.visitor_passes
  where host_id = v_user_id
    and township_id = v_member.township_id
    and status = 'active'
    and valid_until >= now();

  if v_active_count >= (v_settings ->> 'max_active_passes_per_resident')::integer then
    raise exception 'too_many_active_passes';
  end if;

  select count(*) into v_created_today
  from public.visitor_passes
  where host_id = v_user_id
    and township_id = v_member.township_id
    and created_at >= ((now() at time zone 'Asia/Kuala_Lumpur')::date)::timestamptz at time zone 'Asia/Kuala_Lumpur';

  if v_created_today >= (v_settings ->> 'max_creates_per_resident_per_day')::integer then
    raise exception 'pass_creation_rate_limited';
  end if;

  insert into public.visitor_passes (
    host_id, township_id, visitor_name, visitor_phone, vehicle_plate, purpose,
    valid_from, valid_until, max_entries, entries_used, status, source,
    token_hash, short_code_hash
  )
  values (
    v_user_id, v_member.township_id, v_name, v_phone, v_plate, v_purpose,
    p_valid_from, p_valid_until, v_max, 0, 'active', 'resident',
    p_token_hash, p_short_code_hash
  )
  returning id into v_pass_id;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_member.township_id, v_user_id, 'guest_pass_created', 'visitor_pass', v_pass_id, jsonb_build_object('source', 'resident'));

  return jsonb_build_object('pass_id', v_pass_id, 'township_id', v_member.township_id);
end;
$$;

revoke execute on function public.create_visitor_pass(bytea, bytea, text, timestamptz, timestamptz, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.create_visitor_pass(bytea, bytea, text, timestamptz, timestamptz, integer, text, text, text) to authenticated;

create or replace function public.revoke_visitor_pass(p_pass_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_pass public.visitor_passes%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_pass
  from public.visitor_passes
  where id = p_pass_id
    and host_id = v_user_id
  for update;

  if not found then
    raise exception 'pass_not_found';
  end if;
  if v_pass.status = 'revoked' then
    return jsonb_build_object('pass_id', v_pass.id, 'status', 'revoked');
  end if;

  update public.visitor_passes
  set status = 'revoked',
      revoked_at = now(),
      ended_at = coalesce(ended_at, now())
  where id = v_pass.id;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_pass.township_id, v_user_id, 'guest_pass_revoked', 'visitor_pass', v_pass.id, '{}'::jsonb);

  return jsonb_build_object('pass_id', v_pass.id, 'status', 'revoked');
end;
$$;

revoke execute on function public.revoke_visitor_pass(uuid) from public, anon, authenticated;
grant execute on function public.revoke_visitor_pass(uuid) to authenticated;

create or replace function public.set_guest_pass_checkout_mute(p_pass_id uuid, p_mute boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_pass public.visitor_passes%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_pass
  from public.visitor_passes
  where id = p_pass_id and host_id = v_user_id
  for update;

  if not found then
    raise exception 'pass_not_found';
  end if;

  update public.visitor_passes
  set mute_checkout_notifications = coalesce(p_mute, false)
  where id = v_pass.id
  returning * into v_pass;

  return to_jsonb(v_pass);
end;
$$;

revoke execute on function public.set_guest_pass_checkout_mute(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_guest_pass_checkout_mute(uuid, boolean) to authenticated;

create or replace function public.get_resident_guest_passes()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select coalesce(jsonb_agg(row_to_json(pass_view) order by p.created_at desc), '[]'::jsonb)
  into v_result
  from (
    select
      p.id,
      p.township_id,
      p.visitor_name,
      p.vehicle_plate,
      p.purpose,
      p.valid_from,
      p.valid_until,
      p.max_entries,
      p.entries_used,
      public.guest_pass_effective_status(p.id) as status,
      p.mute_checkout_notifications,
      p.created_at,
      p.revoked_at,
      public.guest_pass_is_inside(p.id) as is_inside,
      (
        select jsonb_build_object('direction', l.direction, 'scanned_at', l.scanned_at)
        from public.visitor_logs l
        where l.pass_id = p.id and l.applied = true and l.sync_status = 'applied'
        order by l.scanned_at desc, l.created_at desc
        limit 1
      ) as latest_log
    from public.visitor_passes p
    where p.host_id = v_user_id
    order by p.created_at desc
    limit 100
  ) pass_view
  join public.visitor_passes p on p.id = pass_view.id;

  return v_result;
end;
$$;

revoke execute on function public.get_resident_guest_passes() from public, anon, authenticated;
grant execute on function public.get_resident_guest_passes() to authenticated;

-- ---------------------------------------------------------------------------
-- Public resolver
-- ---------------------------------------------------------------------------

create or replace function public.resolve_guest_pass(
  p_token text default null,
  p_short_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_token_hash bytea;
  v_short_hash bytea;
  v_pass public.visitor_passes%rowtype;
  v_township public.townships%rowtype;
  v_gates jsonb;
  v_status text;
begin
  if coalesce(p_token, '') = '' and coalesce(p_short_code, '') = '' then
    return jsonb_build_object('valid', false, 'reason', 'invalid');
  end if;

  if p_token is not null and p_token <> '' then
    v_token_hash := extensions.digest(p_token, 'sha256');
    select * into v_pass from public.visitor_passes where token_hash = v_token_hash;
    if found and not public.guest_hash_equal(v_pass.token_hash, v_token_hash) then
      v_pass.id := null;
    end if;
  end if;

  if not found and p_short_code is not null and p_short_code <> '' then
    v_short_hash := extensions.digest(upper(trim(p_short_code)), 'sha256');
    select * into v_pass from public.visitor_passes where short_code_hash = v_short_hash;
    if found and not public.guest_hash_equal(v_pass.short_code_hash, v_short_hash) then
      v_pass.id := null;
    end if;
  end if;

  if v_pass.id is null then
    -- Always compare a valid-length hash to avoid an early not-found branch.
    perform public.guest_hash_equal(extensions.digest('invalid', 'sha256'), v_token_hash);
    return jsonb_build_object('valid', false, 'reason', 'invalid');
  end if;

  select * into v_township from public.townships where id = v_pass.township_id;
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name) order by g.name), '[]'::jsonb)
  into v_gates
  from public.gates g
  where g.township_id = v_pass.township_id and g.active = true;

  v_status := public.guest_pass_effective_status(v_pass.id);

  return jsonb_build_object(
    'valid', true,
    'pass_id', v_pass.id,
    'visitor_name', v_pass.visitor_name,
    'valid_from', v_pass.valid_from,
    'valid_until', v_pass.valid_until,
    'status', v_status,
    'township_name', v_township.name,
    'gates', v_gates,
    'privacy_retention_days', (public.get_guest_pass_settings(v_pass.township_id) ->> 'retention_days')::integer
  );
end;
$$;

revoke execute on function public.resolve_guest_pass(text, text) from public;
grant execute on function public.resolve_guest_pass(text, text) to anon;

-- ---------------------------------------------------------------------------
-- Guard result and scans
-- ---------------------------------------------------------------------------

create or replace function public.get_guard_guest_result(
  p_token text default null,
  p_short_code text default null,
  p_plate text default null,
  p_pass_id uuid default null,
  p_township_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_pass public.visitor_passes%rowtype;
  v_host public.township_members%rowtype;
  v_host_profile public.profiles%rowtype;
  v_token_hash bytea;
  v_short_hash bytea;
  v_status text;
  v_inside boolean;
  v_plate text := public.normalize_vehicle_plate(p_plate);
  v_match_count integer;
begin
  if v_user_id is null or not public.is_guest_gate_operator(p_township_id) then
    raise exception 'guard_required';
  end if;

  if p_token is not null and p_token <> '' then
    v_token_hash := extensions.digest(p_token, 'sha256');
    select * into v_pass from public.visitor_passes where token_hash = v_token_hash;
    if found and not public.guest_hash_equal(v_pass.token_hash, v_token_hash) then
      v_pass.id := null;
    end if;
    if v_pass.id is null then
      return jsonb_build_object('valid', false, 'reason', 'invalid');
    end if;
    if v_pass.township_id <> p_township_id then
      return jsonb_build_object('valid', false, 'reason', 'wrong_township');
    end if;
  elsif p_short_code is not null and p_short_code <> '' then
    v_short_hash := extensions.digest(upper(trim(p_short_code)), 'sha256');
    select * into v_pass from public.visitor_passes where short_code_hash = v_short_hash;
    if found and not public.guest_hash_equal(v_pass.short_code_hash, v_short_hash) then
      v_pass.id := null;
    end if;
    if v_pass.id is null or v_pass.township_id <> p_township_id then
      return jsonb_build_object('valid', false, 'reason', 'invalid');
    end if;
  elsif p_pass_id is not null then
    select * into v_pass
    from public.visitor_passes
    where id = p_pass_id and township_id = p_township_id;

    if not found then
      return jsonb_build_object('valid', false, 'reason', 'invalid');
    end if;
    if v_plate is not null and (v_pass.vehicle_plate is null or v_pass.vehicle_plate <> v_plate) then
      return jsonb_build_object('valid', false, 'reason', 'invalid');
    end if;
  elsif v_plate is not null then
    select count(*) into v_match_count
    from public.visitor_passes
    where township_id = p_township_id
      and vehicle_plate = v_plate
      and status in ('active', 'completed')
      and valid_until >= now() - interval '1 day';

    if v_match_count <> 1 then
      return jsonb_build_object('valid', false, 'reason', case when v_match_count = 0 then 'invalid' else 'ambiguous' end);
    end if;

    select * into v_pass
    from public.visitor_passes
    where township_id = p_township_id
      and vehicle_plate = v_plate
      and status in ('active', 'completed')
      and valid_until >= now() - interval '1 day'
    order by created_at desc
    limit 1;
  else
    return jsonb_build_object('valid', false, 'reason', 'invalid');
  end if;

  if v_pass.township_id <> p_township_id then
    return jsonb_build_object('valid', false, 'reason', 'wrong_township');
  end if;

  select * into v_host
  from public.township_members
  where id is not null
    and township_id = v_pass.township_id
    and user_id = v_pass.host_id
  limit 1;

  select * into v_host_profile
  from public.profiles
  where id = v_pass.host_id;

  v_status := public.guest_pass_effective_status(v_pass.id);
  v_inside := public.guest_pass_is_inside(v_pass.id);

  return jsonb_build_object(
    'valid', true,
    'pass_id', v_pass.id,
    'visitor_name', v_pass.visitor_name,
    'vehicle_plate', v_pass.vehicle_plate,
    'purpose', v_pass.purpose,
    'valid_from', v_pass.valid_from,
    'valid_until', v_pass.valid_until,
    'entries_used', v_pass.entries_used,
    'max_entries', v_pass.max_entries,
    'status', v_status,
    'is_inside', v_inside,
    'host_display_name', coalesce(v_host_profile.display_name, 'Resident'),
    'destination_unit', v_host.unit_label,
    'latest_log', (
      select jsonb_build_object('direction', l.direction, 'scanned_at', l.scanned_at)
      from public.visitor_logs l
      where l.pass_id = v_pass.id and l.applied = true and l.sync_status = 'applied'
      order by l.scanned_at desc, l.created_at desc
      limit 1
    )
  );
end;
$$;

revoke execute on function public.get_guard_guest_result(text, text, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_guard_guest_result(text, text, text, uuid, uuid) to authenticated;

create or replace function public.record_guest_scan(
  p_direction text,
  p_gate_id uuid,
  p_id_sighted boolean default false,
  p_note text default null,
  p_device_scanned_at timestamptz default now(),
  p_client_event_id uuid default null,
  p_token text default null,
  p_short_code text default null,
  p_plate text default null,
  p_pass_id uuid default null,
  p_township_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_pass public.visitor_passes%rowtype;
  v_gate public.gates%rowtype;
  v_result jsonb;
  v_status text;
  v_inside boolean;
  v_new_inside boolean;
  v_notification_id uuid;
  v_event_time timestamptz;
  v_existing public.visitor_logs%rowtype;
  v_host public.township_members%rowtype;
  v_gate_name text;
  v_first_name text;
  v_mute boolean;
  v_local_time text;
begin
  if v_user_id is null or not public.is_guest_gate_operator(p_township_id) then
    raise exception 'guard_required';
  end if;
  if p_direction not in ('in', 'out') then
    raise exception 'invalid_direction';
  end if;
  if p_device_scanned_at is null
     or p_device_scanned_at > now() + interval '2 minutes'
     or p_device_scanned_at < now() - interval '30 days' then
    raise exception 'invalid_scan_time';
  end if;

  if p_client_event_id is not null then
    select * into v_existing
    from public.visitor_logs
    where client_event_id = p_client_event_id;

    if found then
      return jsonb_build_object(
        'duplicate', true,
        'log_id', v_existing.id,
        'direction', v_existing.direction,
        'sync_status', v_existing.sync_status,
        'applied', v_existing.applied
      );
    end if;
  end if;

  v_result := public.get_guard_guest_result(
    p_token => p_token,
    p_short_code => p_short_code,
    p_plate => p_plate,
    p_pass_id => p_pass_id,
    p_township_id => p_township_id
  );

  if not (v_result ->> 'valid')::boolean then
    insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
    values (p_township_id, v_user_id, 'guest_scan_rejected', 'gate', p_gate_id, jsonb_build_object('reason', v_result ->> 'reason', 'direction', p_direction));
    return v_result;
  end if;

  select * into v_pass
  from public.visitor_passes
  where id = (v_result ->> 'pass_id')::uuid
  for update;

  if v_pass.township_id <> p_township_id then
    return jsonb_build_object('valid', false, 'reason', 'wrong_township');
  end if;

  select * into v_gate
  from public.gates
  where id = p_gate_id and township_id = p_township_id and active = true;

  if not found then
    raise exception 'invalid_gate';
  end if;

  v_status := public.guest_pass_effective_status(v_pass.id);
  v_inside := public.guest_pass_is_inside(v_pass.id);
  v_event_time := p_device_scanned_at;

  if p_direction = 'in' then
    if v_status = 'revoked' then
      return jsonb_build_object('valid', false, 'reason', 'revoked');
    end if;
    if now() < v_pass.valid_from then
      return jsonb_build_object('valid', false, 'reason', 'not_started');
    end if;
    if now() > v_pass.valid_until then
      return jsonb_build_object('valid', false, 'reason', 'expired');
    end if;
    if v_pass.entries_used >= v_pass.max_entries then
      return jsonb_build_object('valid', false, 'reason', 'entries_used_up');
    end if;
    if v_inside then
      return jsonb_build_object('valid', false, 'reason', 'already_inside');
    end if;
  else
    if not v_inside then
      return jsonb_build_object('valid', false, 'reason', 'not_inside');
    end if;
  end if;

  insert into public.visitor_logs (
    pass_id, walk_in_request_id, township_id, gate_id, guard_id,
    direction, scanned_at, synced_at, id_sighted, note,
    client_event_id, sync_status, applied, review_reason
  )
  values (
    v_pass.id, null, p_township_id, p_gate_id, v_user_id,
    p_direction, v_event_time, now(), coalesce(p_id_sighted, false), nullif(trim(coalesce(p_note, '')), ''),
    coalesce(p_client_event_id, gen_random_uuid()), 'applied', true, null
  )
  returning id into v_notification_id;

  if p_direction = 'in' then
    update public.visitor_passes
    set entries_used = entries_used + 1
    where id = v_pass.id;
    v_new_inside := true;
  else
    update public.visitor_passes
    set status = case when entries_used >= max_entries then 'completed' else status end,
        ended_at = case when entries_used >= max_entries then coalesce(ended_at, now()) else ended_at end
    where id = v_pass.id;
    v_new_inside := false;
  end if;

  select m.* into v_host
  from public.township_members m
  where m.township_id = v_pass.township_id and m.user_id = v_pass.host_id
  limit 1;

  v_gate_name := v_gate.name;
  v_first_name := coalesce(nullif(split_part(v_pass.visitor_name, ' ', 1), ''), v_pass.visitor_name);
  v_local_time := to_char(v_event_time at time zone 'Asia/Kuala_Lumpur', 'HH12:MI AM');
  v_mute := v_pass.mute_checkout_notifications;

  if p_direction = 'in' or not v_mute then
    insert into public.notifications (user_id, type, title, body, link, dedupe_key)
    values (
      v_pass.host_id,
      'guest_pass_' || p_direction,
      case when p_direction = 'in' then 'Guest checked in' else 'Guest checked out' end,
      case
        when p_direction = 'in' then v_first_name || ' checked in at ' || v_gate_name || ', ' || v_local_time
        else v_first_name || ' checked out at ' || v_gate_name || ', ' || v_local_time
      end,
      '/guests/' || v_pass.id,
      'guest-pass-' || p_direction || ':' || v_pass.id || ':' || v_notification_id
    );
  end if;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_township_id, v_user_id, 'guest_scan_' || p_direction, 'visitor_log', v_notification_id, jsonb_build_object('gate_id', p_gate_id));

  return jsonb_build_object(
    'valid', true,
    'log_id', v_notification_id,
    'pass_id', v_pass.id,
    'direction', p_direction,
    'status', public.guest_pass_effective_status(v_pass.id),
    'is_inside', v_new_inside,
    'visitor_name', v_pass.visitor_name,
    'host_display_name', v_result ->> 'host_display_name',
    'destination_unit', v_result ->> 'destination_unit'
  );
end;
$$;

revoke execute on function public.record_guest_scan(text, uuid, boolean, text, timestamptz, uuid, text, text, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.record_guest_scan(text, uuid, boolean, text, timestamptz, uuid, text, text, text, uuid, uuid) to authenticated;

-- Offline sync revalidates current state. Revoked offline check-ins are retained
-- for review and do not change inside state.
create or replace function public.sync_guest_scan(
  p_direction text,
  p_gate_id uuid,
  p_pass_id uuid,
  p_id_sighted boolean default false,
  p_note text default null,
  p_device_scanned_at timestamptz default now(),
  p_client_event_id uuid default null,
  p_token text default null,
  p_township_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_pass public.visitor_passes%rowtype;
  v_gate public.gates%rowtype;
  v_existing public.visitor_logs%rowtype;
  v_status text;
  v_inside boolean;
  v_log_id uuid;
  v_review_reason text;
  v_applied boolean;
  v_host public.township_members%rowtype;
  v_gate_name text;
  v_first_name text;
  v_local_time text;
begin
  if v_user_id is null or not public.is_guest_gate_operator(p_township_id) then
    raise exception 'guard_required';
  end if;
  if p_direction not in ('in', 'out') then
    raise exception 'invalid_direction';
  end if;
  if p_device_scanned_at is null
     or p_device_scanned_at > now() + interval '2 minutes'
     or p_device_scanned_at < now() - interval '30 days' then
    raise exception 'invalid_scan_time';
  end if;

  if p_client_event_id is not null then
    select * into v_existing
    from public.visitor_logs
    where client_event_id = p_client_event_id;

    if found then
      return jsonb_build_object(
        'duplicate', true,
        'log_id', v_existing.id,
        'sync_status', v_existing.sync_status,
        'applied', v_existing.applied
      );
    end if;
  end if;

  if p_pass_id is null then
    raise exception 'invalid_pass';
  end if;

  select * into v_pass
  from public.visitor_passes
  where id = p_pass_id and township_id = p_township_id
  for update;

  if not found then
    raise exception 'pass_not_found';
  end if;

  if p_token is not null and p_token <> '' then
    if not public.guest_hash_equal(v_pass.token_hash, extensions.digest(p_token, 'sha256')) then
      raise exception 'invalid_token';
    end if;
  end if;

  select * into v_gate
  from public.gates
  where id = p_gate_id and township_id = p_township_id and active = true;

  if not found then
    raise exception 'invalid_gate';
  end if;

  v_status := public.guest_pass_effective_status(v_pass.id);
  v_inside := public.guest_pass_is_inside(v_pass.id);
  v_review_reason := null;
  v_applied := true;

  if p_direction = 'in' then
    if v_status = 'revoked' then
      v_applied := false;
      v_review_reason := 'revoked_while_offline';
    elsif now() < v_pass.valid_from then
      v_applied := false;
      v_review_reason := 'not_started_while_offline';
    elsif now() > v_pass.valid_until then
      v_applied := false;
      v_review_reason := 'expired_while_offline';
    elsif v_pass.entries_used >= v_pass.max_entries then
      v_applied := false;
      v_review_reason := 'entries_used_up';
    elsif v_inside then
      v_applied := false;
      v_review_reason := 'already_inside';
    end if;
  else
    if not v_inside then
      v_applied := false;
      v_review_reason := 'not_inside_at_sync';
    end if;
  end if;

  insert into public.visitor_logs (
    pass_id, walk_in_request_id, township_id, gate_id, guard_id,
    direction, scanned_at, synced_at, id_sighted, note,
    client_event_id, sync_status, applied, review_reason
  )
  values (
    v_pass.id, null, p_township_id, p_gate_id, v_user_id,
    p_direction, p_device_scanned_at, now(), coalesce(p_id_sighted, false), nullif(trim(coalesce(p_note, '')), ''),
    coalesce(p_client_event_id, gen_random_uuid()),
    case when v_applied then 'applied' else 'needs_review' end,
    v_applied,
    v_review_reason
  )
  returning id into v_log_id;

  if v_applied and p_direction = 'in' then
    update public.visitor_passes
    set entries_used = entries_used + 1
    where id = v_pass.id;
  elsif v_applied and p_direction = 'out' then
    update public.visitor_passes
    set status = case when entries_used >= max_entries then 'completed' else status end,
        ended_at = case when entries_used >= max_entries then coalesce(ended_at, now()) else ended_at end
    where id = v_pass.id;
  end if;

  if v_applied then
    select m.* into v_host
    from public.township_members m
    where m.township_id = v_pass.township_id and m.user_id = v_pass.host_id
    limit 1;

    v_gate_name := v_gate.name;
    v_first_name := coalesce(nullif(split_part(v_pass.visitor_name, ' ', 1), ''), v_pass.visitor_name);
    v_local_time := to_char(p_device_scanned_at at time zone 'Asia/Kuala_Lumpur', 'HH12:MI AM');

    if p_direction = 'in' or not v_pass.mute_checkout_notifications then
      insert into public.notifications (user_id, type, title, body, link, dedupe_key)
      values (
        v_pass.host_id,
        'guest_pass_' || p_direction,
        case when p_direction = 'in' then 'Guest checked in' else 'Guest checked out' end,
        case
          when p_direction = 'in' then v_first_name || ' checked in at ' || v_gate_name || ', ' || v_local_time
          else v_first_name || ' checked out at ' || v_gate_name || ', ' || v_local_time
        end,
        '/guests/' || v_pass.id,
        'guest-pass-' || p_direction || ':' || v_pass.id || ':' || v_log_id
      );
    end if;
  else
    insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
    values (p_township_id, v_user_id, 'guest_offline_scan_needs_review', 'visitor_log', v_log_id, jsonb_build_object('reason', v_review_reason, 'direction', p_direction));
  end if;

  return jsonb_build_object(
    'valid', true,
    'log_id', v_log_id,
    'sync_status', case when v_applied then 'applied' else 'needs_review' end,
    'applied', v_applied,
    'review_reason', v_review_reason,
    'direction', p_direction
  );
end;
$$;

revoke execute on function public.sync_guest_scan(text, uuid, uuid, boolean, text, timestamptz, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.sync_guest_scan(text, uuid, uuid, boolean, text, timestamptz, uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Guard lists
-- ---------------------------------------------------------------------------

create or replace function public.get_guard_guest_lists(
  p_township_id uuid,
  p_date date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_date date := coalesce(p_date, (now() at time zone 'Asia/Kuala_Lumpur')::date);
  v_inside jsonb;
  v_logs jsonb;
begin
  if v_user_id is null or not public.is_guest_gate_operator(p_township_id) then
    raise exception 'guard_required';
  end if;

  select coalesce(jsonb_agg(row_to_json(inside_view) order by inside_view.scanned_at asc), '[]'::jsonb)
  into v_inside
  from (
    select
      p.id as pass_id,
      p.visitor_name,
      p.vehicle_plate,
      p.valid_until,
      public.guest_pass_effective_status(p.id) as status,
      l.scanned_at,
      l.gate_id,
      g.name as gate_name,
      pr.display_name as host_display_name,
      m.unit_label as destination_unit
    from public.visitor_logs l
    join public.visitor_passes p on p.id = l.pass_id
    join public.gates g on g.id = l.gate_id
    left join public.profiles pr on pr.id = p.host_id
    left join public.township_members m on m.township_id = p.township_id and m.user_id = p.host_id
    where l.township_id = p_township_id
      and l.applied = true
      and l.sync_status = 'applied'
      and l.direction = 'in'
      and l.scanned_at = (
        select max(l2.scanned_at)
        from public.visitor_logs l2
        where l2.pass_id = l.pass_id
          and l2.applied = true
          and l2.sync_status = 'applied'
      )
      and not exists (
        select 1 from public.visitor_logs out_log
        where out_log.pass_id = l.pass_id
          and out_log.applied = true
          and out_log.sync_status = 'applied'
          and out_log.direction = 'out'
          and out_log.scanned_at > l.scanned_at
      )
  ) inside_view;

  select coalesce(jsonb_agg(row_to_json(log_view) order by log_view.scanned_at desc), '[]'::jsonb)
  into v_logs
  from (
    select
      l.id,
      l.pass_id,
      l.walk_in_request_id,
      l.direction,
      l.scanned_at,
      l.sync_status,
      l.review_reason,
      l.id_sighted,
      g.name as gate_name,
      p.visitor_name,
      p.vehicle_plate
    from public.visitor_logs l
    left join public.visitor_passes p on p.id = l.pass_id
    left join public.walk_in_requests w on w.id = l.walk_in_request_id
    join public.gates g on g.id = l.gate_id
    where l.township_id = p_township_id
      and l.guard_id = v_user_id
      and l.scanned_at >= ((v_date)::timestamptz at time zone 'Asia/Kuala_Lumpur')
      and l.scanned_at < (((v_date + 1))::timestamptz at time zone 'Asia/Kuala_Lumpur')
  ) log_view;

  return jsonb_build_object('inside', coalesce(v_inside, '[]'::jsonb), 'logs', coalesce(v_logs, '[]'::jsonb), 'date', v_date);
end;
$$;

revoke execute on function public.get_guard_guest_lists(uuid, date) from public, anon, authenticated;
grant execute on function public.get_guard_guest_lists(uuid, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Walk-ins
-- ---------------------------------------------------------------------------

create or replace function public.create_walk_in_request(
  p_gate_id uuid,
  p_host_member_id uuid,
  p_visitor_name text,
  p_vehicle_plate text default null,
  p_client_request_id uuid default null,
  p_township_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_host public.township_members%rowtype;
  v_request_id uuid;
  v_name text := nullif(trim(coalesce(p_visitor_name, '')), '');
  v_plate text := public.normalize_vehicle_plate(p_vehicle_plate);
  v_settings jsonb;
begin
  if v_user_id is null or not public.is_guest_gate_operator(p_township_id) then
    raise exception 'guard_required';
  end if;
  if v_name is null or char_length(v_name) > 100 then
    raise exception 'invalid_visitor_name';
  end if;
  if v_plate is not null and char_length(v_plate) > 24 then
    raise exception 'invalid_vehicle_plate';
  end if;

  select * into v_host
  from public.township_members
  where id = p_host_member_id
    and township_id = p_township_id
    and status = 'active'
    and role <> 'guard'
  for update;

  if not found then
    raise exception 'invalid_host';
  end if;

  if not exists (
    select 1 from public.gates g
    where g.id = p_gate_id and g.township_id = p_township_id and g.active = true
  ) then
    raise exception 'invalid_gate';
  end if;

  if p_client_request_id is not null and exists (
    select 1 from public.walk_in_requests where client_request_id = p_client_request_id
  ) then
    select id into v_request_id from public.walk_in_requests where client_request_id = p_client_request_id;
    return jsonb_build_object('request_id', v_request_id, 'status', 'pending', 'duplicate', true);
  end if;

  insert into public.walk_in_requests (
    township_id, gate_id, guard_id, host_member_id, visitor_name, vehicle_plate,
    status, client_request_id
  )
  values (
    p_township_id, p_gate_id, v_user_id, v_host.id, v_name, v_plate,
    'pending', coalesce(p_client_request_id, gen_random_uuid())
  )
  returning id into v_request_id;

  v_settings := public.get_guest_pass_settings(p_township_id);

  insert into public.notifications (user_id, type, title, body, link, dedupe_key)
  values (
    v_host.user_id,
    'guest_walk_in_request',
    'Visitor waiting at the gate',
    v_name || ' is waiting at the gate. Approve or deny within ' || (v_settings ->> 'walk_in_timeout_minutes') || ' minutes.',
    '/guests?walkIn=' || v_request_id,
    'guest-walk-in:' || v_request_id
  );

  return jsonb_build_object('request_id', v_request_id, 'status', 'pending', 'timeout_minutes', (v_settings ->> 'walk_in_timeout_minutes')::integer);
end;
$$;

revoke execute on function public.create_walk_in_request(uuid, uuid, text, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_walk_in_request(uuid, uuid, text, text, uuid, uuid) to authenticated;

create or replace function public.respond_to_walk_in(
  p_request_id uuid,
  p_approve boolean,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.walk_in_requests%rowtype;
  v_status text;
  v_guard_user_id uuid;
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_request
  from public.walk_in_requests w
  join public.township_members m
    on m.id = w.host_member_id and m.user_id = v_user_id
  where w.id = p_request_id
  for update of w;

  if not found then
    raise exception 'walk_in_not_found';
  end if;
  if v_request.status <> 'pending' then
    return to_jsonb(v_request);
  end if;

  v_status := case when coalesce(p_approve, false) then 'approved' else 'denied' end;

  update public.walk_in_requests
  set status = v_status,
      responded_at = now(),
      responded_by = v_user_id,
      outcome_note = nullif(trim(coalesce(p_note, '')), '')
  where id = v_request.id
  returning * into v_request;

  select guard_id into v_guard_user_id from public.walk_in_requests where id = v_request.id;

  insert into public.notifications (user_id, type, title, body, link, dedupe_key)
  values (
    v_guard_user_id,
    'guest_walk_in_' || v_status,
    case when v_status = 'approved' then 'Walk-in approved' else 'Walk-in denied' end,
    v_request.visitor_name || ' was ' || v_status || ' for the gate.',
    '/guard?walkIn=' || v_request.id,
    'guest-walk-in-response:' || v_request.id
  );

  return to_jsonb(v_request);
end;
$$;

revoke execute on function public.respond_to_walk_in(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.respond_to_walk_in(uuid, boolean, text) to authenticated;

create or replace function public.get_walk_in_requests(
  p_township_id uuid,
  p_only_pending boolean default true
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_requests jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  if public.is_guest_gate_operator(p_township_id) then
    select coalesce(jsonb_agg(row_to_json(v) order by v.requested_at desc), '[]'::jsonb)
    into v_requests
    from (
      select w.id, w.status, w.visitor_name, w.vehicle_plate, w.requested_at, w.responded_at,
             w.outcome_note, w.gate_id, g.name as gate_name, m.unit_label as destination_unit,
             pr.display_name as host_display_name
      from public.walk_in_requests w
      join public.gates g on g.id = w.gate_id
      join public.township_members m on m.id = w.host_member_id
      left join public.profiles pr on pr.id = m.user_id
      where w.township_id = p_township_id
        and (not p_only_pending or w.status = 'pending')
      order by w.requested_at desc
      limit 100
    ) v;
  else
    select coalesce(jsonb_agg(row_to_json(v) order by v.requested_at desc), '[]'::jsonb)
    into v_requests
    from (
      select w.id, w.status, w.visitor_name, w.vehicle_plate, w.requested_at, w.responded_at,
             w.outcome_note, w.gate_id, g.name as gate_name, null::text as destination_unit,
             null::text as host_display_name
      from public.walk_in_requests w
      join public.gates g on g.id = w.gate_id
      join public.township_members m on m.id = w.host_member_id and m.user_id = v_user_id
      where w.township_id = p_township_id
        and (not p_only_pending or w.status = 'pending')
      order by w.requested_at desc
      limit 100
    ) v;
  end if;

  return coalesce(v_requests, '[]'::jsonb);
end;
$$;

revoke execute on function public.get_walk_in_requests(uuid, boolean) from public, anon, authenticated;
grant execute on function public.get_walk_in_requests(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Guard assignment, gates and admin settings
-- ---------------------------------------------------------------------------

create or replace function public.assign_guest_guard(p_member_id uuid, p_assign boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_member public.township_members%rowtype;
  v_new_role text;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_member
  from public.township_members
  where id = p_member_id
  for update;

  if not found or not public.is_guest_pass_assigner(v_member.township_id) then
    raise exception 'assigner_required';
  end if;

  if v_member.status <> 'active' then
    raise exception 'member_not_active';
  end if;

  if v_member.role = 'township_admin' and not public.is_township_admin(v_member.township_id) then
    raise exception 'admin_role_protected';
  end if;

  if coalesce(p_assign, false) then
    if v_member.role not in ('resident', 'organiser') then
      raise exception 'invalid_role_transition';
    end if;
    v_new_role := 'guard';
  else
    if v_member.role <> 'guard' then
      raise exception 'invalid_role_transition';
    end if;
    v_new_role := 'resident';
  end if;

  update public.township_members
  set role = v_new_role
  where id = v_member.id
  returning * into v_member;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_member.township_id, v_user_id, case when p_assign then 'guard_assigned' else 'guard_removed' end, 'township_member', v_member.id, jsonb_build_object('role', v_new_role));

  return to_jsonb(v_member);
end;
$$;

revoke execute on function public.assign_guest_guard(uuid, boolean) from public, anon, authenticated;
grant execute on function public.assign_guest_guard(uuid, boolean) to authenticated;

create or replace function public.save_guest_gate(
  p_township_id uuid,
  p_name text,
  p_gate_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_gate_id uuid;
begin
  if v_user_id is null or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;
  if v_name is null or char_length(v_name) > 80 then
    raise exception 'invalid_gate_name';
  end if;

  if p_gate_id is null then
    insert into public.gates (township_id, name)
    values (p_township_id, v_name)
    returning id into v_gate_id;
  else
    update public.gates
    set name = v_name, updated_at = now()
    where id = p_gate_id and township_id = p_township_id
    returning id into v_gate_id;

    if v_gate_id is null then
      raise exception 'gate_not_found';
    end if;
  end if;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_township_id, v_user_id, 'guest_gate_saved', 'gate', v_gate_id, jsonb_build_object('name', v_name));

  return (select to_jsonb(g) from public.gates g where id = v_gate_id);
end;
$$;

revoke execute on function public.save_guest_gate(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.save_guest_gate(uuid, text, uuid) to authenticated;

create or replace function public.set_guest_pass_settings(
  p_township_id uuid,
  p_settings jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_current jsonb;
  v_next jsonb;
  v_key text;
  v_value integer;
  v_min integer;
  v_max integer;
begin
  if v_user_id is null or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;

  select coalesce(settings, '{}'::jsonb) into v_current
  from public.townships where id = p_township_id for update;

  if v_current is null then
    raise exception 'township_not_found';
  end if;

  v_next := coalesce(v_current -> 'guest_pass', '{}'::jsonb);

  for v_key, v_min, v_max in
    select * from (values
      ('max_validity_days', 1, 30),
      ('max_active_passes_per_resident', 1, 100),
      ('max_days_ahead', 1, 90),
      ('max_creates_per_resident_per_day', 1, 100),
      ('retention_days', 30, 365),
      ('overstay_grace_minutes', 5, 1440),
      ('walk_in_timeout_minutes', 1, 60),
      ('short_code_max_attempts_per_minute', 1, 20),
      ('token_lookup_max_attempts_per_minute', 1, 600)
    ) as limits(key, min_value, max_value)
  loop
    if p_settings ? v_key then
      begin
        v_value := (p_settings ->> v_key)::integer;
      exception when others then
        raise exception 'invalid_guest_pass_setting';
      end;
      if v_value is null or v_value < v_min or v_value > v_max then
        raise exception 'invalid_guest_pass_setting';
      end if;
        v_next := v_next || jsonb_build_object(v_key, v_value);
    end if;
  end loop;

  update public.townships
  set settings = v_current || jsonb_build_object('guest_pass', v_next)
  where id = p_township_id;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (p_township_id, v_user_id, 'guest_pass_settings_updated', 'township', p_township_id, jsonb_build_object('settings', v_next));

  return public.get_guest_pass_settings(p_township_id);
end;
$$;

revoke execute on function public.set_guest_pass_settings(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.set_guest_pass_settings(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Overstays
-- ---------------------------------------------------------------------------

create or replace function public.notify_guest_overstays()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
  v_record record;
  v_settings jsonb;
  v_first_name text;
  v_gate_name text;
  v_minutes integer;
begin
  for v_record in
    select distinct on (p.id)
      p.id,
      p.host_id,
      p.township_id,
      p.visitor_name,
      p.valid_until,
      l.scanned_at,
      l.gate_id
    from public.visitor_passes p
    join public.visitor_logs l
      on l.pass_id = p.id
      and l.direction = 'in'
      and l.applied = true
      and l.sync_status = 'applied'
    where p.status <> 'revoked'
      and public.guest_pass_is_inside(p.id)
      and now() > p.valid_until
      and not exists (
        select 1 from public.notifications n
        where n.user_id = p.host_id
          and n.type = 'guest_pass_overstay'
          and n.dedupe_key = 'guest-overstay:' || p.id
      )
    order by p.id, l.scanned_at desc
  loop
    v_settings := public.get_guest_pass_settings(v_record.township_id);
    if now() >= v_record.valid_until + make_interval(mins => (v_settings ->> 'overstay_grace_minutes')::integer) then
      v_first_name := coalesce(nullif(split_part(v_record.visitor_name, ' ', 1), ''), v_record.visitor_name);
      select name into v_gate_name from public.gates where id = v_record.gate_id;
      v_minutes := greatest(floor(extract(epoch from (now() - v_record.valid_until)) / 60)::integer, 0);

      insert into public.notifications (user_id, type, title, body, link, dedupe_key)
      values (
        v_record.host_id,
        'guest_pass_overstay',
        'Guest is overdue',
        v_first_name || ' is still inside ' || coalesce(v_gate_name, 'the gate') || ', ' || v_minutes || ' minutes past the visit window.',
        '/guests/' || v_record.id,
        'guest-overstay:' || v_record.id
      );
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.notify_guest_overstays() from public, anon, authenticated;
grant execute on function public.notify_guest_overstays() to service_role, authenticated;

-- ---------------------------------------------------------------------------
-- Aggregates (k = 5)
-- ---------------------------------------------------------------------------

create or replace function public.guest_pass_stats(
  p_township_id uuid,
  p_from date default null,
  p_to date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_from date := coalesce(p_from, (now() at time zone 'Asia/Kuala_Lumpur')::date - 29);
  v_to date := coalesce(p_to, (now() at time zone 'Asia/Kuala_Lumpur')::date);
  v_start timestamptz;
  v_end timestamptz;
  v_daily jsonb;
  v_weekly jsonb;
  v_hours jsonb;
  v_gates jsonb;
  v_avg_stay numeric;
  v_avg_subjects integer;
  v_overstay_count integer;
  v_walk_in_total integer;
  v_walk_in_approved integer;
begin
  if v_user_id is null or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;
  if v_from > v_to then
    raise exception 'invalid_date_range';
  end if;

  v_start := ((v_from)::timestamp at time zone 'Asia/Kuala_Lumpur');
  v_end := (((v_to + 1))::timestamp at time zone 'Asia/Kuala_Lumpur');

  select coalesce(jsonb_agg(row_to_json(day_view)), '[]'::jsonb)
  into v_daily
  from (
    select
      d.day,
      count(distinct l.pass_id) as visitors,
      case when count(distinct l.pass_id) >= 5 then count(distinct l.pass_id) else null end as visitors_safe
    from generate_series(v_from, v_to, interval '1 day') d(day)
    left join public.visitor_logs l
      on l.township_id = p_township_id
      and l.scanned_at >= (d.day at time zone 'Asia/Kuala_Lumpur')
      and l.scanned_at < ((d.day + interval '1 day') at time zone 'Asia/Kuala_Lumpur')
      and l.sync_status in ('applied', 'needs_review')
    group by d.day
  ) day_view;

  select coalesce(jsonb_agg(row_to_json(week_view)), '[]'::jsonb)
  into v_weekly
  from (
    select
      date_trunc('week', d.day)::date as week_start,
      count(distinct l.pass_id) as visitors,
      case when count(distinct l.pass_id) >= 5 then count(distinct l.pass_id) else null end as visitors_safe
    from generate_series(v_from, v_to, interval '1 day') d(day)
    left join public.visitor_logs l
      on l.township_id = p_township_id
      and l.scanned_at >= (d.day at time zone 'Asia/Kuala_Lumpur')
      and l.scanned_at < ((d.day + interval '1 day') at time zone 'Asia/Kuala_Lumpur')
      and l.sync_status in ('applied', 'needs_review')
    group by date_trunc('week', d.day)
  ) week_view;

  select coalesce(jsonb_agg(row_to_json(hour_view)), '[]'::jsonb)
  into v_hours
  from (
    select
      extract(hour from l.scanned_at at time zone 'Asia/Kuala_Lumpur')::integer as hour,
      count(distinct l.pass_id) as visitors,
      case when count(distinct l.pass_id) >= 5 then count(distinct l.pass_id) else null end as visitors_safe
    from public.visitor_logs l
    where l.township_id = p_township_id
      and l.scanned_at >= v_start
      and l.scanned_at < v_end
      and l.sync_status in ('applied', 'needs_review')
    group by 1
    order by 1
  ) hour_view;

  select coalesce(jsonb_agg(row_to_json(gate_view)), '[]'::jsonb)
  into v_gates
  from (
    select
      g.name,
      count(distinct l.pass_id) as passes,
      case when count(distinct l.pass_id) >= 5 then count(distinct l.pass_id) else null end as passes_safe
    from public.gates g
    left join public.visitor_logs l
      on l.gate_id = g.id
      and l.township_id = p_township_id
      and l.scanned_at >= v_start
      and l.scanned_at < v_end
      and l.sync_status in ('applied', 'needs_review')
    where g.township_id = p_township_id
    group by g.id, g.name
  ) gate_view;

  select
    avg(stay_seconds),
    count(distinct pass_id)
  into v_avg_stay, v_avg_subjects
  from (
    select
      p.id as pass_id,
      extract(epoch from (max(case when l.direction = 'out' then l.scanned_at end) - min(case when l.direction = 'in' then l.scanned_at end))) as stay_seconds
    from public.visitor_logs l
    join public.visitor_passes p on p.id = l.pass_id
    where l.township_id = p_township_id
      and l.scanned_at >= v_start
      and l.scanned_at < v_end
      and l.sync_status = 'applied'
      and l.applied = true
    group by p.id
    having min(case when l.direction = 'in' then l.scanned_at end) is not null
      and max(case when l.direction = 'out' then l.scanned_at end) is not null
  ) stays;

  select count(distinct p.id)
  into v_overstay_count
  from public.visitor_passes p
  where p.township_id = p_township_id
    and p.valid_until >= v_start
    and p.valid_until < v_end
    and public.guest_pass_is_inside(p.id)
    and now() > p.valid_until;

  select count(*), count(*) filter (where status = 'approved')
  into v_walk_in_total, v_walk_in_approved
  from public.walk_in_requests
  where township_id = p_township_id
    and requested_at >= v_start
    and requested_at < v_end
    and status in ('approved', 'denied');

  return jsonb_build_object(
    'range', jsonb_build_object('from', v_from, 'to', v_to),
    'visitors_per_day', coalesce(v_daily, '[]'::jsonb),
    'visitors_per_week', coalesce(v_weekly, '[]'::jsonb),
    'peak_hours', coalesce(v_hours, '[]'::jsonb),
    'passes_per_gate', coalesce(v_gates, '[]'::jsonb),
    'average_stay_seconds', case when coalesce(v_avg_subjects, 0) >= 5 then v_avg_stay else null end,
    'average_stay_suppressed', coalesce(v_avg_subjects, 0) < 5,
    'overstay_count', case when v_overstay_count >= 5 then v_overstay_count else null end,
    'overstay_suppressed', v_overstay_count < 5,
    'walk_in_approval_rate', case when v_walk_in_total >= 5 then round((v_walk_in_approved::numeric / nullif(v_walk_in_total, 0)) * 100, 1) else null end,
    'walk_in_approval_suppressed', v_walk_in_total < 5,
    'suppression_threshold', 5
  );
end;
$$;

revoke execute on function public.guest_pass_stats(uuid, date, date) from public, anon, authenticated;
grant execute on function public.guest_pass_stats(uuid, date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Retention and scheduled maintenance
-- ---------------------------------------------------------------------------

create or replace function public.purge_guest_personal_data(p_retention_days integer default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cutoff timestamptz;
  v_retention integer;
  v_pass_count integer := 0;
  v_walk_in_count integer := 0;
  v_attempt_count integer := 0;
  v_township record;
begin
  for v_township in select id from public.townships loop
    v_retention := coalesce(
      p_retention_days,
      (public.get_guest_pass_settings(v_township.id) ->> 'retention_days')::integer,
      90
    );
    v_cutoff := now() - make_interval(days => v_retention);

    update public.visitor_passes
    set visitor_name = null,
        visitor_phone = null,
        vehicle_plate = null,
        purpose = null,
        token_hash = null,
        short_code_hash = null
    where township_id = v_township.id
      and coalesce(ended_at, revoked_at, valid_until) < v_cutoff
      and (
        visitor_name is not null
        or visitor_phone is not null
        or vehicle_plate is not null
        or purpose is not null
        or token_hash is not null
        or short_code_hash is not null
      );
    get diagnostics v_pass_count = row_count;

    update public.walk_in_requests
    set visitor_name = null,
        vehicle_plate = null,
        outcome_note = null
    where township_id = v_township.id
      and coalesce(responded_at, requested_at) < v_cutoff
      and (visitor_name is not null or vehicle_plate is not null or outcome_note is not null);
    get diagnostics v_walk_in_count = row_count;

    insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
    values (
      v_township.id,
      null,
      'guest_personal_data_purged',
      'guest_pass_retention',
      v_township.id,
      jsonb_build_object('passes', v_pass_count, 'walk_ins', v_walk_in_count, 'retention_days', v_retention)
    );
  end loop;

  delete from public.guest_access_attempts where updated_at < now() - interval '7 days';
  get diagnostics v_attempt_count = row_count;

  return jsonb_build_object(
    'visitor_passes_purged', v_pass_count,
    'walk_ins_purged', v_walk_in_count,
    'attempts_purged', v_attempt_count
  );
end;
$$;

revoke execute on function public.purge_guest_personal_data(integer) from public, anon, authenticated;
grant execute on function public.purge_guest_personal_data(integer) to service_role;

create or replace function public.run_guest_pass_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_overstays integer;
  v_purge jsonb;
begin
  if v_user_id is not null then
    if not (
      public.is_township_admin((
        select township_id from public.township_members
        where user_id = v_user_id and status = 'active'
        limit 1
      ))
      or public.is_township_guard((
        select township_id from public.township_members
        where user_id = v_user_id and status = 'active'
        limit 1
      ))
    ) then
      raise exception 'maintenance_forbidden';
    end if;
  end if;

  v_overstays := public.notify_guest_overstays();

  if v_user_id is null then
    v_purge := public.purge_guest_personal_data();
  else
    v_purge := jsonb_build_object('deferred', true);
  end if;

  return jsonb_build_object('overstays', v_overstays, 'purge', v_purge);
end;
$$;

revoke execute on function public.run_guest_pass_maintenance() from public, anon, authenticated;
grant execute on function public.run_guest_pass_maintenance() to service_role, authenticated;

create or replace function public.run_scheduled_jobs()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expired integer;
  v_completed integer;
  v_vouchers integer;
  v_event record;
  v_overstays integer := 0;
  v_purge jsonb;
begin
  v_expired := 0;
  v_completed := 0;
  v_vouchers := 0;
  v_expired := public.expire_stale_booking_requests(now());

  for v_event in
    select id
    from public.events
    where status = 'published' and ends_at < now()
    order by ends_at
    limit 100
  loop
    perform public.complete_event(v_event.id, now());
    v_completed := v_completed + 1;
  end loop;

  update public.redemptions
  set status = 'expired'
  where status = 'issued' and valid_until is not null and valid_until < current_date;
  get diagnostics v_vouchers = row_count;

  v_overstays := public.notify_guest_overstays();
  v_purge := public.purge_guest_personal_data();

  return jsonb_build_object(
    'expired_bookings', v_expired,
    'completed_events', v_completed,
    'expired_vouchers', v_vouchers,
    'guest_overstays', v_overstays,
    'guest_purge', v_purge
  );
end;
$$;

grant execute on function public.run_scheduled_jobs() to service_role;

-- Optional pg_cron scheduling; the database works without it.
do $$
begin
  if to_regclass('cron.job') is not null then
    perform cron.schedule(
      'borrowlah-guest-pass-maintenance',
      '*/5 * * * *',
      'select public.run_guest_pass_maintenance()'
    );
  end if;
exception when others then
  raise notice 'guest pass cron unavailable: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant execute on function public.is_township_guard(uuid) to authenticated;
grant execute on function public.is_guest_pass_assigner(uuid) to authenticated;
grant execute on function public.is_guest_gate_operator(uuid) to authenticated;

grant select on public.gates to authenticated;
