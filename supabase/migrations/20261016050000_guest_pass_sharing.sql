-- Recovered from the applied local migration history.
-- Only the host can recover encrypted sharing credentials. Validation continues
-- to use visitor_passes.token_hash / short_code_hash, including offline scans.
create table public.guest_pass_share_secrets (
  pass_id uuid primary key references public.visitor_passes(id) on delete cascade,
  encrypted_credentials text not null check (length(encrypted_credentials) between 40 and 2048)
);

alter table public.guest_pass_share_secrets enable row level security;

revoke all on public.guest_pass_share_secrets from public, anon, authenticated;

create function public.create_shareable_visitor_pass(
  p_encrypted_credentials text,
  p_token_hash bytea,
  p_short_code_hash bytea,
  p_visitor_name text,
  p_valid_from timestamptz,
  p_valid_until timestamptz,
  p_max_entries integer default 1,
  p_visitor_phone text default null,
  p_vehicle_plate text default null,
  p_purpose text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
  v_result := public.create_visitor_pass(p_token_hash, p_short_code_hash,
    p_visitor_name, p_valid_from, p_valid_until, p_max_entries,
    p_visitor_phone, p_vehicle_plate, p_purpose);
  insert into public.guest_pass_share_secrets(pass_id, encrypted_credentials)
  values ((v_result->>'pass_id')::uuid, p_encrypted_credentials);
  return v_result;
end;
$$;

revoke all on function public.create_shareable_visitor_pass(text, bytea, bytea, text, timestamptz, timestamptz, integer, text, text, text) from public, anon, authenticated;

grant execute on function public.create_shareable_visitor_pass(text, bytea, bytea, text, timestamptz, timestamptz, integer, text, text, text) to authenticated;

-- A legacy pass has no recoverable token. Explicitly replacing its link keeps
-- the same pass, visit window, entry counts and logs. Locking prevents two
-- simultaneous requests from issuing different replacement links.
create function public.share_visitor_pass(
  p_pass_id uuid,
  p_encrypted_credentials text default null,
  p_token_hash bytea default null,
  p_short_code_hash bytea default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pass public.visitor_passes%rowtype;
  v_credentials text;
begin
  select p.* into v_pass from public.visitor_passes p
  where p.id = p_pass_id and p.host_id = auth.uid()
    and exists (select 1 from public.township_members m
      where m.user_id = auth.uid() and m.township_id = p.township_id
        and m.status = 'active' and m.role <> 'guard')
  for update;
  if not found then raise exception 'pass_not_found'; end if;
  if v_pass.status <> 'active' or v_pass.valid_until <= now()
     or v_pass.entries_used >= v_pass.max_entries or v_pass.source <> 'resident' then
    raise exception 'pass_not_shareable';
  end if;

  select encrypted_credentials into v_credentials
  from public.guest_pass_share_secrets where pass_id = v_pass.id;
  if v_credentials is not null then
    return jsonb_build_object('encrypted_credentials', v_credentials);
  end if;
  if p_encrypted_credentials is null then
    return jsonb_build_object('needs_replacement', true);
  end if;
  if p_token_hash is null or octet_length(p_token_hash) <> 32
     or p_short_code_hash is null or octet_length(p_short_code_hash) <> 32 then
    raise exception 'invalid_token';
  end if;

  insert into public.guest_pass_share_secrets(pass_id, encrypted_credentials)
  values (v_pass.id, p_encrypted_credentials);
  update public.visitor_passes set token_hash = p_token_hash,
    short_code_hash = p_short_code_hash where id = v_pass.id;
  insert into public.audit_log(township_id, actor_id, action, entity_type, entity_id, metadata)
  values (v_pass.township_id, auth.uid(), 'guest_pass_link_replaced', 'visitor_pass', v_pass.id, '{}'::jsonb);
  return jsonb_build_object('encrypted_credentials', p_encrypted_credentials);
end;
$$;

revoke all on function public.share_visitor_pass(uuid, text, bytea, bytea) from public, anon, authenticated;

grant execute on function public.share_visitor_pass(uuid, text, bytea, bytea) to authenticated;

-- Follow the existing retention purge when it clears pass credentials.
create function public.purge_guest_pass_share_secret()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.token_hash is null then
    delete from public.guest_pass_share_secrets where pass_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.purge_guest_pass_share_secret() from public, anon, authenticated;

create trigger purge_guest_pass_share_secret after update of token_hash on public.visitor_passes
for each row execute function public.purge_guest_pass_share_secret();
