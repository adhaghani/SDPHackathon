-- Resident Giveaway: pass on old or unusable things for free.
-- A completed giveaway is only rewarded after both sides confirm the handover.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.giveaways (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  giver_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '',
  condition text not null default 'unusable'
    check (condition in ('unusable', 'worn', 'good')),
  category_id uuid references public.item_categories(id) on delete set null,
  photo_path text not null default '/demo/item-placeholder.svg',
  handover_location text not null default 'Shared township space',
  handover_notes text not null default '',
  status text not null default 'active'
    check (status in ('active', 'reserved', 'completed', 'cancelled')),
  taker_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  giver_confirmed_at timestamptz,
  taker_confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint giveaway_taker_is_not_giver check (taker_id is null or taker_id <> giver_id)
);

create index if not exists giveaways_township_status_idx
  on public.giveaways (township_id, status, created_at desc);
create index if not exists giveaways_giver_idx
  on public.giveaways (giver_id, status, created_at desc);
create index if not exists giveaways_taker_idx
  on public.giveaways (taker_id, status, created_at desc);
create unique index if not exists giveaways_reserved_taker_uidx
  on public.giveaways (taker_id)
  where status = 'reserved' and taker_id is not null;

alter table public.giveaways enable row level security;

drop policy if exists giveaways_select_member on public.giveaways;
create policy giveaways_select_member on public.giveaways
  for select to authenticated
  using (
    public.is_active_member(township_id)
    or giver_id = auth.uid()
    or taker_id = auth.uid()
    or public.is_township_admin(township_id)
  );

revoke all on public.giveaways from anon, authenticated;
grant select on public.giveaways to authenticated;

-- ---------------------------------------------------------------------------
-- Reward rules
-- ---------------------------------------------------------------------------

insert into public.reward_rules (
  township_id,
  action_type,
  category_slug,
  points,
  daily_cap,
  weekly_cap,
  active,
  reason_template
)
values
  (null, 'giveaway_given', null, 3, 3, 10, true, 'Giveaway completed by both sides'),
  (null, 'giveaway_taken', null, 3, 3, 10, true, 'Giveaway received and confirmed by both sides')
on conflict (township_id, action_type, category_slug) do update
set points = excluded.points,
    daily_cap = excluded.daily_cap,
    weekly_cap = excluded.weekly_cap,
    active = excluded.active,
    reason_template = excluded.reason_template;

-- ---------------------------------------------------------------------------
-- Resident-facing functions
-- ---------------------------------------------------------------------------

