-- ---------------------------------------------------------------------------
-- Rewards, challenges and community engagement
-- ---------------------------------------------------------------------------

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  name text not null,
  description text not null default '',
  logo_path text,
  created_at timestamptz not null default now(),
  unique (township_id, name)
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  title text not null,
  description text not null default '',
  kind text not null default 'voucher' check (kind in ('voucher', 'event_perk', 'amenity')),
  cost_bp integer not null check (cost_bp > 0),
  unit_cost_rm numeric(10,2) not null default 0,
  funded_by text not null default 'operator' check (funded_by in ('operator', 'sponsor')),
  stock integer not null default 10 check (stock >= 0),
  per_user_limit integer not null default 1 check (per_user_limit > 0),
  valid_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (township_id, title)
);

create index if not exists rewards_township_active_idx
  on public.rewards (township_id, active, cost_bp);

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  township_id uuid not null references public.townships(id) on delete cascade,
  code text not null unique,
  status text not null default 'issued' check (status in ('issued', 'used', 'expired')),
  cost_bp integer not null check (cost_bp > 0),
  valid_until date,
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists redemptions_user_township_idx
  on public.redemptions (user_id, township_id, status);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  title text not null,
  description text not null default '',
  scope text not null default 'individual' check (scope in ('individual', 'community')),
  action_types text[] not null default '{}',
  category_slug text,
  target integer not null check (target > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  reward_points integer not null default 0,
  partner_id uuid references public.partners(id) on delete set null,
  status text not null default 'active' check (status in ('draft', 'active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (township_id, title)
);

create table if not exists public.challenge_progress (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  contribution integer not null default 0 check (contribution >= 0),
  completed_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (township_id, title)
);

create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  details text not null default '',
  kind text not null default 'other' check (kind in ('errand', 'tech_help', 'transport', 'companionship', 'home_help', 'other')),
  neighbourhood_id uuid references public.neighbourhoods(id) on delete set null,
  needed_by date,
  status text not null default 'open' check (status in ('open', 'accepted', 'completed', 'cancelled')),
  helper_id uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (township_id, requester_id, title)
);

create table if not exists public.interest_groups (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  unique (township_id, name)
);

create table if not exists public.group_members (
  group_id uuid not null references public.interest_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  opened_by uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolution text check (resolution is null or resolution in ('completed', 'closed')),
  resolution_note text,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('item', 'event', 'help_request', 'message', 'profile')),
  target_id uuid not null,
  reason text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.programme_costs (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  month date not null,
  label text not null,
  amount_rm numeric(10,2) not null check (amount_rm >= 0),
  created_at timestamptz not null default now(),
  unique (township_id, month, label)
);

create table if not exists public.pilot_baselines (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  metric text not null,
  value numeric(14,2) not null,
  period_label text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (township_id, metric, period_label)
);

alter table public.partners enable row level security;
alter table public.rewards enable row level security;
alter table public.redemptions enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_progress enable row level security;
alter table public.announcements enable row level security;
alter table public.help_requests enable row level security;
alter table public.interest_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.disputes enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.programme_costs enable row level security;
alter table public.pilot_baselines enable row level security;

create policy partners_select_member on public.partners
  for select to authenticated using (public.is_active_member(township_id));
create policy rewards_select_member on public.rewards
  for select to authenticated using (public.is_active_member(township_id) and active = true);
create policy redemptions_select_own on public.redemptions
  for select to authenticated using (user_id = auth.uid());
create policy redemptions_select_admin on public.redemptions
  for select to authenticated using (public.is_township_admin(township_id));
create policy challenges_select_member on public.challenges
  for select to authenticated using (public.is_active_member(township_id));
create policy challenge_progress_select_own on public.challenge_progress
  for select to authenticated using (user_id = auth.uid());
create policy announcements_select_member on public.announcements
  for select to authenticated using (public.is_active_member(township_id));
create policy help_requests_select_member on public.help_requests
  for select to authenticated using (public.is_active_member(township_id) and hidden = false);
create policy interest_groups_select_member on public.interest_groups
  for select to authenticated using (public.is_active_member(township_id));
create policy group_members_select_own on public.group_members
  for select to authenticated using (user_id = auth.uid());
create policy disputes_select_participant on public.disputes
  for select to authenticated using (public.is_booking_participant(booking_id));
create policy reports_select_own_or_admin on public.reports
  for select to authenticated using (reporter_id = auth.uid() or public.is_township_admin(township_id));
create policy blocks_select_own on public.blocks
  for select to authenticated using (blocker_id = auth.uid() or blocked_id = auth.uid());
create policy programme_costs_select_admin on public.programme_costs
  for select to authenticated using (public.is_township_admin(township_id));
create policy pilot_baselines_select_admin on public.pilot_baselines
  for select to authenticated using (public.is_township_admin(township_id));

revoke all on public.partners, public.rewards, public.redemptions, public.challenges,
  public.challenge_progress, public.announcements, public.help_requests,
  public.interest_groups, public.group_members, public.disputes, public.reports,
  public.blocks, public.programme_costs, public.pilot_baselines
from anon, authenticated;
grant select on public.partners, public.rewards, public.redemptions, public.challenges,
  public.challenge_progress, public.announcements, public.help_requests,
  public.interest_groups, public.group_members, public.disputes, public.reports,
  public.blocks, public.programme_costs, public.pilot_baselines
to authenticated;

-- Reference rewards for the demo catalogue.
insert into public.partners (township_id, name, description)
select t.id, p.name, p.description
from public.townships t
cross join (values
  ('Kopi Kita', 'Fictional neighbourhood café partner.'),
  ('Harmoni Sports Club', 'Fictional township amenity partner.'),
  ('Rimba Garden', 'Fictional community garden partner.')
) as p(name, description)
where t.slug = 'harmoni-heights-demo'
on conflict (township_id, name) do nothing;

insert into public.rewards (township_id, partner_id, title, description, kind, cost_bp, unit_cost_rm, funded_by, stock, per_user_limit, valid_until, active)
select t.id, p.id, r.title, r.description, r.kind, r.cost_bp, r.unit_cost_rm, r.funded_by, r.stock, r.per_user_limit, current_date + interval '90 days', true
from public.townships t
join public.partners p on p.township_id = t.id
cross join (values
  ('Kopi Kita voucher', 'A drink at the fictional Kopi Kita café.', 'voucher', 300, 8.00, 'sponsor', 20, 1),
  ('Clubhouse badminton hour', 'One hour on a fictional badminton court.', 'amenity', 500, 0.00, 'operator', 10, 1),
  ('Community garden compost bag', 'A bag of compost from the fictional garden.', 'amenity', 200, 5.00, 'sponsor', 15, 2)
) as r(title, description, kind, cost_bp, unit_cost_rm, funded_by, stock, per_user_limit)
where t.slug = 'harmoni-heights-demo'
  and (
    (p.name = 'Kopi Kita' and r.title = 'Kopi Kita voucher')
    or (p.name = 'Harmoni Sports Club' and r.title = 'Clubhouse badminton hour')
    or (p.name = 'Rimba Garden' and r.title = 'Community garden compost bag')
  )
on conflict do nothing;

insert into public.challenges (township_id, title, description, scope, action_types, target, starts_at, ends_at, reward_points, status)
select t.id, c.title, c.description, c.scope, c.action_types, c.target, now() - interval '30 days', now() + interval '30 days', c.reward_points, 'active'
from public.townships t
cross join (values
  ('Two verified events this month', 'Join two events in the next 30 days.', 'individual', array['event_attendance'], 2, 100),
  ('100 township loans', 'The township completes 100 verified borrows.', 'community', array['item_lent_completed'], 100, 200)
) as c(title, description, scope, action_types, target, reward_points)
where t.slug = 'harmoni-heights-demo'
on conflict do nothing;

insert into public.announcements (township_id, author_id, title, body, pinned)
select t.id, u.id, 'Welcome to Harmoni Heights', 'BorrowLah is a fictional demo township. Meet in shared spaces and look out for one another.', true
from public.townships t
join auth.users u on u.email = 'office@borrowlah.demo'
where t.slug = 'harmoni-heights-demo'
on conflict do nothing;

insert into public.help_requests (township_id, requester_id, title, details, kind, needed_by, status)
select t.id, u.id, 'Help carry groceries', 'A short helping request for the demo community tab.', 'errand', current_date + 2, 'open'
from public.townships t
join auth.users u on u.email = 'siti@borrowlah.demo'
where t.slug = 'harmoni-heights-demo'
on conflict do nothing;

insert into public.interest_groups (township_id, name, description)
select t.id, g.name, g.description
from public.townships t
cross join (values
  ('Community garden', 'Grow, share and learn together.'),
  ('Weekend sports', 'Casual sports and fitness meetups.')
) as g(name, description)
where t.slug = 'harmoni-heights-demo'
on conflict (township_id, name) do nothing;

insert into public.reward_rules (township_id, action_type, category_slug, points)
select t.id, 'challenge_completed', null, 200
from public.townships t
where t.slug = 'harmoni-heights-demo'
on conflict (township_id, action_type, category_slug) do nothing;

create or replace function public.update_challenge_progress(
  p_user_id uuid,
  p_township_id uuid,
  p_action_type text,
  p_category_slug text default null,
  p_occurred_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_challenge record;
  v_progress public.challenge_progress%rowtype;
  v_award jsonb;
begin
  for v_challenge in
    select *
    from public.challenges
    where township_id = p_township_id
      and status = 'active'
      and scope = 'individual'
      and p_occurred_at between starts_at and ends_at
      and p_action_type = any (action_types)
      and (category_slug is null or category_slug = p_category_slug)
  loop
    select * into v_progress
    from public.challenge_progress
    where challenge_id = v_challenge.id and user_id = p_user_id
    for update;

    if not found then
      insert into public.challenge_progress (challenge_id, user_id, contribution)
      values (v_challenge.id, p_user_id, 1)
      returning * into v_progress;
    elsif v_progress.completed_at is null then
      update public.challenge_progress
      set contribution = contribution + 1
      where id = v_progress.id
      returning * into v_progress;
    end if;

    if v_progress.completed_at is null and v_progress.contribution >= v_challenge.target then
      update public.challenge_progress
      set completed_at = p_occurred_at
      where id = v_progress.id;

      v_award := public.award_points(
        p_user_id,
        p_township_id,
        'challenge_completed',
        'challenge',
        v_challenge.id,
        null,
        jsonb_build_object('challenge_id', v_challenge.id),
        p_occurred_at
      );

      if v_award is not null then
        update public.challenge_progress
        set rewarded_at = p_occurred_at
        where id = v_progress.id;
      end if;
    end if;
  end loop;
end;
$$;

create or replace function public.redeem_reward(p_reward_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_reward public.rewards%rowtype;
  v_township public.townships%rowtype;
  v_balance integer;
  v_used_count integer;
  v_code text;
  v_redemption_id uuid;
  v_ledger_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_reward from public.rewards where id = p_reward_id for update;
  if not found or not v_reward.active or v_reward.stock <= 0 then
    raise exception 'reward_unavailable';
  end if;

  select * into v_township from public.townships where id = v_reward.township_id;
  if not v_township.rewards_enabled or not public.is_active_member(v_reward.township_id) then
    raise exception 'not_active_member';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':redemption'));

  select coalesce(sum(delta), 0) into v_balance
  from public.points_ledger
  where user_id = v_user_id and township_id = v_reward.township_id;

  if v_balance < v_reward.cost_bp then
    raise exception 'insufficient_balance';
  end if;

  select count(*) into v_used_count
  from public.redemptions
  where user_id = v_user_id and reward_id = v_reward.id and status <> 'expired';
  if v_used_count >= v_reward.per_user_limit then
    raise exception 'per_user_limit_reached';
  end if;

  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.redemptions where code = v_code);
  end loop;

  insert into public.redemptions (reward_id, user_id, township_id, code, cost_bp, valid_until)
  values (v_reward.id, v_user_id, v_reward.township_id, v_code, v_reward.cost_bp, v_reward.valid_until)
  returning id into v_redemption_id;

  insert into public.points_ledger (township_id, user_id, delta, action_type, source_type, source_id, metadata, created_at)
  values (v_reward.township_id, v_user_id, -v_reward.cost_bp, 'redemption', 'redemption', v_redemption_id, jsonb_build_object('reward_id', v_reward.id), now())
  returning id into v_ledger_id;

  update public.rewards set stock = stock - 1 where id = v_reward.id;

  return jsonb_build_object('redemption_id', v_redemption_id, 'code', v_code, 'ledger_id', v_ledger_id, 'cost_bp', v_reward.cost_bp);
