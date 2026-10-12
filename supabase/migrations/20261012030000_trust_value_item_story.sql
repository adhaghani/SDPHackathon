-- Feature Pack v2, Phase 2: trust, estimated value, item history and guides.

alter table public.bookings
  add column if not exists return_condition text,
  add column if not exists return_condition_reason text not null default '',
  add column if not exists condition_recorded_by uuid references auth.users(id) on delete set null,
  add column if not exists condition_recorded_at timestamptz,
  add column if not exists condition_contest_ends_at timestamptz,
  add column if not exists guide_acknowledged_at timestamptz,
  add column if not exists deposit_amount_rm numeric(10,2) not null default 0,
  add column if not exists deposit_waived boolean not null default false;

alter table public.bookings
  drop constraint if exists bookings_return_condition_check;
alter table public.bookings
  add constraint bookings_return_condition_check check (
    return_condition is null
    or return_condition in ('like_new', 'good', 'fair', 'damaged')
  );

alter table public.disputes
  add column if not exists kind text not null default 'general',
  add column if not exists score_effect_frozen boolean not null default false,
  add column if not exists borrower_at_fault boolean not null default false;

alter table public.disputes
  drop constraint if exists disputes_kind_check;
alter table public.disputes
  add constraint disputes_kind_check check (kind in ('general', 'condition'));

update public.disputes
set kind = 'general'
where kind = 'general';

