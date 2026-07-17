alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.session_registrations enable row level security;
alter table public.session_access_codes enable row level security;
alter table public.user_session_unlocks enable row level security;
alter table public.session_unlock_attempts enable row level security;
alter table public.pages enable row level security;
alter table public.resources enable row level security;
alter table public.programs enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.videos enable row level security;
alter table public.announcements enable row level security;
alter table public.app_settings enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_history enable row level security;

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user and role = 'admin'
  );
$$;

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
      and (
        r.access_type = 'public'
        or public.is_admin(check_user)
        or (
          r.access_type = 'session_protected'
          and r.session_id is not null
          and exists (
            select 1 from public.user_session_unlocks usu
            where usu.user_id = check_user and usu.session_id = r.session_id
          )
        )
      )
  );
$$;

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
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_required';
  end if;

  insert into public.session_access_codes (session_id, code_hash, code_label, starts_at, expires_at)
  values (p_session_id, extensions.crypt(p_plain_code, extensions.gen_salt('bf')), p_code_label, p_starts_at, p_expires_at)
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.grant_session_unlock(p_user_id uuid, p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_required';
  end if;

  insert into public.user_session_unlocks (user_id, session_id, access_code_id)
  values (p_user_id, p_session_id, null)
  on conflict (user_id, session_id) do nothing;
end;
$$;

create or replace function public.revoke_session_unlock(p_user_id uuid, p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_required';
  end if;

  delete from public.user_session_unlocks
  where user_id = p_user_id and session_id = p_session_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone, city, state, date_of_birth)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    case
      when coalesce(new.raw_user_meta_data->>'date_of_birth', '') ~ '^\d{4}-\d{2}-\d{2}$'
      then (new.raw_user_meta_data->>'date_of_birth')::date
      else null
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.protect_profile_identity_and_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profile_id_immutable';
  end if;
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin', 'service_role')
     or public.is_admin(auth.uid()) then
    return new;
  end if;
  if new.email is distinct from old.email then
    raise exception 'profile_email_managed_by_auth';
  end if;
  if new.role is distinct from old.role then
    raise exception 'profile_role_admin_only';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_identity_and_role on public.profiles;
create trigger profiles_protect_identity_and_role
before update on public.profiles
for each row execute function public.protect_profile_identity_and_role();

create policy "profiles own or admin read" on public.profiles for select
using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles own insert" on public.profiles for insert
with check (
  public.is_admin(auth.uid())
  or (id = auth.uid() and role = 'user' and email = coalesce(auth.jwt() ->> 'email', ''))
);

create policy "profiles own update" on public.profiles for update
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles admin delete" on public.profiles for delete
using (public.is_admin(auth.uid()));

create policy "sessions public read" on public.sessions for select
using (status <> 'cancelled' or public.is_admin(auth.uid()));

create policy "sessions admin manage" on public.sessions for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "session registrations own read" on public.session_registrations for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "session registrations own insert" on public.session_registrations for insert
with check (user_id = auth.uid());

create policy "session registrations own update" on public.session_registrations for update
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "session access codes admin only" on public.session_access_codes for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "session unlocks own read" on public.user_session_unlocks for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "session unlocks admin manage" on public.user_session_unlocks for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "session unlock attempts admin read" on public.session_unlock_attempts for select
using (public.is_admin(auth.uid()));

create policy "session unlock attempts admin delete" on public.session_unlock_attempts for delete
using (public.is_admin(auth.uid()));

create policy "pages published read" on public.pages for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

create policy "pages admin manage" on public.pages for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "resources published catalog read" on public.resources for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

create policy "resources admin manage" on public.resources for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "programs published read" on public.programs for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

create policy "programs admin manage" on public.programs for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "events published read" on public.events for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

create policy "events admin manage" on public.events for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "event registrations own read" on public.event_registrations for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "event registrations insert" on public.event_registrations for insert
with check (user_id is null or user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "event registrations admin manage" on public.event_registrations for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "contact submissions own insert" on public.contact_submissions;
create policy "contact submissions own insert" on public.contact_submissions for insert
with check (auth.uid() is not null and (user_id is null or user_id = auth.uid()));

drop policy if exists "contact submissions own read" on public.contact_submissions;
create policy "contact submissions own read" on public.contact_submissions for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "contact submissions admin update" on public.contact_submissions;
create policy "contact submissions admin update" on public.contact_submissions for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "contact submissions admin delete" on public.contact_submissions;
create policy "contact submissions admin delete" on public.contact_submissions for delete
using (public.is_admin(auth.uid()));

create policy "videos published read" on public.videos for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

create policy "videos admin manage" on public.videos for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "announcements active read" on public.announcements for select
using (auth.uid() is not null and is_active = true or public.is_admin(auth.uid()));

create policy "announcements admin manage" on public.announcements for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "settings public whitelist read" on public.app_settings for select
using (
  key in (
    'whatsapp_group_url',
    'youtube_channel_url',
    'contact_email',
    'default_zoom_info',
    'default_zoom_link',
    'sunday_session_time',
    'disclaimer_text',
    'privacy_policy',
    'terms_text'
  )
  or public.is_admin(auth.uid())
);

create policy "settings admin manage" on public.app_settings for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "push tokens own read" on public.push_tokens for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "push tokens own insert" on public.push_tokens for insert
with check (user_id = auth.uid());

create policy "push tokens own update" on public.push_tokens for update
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "notification history admin read" on public.notification_history for select
using (public.is_admin(auth.uid()));

create policy "notification history admin insert" on public.notification_history for insert
with check (public.is_admin(auth.uid()));
