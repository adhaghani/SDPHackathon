-- Feature Pack v2, Phase 6: offline handover and article-grounded support.

create table if not exists public.booking_handover_tokens (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  jti text not null unique,
  issued_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references auth.users(id) on delete set null,
  device_scanned_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.help_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null,
  category text not null default 'general',
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title || ' ' || body, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  township_id uuid not null references public.townships(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'resolved')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.help_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'organiser')),
  content text not null check (char_length(content) between 1 and 4000),
  article_ids uuid[] not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.help_conversations(id) on delete set null,
  township_id uuid not null references public.townships(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists help_articles_search_idx on public.help_articles using gin (search_vector);
create index if not exists help_messages_conversation_idx on public.help_messages (conversation_id, created_at);
create index if not exists handover_tokens_booking_idx on public.booking_handover_tokens (booking_id, expires_at);

alter table public.booking_handover_tokens enable row level security;
alter table public.help_articles enable row level security;
alter table public.help_conversations enable row level security;
alter table public.help_messages enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists handover_tokens_select_participant on public.booking_handover_tokens;
drop policy if exists help_articles_select_member on public.help_articles;
drop policy if exists help_conversations_select_own on public.help_conversations;
drop policy if exists help_messages_select_own on public.help_messages;
drop policy if exists support_tickets_select_requester_admin on public.support_tickets;

create policy handover_tokens_select_participant on public.booking_handover_tokens
  for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (
          b.borrower_id = auth.uid()
          or b.lender_id = auth.uid()
          or public.is_township_admin(b.township_id)
        )
    )
  );
create policy help_articles_select_member on public.help_articles
  for select to authenticated using (true);
create policy help_conversations_select_own on public.help_conversations
  for select to authenticated using (user_id = auth.uid());
create policy help_messages_select_own on public.help_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.help_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
create policy support_tickets_select_requester_admin on public.support_tickets
  for select to authenticated
  using (requester_id = auth.uid() or public.is_township_admin(township_id));

revoke all on public.booking_handover_tokens, public.help_articles,
  public.help_conversations, public.help_messages, public.support_tickets
  from anon, authenticated;
grant select on public.booking_handover_tokens, public.help_articles,
  public.help_conversations, public.help_messages, public.support_tickets
  to authenticated;

create or replace function public.register_booking_handover_token(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_jti text;
  v_expires timestamptz := now() + interval '30 minutes';
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found or v_booking.lender_id <> v_user_id or v_booking.status <> 'approved' then
    raise exception 'not_allowed';
  end if;

  v_jti := encode(uuid_send(gen_random_uuid()), 'hex');
  insert into public.booking_handover_tokens (booking_id, jti, issued_by, expires_at)
  values (p_booking_id, v_jti, v_user_id, v_expires);

  update public.bookings
  set lender_handover_confirmed_at = coalesce(lender_handover_confirmed_at, now()),
      updated_at = now()
  where id = p_booking_id;

  return jsonb_build_object(
    'jti', v_jti,
    'booking_id', p_booking_id,
    'expires_at', v_expires
  );
end;
$$;

create or replace function public.consume_booking_handover_token(
  p_jti text,
  p_booking_id uuid,
  p_device_scanned_at timestamptz,
  p_guide_acknowledged boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_token public.booking_handover_tokens%rowtype;
  v_booking public.bookings%rowtype;
begin
  select * into v_token from public.booking_handover_tokens where jti = p_jti for update;
  if not found or v_token.booking_id <> p_booking_id then
    raise exception 'handover_token_invalid';
  end if;
  if v_token.consumed_at is not null then
    raise exception 'handover_token_replayed';
  end if;
  if v_token.expires_at < now() then
    raise exception 'handover_token_expired';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found or v_booking.borrower_id <> v_user_id or v_booking.status <> 'approved' then
    raise exception 'not_allowed';
  end if;
  if exists (select 1 from public.item_guides where item_id = v_booking.item_id)
     and coalesce(p_guide_acknowledged, false) = false then
    raise exception 'guide_ack_required';
  end if;

  update public.booking_handover_tokens
  set consumed_at = now(),
      consumed_by = v_user_id,
      device_scanned_at = greatest(p_device_scanned_at, now() - interval '30 minutes')
  where id = v_token.id;

  update public.bookings
  set borrower_handover_confirmed_at = coalesce(borrower_handover_confirmed_at, now()),
      guide_acknowledged_at = case
        when exists (select 1 from public.item_guides g where g.item_id = v_booking.item_id)
          and coalesce(p_guide_acknowledged, false) then now()
        else guide_acknowledged_at
      end,
      lender_handover_confirmed_at = coalesce(lender_handover_confirmed_at, now()),
      status = case
        when borrower_handover_confirmed_at is not null
          and lender_handover_confirmed_at is not null then status
        else 'handed_over'
      end,
      updated_at = now()
  where id = p_booking_id;

  return jsonb_build_object(
    'status', 'handed_over',
    'booking_id', p_booking_id,
    'synced_at', now()
  );
end;
$$;

create or replace function public.search_help_articles(p_query text, p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;
  return coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'slug', a.slug,
        'title', a.title,
        'body', a.body,
        'category', a.category,
        'rank', ts_rank(a.search_vector, plainto_tsquery('english', p_query))
      )
      order by ts_rank(a.search_vector, plainto_tsquery('english', p_query)) desc
    ),
    '[]'::jsonb
  )
  from (
    select *
    from public.help_articles
    where search_vector @@ plainto_tsquery('english', coalesce(p_query, 'help'))
       or not exists (
         select 1 from public.help_articles h2
         where h2.search_vector @@ plainto_tsquery('english', coalesce(p_query, 'help'))
       )
    order by ts_rank(search_vector, plainto_tsquery('english', coalesce(p_query, 'help'))) desc
    limit least(greatest(coalesce(p_limit, 20), 1), 20)
  ) a;