create table if not exists public.item_guides (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.items(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  safety_note text not null default '',
  photo_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint item_guides_body_length check (char_length(body) between 1 and 1000),
  constraint item_guides_photo_limit check (array_length(photo_paths, 1) is null or array_length(photo_paths, 1) <= 3)
);

alter table public.item_guides enable row level security;

drop policy if exists item_guides_select_member on public.item_guides;
create policy item_guides_select_member on public.item_guides
  for select to authenticated
  using (
    exists (
      select 1
      from public.items i
      where i.id = item_id and public.is_active_member(i.township_id)
    )
  );

revoke all on public.item_guides from anon, authenticated;
grant select on public.item_guides to authenticated;

create or replace function public._trust_score(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_score integer := 20;
  v_completed integer := 0;
  v_on_time integer := 0;
  v_active_months integer := 0;
  v_open_disputes integer := 0;
  v_faults integer := 0;
  v_reasons jsonb := jsonb_build_array(
    jsonb_build_object('label', 'Active account', 'delta', 20)
  );
  v_pending boolean := false;
  v_tier text;
begin
  select count(*)
  into v_completed
  from public.bookings b
  where b.borrower_id = p_user_id
    and b.status = 'completed'
    and not exists (
      select 1
      from public.disputes d
      where d.booking_id = b.id
        and d.status = 'open'
        and d.kind = 'condition'
    );

  select count(*)
  into v_on_time
  from public.bookings b
  where b.borrower_id = p_user_id
    and b.status = 'completed'
    and exists (
      select 1
      from public.points_ledger l
      where l.user_id = b.borrower_id
        and l.action_type = 'item_returned_on_time'
        and l.source_type = 'booking'
        and l.source_id = b.id
    )
    and not exists (
      select 1
      from public.disputes d
      where d.booking_id = b.id
        and d.status = 'open'
        and d.kind = 'condition'
    );

  with completed_months as (
    select date_trunc('month', b.updated_at at time zone 'Asia/Kuala_Lumpur') as month
    from public.bookings b
    where b.status = 'completed'
      and (b.borrower_id = p_user_id or b.lender_id = p_user_id)
  )
  select count(*)
  into v_active_months
  from completed_months;

  select count(*)
  into v_open_disputes
  from public.disputes d
  join public.bookings b on b.id = d.booking_id
  where d.status = 'open'
    and (b.borrower_id = p_user_id or b.lender_id = p_user_id);

  select count(*)
  into v_faults
  from public.disputes d
  join public.bookings b on b.id = d.booking_id
  where d.status = 'resolved'
    and d.borrower_at_fault = true
    and b.borrower_id = p_user_id;

  if v_completed > 0 then
    v_score := v_score + least(v_completed * 4, 40);
    v_reasons := v_reasons || jsonb_build_array(
      jsonb_build_object('label', format('%s verified returns', v_completed), 'delta', least(v_completed * 4, 40))
    );
  end if;

  if v_on_time > 0 then
    v_score := v_score + least(v_on_time * 2, 20);
    v_reasons := v_reasons || jsonb_build_array(
      jsonb_build_object('label', format('%s on-time returns', v_on_time), 'delta', least(v_on_time * 2, 20))
    );
  end if;

  if v_active_months >= 6 then
    v_score := v_score + 10;
    v_reasons := v_reasons || jsonb_build_array(
      jsonb_build_object('label', 'Six active sharing months', 'delta', 10)
    );
  end if;

  if v_open_disputes = 0 and v_faults = 0 then
    v_score := v_score + 10;
    v_reasons := v_reasons || jsonb_build_array(
      jsonb_build_object('label', 'No open disputes or confirmed faults', 'delta', 10)
    );
  end if;

  if v_faults > 0 then
    v_score := v_score - (v_faults * 15 + greatest(v_faults - 1, 0) * 5);
    v_reasons := v_reasons || jsonb_build_array(
      jsonb_build_object('label', format('%s confirmed damage faults', v_faults), 'delta', -(v_faults * 15 + greatest(v_faults - 1, 0) * 5))
    );
  end if;

  v_pending := v_open_disputes > 0;
  v_score := greatest(0, least(100, v_score));
  v_tier := case
    when v_score >= 75 then 'highly_trusted'
    when v_score >= 40 then 'trusted'
    else 'building'
  end;

  return jsonb_build_object(
    'score', v_score,
    'tier', v_tier,
    'reasons', v_reasons,
    'pending_dispute', v_pending,
    'thresholds', jsonb_build_object(
      'building_max', 39,
      'trusted_min', 40,
      'highly_trusted_min', 75
    )
  );
end;
$$;

create or replace function public.transition_booking(
  p_booking_id uuid,
  p_action text,
  p_payload jsonb default '{}'::jsonb,
  p_actor_id uuid default null,
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth uuid := auth.uid();
  v_actor uuid := case when v_auth is not null then v_auth else p_actor_id end;
  v_booking public.bookings%rowtype;
  v_item public.items%rowtype;
  v_category public.item_categories%rowtype;
  v_status text;
  v_lender_points jsonb;
  v_borrower_points jsonb;
  v_return_condition text;
begin
  if v_actor is null then
    raise exception 'authentication_required';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_item from public.items where id = v_booking.item_id;
  select * into v_category from public.item_categories where id = v_item.category_id;

  if v_auth is not null then
    p_occurred_at := now();
  end if;

  case p_action
    when 'approve' then
      if v_booking.status <> 'requested' or (v_auth is not null and v_actor <> v_booking.lender_id) then
        raise exception 'transition_not_allowed';
      end if;
      v_status := 'approved';
    when 'decline' then
      if v_booking.status <> 'requested' or (v_auth is not null and v_actor <> v_booking.lender_id) then
        raise exception 'transition_not_allowed';
      end if;
      v_status := 'declined';
    when 'cancel' then
      if v_booking.status not in ('requested', 'approved') then
        raise exception 'transition_not_allowed';
      end if;
      if v_auth is not null and not (
        v_actor = v_booking.borrower_id
        or (v_actor = v_booking.lender_id and v_booking.status = 'approved')
      ) then
        raise exception 'transition_not_allowed';
      end if;
      v_status := 'cancelled';
    when 'confirm_handover' then
      if v_booking.status <> 'approved' or (v_auth is not null and v_actor not in (v_booking.borrower_id, v_booking.lender_id)) then
        raise exception 'transition_not_allowed';
      end if;
      if v_actor = v_booking.borrower_id then
        if exists (select 1 from public.item_guides where item_id = v_booking.item_id)
           and coalesce((p_payload->>'guide_acknowledged')::boolean, false) = false then
          raise exception 'guide_ack_required';
        end if;
        update public.bookings
        set borrower_handover_confirmed_at = p_occurred_at,
            guide_acknowledged_at = case
              when coalesce((p_payload->>'guide_acknowledged')::boolean, false)
                then coalesce(guide_acknowledged_at, p_occurred_at)
              else guide_acknowledged_at
            end,
            handover_note = coalesce(nullif(trim(p_payload->>'handover_note'), ''), handover_note)
        where id = v_booking.id;
      else
        update public.bookings
        set lender_handover_confirmed_at = p_occurred_at,
            handover_note = coalesce(nullif(trim(p_payload->>'handover_note'), ''), handover_note)
        where id = v_booking.id;
      end if;
      select * into v_booking from public.bookings where id = p_booking_id;
      if v_booking.borrower_handover_confirmed_at is not null
         and v_booking.lender_handover_confirmed_at is not null then
        v_status := 'handed_over';
      else
        v_status := v_booking.status;
      end if;
    when 'mark_returned' then
      if v_booking.status <> 'handed_over' or (v_auth is not null and v_actor <> v_booking.borrower_id) then
        raise exception 'transition_not_allowed';
      end if;
      update public.bookings
      set borrower_return_marked_at = p_occurred_at,
          borrower_would_have_bought = coalesce(nullif(p_payload->>'would_have_bought', ''), 'unsure'),
          return_note = coalesce(nullif(trim(p_payload->>'return_note'), ''), return_note)
      where id = v_booking.id;
      v_status := 'handed_over';
    when 'confirm_return' then
      if v_booking.status <> 'handed_over'
         or v_booking.borrower_return_marked_at is null
         or (v_auth is not null and v_actor <> v_booking.lender_id) then
        raise exception 'transition_not_allowed';
      end if;

      v_return_condition := coalesce(nullif(trim(p_payload->>'return_condition'), ''), 'good');
      if v_return_condition not in ('like_new', 'good', 'fair', 'damaged') then
        raise exception 'invalid_return_condition';
      end if;
      if v_return_condition = 'damaged'
         and coalesce(nullif(trim(p_payload->>'return_condition_reason'), ''), '') = '' then
        raise exception 'condition_reason_required';
      end if;

      update public.bookings
      set lender_return_confirmed_at = p_occurred_at,
          return_condition = v_return_condition,
          return_condition_reason = case
            when v_return_condition = 'damaged'
              then trim(p_payload->>'return_condition_reason')
            else ''
          end,
          condition_recorded_by = v_actor,
          condition_recorded_at = p_occurred_at,
          condition_contest_ends_at = case
            when v_return_condition = 'damaged' then p_occurred_at + interval '72 hours'
            else null
          end,
          status = 'completed',
          updated_at = p_occurred_at
      where id = v_booking.id;
      v_status := 'completed';
      v_lender_points := public.award_points(
        v_booking.lender_id,
        v_booking.township_id,
        'item_lent_completed',
        'booking',
        v_booking.id,
        v_category.slug,
        jsonb_build_object(
          'item_id', v_item.id,
          'would_have_bought', v_booking.borrower_would_have_bought,
          'return_condition', v_return_condition
        ),
        p_occurred_at
      );
      if v_booking.end_date >= (p_occurred_at at time zone 'Asia/Kuala_Lumpur')::date then
        v_borrower_points := public.award_points(
          v_booking.borrower_id,
          v_booking.township_id,
          'item_returned_on_time',
          'booking',
          v_booking.id,
          v_category.slug,
          jsonb_build_object('item_id', v_item.id),
          p_occurred_at
        );
      end if;
    when 'open_dispute' then
      if v_booking.status not in ('handed_over', 'completed')
         or (v_auth is not null and v_actor not in (v_booking.borrower_id, v_booking.lender_id))
         or p_occurred_at > v_booking.end_date + interval '7 days' then
        raise exception 'transition_not_allowed';
      end if;
      v_status := 'disputed';
    when 'resolve_dispute' then
      if v_booking.status <> 'disputed'
         or (v_auth is not null and not public.is_township_admin(v_booking.township_id)) then
        raise exception 'transition_not_allowed';
      end if;
      if coalesce(p_payload->>'resolution', 'closed') not in ('completed', 'closed') then
        raise exception 'invalid_resolution';
      end if;
      v_status := p_payload->>'resolution';
      if v_status = 'completed' then
        v_lender_points := public.award_points(
          v_booking.lender_id,
          v_booking.township_id,
          'item_lent_completed',
          'booking',
          v_booking.id,
          v_category.slug,
          jsonb_build_object('item_id', v_item.id, 'dispute_resolution', 'completed'),
          p_occurred_at
        );
      end if;
    else
      raise exception 'invalid_action';
  end case;

  update public.bookings
  set status = v_status,
      updated_at = p_occurred_at
  where id = v_booking.id;

  select * into v_booking from public.bookings where id = p_booking_id;
  return jsonb_build_object(
    'booking_id', v_booking.id,
    'status', v_booking.status,
    'lender_points', v_lender_points,
    'borrower_points', v_borrower_points
  );
end;
$$;

create or replace function public.evaluate_badges(p_user_id uuid, p_township_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_badge record;
  v_count integer;
  v_distinct_types integer;
  v_distinct_weeks integer;
  v_window_start timestamptz;
  v_recent_count integer;
  v_recent_ontime integer;
  v_awarded integer := 0;
begin
  for v_badge in select * from public.badges loop
    if v_badge.criteria->>'type' = 'count' then
      select count(*)
      into v_count
      from public.points_ledger l
      where l.user_id = p_user_id
        and l.township_id = p_township_id
        and l.action_type = any (select jsonb_array_elements_text(v_badge.criteria->'action_types'))
        and (
          v_badge.criteria->'metadata' is null
          or l.metadata->>'counts_as_sustainability'
             = coalesce(v_badge.criteria->'metadata'->>'counts_as_sustainability', 'false')
        );

      if v_count >= coalesce((v_badge.criteria->>'threshold')::integer, 1) then
        insert into public.user_badges (user_id, badge_id, township_id)
        select p_user_id, v_badge.id, p_township_id
        where not exists (
          select 1 from public.user_badges ub
          where ub.user_id = p_user_id and ub.badge_id = v_badge.id
        );
        if found then
          v_awarded := v_awarded + 1;
        end if;
      end if;
    elsif v_badge.criteria->>'type' = 'sustained' then
      v_window_start := now() - make_interval(weeks => coalesce((v_badge.criteria->>'window_weeks')::integer, 12));
      select count(distinct l.action_type), count(distinct date_trunc('week', l.created_at))
      into v_distinct_types, v_distinct_weeks
      from public.points_ledger l
      where l.user_id = p_user_id
        and l.township_id = p_township_id
        and l.created_at >= v_window_start;

      if v_distinct_types >= coalesce((v_badge.criteria->>'min_types')::integer, 3)
         and v_distinct_weeks >= coalesce((v_badge.criteria->>'min_active_weeks')::integer, 6) then
        insert into public.user_badges (user_id, badge_id, township_id)
        select p_user_id, v_badge.id, p_township_id
        where not exists (
          select 1 from public.user_badges ub
          where ub.user_id = p_user_id and ub.badge_id = v_badge.id
        );
        if found then
          v_awarded := v_awarded + 1;
        end if;
      end if;
    elsif v_badge.criteria->>'type' = 'consecutive_recent' then
      v_recent_count := coalesce((v_badge.criteria->>'threshold')::integer, 10);
      with recent as (
        select
          b.id,
          exists (
            select 1
            from public.points_ledger l
            where l.user_id = p_user_id
              and l.action_type = v_badge.criteria->>'action_type'
              and l.source_type = 'booking'
              and l.source_id = b.id
          ) as credited
        from public.bookings b
        where b.borrower_id = p_user_id
          and b.status = 'completed'
        order by b.updated_at desc
        limit v_recent_count
      )
      select count(*), count(*) filter (where credited)
      into v_recent_count, v_recent_ontime
      from recent;

      if v_recent_count = coalesce((v_badge.criteria->>'threshold')::integer, 10)
         and v_recent_ontime = v_recent_count then
        insert into public.user_badges (user_id, badge_id, township_id)
        select p_user_id, v_badge.id, p_township_id
        where not exists (
          select 1 from public.user_badges ub
          where ub.user_id = p_user_id and ub.badge_id = v_badge.id
        );
        if found then
          v_awarded := v_awarded + 1;
        end if;
      end if;
    end if;
  end loop;

  return v_awarded;
end;
$$;

insert into public.badges (slug, name, description, icon, criteria)
values (
  'reliable-returner',
  'Reliable returner',
  'Ten consecutive on-time returns.',
  'shield-check',
  '{"type":"consecutive_recent","action_type":"item_returned_on_time","threshold":10}'::jsonb
)
on conflict (slug) do nothing;

create or replace function public.save_item_guide(
  p_item_id uuid,
  p_body text,
  p_safety_note text default '',
  p_photo_paths text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_item public.items%rowtype;
  v_guide_id uuid;
  v_first boolean;
  v_points jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  select * into v_item from public.items where id = p_item_id for update;
  if not found or v_item.owner_id <> v_user_id then
    raise exception 'not_item_owner';
  end if;
  if char_length(coalesce(trim(p_body), '')) = 0 or char_length(p_body) > 1000 then
    raise exception 'invalid_guide_body';
  end if;
  if coalesce(array_length(p_photo_paths, 1), 0) > 3 then
    raise exception 'too_many_guide_photos';
  end if;

  select exists (
    select 1 from public.item_guides where item_id = p_item_id
  ) into v_first;
  v_first := not v_first;

  insert into public.item_guides (item_id, author_id, body, safety_note, photo_paths)
  values (
    p_item_id,
    v_user_id,
    trim(p_body),
    coalesce(nullif(trim(p_safety_note), ''), ''),
    coalesce(p_photo_paths, '{}')
  )
  on conflict (item_id) do update
  set body = excluded.body,
      safety_note = excluded.safety_note,
      photo_paths = excluded.photo_paths,
      author_id = excluded.author_id,
      updated_at = now()
  returning id into v_guide_id;

  if v_first then
    v_points := public.award_points(
      v_user_id,
      v_item.township_id,
      'item_guide_added',
      'item',
      p_item_id,
      null,
      jsonb_build_object('item_id', p_item_id),
      now()
    );
  end if;

  return jsonb_build_object('guide_id', v_guide_id, 'points', v_points, 'first_guide', v_first);
end;
$$;

create or replace function public.get_item_history(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.items%rowtype;
  v_township public.townships%rowtype;
  v_is_owner boolean;
  v_count integer;
  v_borrowers integer;
  v_saved numeric;
  v_timeline jsonb;
begin
  select * into v_item from public.items where id = p_item_id;
  if not found or v_item.hidden then
    raise exception 'item_not_found';
  end if;
  if not public.is_active_member(v_item.township_id) then
    raise exception 'not_active_member';
  end if;
  select * into v_township from public.townships where id = v_item.township_id;
  v_is_owner := auth.uid() = v_item.owner_id;

  select
    count(*),
    count(distinct b.borrower_id),
    coalesce(sum(coalesce(v_item.estimated_new_price_rm, c.typical_new_price_rm, 0)), 0)
  into v_count, v_borrowers, v_saved
  from public.bookings b
  join public.item_categories c on c.id = v_item.category_id
  where b.item_id = v_item.id and b.status = 'completed';

  with events as (
    select
      v_item.created_at as occurred_at,
      'listed' as event_type,
      null::uuid as booking_id,
      null::text as display_name
    union all
    select
      b.updated_at,
      case when b.status = 'completed' then 'returned' else 'borrowed' end,
      b.id,
      case
        when v_is_owner then coalesce(p.display_name, 'A neighbour')
        else 'A neighbour in ' || v_township.name
      end
    from public.bookings b
    left join public.profiles p on p.id = b.borrower_id
    where b.item_id = v_item.id
      and b.status in ('approved', 'handed_over', 'completed')
    union all
    select
      g.updated_at,
      'guide_added',
      null::uuid,
      case when v_is_owner then 'You' else 'The owner' end
    from public.item_guides g
    where g.item_id = v_item.id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(occurred_at at time zone 'Asia/Kuala_Lumpur', 'YYYY-MM-DD'),
        'type', event_type,
        'booking_id', booking_id,
        'display_name', display_name
      )
      order by occurred_at
    ),
    '[]'::jsonb
  )
  into v_timeline
  from events;

  return jsonb_build_object(
    'is_owner', v_is_owner,
    'borrow_count', v_count,
    'unique_borrowers', v_borrowers,
    'lifetime_saved_rm', v_saved,
    'timeline', v_timeline
  );
end;
$$;

create or replace function public.contest_return_condition(p_booking_id uuid, p_details text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_dispute_id uuid;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found or v_user_id is null or v_booking.borrower_id <> v_user_id then
    raise exception 'not_allowed';
  end if;
  if v_booking.return_condition <> 'damaged'
     or v_booking.condition_contest_ends_at is null
     or now() > v_booking.condition_contest_ends_at then
    raise exception 'contest_window_closed';
  end if;
  if exists (
    select 1 from public.disputes
    where booking_id = v_booking.id and kind = 'condition'
  ) then
    raise exception 'condition_already_contested';
  end if;

  insert into public.disputes (
    booking_id,
    opened_by,
    reason,
    details,
    status,
    kind,
    score_effect_frozen
  )
  values (
    v_booking.id,
    v_user_id,
    'condition_rating',
    coalesce(nullif(trim(p_details), ''), v_booking.return_condition_reason),
    'open',
    'condition',
    true
  )
  returning id into v_dispute_id;

  update public.bookings
  set status = 'disputed', updated_at = now()
  where id = v_booking.id;

  insert into public.notifications (user_id, type, title, body, link, dedupe_key)
  select
    m.user_id,
    'dispute_opened',
    'Condition rating contested',
    'A borrower contested a return condition rating. The trust effect is frozen until review.',
    '/admin/disputes',
    'condition-dispute:' || v_dispute_id::text
  from public.township_members m
  where m.township_id = v_booking.township_id
    and m.status = 'active'
    and m.role = 'township_admin'
  on conflict (user_id, dedupe_key) do nothing;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (
    v_booking.township_id,
    v_user_id,
    'condition_contested',
    'booking',
    v_booking.id,
    jsonb_build_object('dispute_id', v_dispute_id)
  );

  return jsonb_build_object('dispute_id', v_dispute_id, 'status', 'disputed');
end;
$$;

create or replace function public.resolve_booking_dispute(
  p_dispute_id uuid,
  p_resolution text,
  p_note text default '',
  p_borrower_at_fault boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_dispute public.disputes%rowtype;
  v_booking public.bookings%rowtype;
  v_category public.item_categories%rowtype;
  v_points jsonb;
begin
  select * into v_dispute from public.disputes where id = p_dispute_id for update;
  if not found or not public.is_township_admin((select township_id from public.bookings where id = v_dispute.booking_id)) then
    raise exception 'admin_required';
  end if;
  if p_resolution not in ('completed', 'closed') then
    raise exception 'invalid_resolution';
  end if;

  select * into v_booking from public.bookings where id = v_dispute.booking_id for update;
  select * into v_category from public.item_categories where id = (select category_id from public.items where id = v_booking.item_id);

  update public.disputes
  set status = 'resolved',
      resolution = p_resolution,
      resolution_note = p_note,
      resolved_by = v_user_id,
      resolved_at = now(),
      borrower_at_fault = case when v_dispute.kind = 'condition' then p_borrower_at_fault else false end,
      score_effect_frozen = false
  where id = v_dispute.id;

  update public.bookings
  set status = p_resolution, updated_at = now()
  where id = v_booking.id;

  if p_resolution = 'completed' then
    v_points := public.award_points(
      v_booking.lender_id,
      v_booking.township_id,
      'item_lent_completed',
      'booking',
      v_booking.id,
      v_category.slug,
      jsonb_build_object('dispute_id', v_dispute.id, 'resolution', 'completed'),
      now()
    );
  end if;

  insert into public.audit_log (township_id, actor_id, action, entity_type, entity_id, metadata)
  values (
    v_booking.township_id,
    v_user_id,
    'dispute_resolved',
    'dispute',
    v_dispute.id,
    jsonb_build_object(
      'resolution', p_resolution,
      'booking_id', v_booking.id,
      'borrower_at_fault', p_borrower_at_fault
    )
  );

  return jsonb_build_object(
    'dispute_id', v_dispute.id,
    'resolution', p_resolution,
    'points', v_points
  );
end;
$$;

create or replace function public.compute_trust_score(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not_self';
  end if;
  return public._trust_score(p_user_id);
end;
$$;

create or replace function public.get_incoming_request_trust(p_item_id uuid, p_requester_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.items%rowtype;
  v_caller uuid := auth.uid();
  v_score jsonb;
begin
  select * into v_item from public.items where id = p_item_id;
  if not found then
    raise exception 'item_not_found';
  end if;
  if v_caller is null or (v_caller <> v_item.owner_id and not public.is_township_admin(v_item.township_id)) then
    raise exception 'not_allowed';
  end if;

  v_score := public._trust_score(p_requester_id);
  return jsonb_build_object(
    'tier', v_score->>'tier',
    'meets_item_requirement',
    case
      when v_item.min_trust_tier is null then true
      when v_item.min_trust_tier = 'building' then true
      when v_item.min_trust_tier = 'trusted' then (v_score->>'score')::integer >= 40
      else (v_score->>'score')::integer >= 75
    end
  );
end;
$$;

create or replace function public.create_booking(
  p_item_id uuid,
  p_start_date date,
  p_end_date date,
  p_handover_method text default 'Meet in a shared space',
  p_borrower_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := coalesce(auth.uid(), p_borrower_id);
  v_item public.items%rowtype;
  v_category public.item_categories%rowtype;
  v_score jsonb;
  v_required_score integer := 0;
  v_value numeric;
  v_deposit_waived boolean := false;
  v_deposit_amount numeric := 0;
  v_booking_id uuid;
  v_conflict_count integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into v_item from public.items where id = p_item_id for update;
  if not found or v_item.hidden or v_item.status <> 'active' then
    raise exception 'item_not_available';
  end if;
  select * into v_category from public.item_categories where id = v_item.category_id;

  if not public.is_active_member(v_item.township_id) then
    raise exception 'not_active_member';
  end if;
  if v_item.owner_id = v_user_id then
    raise exception 'cannot_book_own_item';
  end if;
  if p_start_date > p_end_date then
    raise exception 'invalid_dates';
  end if;
  if (p_end_date - p_start_date + 1) > v_item.max_loan_days then
    raise exception 'loan_too_long';
  end if;

  v_score := public._trust_score(v_user_id);
  v_value := coalesce(v_item.estimated_new_price_rm, v_category.typical_new_price_rm, 0);
  if v_value >= 300 then
    v_required_score := 40;
  end if;
  if v_item.min_trust_tier = 'trusted' then
    v_required_score := greatest(v_required_score, 40);
  elsif v_item.min_trust_tier = 'highly_trusted' then
    v_required_score := greatest(v_required_score, 75);
  elsif v_item.min_trust_tier = 'building' then
    v_required_score := greatest(v_required_score, 0);
  end if;
  if (v_score->>'score')::integer < v_required_score then
    raise exception 'high_value_trust_required';
  end if;

  v_deposit_waived := v_item.requires_deposit
    and v_item.allow_deposit_waiver
    and (v_score->>'tier') = 'highly_trusted';
  if v_item.requires_deposit and not v_deposit_waived then
    v_deposit_amount := v_item.deposit_rm;
  end if;

  select count(*)
  into v_conflict_count
  from public.bookings
  where item_id = p_item_id
    and status in ('approved', 'handed_over')
    and daterange(start_date, end_date, '[]') && daterange(p_start_date, p_end_date, '[]');
  if v_conflict_count > 0 then
    raise exception 'dates_unavailable';
  end if;

  insert into public.bookings (
    item_id,
    township_id,
    borrower_id,
    lender_id,
    start_date,
    end_date,
    handover_method,
    deposit_amount_rm,
    deposit_waived,
    status
  )
  values (
    p_item_id,
    v_item.township_id,
    v_user_id,
    v_item.owner_id,
    p_start_date,
    p_end_date,
    coalesce(nullif(trim(p_handover_method), ''), 'Meet in a shared space'),
    v_deposit_amount,
    v_deposit_waived,
    'requested'
  )
  returning id into v_booking_id;

  return jsonb_build_object(
    'booking_id', v_booking_id,
    'status', 'requested',
    'deposit_amount_rm', v_deposit_amount,
    'deposit_waived', v_deposit_waived
  );
end;
$$;

revoke execute on function public._trust_score(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.compute_trust_score(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.get_incoming_request_trust(uuid, uuid) from public, anon, authenticated, service_role;
revoke execute on function public.save_item_guide(uuid, text, text, text[]) from public, anon, authenticated, service_role;
revoke execute on function public.get_item_history(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.contest_return_condition(uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.compute_trust_score(uuid) to authenticated;
grant execute on function public.get_incoming_request_trust(uuid, uuid) to authenticated;
grant execute on function public.save_item_guide(uuid, text, text, text[]) to authenticated;
grant execute on function public.get_item_history(uuid) to authenticated;
grant execute on function public.contest_return_condition(uuid, text) to authenticated;

create or replace function public.township_value_shared(
  p_township_id uuid,
  p_days integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz;
  v_total numeric;
  v_count integer;
begin
  if auth.uid() is null or not public.is_active_member(p_township_id) then
    raise exception 'not_active_member';
  end if;
  if p_days is not null then
    v_start := now() - make_interval(days => greatest(p_days, 1));
  end if;

  select
    coalesce(sum(coalesce(i.estimated_new_price_rm, c.typical_new_price_rm, 0)), 0),
    count(*)
  into v_total, v_count
  from public.bookings b
  join public.items i on i.id = b.item_id
  join public.item_categories c on c.id = i.category_id
  where b.township_id = p_township_id
    and b.status = 'completed'
    and (v_start is null or b.updated_at >= v_start);

  return jsonb_build_object(
    'estimated_value_shared_rm', v_total,
    'completed_borrows', v_count,
    'estimated', true
  );
end;
$$;

grant execute on function public.township_value_shared(uuid, integer) to authenticated;
