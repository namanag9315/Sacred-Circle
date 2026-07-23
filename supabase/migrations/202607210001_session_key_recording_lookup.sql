begin;

-- A failed lookup does not know a session yet, so global per-user attempts may
-- legitimately have no session id. Playback authorization still records the
-- concrete session whenever one is known.
alter table public.session_unlock_attempts
  alter column session_id drop not null;

-- Resolve a six-digit key to safe recording metadata only. Media locations are
-- deliberately excluded; get-resource-url performs a second, per-playback key
-- check before issuing a temporary URL.
create or replace function public.find_recordings_by_sacred_key(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  matched_session_ids uuid[];
  expired_session_id uuid;
  recent_failures integer := 0;
  recordings jsonb := '[]'::jsonb;
begin
  if caller_id is null then
    return jsonb_build_object('status', 'auth_required', 'recordings', recordings);
  end if;

  perform pg_advisory_xact_lock(hashtextextended(caller_id::text, 0));

  delete from public.session_unlock_attempts
  where user_id = caller_id
    and failed_at < now() - interval '24 hours';

  select count(*)::integer into recent_failures
  from public.session_unlock_attempts
  where user_id = caller_id
    and failed_at >= now() - interval '15 minutes';

  if recent_failures >= 5 then
    return jsonb_build_object('status', 'rate_limited', 'recordings', recordings);
  end if;

  if coalesce(p_code, '') !~ '^[0-9]{6}$' then
    insert into public.session_unlock_attempts (user_id, session_id)
    values (caller_id, null);
    return jsonb_build_object('status', 'invalid_code', 'recordings', recordings);
  end if;

  select array_agg(distinct access_code.session_id)
  into matched_session_ids
  from public.session_access_codes access_code
  where access_code.is_active = true
    and (access_code.starts_at is null or now() >= access_code.starts_at)
    and (access_code.expires_at is null or now() <= access_code.expires_at)
    and access_code.code_hash = extensions.crypt(p_code, access_code.code_hash);

  if matched_session_ids is null or cardinality(matched_session_ids) = 0 then
    select access_code.session_id
    into expired_session_id
    from public.session_access_codes access_code
    where access_code.is_active = true
      and access_code.expires_at is not null
      and now() > access_code.expires_at
      and access_code.code_hash = extensions.crypt(p_code, access_code.code_hash)
    order by access_code.created_at desc
    limit 1;

    insert into public.session_unlock_attempts (user_id, session_id)
    values (caller_id, expired_session_id);

    return jsonb_build_object(
      'status', case when expired_session_id is null then 'invalid_code' else 'expired_code' end,
      'recordings', recordings
    );
  end if;

  delete from public.session_unlock_attempts
  where user_id = caller_id;

  select coalesce(jsonb_agg(to_jsonb(recording) order by recording.recorded_at desc nulls last, recording.created_at desc), '[]'::jsonb)
  into recordings
  from (
    select distinct
      resource.id,
      resource.title,
      resource.description,
      resource.type,
      resource.category,
      resource.audio_group,
      resource.recorded_at,
      resource.shivir_location,
      resource.access_type,
      resource.storage_provider,
      resource.session_id,
      resource.page_id,
      resource.duration_seconds,
      resource.is_featured,
      resource.display_order,
      resource.migration_status,
      resource.status,
      resource.created_at,
      resource.updated_at
    from public.resources resource
    where resource.session_id = any(matched_session_ids)
      and resource.type = 'audio'
      and resource.access_type = 'session_protected'
      and resource.status = 'published'
      and resource.migration_status in ('ready', 'imported')
  ) recording;

  if jsonb_array_length(recordings) = 0 then
    return jsonb_build_object('status', 'recording_unavailable', 'recordings', recordings);
  end if;

  return jsonb_build_object('status', 'matched', 'recordings', recordings);
end;
$$;

revoke all on function public.find_recordings_by_sacred_key(text) from public;
revoke all on function public.find_recordings_by_sacred_key(text) from anon;
grant execute on function public.find_recordings_by_sacred_key(text) to authenticated;

-- Creating a key rotates the key for that session and rejects reuse of an
-- active key belonging to another session.
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
  code_already_used boolean := false;
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin_required'; end if;
  if coalesce(p_plain_code, '') !~ '^[0-9]{6}$' then raise exception 'six_digit_code_required'; end if;

  select exists (
    select 1
    from public.session_access_codes access_code
    where access_code.session_id <> p_session_id
      and access_code.is_active = true
      and access_code.code_hash = extensions.crypt(p_plain_code, access_code.code_hash)
  ) into code_already_used;

  if code_already_used then raise exception 'sacred_key_already_in_use'; end if;

  update public.session_access_codes
  set is_active = false
  where session_id = p_session_id
    and is_active = true;

  insert into public.session_access_codes (session_id, code_hash, code_label, starts_at, expires_at)
  values (p_session_id, extensions.crypt(p_plain_code, extensions.gen_salt('bf')), p_code_label, p_starts_at, p_expires_at)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.create_session_access_code(uuid, text, text, timestamptz, timestamptz) from public;
revoke all on function public.create_session_access_code(uuid, text, text, timestamptz, timestamptz) from anon;
grant execute on function public.create_session_access_code(uuid, text, text, timestamptz, timestamptz) to authenticated;

-- Retire keys produced by the superseded common-key control. Existing
-- session-specific keys remain active.
update public.session_access_codes
set is_active = false
where is_active = true
  and code_label = 'Common Sacred Access Key';

revoke execute on function public.set_common_session_access_code(text) from authenticated;
revoke execute on function public.set_common_session_access_code(text) from service_role;

comment on function public.find_recordings_by_sacred_key(text) is
  'Returns safe published recording metadata for a valid session-specific Sacred Access Key. Never returns media URLs or storage paths.';

commit;
