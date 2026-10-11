create table if not exists public.equipment_hubs (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  name text not null,
  location_text text not null,
  staff_user_id uuid references auth.users(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (township_id, name)
);

create table if not exists public.hub_inventory (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.equipment_hubs(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  checkout_status text not null default 'available' check (checkout_status in ('available', 'checked_out', 'maintenance')),
  checked_out_to uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (hub_id, item_id)
);

alter table public.equipment_hubs enable row level security;
alter table public.hub_inventory enable row level security;

create policy equipment_hubs_select_member on public.equipment_hubs
  for select to authenticated using (public.is_active_member(township_id));
create policy hub_inventory_select_member on public.hub_inventory
  for select to authenticated using (
    exists (
      select 1 from public.equipment_hubs h
      where h.id = hub_id and public.is_active_member(h.township_id)
    )
  );

revoke all on public.equipment_hubs, public.hub_inventory from anon, authenticated;
grant select on public.equipment_hubs, public.hub_inventory to authenticated;

create or replace function public.create_equipment_hub(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := (p_payload->>'township_id')::uuid;
  v_hub_id uuid;
begin
  if v_user_id is null or not public.has_role(v_township_id, array['township_admin', 'organiser']) then
    raise exception 'not_allowed';
  end if;

  insert into public.equipment_hubs (township_id, name, location_text, staff_user_id)
  values (v_township_id, trim(p_payload->>'name'), coalesce(p_payload->>'location_text', 'Shared township space'), v_user_id)
  returning id into v_hub_id;

  return jsonb_build_object('hub_id', v_hub_id);
end;
$$;

create or replace function public.add_hub_inventory(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_hub_id uuid := (p_payload->>'hub_id')::uuid;
  v_item_id uuid := (p_payload->>'item_id')::uuid;
  v_hub public.equipment_hubs%rowtype;
  v_inventory_id uuid;
begin
  select * into v_hub from public.equipment_hubs where id = v_hub_id for update;
  if not found or v_user_id is null or not public.has_role(v_hub.township_id, array['township_admin', 'organiser']) then
    raise exception 'not_allowed';
  end if;
  if not exists (select 1 from public.items where id = v_item_id and township_id = v_hub.township_id and owner_id = v_user_id) then
    raise exception 'item_not_available';
  end if;

  insert into public.hub_inventory (hub_id, item_id, quantity)
  values (v_hub_id, v_item_id, coalesce((p_payload->>'quantity')::integer, 1))
  on conflict (hub_id, item_id) do update set quantity = excluded.quantity, updated_at = now()
  returning id into v_inventory_id;

  return jsonb_build_object('inventory_id', v_inventory_id);
end;
$$;

create or replace function public.checkout_hub_inventory(p_inventory_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_inventory public.hub_inventory%rowtype;
  v_hub public.equipment_hubs%rowtype;
begin
  select * into v_inventory from public.hub_inventory where id = p_inventory_id for update;
  if found then
    select * into v_hub from public.equipment_hubs where id = v_inventory.hub_id;
  end if;

  if not found or v_user_id is null or not public.is_active_member(v_hub.township_id) then
    raise exception 'not_allowed';
  end if;
  if v_inventory.checkout_status <> 'available' then
    raise exception 'inventory_unavailable';
  end if;

  update public.hub_inventory
  set checkout_status = 'checked_out', checked_out_to = v_user_id, due_at = now() + interval '3 days', updated_at = now()
  where id = v_inventory.id;

  return jsonb_build_object('inventory_id', v_inventory.id, 'status', 'checked_out', 'due_at', now() + interval '3 days');
end;
$$;

grant execute on function public.create_equipment_hub(jsonb), public.add_hub_inventory(jsonb), public.checkout_hub_inventory(uuid) to authenticated;