create or replace function public.create_giveaway(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := (p_payload->>'township_id')::uuid;
  v_category_id uuid := nullif(p_payload->>'category_id', '')::uuid;
  v_title text := trim(coalesce(p_payload->>'title', ''));
  v_description text := trim(coalesce(p_payload->>'description', ''));
  v_condition text := coalesce(p_payload->>'condition', 'unusable');
  v_handover_location text := nullif(trim(coalesce(p_payload->>'handover_location', '')), '');
  v_handover_notes text := trim(coalesce(p_payload->>'handover_notes', ''));
  v_photo_path text := nullif(trim(coalesce(p_payload->>'photo_path', '')), '');
  v_active_count integer;
  v_giveaway_id uuid;
begin
  if v_user_id is null or not public.is_active_member(v_township_id) then
    raise exception 'not_active_member';
  end if;

  if char_length(v_title) < 3 or char_length(v_title) > 120 then
    raise exception 'invalid_title';
  end if;

  if char_length(v_description) > 1000 then
    raise exception 'invalid_description';
  end if;

  if v_condition not in ('unusable', 'worn', 'good') then
    raise exception 'invalid_condition';
  end if;

  if v_category_id is not null and not exists (
    select 1 from public.item_categories where id = v_category_id
  ) then
    raise exception 'invalid_category';
  end if;

  select count(*)
  into v_active_count
  from public.giveaways
  where giver_id = v_user_id
    and status in ('active', 'reserved');

  if v_active_count >= 5 then
    raise exception 'giveaway_listing_limit';
  end if;

  insert into public.giveaways (
    township_id,
    giver_id,
    title,
    description,
    condition,
    category_id,
    photo_path,
    handover_location,
    handover_notes,
    status
  )
  values (
    v_township_id,
    v_user_id,
    v_title,
    v_description,
    v_condition,
    v_category_id,
    coalesce(v_photo_path, '/demo/item-placeholder.svg'),
    coalesce(v_handover_location, 'Shared township space'),
    v_handover_notes,
    'active'
  )
  returning id into v_giveaway_id;

  return jsonb_build_object('giveaway_id', v_giveaway_id, 'status', 'active');
end;
$$;

create or replace function public.claim_giveaway(p_giveaway_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_giveaway public.giveaways%rowtype;
  v_active_claims integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_giveaway
  from public.giveaways
  where id = p_giveaway_id
  for update;

  if not found or v_giveaway.status <> 'active' then
    raise exception 'giveaway_not_available';
  end if;

  if v_giveaway.giver_id = v_user_id then
    raise exception 'cannot_claim_own_giveaway';
  end if;

  if not public.is_active_member(v_giveaway.township_id) then
    raise exception 'not_active_member';
  end if;

  select count(*)
  into v_active_claims
  from public.giveaways
  where taker_id = v_user_id
    and status = 'reserved';

  if v_active_claims >= 1 then
    raise exception 'giveaway_claim_limit';
  end if;

  update public.giveaways
  set status = 'reserved',
      taker_id = v_user_id,
      claimed_at = now(),
      giver_confirmed_at = null,
      taker_confirmed_at = null,
      updated_at = now()
  where id = v_giveaway.id;

  return jsonb_build_object(
    'giveaway_id',
    v_giveaway.id,
    'status',
    'reserved',
    'taker_id',
    v_user_id
  );
end;
$$;

create or replace function public.transition_giveaway(
  p_giveaway_id uuid,
  p_action text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_giveaway public.giveaways%rowtype;
  v_category_slug text;
  v_given jsonb;
  v_taken jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  if p_action not in ('confirm_handover', 'cancel_claim', 'withdraw') then
    raise exception 'invalid_giveaway_action';
  end if;

  select * into v_giveaway
  from public.giveaways
  where id = p_giveaway_id
  for update;

  if not found or v_giveaway.status = 'cancelled' then
    raise exception 'giveaway_not_available';
  end if;

  if not public.is_active_member(v_giveaway.township_id) then
    raise exception 'not_active_member';
  end if;

  if p_action = 'withdraw' then
    if v_giveaway.giver_id <> v_user_id or v_giveaway.status <> 'active' then
      raise exception 'transition_not_allowed';
    end if;

    update public.giveaways
    set status = 'cancelled',
        updated_at = now()
    where id = v_giveaway.id;

    return jsonb_build_object('giveaway_id', v_giveaway.id, 'status', 'cancelled');
  end if;

  if p_action = 'cancel_claim' then
    if v_giveaway.status <> 'reserved'
      or v_user_id not in (v_giveaway.giver_id, v_giveaway.taker_id) then
      raise exception 'transition_not_allowed';
    end if;

    update public.giveaways
    set status = 'active',
        taker_id = null,
        claimed_at = null,
        giver_confirmed_at = null,
        taker_confirmed_at = null,
        updated_at = now()
    where id = v_giveaway.id;

    return jsonb_build_object('giveaway_id', v_giveaway.id, 'status', 'active');
  end if;

  if v_giveaway.status <> 'reserved'
    or v_user_id not in (v_giveaway.giver_id, v_giveaway.taker_id) then
    raise exception 'transition_not_allowed';
  end if;

  if v_user_id = v_giveaway.giver_id then
    update public.giveaways
    set giver_confirmed_at = coalesce(giver_confirmed_at, now()),
        updated_at = now()
    where id = v_giveaway.id;
  else
    update public.giveaways
    set taker_confirmed_at = coalesce(taker_confirmed_at, now()),
        updated_at = now()
    where id = v_giveaway.id;
  end if;

  select c.slug into v_category_slug
  from public.giveaways g
  left join public.item_categories c on c.id = g.category_id
  where g.id = v_giveaway.id;

  if exists (
    select 1
    from public.giveaways
    where id = v_giveaway.id
      and giver_confirmed_at is not null
      and taker_confirmed_at is not null
  ) then
    update public.giveaways
    set status = 'completed',
        completed_at = coalesce(completed_at, now()),
        updated_at = now()
    where id = v_giveaway.id
    returning * into v_giveaway;

    v_given := public.award_points(
      v_giveaway.giver_id,
      v_giveaway.township_id,
      'giveaway_given',
      'giveaway',
      v_giveaway.id,
      v_category_slug,
      jsonb_build_object('title', v_giveaway.title, 'taker_id', v_giveaway.taker_id),
      now()
    );

    v_taken := public.award_points(
      v_giveaway.taker_id,
      v_giveaway.township_id,
      'giveaway_taken',
      'giveaway',
      v_giveaway.id,
      v_category_slug,
      jsonb_build_object('title', v_giveaway.title, 'giver_id', v_giveaway.giver_id),
      now()
    );

    return jsonb_build_object(
      'giveaway_id',
      v_giveaway.id,
      'status',
      'completed',
      'giver_points',
      v_given,
      'taker_points',
      v_taken
    );
  end if;

  return jsonb_build_object('giveaway_id', v_giveaway.id, 'status', 'reserved');
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke execute on function public.create_giveaway(jsonb) from public, anon, authenticated, service_role;
revoke execute on function public.claim_giveaway(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.transition_giveaway(uuid, text, jsonb) from public, anon, authenticated, service_role;

grant execute on function public.create_giveaway(jsonb) to authenticated;
grant execute on function public.claim_giveaway(uuid) to authenticated;
grant execute on function public.transition_giveaway(uuid, text, jsonb) to authenticated;
