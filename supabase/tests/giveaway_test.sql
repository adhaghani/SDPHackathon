begin;

select plan(6);

select id as giveaway_raj_id from auth.users where email = 'raj@borrowlah.demo' \gset
select id as giveaway_aisyah_id from auth.users where email = 'aisyah@borrowlah.demo' \gset
select id as giveaway_township_id from public.townships where slug = 'harmoni-heights-demo' \gset

insert into public.giveaways (
  township_id,
  giver_id,
  title,
  description,
  condition,
  handover_location,
  status
)
values (
  :'giveaway_township_id',
  :'giveaway_raj_id',
  'Giveaway test fan',
  'For parts',
  'unusable',
  'Lobby',
  'active'
)
returning id as giveaway_id \gset

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'giveaway_aisyah_id', 'role', 'authenticated')::text,
  true
);

select is(
  (public.claim_giveaway(:'giveaway_id') ->> 'status')::text,
  'reserved',
  'an active neighbour can claim a free giveaway'
);

select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'giveaway_raj_id', 'role', 'authenticated')::text,
  true
);

select public.transition_giveaway(:'giveaway_id', 'confirm_handover') as giver_confirmation \gset

select is(
  (select giver_confirmed_at is not null from public.giveaways where id = :'giveaway_id'),
  true,
  'the giver can confirm the handover'
);

select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'giveaway_aisyah_id', 'role', 'authenticated')::text,
  true
);

select public.transition_giveaway(:'giveaway_id', 'confirm_handover') as taker_confirmation \gset

select is(
  (select status from public.giveaways where id = :'giveaway_id'),
  'completed',
  'the giveaway completes after both confirmations'
);

reset role;

select is(
  (select count(*) from public.points_ledger
    where source_id = :'giveaway_id'
      and action_type in ('giveaway_given', 'giveaway_taken')),
  2::bigint,
  'both neighbours receive one idempotent giveaway BP reward'
);

select is(
  (select delta from public.points_ledger
    where source_id = :'giveaway_id' and action_type = 'giveaway_given'),
  3,
  'the giver receives the configured 3 BP reward'
);

select is(
  has_table_privilege('authenticated', 'public.giveaways', 'insert'),
  false,
  'authenticated clients cannot insert giveaways directly'
);

select * from finish();

rollback;
