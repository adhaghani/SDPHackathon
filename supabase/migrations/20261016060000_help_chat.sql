-- Broader grounded support and durable, owner-scoped chat replies.
alter table public.help_messages
  add column reply_to_message_id uuid unique references public.help_messages(id) on delete cascade,
  add column source text check (source in ('ai', 'articles'));

create or replace function public.search_help_articles(p_query text, p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_query tsquery := replace(plainto_tsquery('english', coalesce(p_query, ''))::text, ' & ', ' | ')::tsquery;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  return coalesce((
    select jsonb_agg(to_jsonb(a) order by a.rank desc, a.slug)
    from (
      select id, slug, title, body, category,
        ts_rank(search_vector, v_query) + 2 * ts_rank(to_tsvector('english', title), v_query) as rank
      from public.help_articles
      where search_vector @@ v_query
        or numnode(v_query) = 0
      order by rank desc, slug
      limit least(greatest(coalesce(p_limit, 20), 1), 50)
    ) a
  ), '[]'::jsonb);
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

  -- Include the previous user turn for short follow-ups such as "what happens next?".
  v_articles := public.search_help_articles(
    p_question || case when char_length(p_question) < 80 then ' ' || coalesce((
      select content from public.help_messages
      where conversation_id = v_conversation_id and role = 'user' and id <> v_message_id
      order by created_at desc, id desc limit 1
    ), '') else '' end,
    8
  );

  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', m.id, 'role', m.role, 'content', m.content, 'created_at', m.created_at, 'source', m.source)
      order by m.created_at
    ),
    '[]'::jsonb
  )
  into v_messages
  from (
    select * from public.help_messages
    where conversation_id = v_conversation_id
    order by created_at desc, id desc limit 40
  ) m;

  return jsonb_build_object(
    'conversation_id', v_conversation_id,
    'message_id', v_message_id,
    'articles', v_articles,
    'messages', v_messages
  );
end;
$$;

