begin;

create extension if not exists pgtap;

select plan(17);

select has_table('public', 'calendar_events', 'calendar event table exists');
select has_table('public', 'festival_uplifts', 'festival uplift table exists');
select has_table('public', 'shared_library_wishlists', 'shared wishlist table exists');

select id as intel_township_id from public.townships where slug = 'harmoni-heights-demo' \gset
select id as intel_office_id from auth.users where email = 'office@borrowlah.demo' \gset
select id as intel_aisyah_id from auth.users where email = 'aisyah@borrowlah.demo' \gset
select id as intel_home_tools_id from public.item_categories where slug = 'home-tools' \gset

set local role authenticated;
select is(
  has_table_privilege('authenticated', 'public.calendar_events', 'insert'),
  false,
  'authenticated clients cannot insert calendar dates directly'
);
reset role;
select set_config('request.jwt.claims', '', true);

select is(
  (select count(*)
   from public.calendar_events
   where official_source
     and source_url like 'https://%'
     and source_name <> ''),
  (select count(*) from public.calendar_events),
  'every seeded calendar date has an official source URL and name'
);
select is(
  (select count(*)
   from public.calendar_events
   where event_type = 'school_holiday'
     and starts_on >= '2027-01-01'
     and starts_on < '2028-01-01'),
  0::bigint,
  'unpublished 2027 school dates are not invented'
);

insert into public.search_events (
  township_id, normalized_term, results_count, available_count, is_demo
)
values (:'intel_township_id', 'rare-suppressed-term', 1, 0, true);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'intel_office_id', 'role', 'authenticated')::text,
  true
);
select public.admin_demand_gaps(:'intel_township_id'::uuid) as intel_gaps \gset
select ok(
  jsonb_array_length(:'intel_gaps'::jsonb) > 0,
  'admin demand gaps include seeded search demand'
);

select public.admin_demand_gaps(:'intel_township_id'::uuid) as intel_gaps_after_rare \gset
select is(
  (:'intel_gaps_after_rare'::jsonb @> '[{"key":"rare-suppressed-term"}]'),
  false,
  'demand buckets with fewer than five search events are suppressed'
);

select public.add_shared_library_wishlist(
  :'intel_home_tools_id'::uuid,
  'rare-suppressed-term',
  'Rare suppressed test item'
) as intel_wishlist \gset
select is(
  (:'intel_wishlist'::jsonb ->> 'wishlist_id') is not null,
  true,
  'an admin can add an aggregate demand item to the shared wishlist'
);
reset role;
select set_config('request.jwt.claims', '', true);
select is(
  (select count(*)
   from public.shared_library_wishlists
   where is_demo and normalized_term = 'drill'),
  1::bigint,
  'demo wishlist data is persisted once'
);

select lives_ok(
  $$
    update public.calendar_events
    set starts_on = current_date + 7,
        ends_on = current_date + 7
    where name = 'Hari Deepavali'
      and starts_on = '2026-11-08'
  $$,
  'a forecast test can move an official-source row inside the test window'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'intel_office_id', 'role', 'authenticated')::text,
  true
);
select public.set_calendar_event_verification(
  (select id from public.calendar_events where name = 'Hari Deepavali' and starts_on = current_date + 7),
  'verified',
  'Verified for forecast test.',
  :'intel_township_id'::uuid
);
select public.predictive_demand(:'intel_township_id'::uuid) as intel_forecast \gset
select is(
  (:'intel_forecast'::jsonb ->> 'available')::boolean,
  true,
  'an official-source festival inside 14 days enables a forecast'
);
select ok(
  jsonb_array_length(:'intel_forecast'::jsonb -> 'forecasts') > 0,
  'predictive demand returns category forecasts'
);
select is(
  (:'intel_forecast'::jsonb -> 'forecasts' -> 0 ->> 'is_forecast')::boolean,
  true,
  'category output is explicitly marked Forecast'
);
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'intel_aisyah_id', 'role', 'authenticated')::text,
  true
);
select public.send_forecast_nudges(:'intel_township_id'::uuid) as intel_nudge_count \gset
select ok(
  (:'intel_nudge_count'::integer) >= 1,
  'an active resident can lazily trigger owner forecast nudges'
);
select ok(
  (select count(*) from public.notifications where type = 'forecast_nudge') >= 1,
  'forecast nudges use deduplicated resident notifications'
);
select is(
  (select verification_status
   from public.calendar_events
   where name = 'Hari Deepavali'
     and starts_on = current_date + 7),
  'verified',
  'official-source dates can be verified before forecast use'
);
reset role;
select set_config('request.jwt.claims', '', true);

select * from finish();

rollback;
