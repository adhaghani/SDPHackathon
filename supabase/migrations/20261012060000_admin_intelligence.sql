-- Feature Pack v2, Phase 5: demand gaps, verified-source calendars and forecasts.

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_type text not null check (event_type in ('festival', 'school_holiday')),
  starts_on date not null,
  ends_on date not null,
  source_name text not null,
  source_url text not null,
  official_source boolean not null default false,
  verification_status text not null default 'needs_review' check (
    verification_status in ('needs_review', 'verified', 'rejected')
  ),
  verification_note text not null default '',
  created_at timestamptz not null default now(),
  constraint calendar_events_dates_valid check (ends_on >= starts_on),
  unique (name, event_type, starts_on, ends_on)
);

create table if not exists public.festival_uplifts (
  id uuid primary key default gen_random_uuid(),
  calendar_event_id uuid references public.calendar_events(id) on delete cascade,
  festival_slug text not null,
  category_slug text not null,
  default_uplift numeric(6,3) not null check (default_uplift >= 1),
  observed_uplift numeric(6,3) check (observed_uplift is null or observed_uplift >= 1),
  source_name text not null default 'Reviewed default',
  verification_status text not null default 'needs_review' check (
    verification_status in ('needs_review', 'verified', 'rejected')
  ),
  unique (festival_slug, category_slug)
);

create table if not exists public.shared_library_wishlists (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id) on delete cascade,
  category_id uuid references public.item_categories(id) on delete set null,
  normalized_term text not null default '',
  requested_label text not null,
  source_demand_gap_id uuid,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (township_id, category_id, normalized_term)
);

create index if not exists calendar_events_upcoming_idx
  on public.calendar_events (starts_on, ends_on, official_source);
create index if not exists shared_wishlists_township_idx
  on public.shared_library_wishlists (township_id, created_at desc);

alter table public.calendar_events enable row level security;
alter table public.festival_uplifts enable row level security;
alter table public.shared_library_wishlists enable row level security;

drop policy if exists calendar_events_select_member on public.calendar_events;
drop policy if exists festival_uplifts_select_admin on public.festival_uplifts;
drop policy if exists shared_wishlists_select_admin on public.shared_library_wishlists;

create policy calendar_events_select_member on public.calendar_events
  for select to authenticated using (official_source = true);
create policy festival_uplifts_select_admin on public.festival_uplifts
  for select to authenticated using (false);
create policy shared_wishlists_select_admin on public.shared_library_wishlists
  for select to authenticated using (public.is_township_admin(township_id));

revoke all on public.calendar_events, public.festival_uplifts,
  public.shared_library_wishlists from anon, authenticated;
grant select on public.calendar_events to authenticated;
grant select on public.festival_uplifts, public.shared_library_wishlists to authenticated;

