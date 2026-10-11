create table if not exists public.partner_accounts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (partner_id, user_id)
);

alter table public.partner_accounts enable row level security;

create policy partner_accounts_select_own on public.partner_accounts
  for select to authenticated using (user_id = auth.uid());

revoke all on public.partner_accounts from anon, authenticated;
grant select on public.partner_accounts to authenticated;

create or replace function public.get_partner_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_account public.partner_accounts%rowtype;
  v_partner public.partners%rowtype;
begin
  select * into v_account from public.partner_accounts where user_id = auth.uid() and active = true limit 1;
  if not found then
    return jsonb_build_object('error', 'partner_account_not_found');
  end if;

  select * into v_partner from public.partners where id = v_account.partner_id;
  return jsonb_build_object(
    'partner_account_id', v_account.id,
    'partner_id', v_partner.id,
    'township_id', v_partner.township_id,
    'partner_name', v_partner.name
  );
end;
$$;

create or replace function public.create_partner_reward(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_context jsonb := public.get_partner_context();
  v_reward_id uuid;
begin
  if v_context->>'error' is not null then
    raise exception 'partner_account_not_found';
  end if;
  if coalesce((p_payload->>'title')::text, '') = '' or coalesce((p_payload->>'cost_bp')::integer, 0) <= 0 then
    raise exception 'invalid_reward';
  end if;

  insert into public.rewards (township_id, partner_id, title, description, kind, cost_bp, unit_cost_rm, funded_by, stock, per_user_limit, valid_until, active)
  values (
    (v_context->>'township_id')::uuid,
    (v_context->>'partner_id')::uuid,
    trim(p_payload->>'title'),
    coalesce(p_payload->>'description', ''),
    coalesce(p_payload->>'kind', 'voucher'),
    (p_payload->>'cost_bp')::integer,
    coalesce((p_payload->>'unit_cost_rm')::numeric, 0),
    'sponsor',
    coalesce((p_payload->>'stock')::integer, 10),
    coalesce((p_payload->>'per_user_limit')::integer, 1),
    nullif(p_payload->>'valid_until', '')::date,
    true
  )
  returning id into v_reward_id;

  return jsonb_build_object('reward_id', v_reward_id);
end;
$$;

create or replace function public.create_partner_challenge(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_context jsonb := public.get_partner_context();
  v_challenge_id uuid;
begin
  if v_context->>'error' is not null then
    raise exception 'partner_account_not_found';
  end if;
  if coalesce((p_payload->>'title')::text, '') = '' or coalesce((p_payload->>'target')::integer, 0) <= 0 then
    raise exception 'invalid_challenge';
  end if;

  insert into public.challenges (township_id, title, description, scope, action_types, category_slug, target, starts_at, ends_at, reward_points, partner_id, status)
  values (
    (v_context->>'township_id')::uuid,
    trim(p_payload->>'title'),
    coalesce(p_payload->>'description', ''),
    coalesce(p_payload->>'scope', 'individual'),
    coalesce(
      array(select jsonb_array_elements_text(p_payload->'action_types')),
      array['event_attendance']
    ),
    nullif(p_payload->>'category_slug', ''),
    (p_payload->>'target')::integer,
    coalesce((p_payload->>'starts_at')::timestamptz, now()),
    coalesce((p_payload->>'ends_at')::timestamptz, now() + interval '30 days'),
    coalesce((p_payload->>'reward_points')::integer, 0),
    (v_context->>'partner_id')::uuid,
    'active'
  )
  returning id into v_challenge_id;

  return jsonb_build_object('challenge_id', v_challenge_id);
end;
$$;

create or replace function public.partner_stats(p_partner_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_context jsonb := public.get_partner_context();
  v_rewards integer;
  v_redemptions integer;
  v_challenges integer;
begin
  if v_context->>'error' is not null or (v_context->>'partner_id')::uuid <> p_partner_id then
    raise exception 'partner_account_not_found';
  end if;

  select count(*) into v_rewards from public.rewards where partner_id = p_partner_id and active = true;
  select count(*) into v_redemptions from public.redemptions where reward_id in (select id from public.rewards where partner_id = p_partner_id) and status <> 'expired';
  select count(*) into v_challenges from public.challenges where partner_id = p_partner_id;

  return jsonb_build_object(
    'partner_id', p_partner_id,
    'active_rewards', v_rewards,
    'redemptions', v_redemptions,
    'challenges', v_challenges,
    'privacy_note', 'Aggregate partner stats only; no resident-level activity is exposed.'
  );
end;
$$;

grant execute on function public.get_partner_context(), public.create_partner_reward(jsonb), public.create_partner_challenge(jsonb), public.partner_stats(uuid) to authenticated;
