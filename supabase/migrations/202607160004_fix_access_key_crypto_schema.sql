-- Supabase installs pgcrypto in the extensions schema. Qualify each crypto
-- call so key creation and unlock validation work with a restricted search_path.

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

  perform pg_advisory_xact_lock(hashtextextended(caller_id::text || ':' || p_session_id::text, 0));

  if exists (
    select 1 from public.user_session_unlocks
    where user_id = caller_id and session_id = p_session_id
  ) then return 'already_unlocked'; end if;

  delete from public.session_unlock_attempts
  where user_id = caller_id
    and session_id = p_session_id
    and failed_at < now() - interval '24 hours';

  select count(*)::integer into recent_failures
  from public.session_unlock_attempts
  where user_id = caller_id
    and session_id = p_session_id
    and failed_at >= now() - interval '15 minutes';

  if recent_failures >= 5 then return 'rate_limited'; end if;

  select id into matched_code
  from public.session_access_codes
  where session_id = p_session_id
    and is_active = true
    and (starts_at is null or now() >= starts_at)
    and (expires_at is null or now() <= expires_at)
    and code_hash = extensions.crypt(coalesce(p_code, ''), code_hash)
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
        and code_hash = extensions.crypt(coalesce(p_code, ''), code_hash)
    ) into expired_match;

    insert into public.session_unlock_attempts (user_id, session_id)
    values (caller_id, p_session_id);

    if expired_match then return 'expired_code'; end if;
    return 'invalid_code';
  end if;

  insert into public.user_session_unlocks (user_id, session_id, access_code_id)
  values (caller_id, p_session_id, matched_code)
  on conflict (user_id, session_id) do nothing;

  delete from public.session_unlock_attempts
  where user_id = caller_id and session_id = p_session_id;

  return 'unlocked';
end;
$$;

revoke all on function public.unlock_session_recording(uuid, text) from public;
revoke all on function public.unlock_session_recording(uuid, text) from anon;
grant execute on function public.unlock_session_recording(uuid, text) to authenticated;

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
  if coalesce(p_plain_code, '') !~ '^\d{4}$' then raise exception 'four_digit_code_required'; end if;

  insert into public.session_access_codes (session_id, code_hash, code_label, starts_at, expires_at)
  values (p_session_id, extensions.crypt(p_plain_code, extensions.gen_salt('bf')), p_code_label, p_starts_at, p_expires_at)
  returning id into new_id;

  return new_id;
end;
$$;

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
  if coalesce(p_plain_code, '') !~ '^\d{4}$' then raise exception 'four_digit_code_required'; end if;

  update public.session_access_codes code
  set is_active = false
  where code.is_active = true
    and exists (
      select 1 from public.resources resource
      where resource.session_id = code.session_id
        and resource.type = 'audio'
        and resource.access_type = 'session_protected'
        and resource.status = 'published'
    );

  insert into public.session_access_codes (session_id, code_hash, code_label, starts_at, expires_at, is_active)
  select distinct
    resource.session_id,
    extensions.crypt(p_plain_code, extensions.gen_salt('bf')),
    'Common Sacred Access Key',
    null,
    null,
    true
  from public.resources resource
  where resource.type = 'audio'
    and resource.access_type = 'session_protected'
    and resource.status = 'published'
    and resource.session_id is not null;

  get diagnostics created_count = row_count;
  return created_count;
end;
$$;

revoke all on function public.set_common_session_access_code(text) from public;
revoke all on function public.set_common_session_access_code(text) from anon;
grant execute on function public.set_common_session_access_code(text) to authenticated;
grant execute on function public.set_common_session_access_code(text) to service_role;
