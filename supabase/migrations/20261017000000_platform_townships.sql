-- Platform provisioning is separate from resident and township roles.
create extension if not exists postgis with schema extensions;

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;
grant select on public.platform_admins to authenticated;
grant all on public.platform_admins to service_role;
create policy platform_admin_self on public.platform_admins for select to authenticated using (user_id = auth.uid());

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.platform_admins where user_id = auth.uid());
$$;
revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

alter table public.townships
  add column lifecycle text not null default 'active' check (lifecycle in ('draft','active','archived')),
  add column state text not null default '',
  add column district text not null default '',
  add column description text not null default '',
  add column boundary jsonb;

create table public.platform_manager_invitations (
  id uuid primary key default gen_random_uuid(),
  township_id uuid not null references public.townships(id),
  email text not null check (email = lower(trim(email)) and length(email) <= 254),
  display_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','sent','failed','accepted','revoked')),
  last_error text,
  sent_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (township_id, email)
);
create table public.platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  township_id uuid not null references public.townships(id),
  action text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
-- Include managers provisioned before the platform portal existed.
insert into public.platform_manager_invitations(township_id,email,display_name,user_id,status,created_by)
select m.township_id,lower(u.email),coalesce(p.display_name,'Township manager'),m.user_id,'accepted',m.user_id
from public.township_members m join auth.users u on u.id=m.user_id
left join public.profiles p on p.id=m.user_id
where m.role='township_admin' and m.status='active' and u.email is not null;
alter table public.platform_manager_invitations enable row level security;
alter table public.platform_audit_log enable row level security;
revoke all on public.platform_manager_invitations, public.platform_audit_log from anon, authenticated;
grant select on public.platform_manager_invitations, public.platform_audit_log to authenticated;
create policy platform_invitations_read on public.platform_manager_invitations for select to authenticated using (public.is_platform_admin());
create policy platform_audit_read on public.platform_audit_log for select to authenticated using (public.is_platform_admin());
create policy platform_townships_read on public.townships for select to authenticated using (public.is_platform_admin());
create policy platform_neighbourhoods_read on public.neighbourhoods for select to authenticated using (public.is_platform_admin());
-- Members retain their township's identity for draft/archive status messages.
create policy township_identity_member on public.townships for select to authenticated using (
  exists(select 1 from public.township_members m where m.township_id=public.townships.id and m.user_id=auth.uid() and m.status in ('active','pending'))
);

create function public._platform_require_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'platform_admin_required'; end if;
end; $$;
revoke all on function public._platform_require_admin() from public, anon, authenticated;

create function public._platform_boundary(p_boundary jsonb) returns extensions.geometry
language plpgsql immutable set search_path = '' as $$
declare g extensions.geometry;
begin
  if p_boundary is null or p_boundary->>'type' is distinct from 'Polygon'
     or jsonb_typeof(p_boundary->'coordinates') is distinct from 'array'
     or jsonb_array_length(p_boundary->'coordinates') <> 1
     or jsonb_typeof(p_boundary->'coordinates'->0) is distinct from 'array'
     or jsonb_array_length(p_boundary->'coordinates'->0) not between 4 and 501 then
    raise exception 'invalid_boundary';
  end if;
  g := extensions.st_setsrid(extensions.st_geomfromgeojson(p_boundary::text), 4326);
  if extensions.st_isempty(g) or not extensions.st_isvalid(g)
     or extensions.st_ndims(g) <> 2
     or extensions.st_xmin(g) < -180 or extensions.st_xmax(g) > 180
     or extensions.st_ymin(g) <= -90 or extensions.st_ymax(g) >= 90
     or extensions.st_area(g) <= 0 then raise exception 'invalid_boundary'; end if;
  return g;
exception when others then raise exception 'invalid_boundary';
end; $$;
revoke all on function public._platform_boundary(jsonb) from public, anon, authenticated;

