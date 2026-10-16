-- One-time resident reward for completing the Rimba recycling basics guide.

insert into public.reward_rules (
  township_id,
  action_type,
  category_slug,
  points,
  daily_cap,
  weekly_cap,
  active,
  reason_template
)
values (
  null,
  'recycling_guide_completed',
  null,
  5,
  null,
  null,
  true,
  'Recycling guide completed'
)
on conflict (township_id, action_type, category_slug) do update
set points = excluded.points,
    active = excluded.active,
    reason_template = excluded.reason_template;

create or replace function public.complete_recycling_guide(p_township_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_award jsonb;
begin
  if v_user_id is null or not public.is_active_member(p_township_id) then
    raise exception 'not_active_member';
  end if;

  v_award := public.award_points(
    v_user_id,
    p_township_id,
    'recycling_guide_completed',
    'recycling_guide',
    p_township_id,
    null,
    jsonb_build_object('guide_version', 1),
    now()
  );

  return jsonb_build_object(
    'awarded', v_award is not null,
    'points', coalesce((v_award->>'delta')::integer, 0),
    'completed', true
  );
end;
$$;

revoke execute on function public.complete_recycling_guide(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.complete_recycling_guide(uuid)
  to authenticated, service_role;
