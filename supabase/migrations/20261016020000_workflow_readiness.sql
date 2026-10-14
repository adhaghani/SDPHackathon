-- Separate private deduplication from anonymous search telemetry.
-- No client (including an admin) can query resident search identities.
create table public.borrow_demand_residents (
  township_id uuid not null references public.townships(id) on delete cascade,
  resident_id uuid not null references auth.users(id) on delete cascade,
  normalized_term text not null,
  category_id uuid references public.item_categories(id) on delete cascade,
  last_searched_at timestamptz not null default now(),
  unique nulls not distinct (township_id, resident_id, normalized_term, category_id)
);
alter table public.borrow_demand_residents enable row level security;
revoke all on public.borrow_demand_residents from public, anon, authenticated;

create or replace function public.log_borrow_search(
  p_township_id uuid,
  p_neighbourhood_id uuid default null,
  p_term text default '',
  p_category_id uuid default null,
  p_results_count integer default 0,
  p_available_count integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_search_id uuid;
  v_normalized text;
begin
  if auth.uid() is null or not public.is_active_member(p_township_id) then
    raise exception 'not_active_member';
  end if;

  if p_neighbourhood_id is not null and not exists (
    select 1
    from public.neighbourhoods
    where id = p_neighbourhood_id and township_id = p_township_id
  ) then
    raise exception 'invalid_neighbourhood';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.item_categories where id = p_category_id
  ) then
    raise exception 'invalid_category';
  end if;

  v_normalized := public.normalize_borrow_search_term(p_term);
  insert into public.search_events (
    township_id,
    neighbourhood_id,
    normalized_term,
    category_id,
    results_count,
    available_count
  )
  values (
    p_township_id,
    p_neighbourhood_id,
    v_normalized,
    p_category_id,
    greatest(coalesce(p_results_count, 0), 0),
    greatest(coalesce(p_available_count, 0), 0)
  )
  returning id into v_search_id;

  insert into public.borrow_demand_residents (township_id, resident_id, normalized_term, category_id)
  values (p_township_id, auth.uid(), v_normalized, p_category_id)
  on conflict (township_id, resident_id, normalized_term, category_id)
  do update set last_searched_at = now();

  -- Bound identity retention to the reporting window. Search events stay anonymous.
  delete from public.borrow_demand_residents where last_searched_at < now() - interval '30 days';
  return jsonb_build_object(
    'search_id',
    v_search_id,
    'normalized_term',
    v_normalized,
    'results_count',
    greatest(coalesce(p_results_count, 0), 0),
    'available_count',
    greatest(coalesce(p_available_count, 0), 0)
  );
end;
$$;

create or replace function public.admin_demand_gaps(p_township_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_township_admin(p_township_id) then
    raise exception 'admin_required';
  end if;

  return coalesce(
    jsonb_agg(value order by (value->>'gap')::integer desc, (value->>'searches')::integer desc),
    '[]'::jsonb
  )
  from (
    select jsonb_build_object(
      'key', coalesce(nullif(s.normalized_term, ''), 'category:' || coalesce(c.slug, 'other')),
      'label', coalesce(c.name, nullif(s.normalized_term, ''), 'Other'),
      'category_slug', c.slug,
      'searches', coalesce(s.search_count, 0),
      'unique_residents', d.residents,
      'identity_coverage', case when d.residents is null then 'Legacy demo searches; residents not recorded' else 'Distinct residents in the last 30 days' end,
      'open_requests', coalesce(r.request_count, 0),
      'available_items', coalesce(a.item_count, 0),
      'gap', greatest(
        coalesce(s.search_count, 0) + coalesce(r.request_count, 0) - coalesce(a.item_count, 0),
        0
      )
    ) as value
    from (
      select
        normalized_term,
        category_id,
        count(*) as search_count
      from public.search_events
      where township_id = p_township_id
        and created_at >= now() - interval '30 days'
      group by normalized_term, category_id
      having count(*) >= 5
    ) s
    left join lateral (
      select nullif(count(distinct resident_id), 0) as residents
      from public.borrow_demand_residents d
      where d.township_id = p_township_id
        and d.normalized_term = s.normalized_term
        and d.category_id is not distinct from s.category_id
        and d.last_searched_at >= now() - interval '30 days'
    ) d on true
    left join public.item_categories c on c.id = s.category_id
    left join lateral (
      select count(*) as request_count
      from public.item_requests r
      where r.township_id = p_township_id
        and r.status in ('open', 'offered')
        and (
          case
            when s.category_id is not null then r.category_id = s.category_id
            else s.normalized_term <> '' and lower(r.title) like '%' || s.normalized_term || '%'
          end
        )
    ) r on true
    left join lateral (
      select count(*) as item_count
      from public.items i
      where i.township_id = p_township_id
        and i.status = 'active'
        and i.hidden = false
        and (
          case
            when s.normalized_term <> '' then lower(i.title) like '%' || s.normalized_term || '%'
            else i.category_id = s.category_id
          end
        )
    ) a on true
    where (d.residents >= 5 or (d.residents is null and exists (
      select 1 from public.townships t where t.id = p_township_id and t.is_demo
    ))) and coalesce(s.search_count, 0) + coalesce(r.request_count, 0) - coalesce(a.item_count, 0) > 0
  ) gaps;
end;
$$;

create or replace function public.admin_supply_outcomes(p_township_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_township_admin(p_township_id) then raise exception 'admin_required'; end if;
  return jsonb_build_object(
    'period_days', 30,
    'programme_cost_rm', (select coalesce(sum(amount_rm), 0) from public.programme_costs where township_id = p_township_id and month >= date_trunc('month', now())::date and month < (date_trunc('month', now()) + interval '1 month')::date),
    'categories', (select coalesce(jsonb_agg(row_to_json(x) order by x.category), '[]'::jsonb) from (
      select c.name as category,
        (select count(*) from public.search_events s where s.township_id = p_township_id and s.category_id = c.id and s.created_at >= now() - interval '30 days') as searches,
        (select case when count(distinct resident_id) >= 5 then count(distinct resident_id) else null end from public.borrow_demand_residents d where d.township_id = p_township_id and d.category_id = c.id and d.last_searched_at >= now() - interval '30 days') as unique_residents,
        coalesce(sum(h.quantity), 0) as units_supplied,
        count(distinct i.id) as stocked_listings,
        count(distinct i.id) filter (where exists (select 1 from public.bookings b where b.item_id = i.id and b.status = 'completed' and b.lender_return_confirmed_at >= now() - interval '30 days')) as used_listings,
        (select count(*) from public.bookings b join public.items bi on bi.id = b.item_id where b.township_id = p_township_id and bi.category_id = c.id and b.status = 'completed' and b.lender_return_confirmed_at >= now() - interval '30 days' and exists (select 1 from public.hub_inventory hi where hi.item_id = bi.id)) as completed_loans
      from public.item_categories c
      left join public.items i on i.category_id = c.id and i.township_id = p_township_id and exists (select 1 from public.hub_inventory hi where hi.item_id = i.id)
      left join public.hub_inventory h on h.item_id = i.id
      group by c.id, c.name
    ) x)
  );
end;
$$;
revoke all on function public.admin_supply_outcomes(uuid) from public, anon;
grant execute on function public.admin_supply_outcomes(uuid) to authenticated;
