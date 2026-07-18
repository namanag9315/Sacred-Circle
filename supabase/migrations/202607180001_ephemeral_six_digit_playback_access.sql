begin;

-- A Sacred Access Key now authorizes one protected playback request. It no
-- longer creates a durable user/session entitlement.
create or replace function public.unlock_session_recording(p_session_id uuid, p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  matched_code uuid;
  expired_match boolean := false;
  recent_failures integer := 0;
begin
  if caller_id is null then return 'auth_required'; end if;

  -- The common key is shared across sessions, so rate limiting must also be
  -- global per user; otherwise callers could multiply guesses by session id.
  perform pg_advisory_xact_lock(hashtextextended(caller_id::text, 0));

  delete from public.session_unlock_attempts
  where user_id = caller_id
    and failed_at < now() - interval '24 hours';

  select count(*)::integer into recent_failures
  from public.session_unlock_attempts
  where user_id = caller_id
    and failed_at >= now() - interval '15 minutes';

  if recent_failures >= 5 then return 'rate_limited'; end if;

  if coalesce(p_code, '') !~ '^[0-9]{6}$' then
    insert into public.session_unlock_attempts (user_id, session_id)
    values (caller_id, p_session_id);
    return 'invalid_code';
  end if;

  select id into matched_code
  from public.session_access_codes
  where session_id = p_session_id
    and is_active = true
    and (starts_at is null or now() >= starts_at)
    and (expires_at is null or now() <= expires_at)
    and code_hash = extensions.crypt(p_code, code_hash)
  order by created_at desc
  limit 1;

  if matched_code is null then
    select exists (
      select 1
      from public.session_access_codes
      where session_id = p_session_id
        and is_active = true
        and expires_at is not null
        and now() > expires_at
        and code_hash = extensions.crypt(p_code, code_hash)
    ) into expired_match;

    insert into public.session_unlock_attempts (user_id, session_id)
    values (caller_id, p_session_id);

    if expired_match then return 'expired_code'; end if;
    return 'invalid_code';
  end if;

  delete from public.session_unlock_attempts
  where user_id = caller_id;

  return 'unlocked';
end;
$$;

revoke all on function public.unlock_session_recording(uuid, text) from public;
revoke all on function public.unlock_session_recording(uuid, text) from anon;
grant execute on function public.unlock_session_recording(uuid, text) to authenticated;

-- Bind authorization to the published resource so callers cannot substitute a
-- different session id. Admins retain their existing protected-media bypass.
create or replace function public.authorize_resource_playback(p_resource_id uuid, p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  resource_access_type text;
  resource_session_id uuid;
begin
  if caller_id is null then return 'auth_required'; end if;

  select access_type, session_id
  into resource_access_type, resource_session_id
  from public.resources
  where id = p_resource_id
    and status = 'published';

  if not found then return 'resource_not_found'; end if;
  if resource_access_type = 'public' or public.is_admin(caller_id) then return 'authorized'; end if;
  if resource_access_type <> 'session_protected' or resource_session_id is null then return 'access_denied'; end if;

  return public.unlock_session_recording(resource_session_id, p_code);
end;
$$;

revoke all on function public.authorize_resource_playback(uuid, text) from public;
revoke all on function public.authorize_resource_playback(uuid, text) from anon;
grant execute on function public.authorize_resource_playback(uuid, text) to authenticated;

-- Catalog access is no longer an entitlement check for protected playback.
-- The Edge Function performs the per-request key authorization above.
create or replace function public.user_can_access_resource(check_resource uuid, check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.resources r
    where r.id = check_resource
      and r.status = 'published'
      and (r.access_type = 'public' or public.is_admin(check_user))
  );
$$;

create or replace function public.create_session_access_code(
  p_session_id uuid,
  p_plain_code text,
  p_code_label text default null,
  p_starts_at timestamptz default null,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin_required'; end if;
  if coalesce(p_plain_code, '') !~ '^[0-9]{6}$' then raise exception 'six_digit_code_required'; end if;

  insert into public.session_access_codes (session_id, code_hash, code_label, starts_at, expires_at)
  values (p_session_id, extensions.crypt(p_plain_code, extensions.gen_salt('bf')), p_code_label, p_starts_at, p_expires_at)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.create_session_access_code(uuid, text, text, timestamptz, timestamptz) from public;
revoke all on function public.create_session_access_code(uuid, text, text, timestamptz, timestamptz) from anon;
grant execute on function public.create_session_access_code(uuid, text, text, timestamptz, timestamptz) to authenticated;

create or replace function public.set_common_session_access_code(p_plain_code text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  created_count integer := 0;
begin
  if auth.role() <> 'service_role' and not public.is_admin(auth.uid()) then raise exception 'admin_required'; end if;
  if coalesce(p_plain_code, '') !~ '^[0-9]{6}$' then raise exception 'six_digit_code_required'; end if;

  -- A common-key rotation must retire every prior active key. Otherwise an
  -- unpublished recording could retain an old key and silently accept it if
  -- the recording is published again later.
  update public.session_access_codes
  set is_active = false
  where is_active = true;

  insert into public.session_access_codes (session_id, code_hash, code_label, starts_at, expires_at, is_active)
  select
    protected_session.session_id,
    extensions.crypt(p_plain_code, extensions.gen_salt('bf')),
    'Common Sacred Access Key',
    null::timestamptz,
    null::timestamptz,
    true
  from (
    select distinct resource.session_id
    from public.resources resource
    where resource.type = 'audio'
      and resource.access_type = 'session_protected'
      and resource.session_id is not null
  ) protected_session;

  get diagnostics created_count = row_count;
  return created_count;
end;
$$;

revoke all on function public.set_common_session_access_code(text) from public;
revoke all on function public.set_common_session_access_code(text) from anon;
grant execute on function public.set_common_session_access_code(text) to authenticated;
grant execute on function public.set_common_session_access_code(text) to service_role;

-- Existing hashes cannot reveal whether their plaintext was four or six digits.
-- Require an administrator to rotate a new known six-digit key after deployment.
update public.session_access_codes set is_active = false where is_active = true;

-- Old rows were permanent entitlements. They are deliberately invalidated and
-- user_can_access_resource no longer consults this table.
delete from public.user_session_unlocks;

-- Prevent old admin RPCs from recreating inert rows that look like durable
-- access grants. The table remains only so older databases can migrate safely.
drop function if exists public.grant_session_unlock(uuid, uuid);
drop function if exists public.revoke_session_unlock(uuid, uuid);

comment on table public.user_session_unlocks is
  'Deprecated legacy unlock rows. Protected playback now requires a Sacred Access Key for each new playback request.';

commit;