create function public.platform_boundary_overlaps(p_boundary jsonb, p_township_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare g extensions.geometry; result jsonb;
begin
  perform public._platform_require_admin();
  g := public._platform_boundary(p_boundary);
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name)), '[]') into result
  from public.townships t where t.boundary is not null and t.lifecycle <> 'archived'
    and t.id is distinct from p_township_id
    and extensions.st_relate(g, public._platform_boundary(t.boundary), 'T********');
  return result;
end; $$;

create function public.platform_save_township(p_data jsonb, p_township_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_status text; v_names text[]; v_old public.townships%rowtype; v_overlaps jsonb;
begin
  perform public._platform_require_admin();
  -- Serialize provisioning so concurrent boundary checks cannot miss each other.
  perform pg_advisory_xact_lock(70261017);
  v_status := p_data->>'lifecycle';
  if length(trim(coalesce(p_data->>'name',''))) not between 2 and 120
     or coalesce(p_data->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or length(p_data->>'slug') > 100
     or coalesce(p_data->>'join_code','') !~ '^[A-Z0-9-]{6,40}$'
     or length(trim(coalesce(p_data->>'state',''))) not between 1 and 100
     or length(trim(coalesce(p_data->>'district',''))) not between 1 and 100
     or length(coalesce(p_data->>'description','')) > 2000
     or v_status is null or v_status not in ('draft','active','archived') then
    raise exception 'invalid_township_details';
  end if;
  if p_township_id is not null then
    select * into v_old from public.townships where id = p_township_id for update;
    if not found then raise exception 'township_not_found'; end if;
  end if;
  v_overlaps := public.platform_boundary_overlaps(p_data->'boundary', p_township_id);
  if jsonb_array_length(v_overlaps) > 0 and coalesce(p_data->>'acknowledge_overlaps','false') <> 'true' then
    raise exception 'boundary_overlap_confirmation_required';
  end if;
  select array_agg(distinct trim(value)) into v_names
  from jsonb_array_elements_text(p_data->'neighbourhoods') where trim(value) <> '';
  if coalesce(cardinality(v_names),0) not between 1 and 100
     or exists(select 1 from unnest(v_names) n where length(n) > 100) then
    raise exception 'neighbourhoods_required';
  end if;
  if v_status = 'active' and not exists(
    select 1 from public.platform_manager_invitations where township_id = p_township_id and status = 'sent'
    union all select 1 from public.township_members where township_id = p_township_id and role = 'township_admin' and status = 'active'
  ) then raise exception 'manager_required_before_activation'; end if;
  if p_township_id is null then
    insert into public.townships(name,slug,join_code,state,district,description,boundary,lifecycle,auto_approve_members,require_event_approval,is_demo)
    values(trim(p_data->>'name'),p_data->>'slug',p_data->>'join_code',trim(p_data->>'state'),trim(p_data->>'district'),p_data->>'description',p_data->'boundary',v_status,(p_data->>'auto_approve_members')::boolean,(p_data->>'require_event_approval')::boolean,false)
    returning id into v_id;
  else
    v_id := p_township_id;
    update public.townships set name=trim(p_data->>'name'),slug=p_data->>'slug',join_code=p_data->>'join_code',state=trim(p_data->>'state'),district=trim(p_data->>'district'),description=p_data->>'description',boundary=p_data->'boundary',lifecycle=v_status,auto_approve_members=(p_data->>'auto_approve_members')::boolean,require_event_approval=(p_data->>'require_event_approval')::boolean where id=v_id;
  end if;
  -- Preserve existing neighbourhood IDs and memberships. New names are additive.
  insert into public.neighbourhoods(township_id,name) select v_id, unnest(v_names) on conflict do nothing;
  insert into public.platform_audit_log(actor_id,township_id,action,details) values(auth.uid(),v_id,case when p_township_id is null then 'township_created' else 'township_updated' end,jsonb_build_object('previous_status',v_old.lifecycle,'status',v_status,'overlaps_acknowledged',v_overlaps,'previous_boundary',v_old.boundary,'boundary',p_data->'boundary'));
  return v_id;
end; $$;

create function public.platform_prepare_manager(p_township_id uuid, p_email text, p_display_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_id uuid; v_status text; v_email text := lower(trim(p_email));
begin
  perform public._platform_require_admin();
  perform 1 from public.townships where id=p_township_id and lifecycle <> 'archived' for update;
  if not found then raise exception 'township_not_available'; end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(v_email)>254
     or length(trim(p_display_name)) not between 2 and 100 then raise exception 'invalid_manager_details'; end if;
  if exists(select 1 from public.platform_manager_invitations where township_id=p_township_id and email=v_email and status='sent' and sent_at > now()-interval '60 seconds') then raise exception 'invitation_rate_limited'; end if;
  select id into v_user from auth.users where lower(email)=v_email and email_confirmed_at is not null and deleted_at is null;
  v_status := case when v_user is null then 'pending' else 'accepted' end;
  insert into public.platform_manager_invitations(township_id,email,display_name,user_id,status,created_by)
  values(p_township_id,v_email,trim(p_display_name),v_user,v_status,auth.uid())
  on conflict (township_id,email) do update set display_name=excluded.display_name,user_id=excluded.user_id,status=excluded.status,last_error=null,sent_at=null,created_by=auth.uid()
  returning id into v_id;
  if v_user is not null then
    insert into public.township_members(township_id,user_id,role,status,approved_by,approved_at)
    values(p_township_id,v_user,'township_admin','active',auth.uid(),now())
    on conflict(township_id,user_id) do update set role='township_admin',status='active',approved_by=auth.uid(),approved_at=now();
    insert into public.profiles(id,display_name) values(v_user,trim(p_display_name)) on conflict do nothing;
  end if;
  insert into public.platform_audit_log(actor_id,township_id,action,details) values(auth.uid(),p_township_id,'manager_appointed',jsonb_build_object('invitation_id',v_id,'status',v_status));
  return jsonb_build_object('id',v_id,'status',v_status,'email',v_email);
end; $$;

create function public.platform_record_delivery(p_id uuid, p_succeeded boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_township uuid;
begin
  perform public._platform_require_admin();
  update public.platform_manager_invitations set status=case when p_succeeded then 'sent' else 'failed' end,
    sent_at=case when p_succeeded then now() else null end,
    last_error=case when p_succeeded then null else 'Email could not be sent. Check Auth email settings and retry.' end
  where id=p_id and status='pending' returning township_id into v_township;
  if v_township is not null then insert into public.platform_audit_log(actor_id,township_id,action,details) values(auth.uid(),v_township,'manager_email_delivery',jsonb_build_object('invitation_id',p_id,'succeeded',p_succeeded)); end if;
end; $$;

create function public.platform_revoke_manager(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.platform_manager_invitations%rowtype;
begin
  perform public._platform_require_admin();
  select * into v from public.platform_manager_invitations where id=p_id for update;
  if not found then raise exception 'invitation_not_found'; end if;
  perform 1 from public.townships where id=v.township_id for update;
  if v.status='accepted' and exists(select 1 from public.townships where id=v.township_id and lifecycle='active')
     and not exists(select 1 from public.township_members where township_id=v.township_id and role='township_admin' and status='active' and user_id is distinct from v.user_id) then
    raise exception 'last_active_manager';
  end if;
  update public.platform_manager_invitations set status='revoked' where id=p_id;
  update public.township_members set role='resident',status=case when exists(select 1 from public.townships where id=v.township_id and lifecycle='active') then status else 'suspended' end where township_id=v.township_id and user_id=v.user_id and role='township_admin';
  insert into public.platform_audit_log(actor_id,township_id,action,details) values(auth.uid(),v.township_id,'manager_revoked',jsonb_build_object('invitation_id',p_id));
end; $$;

create function public.my_manager_invitations() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'township_id',t.id,'name',t.name,'display_name',i.display_name)), '[]')
  from public.platform_manager_invitations i join public.townships t on t.id=i.township_id
  join auth.users u on u.id=auth.uid() and lower(u.email)=i.email and u.email_confirmed_at is not null
  where i.status='sent' and t.lifecycle <> 'archived';
$$;

create function public.accept_manager_invitations() returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.platform_manager_invitations%rowtype; v_first uuid; v_name text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  for v in select i.* from public.platform_manager_invitations i join auth.users u on u.id=auth.uid() and lower(u.email)=i.email and u.email_confirmed_at is not null join public.townships t on t.id=i.township_id and t.lifecycle <> 'archived' where i.status='sent' for update of i loop
    insert into public.township_members(township_id,user_id,role,status,approved_by,approved_at)
    values(v.township_id,auth.uid(),'township_admin','active',v.created_by,now())
    on conflict(township_id,user_id) do update set role='township_admin',status='active',approved_by=v.created_by,approved_at=now();
    update public.platform_manager_invitations set status='accepted',user_id=auth.uid(),last_error=null where id=v.id;
    insert into public.platform_audit_log(actor_id,township_id,action,details) values(auth.uid(),v.township_id,'manager_accepted',jsonb_build_object('invitation_id',v.id));
    v_first := coalesce(v_first,v.township_id); v_name := v.display_name;
  end loop;
  if v_first is null then raise exception 'no_pending_manager_invitation'; end if;
  insert into public.profiles(id,display_name,terms_accepted_at,privacy_accepted_at) values(auth.uid(),v_name,now(),now())
  on conflict(id) do update set terms_accepted_at=coalesce(public.profiles.terms_accepted_at,now()),privacy_accepted_at=coalesce(public.profiles.privacy_accepted_at,now());
  return v_first;
end; $$;

-- Drafts and archived townships cannot receive new resident memberships.
create function public._guard_township_membership() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('active','pending') and new.role <> 'township_admin'
     and not exists(select 1 from public.townships where id=new.township_id and lifecycle='active') then
    raise exception 'township_not_available';
  end if;
  return new;
end; $$;
revoke all on function public._guard_township_membership() from public, anon, authenticated;
create trigger guard_township_membership before insert or update on public.township_members for each row execute function public._guard_township_membership();

-- Lifecycle controls discovery and resident/admin entry. Records are preserved.
create or replace function public.is_active_member(p_township_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.township_members m join public.townships t on t.id=m.township_id where m.township_id=p_township_id and m.user_id=auth.uid() and m.status='active' and t.lifecycle='active');
$$;
create or replace function public.has_role(p_township_id uuid, p_roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.township_members m join public.townships t on t.id=m.township_id where m.township_id=p_township_id and m.user_id=auth.uid() and m.status='active' and m.role=any(p_roles) and t.lifecycle='active');
$$;
create or replace function public.get_join_details(p_join_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare t public.townships%rowtype; n jsonb;
begin
  select * into t from public.townships where join_code=upper(trim(p_join_code)) and lifecycle='active';
  if not found then return jsonb_build_object('error','invalid_join_code'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name) order by name),'[]') into n from public.neighbourhoods where township_id=t.id;
  return jsonb_build_object('township_id',t.id,'name',t.name,'auto_approve_members',t.auto_approve_members,'neighbourhoods',n);
end; $$;

-- Explicit grants: new SECURITY DEFINER functions are never public entry points.
revoke all on function public.platform_boundary_overlaps(jsonb,uuid), public.platform_save_township(jsonb,uuid), public.platform_prepare_manager(uuid,text,text), public.platform_record_delivery(uuid,boolean), public.platform_revoke_manager(uuid), public.my_manager_invitations(), public.accept_manager_invitations() from public, anon;
grant execute on function public.platform_boundary_overlaps(jsonb,uuid), public.platform_save_township(jsonb,uuid), public.platform_prepare_manager(uuid,text,text), public.platform_record_delivery(uuid,boolean), public.platform_revoke_manager(uuid), public.my_manager_invitations(), public.accept_manager_invitations() to authenticated;
