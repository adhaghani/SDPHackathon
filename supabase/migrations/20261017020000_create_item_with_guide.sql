create or replace function public.create_item(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_township_id uuid := (p_payload->>'township_id')::uuid;
  v_category_id uuid := (p_payload->>'category_id')::uuid;
  v_kind text := coalesce(p_payload->>'kind', 'item');
  v_facility_id uuid := nullif(p_payload->>'meeting_facility_id', '')::uuid;
  v_item_id uuid;
  v_category_kind text;
  v_guide_body text := trim(coalesce(p_payload->>'guide_body', ''));
  v_guide_safety_note text := trim(coalesce(p_payload->>'guide_safety_note', ''));
  v_guide_points jsonb;
begin
  if v_user_id is null or not public.is_active_member(v_township_id) then
    raise exception 'not_active_member';
  end if;
  select kind into v_category_kind from public.item_categories where id = v_category_id;
  if v_category_kind is null then raise exception 'invalid_category'; end if;
  if v_kind <> v_category_kind then raise exception 'category_kind_mismatch'; end if;
  if char_length(v_guide_body) > 1000 or char_length(v_guide_safety_note) > 600 then
    raise exception 'invalid_guide';
  end if;
  if v_kind = 'skill' then
    if coalesce((p_payload->>'duration_minutes')::integer, 0) <= 0 then raise exception 'invalid_skill_duration'; end if;
    if coalesce(p_payload->>'meeting_arrangement', 'arranged_by_message') = 'shared_facility' then
      if v_facility_id is null or not exists (
        select 1 from public.facilities where id = v_facility_id and township_id = v_township_id
      ) then raise exception 'invalid_shared_space'; end if;
    end if;
    if v_category_id = (select id from public.item_categories where slug = 'tuition')
       and coalesce((p_payload->>'guardian_acknowledgement')::boolean, false) = false then
      raise exception 'guardian_acknowledgement_required';
    end if;
  end if;

  insert into public.items (
    township_id, owner_id, title, description, category_id, kind, condition, photo_paths,
    estimated_new_price_rm, value_source, requires_deposit, deposit_rm, allow_deposit_waiver,
    min_trust_tier, duration_minutes, meeting_facility_id, meeting_arrangement,
    guardian_acknowledgement, max_loan_days, handover_options, status, hidden
  ) values (
    v_township_id, v_user_id, trim(p_payload->>'title'), coalesce(p_payload->>'description', ''),
    v_category_id, v_kind, coalesce(p_payload->>'condition', 'good'),
    coalesce(array(select jsonb_array_elements_text(p_payload->'photo_paths')), array['/demo/item-placeholder.svg']),
    nullif(p_payload->>'estimated_new_price_rm', '')::numeric,
    coalesce(p_payload->>'value_source', 'category_default'),
    coalesce((p_payload->>'requires_deposit')::boolean, false),
    case when coalesce((p_payload->>'requires_deposit')::boolean, false)
      then coalesce(nullif(p_payload->>'deposit_rm', '')::numeric, 0) else 0 end,
    coalesce((p_payload->>'allow_deposit_waiver')::boolean, false), nullif(p_payload->>'min_trust_tier', ''),
    case when v_kind = 'skill' then (p_payload->>'duration_minutes')::integer else null end,
    case when v_kind = 'skill' then v_facility_id else null end,
    case when v_kind = 'skill' then coalesce(p_payload->>'meeting_arrangement', 'arranged_by_message') else 'arranged_by_message' end,
    coalesce((p_payload->>'guardian_acknowledgement')::boolean, false),
    coalesce(nullif(p_payload->>'max_loan_days', '')::integer, 3),
    coalesce(array(select jsonb_array_elements_text(p_payload->'handover_options')), array['Meet in a shared space']),
    'active', false
  ) returning id into v_item_id;

  if v_guide_body <> '' then
    insert into public.item_guides (item_id, author_id, body, safety_note, photo_paths)
    values (v_item_id, v_user_id, v_guide_body, v_guide_safety_note, '{}'::text[]);
    v_guide_points := public.award_points(
      v_user_id,
      v_township_id,
      'item_guide_added',
      'item',
      v_item_id,
      null,
      jsonb_build_object('item_id', v_item_id),
      now()
    );
  end if;

  return jsonb_build_object('item_id', v_item_id, 'status', 'active', 'kind', v_kind, 'guide_points', v_guide_points);
end;
$$;
