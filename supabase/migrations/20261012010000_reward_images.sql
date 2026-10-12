alter table public.rewards
  add column if not exists image_path text;

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

  insert into public.rewards (
    township_id, partner_id, title, description, kind, cost_bp, unit_cost_rm,
    funded_by, stock, per_user_limit, valid_until, active, image_path
  )
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
    true,
    nullif(p_payload->>'image_path', '')
  )
  returning id into v_reward_id;

  return jsonb_build_object('reward_id', v_reward_id);
end;
$$;