end;
$$;

create or replace function public.get_current_user_booking_statuses()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;
  return (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'status', status,
          'start_date', start_date,
          'end_date', end_date
        )
        order by updated_at desc
      ),
      '[]'::jsonb
    )
    from (
      select *
      from public.bookings
      where borrower_id = auth.uid() or lender_id = auth.uid()
      order by updated_at desc
      limit 10
    ) recent
  );
end;
$$;

create or replace function public.send_help_message(
  p_conversation_id uuid default null,
  p_question text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid;
  v_conversation_id uuid := p_conversation_id;
  v_message_id uuid;
  v_recent integer;
  v_articles jsonb;
  v_messages jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if char_length(trim(coalesce(p_question, ''))) = 0 or char_length(p_question) > 1000 then
    raise exception 'invalid_help_question';
  end if;
  select township_id into v_township_id
  from public.township_members
  where user_id = v_user_id and status = 'active'
  order by created_at
  limit 1;
  if v_township_id is null then
    raise exception 'not_active_member';
  end if;

  if v_conversation_id is null then
    insert into public.help_conversations (user_id, township_id)
    values (v_user_id, v_township_id)
    returning id into v_conversation_id;
  elsif not exists (
    select 1 from public.help_conversations
    where id = v_conversation_id and user_id = v_user_id
  ) then
    raise exception 'conversation_not_found';
  end if;

  select count(*) into v_recent
  from public.help_messages
  where user_id = v_user_id
    and role = 'user'
    and created_at >= now() - interval '1 hour';
  if v_recent >= 20 then
    raise exception 'help_rate_limited';
  end if;

  insert into public.help_messages (conversation_id, user_id, role, content)
  values (v_conversation_id, v_user_id, 'user', trim(p_question))
  returning id into v_message_id;
  update public.help_conversations set updated_at = now() where id = v_conversation_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'slug', a.slug,
        'title', a.title,
        'body', a.body,
        'category', a.category
      )
      order by ts_rank(a.search_vector, plainto_tsquery('english', p_question)) desc
    ),
    '[]'::jsonb
  )
  into v_articles
  from (
    select *
    from public.help_articles
    where search_vector @@ plainto_tsquery('english', p_question)
       or not exists (
         select 1 from public.help_articles h2
         where h2.search_vector @@ plainto_tsquery('english', p_question)
       )
    order by ts_rank(search_vector, plainto_tsquery('english', p_question)) desc
    limit 3
  ) a;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', m.id, 'role', m.role, 'content', m.content, 'created_at', m.created_at)
      order by m.created_at
    ),
    '[]'::jsonb
  )
  into v_messages
  from public.help_messages m
  where m.conversation_id = v_conversation_id;

  return jsonb_build_object(
    'conversation_id', v_conversation_id,
    'message_id', v_message_id,
    'articles', v_articles,
    'messages', v_messages
  );
end;
$$;

