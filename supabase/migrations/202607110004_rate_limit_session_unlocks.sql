begin;

create table if not exists public.session_unlock_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  failed_at timestamptz not null default now()
);

alter table public.session_unlock_attempts enable row level security;

create index if not exists idx_session_unlock_attempts_window
  on public.session_unlock_attempts(user_id, session_id, failed_at desc);

drop policy if exists "session unlock attempts admin read" on public.session_unlock_attempts;
create policy "session unlock attempts admin read"
on public.session_unlock_attempts for select
using (public.is_admin(auth.uid()));

drop policy if exists "session unlock attempts admin delete" on public.session_unlock_attempts;
create policy "session unlock attempts admin delete"
on public.session_unlock_attempts for delete
using (public.is_admin(auth.uid()));

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
  if caller_id is null then
    return 'auth_required';
  end if;

  -- Serialize attempts for this user/session so concurrent requests cannot
  -- bypass the rolling limit.
  perform pg_advisory_xact_lock(
    hashtextextended(caller_id::text || ':' || p_session_id::text, 0)
  );

  if exists (
    select 1 from public.user_session_unlocks
    where user_id = caller_id and session_id = p_session_id
  ) then
    return 'already_unlocked';
  end if;

  delete from public.session_unlock_attempts
  where user_id = caller_id
    and session_id = p_session_id
    and failed_at < now() - interval '24 hours';

  select count(*)::integer into recent_failures
  from public.session_unlock_attempts
  where user_id = caller_id
    and session_id = p_session_id
    and failed_at >= now() - interval '15 minutes';

  if recent_failures >= 5 then
    return 'rate_limited';
  end if;

  select id into matched_code
  from public.session_access_codes
  where session_id = p_session_id
    and is_active = true
    and (starts_at is null or now() >= starts_at)
    and (expires_at is null or now() <= expires_at)
    and code_hash = crypt(coalesce(p_code, ''), code_hash)
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
        and code_hash = crypt(coalesce(p_code, ''), code_hash)
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

comment on table public.session_unlock_attempts is
  'Failed unlock timestamps only. Sacred Access Key values are never stored here.';

commit;
