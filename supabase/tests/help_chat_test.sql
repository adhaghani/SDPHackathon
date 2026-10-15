begin;
create extension if not exists pgtap;
select plan(12);
select id as help_user_id from auth.users where email = 'aisyah@borrowlah.demo' \gset
select id as help_other_id from auth.users where email = 'raj@borrowlah.demo' \gset
select ok((select count(*) from public.help_articles) >= 34, 'help knowledge base includes at least 34 articles');
select ok(not has_function_privilege('anon', 'public.save_help_answer(uuid,text,text)', 'execute'), 'anonymous callers cannot save replies');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'help_user_id', 'role', 'authenticated')::text, true);
select is(public.search_help_articles('How do I borrow an item?', 8)->0->>'slug', 'how-to-borrow-an-item', 'natural borrowing question finds the full journey first');
select is(jsonb_array_length(public.search_help_articles('', 50)), 34, 'all guides can be browsed');
select is(jsonb_array_length(public.search_help_articles('xylophonexyz', 8)), 0, 'unmatched searches do not return unrelated guides');
select public.send_help_message(null, 'How do I borrow an item?') as help_turn \gset
select ok(jsonb_array_length(:'help_turn'::jsonb->'articles') > 3, 'a broad question supplies more than three matching articles');
select public.save_help_answer((:'help_turn'::jsonb->>'message_id')::uuid, 'Choose dates and send a request.', 'ai') as help_reply \gset
select is(:'help_reply'::jsonb->>'role', 'assistant', 'reply is saved as an assistant message');
select is(public.save_help_answer((:'help_turn'::jsonb->>'message_id')::uuid, 'Duplicate reply', 'ai')->>'id', :'help_reply'::jsonb->>'id', 'retries do not duplicate replies');
select is((select count(*)::integer from public.help_messages where conversation_id = (:'help_turn'::jsonb->>'conversation_id')::uuid), 2, 'the stored conversation contains a question and reply');
select public.send_help_message((:'help_turn'::jsonb->>'conversation_id')::uuid, 'What happens next?') as help_followup \gset
select ok(exists(select 1 from jsonb_array_elements(:'help_followup'::jsonb->'articles') a where a->>'slug' = 'how-to-borrow-an-item'), 'follow-ups retain the previous topic for retrieval');
select set_config('request.jwt.claims', json_build_object('sub', :'help_other_id', 'role', 'authenticated')::text, true);
select is((select count(*)::integer from public.help_messages where conversation_id = (:'help_turn'::jsonb->>'conversation_id')::uuid), 0, 'another resident cannot read the conversation');
select throws_ok(format('select public.save_help_answer(%L::uuid, %L, %L)', :'help_turn'::jsonb->>'message_id', 'Forged reply', 'ai'), 'P0001', 'help_message_not_found', 'another resident cannot write a reply in this conversation');
select * from finish();
rollback;