insert into public.calendar_events (
  name, event_type, starts_on, ends_on, source_name, source_url, official_source, verification_status
)
values
  ('Tahun Baharu Cina', 'festival', '2026-02-17', '2026-02-18', 'Jabatan Perdana Menteri federal holiday schedule', 'https://www.kabinet.gov.my/storage/2025/08/HKA-2026.pdf', true, 'needs_review'),
  ('Hari Raya Puasa', 'festival', '2026-03-21', '2026-03-22', 'Jabatan Perdana Menteri federal holiday schedule', 'https://www.kabinet.gov.my/storage/2025/08/HKA-2026.pdf', true, 'needs_review'),
  ('Hari Deepavali', 'festival', '2026-11-08', '2026-11-08', 'Jabatan Perdana Menteri federal holiday schedule', 'https://www.kabinet.gov.my/storage/2025/08/HKA-2026.pdf', true, 'needs_review'),
  ('Hari Krismas', 'festival', '2026-12-25', '2026-12-25', 'Jabatan Perdana Menteri federal holiday schedule', 'https://www.kabinet.gov.my/storage/2025/08/HKA-2026.pdf', true, 'needs_review'),
  ('Tahun Baharu Cina', 'festival', '2027-02-06', '2027-02-07', 'Jabatan Perdana Menteri federal holiday schedule', 'https://www.kabinet.gov.my/storage/2026/08/HKA_2027.pdf', true, 'needs_review'),
  ('Hari Raya Puasa', 'festival', '2027-03-10', '2027-03-11', 'Jabatan Perdana Menteri federal holiday schedule', 'https://www.kabinet.gov.my/storage/2026/08/HKA_2027.pdf', true, 'needs_review'),
  ('Hari Deepavali', 'festival', '2027-10-28', '2027-10-28', 'Jabatan Perdana Menteri federal holiday schedule', 'https://www.kabinet.gov.my/storage/2026/08/HKA_2027.pdf', true, 'needs_review'),
  ('Hari Krismas', 'festival', '2027-12-25', '2027-12-25', 'Jabatan Perdana Menteri federal holiday schedule', 'https://www.kabinet.gov.my/storage/2026/08/HKA_2027.pdf', true, 'needs_review'),
  ('School holiday · Group B · Term 1', 'school_holiday', '2026-03-21', '2026-03-29', 'Kementerian Pendidikan Malaysia academic calendar', 'https://www.moe.gov.my/storage/files/shares/Takwim/Takwim%20Persekolahan/Kalendar%20Akademik%202026.pdf', true, 'needs_review'),
  ('School holiday · Group B · Mid-year', 'school_holiday', '2026-05-23', '2026-06-07', 'Kementerian Pendidikan Malaysia academic calendar', 'https://www.moe.gov.my/storage/files/shares/Takwim/Takwim%20Persekolahan/Kalendar%20Akademik%202026.pdf', true, 'needs_review'),
  ('School holiday · Group B · Term 2', 'school_holiday', '2026-08-29', '2026-09-06', 'Kementerian Pendidikan Malaysia academic calendar', 'https://www.moe.gov.my/storage/files/shares/Takwim/Takwim%20Persekolahan/Kalendar%20Akademik%202026.pdf', true, 'needs_review'),
  ('School holiday · Group B · End of year', 'school_holiday', '2026-12-05', '2026-12-31', 'Kementerian Pendidikan Malaysia academic calendar', 'https://www.moe.gov.my/storage/files/shares/Takwim/Takwim%20Persekolahan/Kalendar%20Akademik%202026.pdf', true, 'needs_review')
on conflict (name, event_type, starts_on, ends_on) do nothing;

insert into public.festival_uplifts (festival_slug, category_slug, default_uplift)
values
  ('tahun-baharu-cina', 'events', 2.5),
  ('hari-raya-puasa', 'kitchen', 2.5),
  ('hari-raya-puasa', 'events', 2.5),
  ('hari-deepavali', 'kitchen', 2.5),
  ('hari-deepavali', 'events', 2.5),
  ('hari-krismas', 'kitchen', 2.0),
  ('hari-krismas', 'events', 2.0)
on conflict (festival_slug, category_slug) do nothing;

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
        sum(results_count) as search_count
      from public.search_events
      where township_id = p_township_id
        and created_at >= now() - interval '30 days'
      group by normalized_term, category_id
      having sum(results_count) >= 5
    ) s
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
    where coalesce(s.search_count, 0) + coalesce(r.request_count, 0) - coalesce(a.item_count, 0) > 0
  ) gaps;
end;
$$;