end;
$$;

create or replace function public.mark_redemption_used(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_redemption public.redemptions%rowtype;
begin
  select * into v_redemption from public.redemptions where code = upper(trim(p_code)) for update;
  if not found or v_redemption.status <> 'issued' then
    raise exception 'redemption_not_available';
  end if;
  if not public.is_township_admin(v_redemption.township_id) then
    raise exception 'admin_required';
  end if;

  update public.redemptions
  set status = 'used', used_at = now(), used_by = auth.uid()
  where id = v_redemption.id
  returning * into v_redemption;

  return to_jsonb(v_redemption);
end;
$$;

create or replace function public.create_announcement(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := (p_payload->>'township_id')::uuid;
  v_id uuid;
begin
  if v_user_id is null or not public.has_role(v_township_id, array['organiser', 'township_admin']) then
    raise exception 'not_allowed';
  end if;

  insert into public.announcements (township_id, author_id, title, body, pinned, published_at)
  values (v_township_id, v_user_id, trim(p_payload->>'title'), p_payload->>'body', coalesce((p_payload->>'pinned')::boolean, false), now())
  returning id into v_id;

  return jsonb_build_object('announcement_id', v_id);
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

  insert into public.help_requests (township_id, requester_id, title, details, kind, neighbourhood_id, needed_by)
  values (
    v_township_id,
    v_user_id,
    trim(p_payload->>'title'),
    coalesce(p_payload->>'details', ''),
    coalesce(p_payload->>'kind', 'other'),
    nullif(p_payload->>'neighbourhood_id', '')::uuid,
    nullif(p_payload->>'needed_by', '')::date
  )
  returning id into v_request_id;

  return jsonb_build_object('request_id', v_request_id);
end;
$$;

create or replace function public.join_group(p_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_group public.interest_groups%rowtype;
begin
  select * into v_group from public.interest_groups where id = p_group_id;
  if not found or v_user_id is null or not public.is_active_member(v_group.township_id) then
    raise exception 'group_unavailable';
  end if;

  insert into public.group_members (group_id, user_id)
  values (p_group_id, v_user_id)
  on conflict do nothing;

  return jsonb_build_object('group_id', p_group_id, 'joined', true);
end;
$$;

create or replace function public.leave_group(p_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  delete from public.group_members where group_id = p_group_id and user_id = v_user_id;
  return jsonb_build_object('group_id', p_group_id, 'joined', false);
end;
$$;

create or replace function public.accept_help_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.help_requests%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_request from public.help_requests where id = p_request_id for update;
  if not found or v_request.hidden or v_request.status <> 'open' or v_request.requester_id = v_user_id then
    raise exception 'help_request_unavailable';
  end if;
  if not public.is_active_member(v_request.township_id) then
    raise exception 'not_active_member';
  end if;

  update public.help_requests
  set status = 'accepted', helper_id = v_user_id
  where id = v_request.id
  returning * into v_request;

  return to_jsonb(v_request);
end;
$$;

create or replace function public.complete_help_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.help_requests%rowtype;
  v_points jsonb;
begin
  select * into v_request from public.help_requests where id = p_request_id for update;
  if not found or v_request.requester_id <> v_user_id or v_request.status <> 'accepted' or v_request.helper_id is null then
    raise exception 'help_request_unavailable';
  end if;

  update public.help_requests
  set status = 'completed', completed_at = now()
  where id = v_request.id
  returning * into v_request;

  v_points := public.award_points(
    v_request.helper_id,
    v_request.township_id,
    'help_completed',
    'help_request',
    v_request.id,
    null,
    jsonb_build_object('kind', v_request.kind),
    now()
  );

  return jsonb_build_object('request', to_jsonb(v_request), 'points', v_points);
end;
$$;

create or replace function public.send_booking_message(p_booking_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_message_id uuid;
begin
  if v_user_id is null or not public.is_booking_participant(p_booking_id) then
    raise exception 'not_booking_participant';
  end if;
  if length(trim(coalesce(p_body, ''))) = 0 or length(p_body) > 1200 then
    raise exception 'invalid_message';
  end if;

  insert into public.booking_messages (booking_id, sender_id, body)
  values (p_booking_id, v_user_id, trim(p_body))
  returning id into v_message_id;

  return jsonb_build_object('message_id', v_message_id);
end;
$$;

create or replace function public.create_report(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := (p_payload->>'township_id')::uuid;
  v_target_type text := p_payload->>'target_type';
  v_target_id uuid := (p_payload->>'target_id')::uuid;
  v_report_id uuid;
  v_open_count integer;
begin
  if v_user_id is null or not public.is_active_member(v_township_id) then
    raise exception 'not_active_member';
  end if;
  if v_target_type not in ('item', 'event', 'help_request', 'message', 'profile') then
    raise exception 'invalid_report_target';
  end if;

  insert into public.reports (township_id, reporter_id, target_type, target_id, reason, details)
  values (v_township_id, v_user_id, v_target_type, v_target_id, coalesce(p_payload->>'reason', 'other'), coalesce(p_payload->>'details', ''))
  returning id into v_report_id;

  select count(*) into v_open_count
  from public.reports
  where township_id = v_township_id and target_type = v_target_type and target_id = v_target_id and status = 'open';

  if v_open_count >= 3 then
    if v_target_type = 'item' then
      update public.items set hidden = true where id = v_target_id;
    elsif v_target_type = 'event' then
      update public.events set hidden = true where id = v_target_id;
    elsif v_target_type = 'help_request' then
      update public.help_requests set hidden = true where id = v_target_id;
    end if;
  end if;

  return jsonb_build_object('report_id', v_report_id, 'open_count', v_open_count);
end;
$$;

create or replace function public.block_user(p_blocked_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or v_user_id = p_blocked_id then
    raise exception 'invalid_block';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (v_user_id, p_blocked_id)
  on conflict do nothing;

  return jsonb_build_object('blocked_id', p_blocked_id);
end;
$$;

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

  return jsonb_build_object('expired_bookings', v_expired, 'completed_events', v_completed, 'expired_vouchers', v_vouchers);
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_notification public.notifications%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  update public.notifications
  set read_at = coalesce(read_at, now())
  where id = p_notification_id and user_id = v_user_id
  returning * into v_notification;

  if not found then
    raise exception 'notification_not_found';
  end if;

  return to_jsonb(v_notification);
end;
$$;

create or replace function public.approve_member(p_member_id uuid, p_approve boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.township_members%rowtype;
begin
  select * into v_member from public.township_members where id = p_member_id for update;
  if not found or not public.is_township_admin(v_member.township_id) then
    raise exception 'admin_required';
  end if;

  update public.township_members
  set status = case when p_approve then 'active' else 'rejected' end,
      approved_by = auth.uid(),
      approved_at = case when p_approve then now() else null end
  where id = p_member_id
  returning * into v_member;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_member.township_id, auth.uid(), case when p_approve then 'member_approved' else 'member_rejected' end, 'township_member', v_member.id, jsonb_build_object('user_id', v_member.user_id));

  return to_jsonb(v_member);
end;
$$;

create or replace function public.moderate_report(p_report_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.reports%rowtype;
begin
  select * into v_report from public.reports where id = p_report_id for update;
  if not found or not public.is_township_admin(v_report.township_id) then
    raise exception 'admin_required';
  end if;
  if p_action not in ('dismiss', 'hide', 'actioned') then
    raise exception 'invalid_moderation_action';
  end if;

  update public.reports
  set status = case when p_action = 'dismiss' then 'dismissed' else 'actioned' end,
      resolved_by = auth.uid(),
      resolution_note = p_action
  where id = v_report.id
  returning * into v_report;

  if p_action = 'hide' then
    if v_report.target_type = 'item' then
      update public.items set hidden = true where id = v_report.target_id;
    elsif v_report.target_type = 'event' then
      update public.events set hidden = true where id = v_report.target_id;
    elsif v_report.target_type = 'help_request' then
      update public.help_requests set hidden = true where id = v_report.target_id;
    end if;
  end if;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_report.township_id, auth.uid(), 'report_' || p_action, 'report', v_report.id, jsonb_build_object('target_type', v_report.target_type, 'target_id', v_report.target_id));

  return to_jsonb(v_report);
end;
$$;

grant execute on function public.is_active_member(uuid), public.has_role(uuid, text[]), public.is_township_admin(uuid), public.is_event_staff(uuid), public.can_read_event(uuid), public.is_booking_participant(uuid) to authenticated;
grant execute on function public.redeem_reward(uuid), public.mark_redemption_used(text), public.create_announcement(jsonb), public.create_help_request(jsonb), public.join_group(uuid), public.leave_group(uuid), public.accept_help_request(uuid), public.complete_help_request(uuid), public.send_booking_message(uuid, text), public.create_report(jsonb), public.block_user(uuid), public.mark_notification_read(uuid), public.approve_member(uuid, boolean), public.moderate_report(uuid, text) to authenticated;
grant execute on function public.run_scheduled_jobs(), public.update_challenge_progress(uuid, uuid, text, text, timestamptz) to service_role;
