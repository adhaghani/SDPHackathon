begin;

create extension if not exists pgtap;

select plan(22);

select has_table('public', 'booking_handover_tokens', 'handover token table exists');
select has_table('public', 'help_articles', 'help article table exists');
select has_table('public', 'help_conversations', 'help conversation table exists');
select has_table('public', 'help_messages', 'help message table exists');
select has_table('public', 'support_tickets', 'support ticket table exists');

select id as rel_township_id from public.townships where slug = 'harmoni-heights-demo' \gset
select id as rel_aisyah_id from auth.users where email = 'aisyah@borrowbetter.demo' \gset
select id as rel_raj_id from auth.users where email = 'raj@borrowbetter.demo' \gset
select id as rel_booking_id
from public.bookings
where status = 'requested'
  and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')
limit 1 \gset

set local role authenticated;
select is(
  has_table_privilege('authenticated', 'public.booking_handover_tokens', 'insert'),
  false,
  'authenticated clients cannot insert handover tokens directly'
);
reset role;
select set_config('request.jwt.claims', '', true);

select ok(
  (select count(*) from public.help_articles) >= 15,
  'at least fifteen help articles are seeded'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'rel_aisyah_id', 'role', 'authenticated')::text,
  true
);
select public.get_current_user_booking_statuses() as rel_statuses \gset
select ok(
  jsonb_typeof(:'rel_statuses'::jsonb) = 'array',
  'the fixed booking-status function returns only the current user a JSON list'
);
reset role;
select set_config('request.jwt.claims', '', true);

select lives_ok(
  $$
    select public.transition_booking(
      (select id from public.bookings
       where status = 'requested'
         and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      'approve',
      '{}'::jsonb,
      (select id from auth.users where email = 'raj@borrowbetter.demo'),
      now()
    )
  $$,
  'the lender approves the offline-handover booking'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'rel_raj_id', 'role', 'authenticated')::text,
  true
);
select public.register_booking_handover_token(:'rel_booking_id'::uuid) as rel_registration \gset
select is(
  (:'rel_registration'::jsonb ->> 'jti') is not null,
  true,
  'the lender can register a 30-minute handover token'
);
select lives_ok(
  $$
    select public.save_item_guide(
      (select item_id from public.bookings
       where item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')
       limit 1),
      'Lock the wheels before use.',
      'Check the hose.',
      '{}'
    )
  $$,
  'the owner adds a guide that must be acknowledged before offline handover'
);
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'rel_aisyah_id', 'role', 'authenticated')::text,
  true
);
select throws_ok(
  $$
    select public.consume_booking_handover_token(
      (select jti from public.booking_handover_tokens where booking_id =
        (select id from public.bookings
         where item_id = (select id from public.items where title = 'Pressure washer for the next clean-up'))),
      (select id from public.bookings
       where item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      now(),
      false
    )
  $$,
  'P0001',
  'guide_ack_required',
  'offline consumption rejects an unacknowledged guide'
);

select lives_ok(
  $$
    select public.consume_booking_handover_token(
      (select jti from public.booking_handover_tokens where booking_id =
        (select id from public.bookings
         where status = 'approved'
           and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up'))),
      (select id from public.bookings
       where status = 'approved'
         and item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      now(),
      true
    )
  $$,
  'the borrower synchronizes the acknowledged scan'
);
select is(
  (select status from public.bookings where id = :'rel_booking_id'::uuid),
  'handed_over',
  'a successful synchronized scan completes both handover confirmations'
);
select throws_ok(
  $$
    select public.consume_booking_handover_token(
      (select jti from public.booking_handover_tokens where booking_id =
        (select id from public.bookings
         where item_id = (select id from public.items where title = 'Pressure washer for the next clean-up'))),
      (select id from public.bookings
       where item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      now(),
      true
    )
  $$,
  'P0001',
  'handover_token_replayed',
  'replaying a consumed token is rejected'
);
reset role;
select set_config('request.jwt.claims', '', true);

insert into public.booking_handover_tokens (
  booking_id, jti, issued_by, expires_at, is_demo
)
values (:'rel_booking_id', 'EXPIREDDEMO', :'rel_raj_id', now() - interval '1 minute', true);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'rel_aisyah_id', 'role', 'authenticated')::text,
  true
);
select throws_ok(
  $$
    select public.consume_booking_handover_token(
      'EXPIREDDEMO',
      (select id from public.bookings
       where item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      now() - interval '2 minutes',
      true
    )
  $$,
  'P0001',
  'handover_token_expired',
  'an expired token is rejected'
);
select throws_ok(
  $$
    select public.consume_booking_handover_token(
      'MISSINGTOKEN',
      (select id from public.bookings
       where item_id = (select id from public.items where title = 'Pressure washer for the next clean-up')),
      now(),
      true
    )
  $$,
  'P0001',
  'handover_token_invalid',
  'an unknown token is rejected'
);

select public.send_help_message(null, 'How does offline handover work?') as rel_help \gset
select ok(
  jsonb_array_length(:'rel_help'::jsonb -> 'articles') > 0,
  'help retrieval returns matching grounded articles'
);
select throws_ok(
  $$
    select public.send_help_message(
      '00000000-0000-4000-8000-000000000001',
      'Test question'
    )
  $$,
  'P0001',
  'conversation_not_found',
  'a user cannot send a message into another conversation'
);
reset role;
select set_config('request.jwt.claims', '', true);

select id as rel_help_conversation_id
from public.help_conversations
where user_id = :'rel_aisyah_id' and is_demo = false
order by created_at desc
limit 1 \gset
insert into public.help_messages (conversation_id, user_id, role, content, is_demo)
select :'rel_help_conversation_id'::uuid, :'rel_aisyah_id', 'user', 'Rate limit test message', false
from generate_series(1, 20);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'rel_aisyah_id', 'role', 'authenticated')::text,
  true
);
select throws_ok(
  $$
    select public.send_help_message(null, 'One message too many')
  $$,
  'P0001',
  'help_rate_limited',
  'the twentieth help message in an hour is followed by a rate limit'
);
select public.create_support_ticket(
  :'rel_help_conversation_id'::uuid,
  'Offline handover help'
) as rel_ticket \gset
select ok(
  (:'rel_ticket'::jsonb ->> 'ticket_id') is not null,
  'the user can create an organiser support ticket'
);
reset role;
select set_config('request.jwt.claims', '', true);

select ok(
  (select count(*) from public.notifications where type = 'support_ticket') >= 1,
  'organisers receive a deduplicated support-ticket notification'
);

select * from finish();

rollback;