create or replace function public.save_help_answer(p_message_id uuid, p_answer text, p_source text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question public.help_messages%rowtype;
  v_reply public.help_messages%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_answer is null or char_length(trim(p_answer)) not between 1 and 4000
     or p_source is null or p_source not in ('ai', 'articles') then
    raise exception 'invalid_help_answer';
  end if;
  select m.* into v_question from public.help_messages m
  join public.help_conversations c on c.id = m.conversation_id
  where m.id = p_message_id and m.role = 'user' and c.user_id = auth.uid()
    and exists (select 1 from public.township_members tm
      where tm.user_id = auth.uid() and tm.township_id = c.township_id and tm.status = 'active');
  if not found then raise exception 'help_message_not_found'; end if;
  insert into public.help_messages(conversation_id, user_id, role, content, reply_to_message_id, source)
  values (v_question.conversation_id, auth.uid(), 'assistant', trim(p_answer), p_message_id, p_source)
  on conflict (reply_to_message_id) do nothing;
  select * into v_reply from public.help_messages where reply_to_message_id = p_message_id;
  update public.help_conversations set updated_at = now() where id = v_question.conversation_id;
  return jsonb_build_object('id', v_reply.id, 'role', v_reply.role, 'content', v_reply.content,
    'created_at', v_reply.created_at, 'source', v_reply.source);
end;
$$;
revoke execute on function public.save_help_answer(uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function public.save_help_answer(uuid, text, text) to authenticated;

insert into public.help_articles(slug, title, body, category)
values
  ('how-to-borrow-an-item', 'How do I borrow an item?', 'Open Borrow and search or filter for an item in your township. Open the listing and check its condition, maximum loan period, deposit and trust requirement. Under When do you need it?, choose available dates and press Request. Wait for the owner to approve; sending a request does not mean it is approved. Open Borrowing and lending to find the booking. Arrange pickup through the booking chat in a shared township space, read any item guide, and have both sides confirm handover. Return the item by the agreed date and have both sides confirm the return.', 'borrowing'),
  ('find-available-items', 'How do I find available items and choose dates?', 'In Borrow, use search and the category filters to find a listing. Open an item to choose its dates. Dates reserved by approved or active bookings are blocked; pending requests do not reserve the item. The requested range must fit the owner''s maximum loan period. Availability is checked again when a request is approved, so choose another range if it is no longer available.', 'borrowing'),
  ('where-is-my-booking', 'Where can I find my borrowing request or booking?', 'Open Borrow, then Borrowing and lending. The I''m borrowing tab lists your requests and loans; I''m lending lists requests for your items. Open a booking to see its status, dates, messages and available actions. Requested means the owner has not yet approved. Approved means arrange pickup; it does not mean handover is complete.', 'borrowing'),
  ('booking-chat', 'How do I message the owner or borrower?', 'Open the booking from Borrowing and lending and use its message area. Only the two booking participants can use this chat. Agree on pickup and return in a shared township space. Keep private contact, bank and identity details out of messages. The Help chatbot cannot read or send booking messages for you.', 'borrowing'),
  ('return-an-item', 'How do I return a borrowed item?', 'Open your booking and arrange the return with the owner through booking chat. Return the item in the agreed condition and meeting place. Both borrower and owner must confirm the return in BorrowLah. A single confirmation does not complete the loan. Verified borrowing points are awarded after the required return confirmations, not when a request is sent.', 'handover'),
  ('approve-borrow-request', 'How do I approve a request for my item?', 'Open Borrowing and lending, choose I''m lending, and open the incoming request. Review its dates and borrower trust information before approving or declining it. Approval rechecks availability; overlapping approved or active bookings can prevent approval. After approval, arrange pickup through booking chat and have both people confirm handover.', 'lending'),
  ('list-an-item', 'How do I list an item for neighbours to borrow?', 'Open Borrow and choose List an item. Enter the item title, category, condition and description; add a photo if available. Set the maximum loan length, handover options and any deposit or trust requirement shown in the form. Review all details before publishing. Photo suggestions are drafts and need your confirmation. Your listings appear under My items in Borrowing and lending.', 'listing'),
  ('photo-suggestion-review', 'Do I need to accept the photo listing suggestions?', 'No. A photo may suggest listing fields, but you can review and edit them before publishing or fill them in manually if suggestions are unavailable. An estimated replacement value is an approximate item value in Malaysian ringgit, not a rental charge or deposit. Confirm the actual condition and included accessories yourself. Uploaded photos are re-encoded to remove EXIF metadata, but visible personal details in the photo should be removed before uploading.', 'listing'),
  ('save-items', 'How do I save an item for later?', 'Use the save control on an item to add it to your saved items. Open Saved items from Borrow to find saved listings again. Saving does not reserve an item, request a loan or guarantee that the dates will remain available. Open the listing and send a borrowing request when you are ready.', 'borrowing'),
  ('join-an-event', 'How do I join an event?', 'Open Events and choose an event to read its details, place and time. Use the event''s join or RSVP action when places are available. After signing up, open your ticket. Show its QR code for organiser check-in at the event. Signing up alone does not earn attendance points; a verified check-in is required.', 'events'),
  ('event-ticket-checkin', 'Where is my event ticket and why have I not earned attendance points?', 'Open your signed-up event or My events to find its ticket. At the event, show the ticket QR code to the organiser for check-in. RSVP alone does not count as attendance. Check your points activity after verified check-in; the chatbot cannot perform check-in or add points.', 'events'),
  ('rewards-and-history', 'Where can I see my BetterPoints and rewards?', 'Open Impact to see your BetterPoints and available rewards. Points activity explains the verified action behind each entry. Review a reward''s points cost and conditions before redeeming. The chatbot cannot change balances, promise a reward is available or redeem a reward for you.', 'points'),
  ('log-recycling', 'How do I log recycling and what do the impact figures mean?', 'Open Recycling, select the material and enter the number of items recycled. Add a photo if available and review the form before submitting. Logs use the current Malaysia date. Counts are converted into estimated weight, CO2e and energy equivalents; these are self-reported estimates, not measured environmental outcomes. Any campaign points depend on the applicable campaign rules, not a promise from the chatbot.', 'recycling'),
  ('give-away-an-item', 'How do I give away an item?', 'Open Giveaway to browse items neighbours are offering free, or use the listing action there to offer your own item. Read a listing and use its claim action if available. A giveaway transfers the item; a borrowing booking expects a return. Arrange collection in a shared township space and follow the confirmation steps shown on the claim.', 'giveaway'),
  ('help-chat-boundaries', 'What can the Help chatbot do?', 'Ask practical questions about using BorrowLah, including borrowing, listing, handover, events, BetterPoints and recycling. Answers use help articles and limited booking-status context. The chatbot cannot inspect private booking messages, approve a request, move money, edit points or complete an action on your behalf. For a problem that needs a person, use Talk to an organiser to create a support ticket.', 'support'),
  ('booking-problem', 'What should I do if a booking or item has a problem?', 'Open the affected item or booking and use its Report action. Describe the issue using the form shown there. You can also use Talk to an organiser in Help to create a support ticket. Avoid sharing bank or identity details. The chatbot cannot decide disputes, guarantee refunds or confirm that a report was submitted unless you complete the relevant form.', 'safety')
on conflict (slug) do update set title = excluded.title, body = excluded.body, category = excluded.category, updated_at = now();