create or replace function public.add_shared_library_wishlist(
  p_category_id uuid default null,
  p_normalized_term text default '',
  p_label text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_township_id uuid;
  v_id uuid;
begin
  select township_id into v_township_id
  from public.township_members
  where user_id = auth.uid() and status = 'active' and role = 'township_admin'
  order by created_at
  limit 1;
  if v_township_id is null then
    raise exception 'admin_required';
  end if;
  if char_length(trim(p_label)) < 2 then
    raise exception 'invalid_wishlist_label';
  end if;

  insert into public.shared_library_wishlists (
    township_id, category_id, normalized_term, requested_label, created_by
  )
  values (
    v_township_id,
    p_category_id,
    public.normalize_borrow_search_term(p_normalized_term),
    trim(p_label),
    auth.uid()
  )
  on conflict (township_id, category_id, normalized_term) do update
  set requested_label = excluded.requested_label,
      created_by = excluded.created_by
  returning id into v_id;

  return jsonb_build_object('wishlist_id', v_id);
end;
$$;

create or replace function public.predictive_demand(p_township_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz := now() - interval '8 weeks';
  v_event public.calendar_events%rowtype;
  v_uplift numeric;
begin
  if auth.uid() is null
     or (
       not public.is_township_admin(p_township_id)
       and not public.is_active_member(p_township_id)
     ) then
    raise exception 'admin_required';
  end if;

  select * into v_event
  from public.calendar_events
  where official_source = true
    and verification_status <> 'rejected'
    and starts_on >= current_date
    and starts_on <= current_date + 14
  order by starts_on
  limit 1;
  if not found then
    return jsonb_build_object('available', false, 'forecasts', '[]'::jsonb);
  end if;

  return (
    select jsonb_build_object(
      'available', true,
      'event', jsonb_build_object(
        'name', v_event.name,
        'starts_on', v_event.starts_on,
        'source_name', v_event.source_name,
        'source_url', v_event.source_url,
        'verification_status', v_event.verification_status
      ),
      'forecasts', coalesce(jsonb_agg(value order by (value->>'forecast')::numeric desc), '[]'::jsonb)
    )
    from (
      select jsonb_build_object(
        'category_slug', b.category_slug,
        'category_name', b.category_name,
        'baseline_weekly_demand', b.baseline,
        'uplift', coalesce(
          u.observed_uplift,
          u.default_uplift,
          case when b.category_slug in ('events', 'kitchen', 'home-tools') then 2.5 else 1.0 end
        ),
        'forecast', round(
          b.baseline * coalesce(
            u.observed_uplift,
            u.default_uplift,
            case when b.category_slug in ('events', 'kitchen', 'home-tools') then 2.5 else 1.0 end
          ),
          1
        ),
        'is_forecast', true
      ) as value
      from (
        select
          c.slug as category_slug,
          c.name as category_name,
          greatest(
            count(distinct b.id) + count(distinct s.id) + count(distinct r.id),
            0
          )::numeric / 8.0 as baseline
        from public.item_categories c
        left join public.bookings b
          on b.township_id = p_township_id
         and b.created_at >= v_start
         and b.item_id in (select id from public.items where category_id = c.id)
        left join public.search_events s
          on s.township_id = p_township_id
         and s.created_at >= v_start
         and s.category_id = c.id
        left join public.item_requests r
          on r.township_id = p_township_id
         and r.created_at >= v_start
         and r.category_id = c.id
        where c.kind = 'item'
        group by c.slug, c.name
      ) b
      left join public.festival_uplifts u
        on u.category_slug = b.category_slug
       and u.festival_slug = case
         when v_event.name = 'Tahun Baharu Cina' then 'tahun-baharu-cina'
         when v_event.name = 'Hari Raya Puasa' then 'hari-raya-puasa'
         when v_event.name = 'Hari Deepavali' then 'hari-deepavali'
         when v_event.name = 'Hari Krismas' then 'hari-krismas'
         else 'school-holiday'
       end
      where coalesce(u.observed_uplift, u.default_uplift,
        case when b.category_slug in ('events', 'kitchen', 'home-tools') then 2.5 else 1.0 end
      ) > 1
      order by baseline desc
      limit 6
    ) forecasts
  );
end;
$$;

create or replace function public.send_forecast_nudges(p_township_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_forecast record;
  v_sent integer := 0;
begin
  if auth.uid() is null or not public.is_active_member(p_township_id) then
    raise exception 'not_active_member';
  end if;

  for v_forecast in
    select * from jsonb_to_recordset(
      public.predictive_demand(p_township_id)->'forecasts'
    ) as x(category_slug text, category_name text, forecast numeric)
  loop
    with notices as (
      insert into public.notifications (user_id, type, title, body, link, dedupe_key)
      select distinct i.owner_id,
        'forecast_nudge',
        'Neighbours may need ' || lower(v_forecast.category_name),
        format('Expect high demand for %s next week. Make yours available?', lower(v_forecast.category_name)),
        '/borrow',
        'forecast:' || p_township_id::text || ':' || v_forecast.category_slug || ':' ||
          to_char(current_date + 7, 'YYYY-MM-DD')
      from public.items i
      join public.item_categories c on c.id = i.category_id
      where i.township_id = p_township_id
        and i.status = 'active'
        and i.hidden = false
        and c.slug = v_forecast.category_slug
        on conflict (user_id, dedupe_key) do nothing
        returning user_id
    )
    select count(*) into v_sent from notices;
  end loop;
  return v_sent;
end;
$$;

revoke execute on function public.admin_demand_gaps(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.add_shared_library_wishlist(uuid, text, text) from public, anon, authenticated, service_role;
revoke execute on function public.predictive_demand(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.send_forecast_nudges(uuid) from public, anon, authenticated, service_role;
grant execute on function public.admin_demand_gaps(uuid) to authenticated;
grant execute on function public.add_shared_library_wishlist(uuid, text, text) to authenticated;
grant execute on function public.predictive_demand(uuid) to authenticated;
grant execute on function public.send_forecast_nudges(uuid) to authenticated;
