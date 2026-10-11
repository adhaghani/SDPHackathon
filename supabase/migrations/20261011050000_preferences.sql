create table if not exists public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('points_awarded','badge_earned','level_up','booking_update','event_update','announcement','challenge_complete')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, type)
);

alter table public.notification_preferences enable row level security;

create policy notification_preferences_select_own on public.notification_preferences
  for select to authenticated using (user_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then
    null;
end
$$;

revoke all on public.notification_preferences from anon, authenticated;
grant select on public.notification_preferences to authenticated;

create or replace function public.set_notification_preference(
  p_type text,
  p_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or p_type not in ('points_awarded','badge_earned','level_up','booking_update','event_update','announcement','challenge_complete') then
    raise exception 'invalid_notification_preference';
  end if;

  insert into public.notification_preferences (user_id, type, enabled, updated_at)
  values (v_user_id, p_type, coalesce(p_enabled, true), now())
  on conflict (user_id, type) do update set enabled = excluded.enabled, updated_at = excluded.updated_at;

  return jsonb_build_object('type', p_type, 'enabled', coalesce(p_enabled, true));
end;
$$;

grant execute on function public.set_notification_preference(text, boolean) to authenticated;