create or replace function public.create_support_ticket(
  p_conversation_id uuid default null,
  p_subject text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid;
  v_subject text := coalesce(nullif(trim(p_subject), ''), 'BorrowLah help request');
  v_ticket_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  select township_id into v_township_id
  from public.township_members
  where user_id = v_user_id and status = 'active'
  order by created_at
  limit 1;
  if v_township_id is null then
    raise exception 'not_active_member';
  end if;
  if p_conversation_id is not null and not exists (
    select 1 from public.help_conversations where id = p_conversation_id and user_id = v_user_id
  ) then
    raise exception 'conversation_not_found';
  end if;

  insert into public.support_tickets (conversation_id, township_id, requester_id, subject)
  values (p_conversation_id, v_township_id, v_user_id, left(v_subject, 160))
  returning id into v_ticket_id;

  insert into public.notifications (user_id, type, title, body, link, dedupe_key)
  select m.user_id,
    'support_ticket',
    'New support ticket',
    left(v_subject, 160),
    '/admin/moderation',
    'support-ticket:' || v_ticket_id::text
  from public.township_members m
  where m.township_id = v_township_id
    and m.status = 'active'
    and m.role in ('organiser', 'township_admin')
  on conflict (user_id, dedupe_key) do nothing;

  return jsonb_build_object('ticket_id', v_ticket_id, 'status', 'open');
end;
$$;

insert into public.help_articles (slug, title, body, category)
values
  ('what-are-betterpoints', 'What are BetterPoints?', 'BetterPoints, or BP, are earned only after a verified real-world action such as an event check-in, completed borrow, confirmed help or redemption.', 'points'),
  ('how-earn-bp', 'How do I earn BP?', 'You can earn BP when a booking is completed and confirmed by both sides, when you check in to an event, when help is completed, or through an approved challenge.', 'points'),
  ('bp-reasons', 'Why does my BP activity show a reason?', 'Every ledger entry explains the verified action, for example “Return confirmed by both sides”. Points are never given just for opening the app.', 'points'),
  ('trust-tiers', 'What are trust tiers?', 'Trust tiers are Building, Trusted and Highly trusted. The score is based on verified returns, on-time returns, active sharing months and dispute outcomes.', 'trust'),
  ('high-value-items', 'Why do some items need a Trusted neighbour?', 'Items at or above the high-value threshold require a Trusted or higher borrower. Owners may also set a minimum tier on their listing.', 'trust'),
  ('deposits', 'How do deposits work?', 'Deposits are an in-person agreement recorded on the booking. BorrowLah never processes money. Eligible Highly trusted borrowers may be waived when the owner allows it.', 'deposits'),
  ('deposit-waiver', 'Can a deposit be waived?', 'Only when the owner enables waiver and the borrower is Highly trusted. The booking records whether the deposit was waived.', 'deposits'),
  ('handover-basics', 'How does handover work?', 'The owner approves the request, both people confirm handover, then both confirm the return. Points are awarded after the return is confirmed.', 'handover'),
  ('offline-qr', 'Can I use the handover QR offline?', 'The owner can prepare a signed QR while online. A borrower scan can wait in the device queue and sync when the connection returns. Expired or replayed tokens are rejected.', 'handover'),
  ('guide-ack', 'Why must I read a how-to first?', 'If the owner added an item guide, the borrower acknowledges it before completing the handover step.', 'handover'),
  ('request-board', 'How do item requests work?', 'Post a request, then owners can offer an existing item or a new listing. Accepting an attached offer creates the booking request.', 'requests'),
  ('request-limit', 'Why can I not post another request?', 'Residents can keep up to three open requests at a time. Cancel or complete one before posting another.', 'requests'),
  ('bundles', 'How do bundles work?', 'A bundle books several items from one owner as a group. Every item must be available for the same dates or the whole request fails.', 'bundles'),
  ('skills', 'What is skill lending?', 'Skill listings are sessions for repairs, tuition, sewing, cooking or tech help. Meeting places are shared township spaces or arranged by message, never a home address.', 'skills'),
  ('snap-to-list', 'How does photo listing help?', 'A photo can suggest a title, category, value and condition. Suggestions stay marked until you confirm them. Without an AI key, you complete the form manually.', 'listing'),
  ('privacy', 'What private information is hidden?', 'Admins and sponsors see aggregates only. Unit labels, home locations, private messages and named resident activity are not shown in aggregate views.', 'privacy'),
  ('report-safety', 'How do I report a problem?', 'Use Report on an item or booking. Meet in shared spaces and never share bank or ID details.', 'safety'),
  ('contact-organiser', 'How do I contact an organiser?', 'Use Talk to an organiser in Help. It creates a support ticket for the township office without exposing private booking messages.', 'support')
on conflict (slug) do nothing;

revoke execute on function public.register_booking_handover_token(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.consume_booking_handover_token(text, uuid, timestamptz, boolean) from public, anon, authenticated, service_role;
revoke execute on function public.search_help_articles(text, integer) from public, anon, authenticated, service_role;
revoke execute on function public.get_current_user_booking_statuses() from public, anon, authenticated, service_role;
revoke execute on function public.send_help_message(uuid, text) from public, anon, authenticated, service_role;
revoke execute on function public.create_support_ticket(uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.register_booking_handover_token(uuid) to authenticated;
grant execute on function public.consume_booking_handover_token(text, uuid, timestamptz, boolean) to authenticated;
grant execute on function public.search_help_articles(text, integer) to authenticated;
grant execute on function public.get_current_user_booking_statuses() to authenticated;
grant execute on function public.send_help_message(uuid, text) to authenticated;
grant execute on function public.create_support_ticket(uuid, text) to authenticated;
