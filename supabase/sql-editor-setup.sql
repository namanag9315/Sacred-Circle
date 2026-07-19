-- Sacred Circle Supabase SQL Editor Setup
-- Run this entire file in Supabase Dashboard > SQL Editor.
-- Order: schema, RPC/functions/RLS, base seed data, YouTube video library seed.
-- Safe to rerun for tables/functions/triggers/seeds; policies are dropped/recreated here.

begin;

-- =========================================================
-- 1. Schema
-- =========================================================
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  phone text null,
  city text null,
  state text null,
  date_of_birth date null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists state text null,
  add column if not exists date_of_birth date null;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  topic text null,
  description text not null default '',
  session_date timestamptz not null,
  duration_minutes integer null,
  zoom_link text null,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (user_id, session_id)
);

create table if not exists public.session_access_codes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  code_hash text not null,
  code_label text null,
  starts_at timestamptz null,
  expires_at timestamptz null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_session_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  access_code_id uuid null references public.session_access_codes(id) on delete set null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, session_id)
);

create table if not exists public.session_unlock_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  failed_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text null,
  body text not null default '',
  hero_image_url text null,
  status text not null default 'published' check (status in ('published', 'archived', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  type text not null check (type in ('audio', 'pdf', 'article', 'video')),
  category text not null,
  audio_group text null check (audio_group is null or audio_group in ('free', 'online_shivir', 'offline_shivir')),
  recorded_at date null,
  shivir_location text null,
  access_type text not null default 'public' check (access_type in ('public', 'session_protected', 'admin_only')),
  storage_provider text not null default 'external' check (storage_provider in ('r2', 'supabase', 'youtube', 'external')),
  storage_path text null,
  youtube_url text null,
  external_url text null,
  session_id uuid null references public.sessions(id) on delete set null,
  page_id uuid null references public.pages(id) on delete set null,
  duration_seconds integer null,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  source_url text null,
  migration_status text not null default 'manual_review' check (migration_status in ('manual_review', 'ready', 'imported', 'needs_update', 'archived')),
  status text not null default 'published' check (status in ('published', 'archived', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint protected_audio_requires_session check (access_type <> 'session_protected' or session_id is not null),
  constraint offline_shivir_requires_location check (audio_group <> 'offline_shivir' or nullif(trim(shivir_location), '') is not null)
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text null,
  image_url text null,
  display_order integer not null default 0,
  source_url text null,
  migration_status text not null default 'manual_review' check (migration_status in ('manual_review', 'ready', 'imported', 'needs_update', 'archived')),
  status text not null default 'published' check (status in ('published', 'archived', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  event_date timestamptz null,
  location text null,
  image_url text null,
  registration_enabled boolean not null default true,
  source_url text null,
  migration_status text not null default 'manual_review' check (migration_status in ('manual_review', 'ready', 'imported', 'needs_update', 'archived')),
  status text not null default 'published' check (status in ('published', 'archived', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.profiles(id) on delete set null,
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  email text not null,
  phone text null,
  city text null,
  message text null,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  phone text null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  youtube_url text not null,
  thumbnail_url text null,
  category text null,
  display_order integer not null default 0,
  source_url text null,
  migration_status text not null default 'manual_review' check (migration_status in ('manual_review', 'ready', 'imported', 'needs_update', 'archived')),
  status text not null default 'published' check (status in ('published', 'archived', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_type text not null default 'all',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.pages add column if not exists display_order integer not null default 0;
alter table public.pages add column if not exists source_url text null;
alter table public.pages add column if not exists migration_status text not null default 'manual_review';
alter table public.programs add column if not exists source_url text null;
alter table public.programs add column if not exists migration_status text not null default 'manual_review';
alter table public.programs add column if not exists created_at timestamptz not null default now();
alter table public.programs add column if not exists updated_at timestamptz not null default now();
alter table public.events add column if not exists source_url text null;
alter table public.events add column if not exists migration_status text not null default 'manual_review';
alter table public.videos add column if not exists source_url text null;
alter table public.videos add column if not exists migration_status text not null default 'manual_review';
alter table public.videos add column if not exists created_at timestamptz not null default now();
alter table public.videos add column if not exists updated_at timestamptz not null default now();
alter table public.resources add column if not exists source_url text null;
alter table public.resources add column if not exists migration_status text not null default 'manual_review';

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  platform text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create table if not exists public.notification_history (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_type text not null default 'all',
  sent_by uuid null references public.profiles(id) on delete set null,
  sent_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at before update on public.sessions for each row execute function public.set_updated_at();

drop trigger if exists pages_set_updated_at on public.pages;
create trigger pages_set_updated_at before update on public.pages for each row execute function public.set_updated_at();

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at before update on public.resources for each row execute function public.set_updated_at();

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at before update on public.programs for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();

drop trigger if exists videos_set_updated_at on public.videos;
create trigger videos_set_updated_at before update on public.videos for each row execute function public.set_updated_at();

create or replace function public.set_youtube_thumbnail_url()
returns trigger
language plpgsql
as $$
declare
  video_id text;
begin
  if new.youtube_url is null or btrim(new.youtube_url) = '' then
    return new;
  end if;

  video_id := substring(new.youtube_url from '(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/|shorts/|live/))([A-Za-z0-9_-]{6,})');
  if video_id is null then
    video_id := substring(new.youtube_url from '[?&]v=([A-Za-z0-9_-]{6,})');
  end if;

  if video_id is not null and (
    new.thumbnail_url is null
    or new.thumbnail_url = ''
    or new.thumbnail_url not like 'https://i.ytimg.com/vi/%'
  ) then
    new.thumbnail_url := 'https://i.ytimg.com/vi/' || video_id || '/hqdefault.jpg';
  end if;

  return new;
end;
$$;

drop trigger if exists videos_set_youtube_thumbnail_url on public.videos;
create trigger videos_set_youtube_thumbnail_url
before insert or update of youtube_url, thumbnail_url on public.videos
for each row execute function public.set_youtube_thumbnail_url();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at before update on public.app_settings for each row execute function public.set_updated_at();

drop trigger if exists push_tokens_set_updated_at on public.push_tokens;
create trigger push_tokens_set_updated_at before update on public.push_tokens for each row execute function public.set_updated_at();

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_sessions_date on public.sessions(session_date);
create index if not exists idx_session_access_codes_session on public.session_access_codes(session_id);
create index if not exists idx_unlocks_user_session on public.user_session_unlocks(user_id, session_id);
create index if not exists idx_session_unlock_attempts_window on public.session_unlock_attempts(user_id, session_id, failed_at desc);
create index if not exists idx_resources_access on public.resources(access_type, status);
create index if not exists idx_resources_session on public.resources(session_id);
create index if not exists idx_resources_migration on public.resources(migration_status);
create index if not exists idx_pages_order on public.pages(display_order);
create index if not exists idx_programs_order on public.programs(display_order);
create index if not exists idx_events_date on public.events(event_date);
create index if not exists idx_videos_order on public.videos(display_order);
create index if not exists idx_contact_submissions_status on public.contact_submissions(status, created_at desc);


-- =========================================================
-- 2. RLS, RPC Functions, Auth Trigger, Policies
-- =========================================================
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
    select 1
    from public.profiles profile
    join auth.users auth_user on auth_user.id = profile.id
    where profile.id = check_user
      and profile.role = 'admin'
      and lower(profile.email) = 'sacredcircle45@gmail.com'
      and lower(coalesce(auth_user.email, '')) = 'sacredcircle45@gmail.com'
      and auth_user.email_confirmed_at is not null
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
  if coalesce(p_plain_code, '') !~ '^[0-9]{6}$' then
    raise exception 'six_digit_code_required';
  end if;

  insert into public.session_access_codes (session_id, code_hash, code_label, starts_at, expires_at)
  values (p_session_id, extensions.crypt(p_plain_code, extensions.gen_salt('bf')), p_code_label, p_starts_at, p_expires_at)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.create_session_access_code(uuid, text, text, timestamptz, timestamptz) from public;
revoke all on function public.create_session_access_code(uuid, text, text, timestamptz, timestamptz) from anon;
grant execute on function public.create_session_access_code(uuid, text, text, timestamptz, timestamptz) to authenticated;

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

drop policy if exists "profiles own or admin read" on public.profiles;
create policy "profiles own or admin read" on public.profiles for select
using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles for insert
with check (
  public.is_admin(auth.uid())
  or (id = auth.uid() and role = 'user' and email = coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles admin delete" on public.profiles;
create policy "profiles admin delete" on public.profiles for delete
using (public.is_admin(auth.uid()));

drop policy if exists "sessions logged in read" on public.sessions;
drop policy if exists "sessions public read" on public.sessions;
create policy "sessions public read" on public.sessions for select
using (status <> 'cancelled' or public.is_admin(auth.uid()));

drop policy if exists "sessions admin manage" on public.sessions;
create policy "sessions admin manage" on public.sessions for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "session registrations own read" on public.session_registrations;
create policy "session registrations own read" on public.session_registrations for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "session registrations own insert" on public.session_registrations;
create policy "session registrations own insert" on public.session_registrations for insert
with check (user_id = auth.uid());

drop policy if exists "session registrations own update" on public.session_registrations;
create policy "session registrations own update" on public.session_registrations for update
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "session access codes admin only" on public.session_access_codes;
create policy "session access codes admin only" on public.session_access_codes for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "session unlocks own read" on public.user_session_unlocks;
create policy "session unlocks own read" on public.user_session_unlocks for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "session unlocks admin manage" on public.user_session_unlocks;
create policy "session unlocks admin manage" on public.user_session_unlocks for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "session unlock attempts admin read" on public.session_unlock_attempts;
create policy "session unlock attempts admin read" on public.session_unlock_attempts for select
using (public.is_admin(auth.uid()));

drop policy if exists "session unlock attempts admin delete" on public.session_unlock_attempts;
create policy "session unlock attempts admin delete" on public.session_unlock_attempts for delete
using (public.is_admin(auth.uid()));

drop policy if exists "pages published read" on public.pages;
create policy "pages published read" on public.pages for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

drop policy if exists "pages admin manage" on public.pages;
create policy "pages admin manage" on public.pages for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "resources catalog read" on public.resources;
drop policy if exists "resources published catalog read" on public.resources;
create policy "resources published catalog read" on public.resources for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

drop policy if exists "resources admin manage" on public.resources;
create policy "resources admin manage" on public.resources for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "programs published read" on public.programs;
create policy "programs published read" on public.programs for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

drop policy if exists "programs admin manage" on public.programs;
create policy "programs admin manage" on public.programs for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "events published read" on public.events;
create policy "events published read" on public.events for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

drop policy if exists "events admin manage" on public.events;
create policy "events admin manage" on public.events for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "event registrations own read" on public.event_registrations;
create policy "event registrations own read" on public.event_registrations for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "event registrations insert" on public.event_registrations;
create policy "event registrations insert" on public.event_registrations for insert
with check (user_id is null or user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "event registrations admin manage" on public.event_registrations;
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

drop policy if exists "videos published read" on public.videos;
create policy "videos published read" on public.videos for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

drop policy if exists "videos admin manage" on public.videos;
create policy "videos admin manage" on public.videos for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "announcements active read" on public.announcements;
create policy "announcements active read" on public.announcements for select
using (auth.uid() is not null and is_active = true or public.is_admin(auth.uid()));

drop policy if exists "announcements admin manage" on public.announcements;
create policy "announcements admin manage" on public.announcements for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "settings logged in read" on public.app_settings;
drop policy if exists "settings public whitelist read" on public.app_settings;
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

drop policy if exists "settings admin manage" on public.app_settings;
create policy "settings admin manage" on public.app_settings for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "push tokens own read" on public.push_tokens;
create policy "push tokens own read" on public.push_tokens for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "push tokens own insert" on public.push_tokens;
create policy "push tokens own insert" on public.push_tokens for insert
with check (user_id = auth.uid());

drop policy if exists "push tokens own update" on public.push_tokens;
create policy "push tokens own update" on public.push_tokens for update
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "notification history admin read" on public.notification_history;
create policy "notification history admin read" on public.notification_history for select
using (public.is_admin(auth.uid()));

drop policy if exists "notification history admin insert" on public.notification_history;
create policy "notification history admin insert" on public.notification_history for insert
with check (public.is_admin(auth.uid()));


-- =========================================================
-- 3. Base Seed Data
-- =========================================================
insert into public.sessions (id, title, topic, description, session_date, duration_minutes, zoom_link, status)
values
  ('20000000-0000-4000-8000-000000000001', 'Sunday Meditation and Healing', 'Meditation, healing and spiritual wisdom', 'Join the live Sacred Circle Sunday session online through Zoom. The Sacred Access Key is shared during the live session.', now() + interval '1 day', 75, null, 'upcoming'),
  ('20000000-0000-4000-8000-000000000002', 'Fear Release Healing Session', 'Removing all kinds of fears', 'A protected Sunday healing recording for participants of the live session.', now() - interval '6 days', 58, null, 'completed'),
  ('20000000-0000-4000-8000-000000000003', 'Relationship Healing Circle', 'Resolving relationship issues', 'A protected Sunday session recording for live participants.', now() - interval '13 days', 64, null, 'completed'),
  ('20000000-0000-4000-8000-000000000004', 'Manifestation and Abundance', 'Manifestation for abundance', 'A completed Sunday session whose recording has not been uploaded yet.', now() - interval '20 days', 60, null, 'completed')
on conflict (id) do nothing;

insert into public.pages (id, slug, title, subtitle, body, hero_image_url, status)
values
  ('90000000-0000-4000-8000-000000000001', 'home', 'Sacred Circle', 'Meditation, healing, Brahm Vidya and spiritual wisdom.', 'Sacred Circle is a simple spiritual space for meditation, healing, Brahm Vidya practices, Sunday online sessions and wisdom resources.', null, 'published'),
  ('90000000-0000-4000-8000-000000000002', 'about', 'About Sacred Circle', 'A peaceful community for sincere seekers.', 'Sacred Circle offers meditation, healing practices, spiritual wisdom and online Sunday sessions. The app preserves the website content in a simpler mobile format.', null, 'published'),
  ('90000000-0000-4000-8000-000000000003', 'contact', 'Contact', 'Reach Sacred Circle or join the WhatsApp community.', 'For session details, WhatsApp community access, event interest or general questions, contact Sacred Circle using the details in app settings.', null, 'published')
on conflict (slug) do update set title = excluded.title, subtitle = excluded.subtitle, body = excluded.body, status = excluded.status;

insert into public.programs (title, description, display_order, status)
values
  ('Healing Body and Mind', 'Meditation and healing practices for restoring balance in body, mind and energy.', 1, 'published'),
  ('Concentration in Studies', 'Simple spiritual practices for students seeking calm focus, memory and discipline.', 2, 'published'),
  ('Manifestation for Abundance', 'Sacred Circle program content preserved for mobile review.', 3, 'published'),
  ('Resolving Relationship Issues', 'Sacred Circle program content preserved for mobile review.', 4, 'published'),
  ('Removing all Kinds of Fears', 'Sacred Circle program content preserved for mobile review.', 5, 'published'),
  ('Intuition Development', 'Sacred Circle program content preserved for mobile review.', 6, 'published'),
  ('DNA Activations', 'Sacred Circle program content preserved for mobile review.', 7, 'published'),
  ('Past Life Regression', 'Sacred Circle program content preserved for mobile review.', 8, 'published'),
  ('Akashic Records', 'Sacred Circle program content preserved for mobile review.', 9, 'published'),
  ('Guidance from Higher Self / I AM Presence', 'Sacred Circle program content preserved for mobile review.', 10, 'published'),
  ('Merkaba Activation', 'Sacred Circle program content preserved for mobile review.', 11, 'published'),
  ('Great Central Sun', 'Sacred Circle program content preserved for mobile review.', 12, 'published'),
  ('Amrit Shakti', 'Sacred Circle program content preserved for mobile review.', 13, 'published'),
  ('Ascended Masters', 'Sacred Circle program content preserved for mobile review.', 14, 'published'),
  ('Galactic Beings', 'Sacred Circle program content preserved for mobile review.', 15, 'published'),
  ('Ancient Egypt Energy Journey', 'Sacred Circle program content preserved for mobile review.', 16, 'published'),
  ('Tachyon Energy', 'A subtle energy-based exploration preserved from the Sacred Circle program inventory.', 17, 'published')
on conflict do nothing;

insert into public.events (id, title, description, event_date, location, registration_enabled, status)
values
  ('50000000-0000-4000-8000-000000000001', 'Shri Vishnu Vidhya Shivir', 'A Sacred Circle shivir preserved from the website inventory. Details should be confirmed manually before registration opens.', now() + interval '21 days', 'To be shared by Sacred Circle', true, 'published')
on conflict (id) do nothing;

insert into public.announcements (id, title, message, target_type, is_active)
values
  ('60000000-0000-4000-8000-000000000001', 'Sunday Session', 'Join the Sunday meditation and healing session at 4:00 PM IST on Zoom.', 'all', true),
  ('60000000-0000-4000-8000-000000000002', 'Protected Recording', 'Enter the Sacred Access Key shared during the live Sunday session to unlock that session recording.', 'all', true)
on conflict (id) do nothing;

insert into public.app_settings (id, key, value)
values
  ('80000000-0000-4000-8000-000000000002', 'youtube_channel_url', 'https://www.youtube.com/@sacredcirclegroup'),
  ('80000000-0000-4000-8000-000000000003', 'contact_email', 'hello@sacredcirclegroup.com'),
  ('80000000-0000-4000-8000-000000000004', 'default_zoom_info', 'Sunday meditation happens online through Zoom at 4:00 PM IST.'),
  ('80000000-0000-4000-8000-000000000006', 'disclaimer_text', 'Sacred Circle offers meditation and spiritual awareness practices for personal growth and wellbeing. It is not a substitute for medical, psychological, or professional advice.'),
  ('80000000-0000-4000-8000-000000000007', 'home_quote', 'The light within
you is the same
light that illuminates
the universe.'),
  ('80000000-0000-4000-8000-000000000008', 'home_quote_author', 'Mahavatar Babaji'),
  ('80000000-0000-4000-8000-000000000009', 'privacy_policy', 'Sacred Circle keeps profile details minimal and uses them only for sessions, meditation access, contact, and app support.'),
  ('80000000-0000-4000-8000-000000000010', 'terms_text', 'Use Sacred Circle as a wellness and meditation companion. Live sessions remain on external Zoom links.')
on conflict (key) do update set value = excluded.value;


-- =========================================================
-- 4. YouTube Video Library Seed
-- =========================================================
-- Sacred Circle YouTube video library imported from sacred_circle_youtube_video_library.xlsx
-- Videos are stored as YouTube links only. Do not download or host YouTube videos.

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000001', 'Guided Meditation: Connection to Great Central Sun & Galactic Beings', 'Sacred Circle video library item. Suggested category: Guided Meditation / Spiritual Development.', 'https://www.youtube.com/watch?v=bzK0ha1LNfI', 'https://i.ytimg.com/vi/bzK0ha1LNfI/hqdefault.jpg', 'Meditation', 1, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000002', 'Intuition क्या है? Kundalini Awakening; Past Life Heal करने का विज्ञान', 'Sacred Circle video library item. Suggested category: Intuition / Kundalini / Past Life.', 'https://www.youtube.com/watch?v=eYm0jfliXWU', 'https://i.ytimg.com/vi/eYm0jfliXWU/hqdefault.jpg', 'Spirituality', 2, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000003', 'Divine Matrix क्या है? सफलता का विज्ञान', 'Sacred Circle video library item. Suggested category: Divine Matrix / Success.', 'https://www.youtube.com/watch?v=kJMynrjNLAE', 'https://i.ytimg.com/vi/kJMynrjNLAE/hqdefault.jpg', 'Spirituality', 3, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000004', 'साधना की मंज़िल', 'Sacred Circle video library item. Suggested category: Sadhana.', 'https://www.youtube.com/watch?v=wdcQuk8Hb0g', 'https://i.ytimg.com/vi/wdcQuk8Hb0g/hqdefault.jpg', 'Spirituality', 4, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000005', 'आध्यात्मिक मुक्ति के लिए क्या करें? Arcturians से मदद; साधना के लिए यह सतयुग है', 'Sacred Circle video library item. Suggested category: Spiritual Liberation.', 'https://www.youtube.com/watch?v=wvVTGP2czT0', 'https://i.ytimg.com/vi/wvVTGP2czT0/hqdefault.jpg', 'Spirituality', 5, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000006', 'श्री गुरु दत्त: The Cosmic Guide; Ascended Masters कौन हैं? Spiritual Activation क्या है?', 'Sacred Circle video library item. Suggested category: Ascended Masters / Spiritual Activation.', 'https://www.youtube.com/watch?v=5NHP0Y94WrQ', 'https://i.ytimg.com/vi/5NHP0Y94WrQ/hqdefault.jpg', 'Spirituality', 6, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000007', 'बांग्ला देश में भगवान मदद क्यों नहीं कर रहे हैं?', 'Sacred Circle video library item. Suggested category: Spiritual Talk.', 'https://www.youtube.com/watch?v=CuyKlL0IsOU', 'https://i.ytimg.com/vi/CuyKlL0IsOU/hqdefault.jpg', 'Spirituality', 7, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000008', 'Guided Meditation for World Peace', 'Sacred Circle video library item. Suggested category: Guided Meditation / World Peace.', 'https://www.youtube.com/watch?v=RRhQQXhOx2c', 'https://i.ytimg.com/vi/RRhQQXhOx2c/hqdefault.jpg', 'Meditation', 8, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000009', 'क्या धरती सजीव है? Part 3: मंत्र जाप की सही विधि, चमत्कारों के रहस्य', 'Sacred Circle video library item. Suggested category: Healing & Meditation Workshop.', 'https://www.youtube.com/watch?v=kFJurSkzDkE', 'https://i.ytimg.com/vi/kFJurSkzDkE/hqdefault.jpg', 'Healing', 9, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000010', 'Mother Earth Meditation: Chakra Activation; धरती माता की चेतना से जुड़ना', 'Sacred Circle video library item. Suggested category: Mother Earth Meditation.', 'https://www.youtube.com/watch?v=icHVPbidq74', 'https://i.ytimg.com/vi/icHVPbidq74/hqdefault.jpg', 'Meditation', 10, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000011', 'Meta Healing क्या है? आप healing क्यों स्वीकार नहीं करते? Flight/Fight/Freeze response', 'Sacred Circle video library item. Suggested category: Meta Healing.', 'https://www.youtube.com/watch?v=P1gJheLi7gQ', 'https://i.ytimg.com/vi/P1gJheLi7gQ/hqdefault.jpg', 'Healing', 11, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000012', 'Meditation for Meta Healing: Energy Blocks heal नहीं होने दे रहे हैं उन्हें निकाल दें', 'Sacred Circle video library item. Suggested category: Meta Healing Meditation.', 'https://www.youtube.com/watch?v=fpyoSX0V2xM', 'https://i.ytimg.com/vi/fpyoSX0V2xM/hqdefault.jpg', 'Healing', 12, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000013', 'जीवन की समस्याओं से कैसे मुक्त हो? Finding and Removing Sub-conscious Blocks', 'Sacred Circle video library item. Suggested category: Sub-conscious Blocks.', 'https://www.youtube.com/watch?v=IQoZGVOCnZQ', 'https://i.ytimg.com/vi/IQoZGVOCnZQ/hqdefault.jpg', 'Spirituality', 13, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000014', 'How to find Sub-conscious Blocks?', 'Sacred Circle video library item. Suggested category: Sub-conscious Blocks.', 'https://www.youtube.com/watch?v=cgmduKGvfo4', 'https://i.ytimg.com/vi/cgmduKGvfo4/hqdefault.jpg', 'Spirituality', 14, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000015', 'Scientific Principles of Manifestation: आपके जीवन में भाग्योदय कैसे होता है?', 'Sacred Circle video library item. Suggested category: Manifestation.', 'https://www.youtube.com/watch?v=_gQe17H7Sl8', 'https://i.ytimg.com/vi/_gQe17H7Sl8/hqdefault.jpg', 'Manifestation', 15, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000016', 'Meditation for Manifestation: अपना भाग्योदय खुद करें; Lemurian Technique and Prana Shakti', 'Sacred Circle video library item. Suggested category: Manifestation Meditation.', 'https://www.youtube.com/watch?v=0kmq7p4LReM', 'https://i.ytimg.com/vi/0kmq7p4LReM/hqdefault.jpg', 'Manifestation', 16, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000017', 'Relationships-2: कटु संबंध में कैसे सुधार करें? मधुर संबंधों के लिए विशेष विधि', 'Sacred Circle video library item. Suggested category: Relationships.', 'https://www.youtube.com/watch?v=oL3A_YYoOXY', 'https://i.ytimg.com/vi/oL3A_YYoOXY/hqdefault.jpg', 'Relationships', 17, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000018', 'Relationships-3: Guided Meditation for Better Relationships', 'Sacred Circle video library item. Suggested category: Relationships Meditation.', 'https://www.youtube.com/watch?v=DauKdDvQPuY', 'https://i.ytimg.com/vi/DauKdDvQPuY/hqdefault.jpg', 'Relationships', 18, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000019', 'Successful कैसे बने? आपको success क्यों नहीं मिलता?', 'Sacred Circle video library item. Suggested category: Success.', 'https://www.youtube.com/watch?v=UQQAYkqdZGw', 'https://i.ytimg.com/vi/UQQAYkqdZGw/hqdefault.jpg', 'Manifestation', 19, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000020', 'Guided Meditation to Achieve Success and Abundance', 'Sacred Circle video library item. Suggested category: Success & Abundance Meditation.', 'https://www.youtube.com/watch?v=Uj4Mm1pEb8k', 'https://i.ytimg.com/vi/Uj4Mm1pEb8k/hqdefault.jpg', 'Manifestation', 20, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000021', 'मैं कौन हूँ? पाँच शरीर कैसे मिले? कर्म बंध और मुक्ति', 'Sacred Circle video library item. Suggested category: Self / Karma / Liberation.', 'https://www.youtube.com/watch?v=Do3NG-i5DVc', 'https://i.ytimg.com/vi/Do3NG-i5DVc/hqdefault.jpg', 'Spirituality', 21, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000022', 'भगवान धन्वंतरी द्वारा Healing: प्राणशक्ति क्या है? Intuition कैसे होता है?', 'Sacred Circle video library item. Suggested category: Healing / Prana Shakti / Intuition.', 'https://www.youtube.com/watch?v=LVqTLenpzeU', 'https://i.ytimg.com/vi/LVqTLenpzeU/hqdefault.jpg', 'Healing', 22, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000023', 'दैनिक कार्य करते हुए भी ध्यान में कैसे रहें?', 'Sacred Circle video library item. Suggested category: Meditation in Daily Life.', 'https://www.youtube.com/watch?v=8TpyNaQFzdk', 'https://i.ytimg.com/vi/8TpyNaQFzdk/hqdefault.jpg', 'Meditation', 23, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000024', 'Guided Meditation: जीवन से कोई भी डर कैसे निकाल दें?', 'Sacred Circle video library item. Suggested category: Fear Release Meditation.', 'https://www.youtube.com/watch?v=kmGPmqrRsjc', 'https://i.ytimg.com/vi/kmGPmqrRsjc/hqdefault.jpg', 'Meditation', 24, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000025', 'कर्म कैसे बनते हैं? कर्म कैसे कटते हैं? क्या कर्म भुगतने ही होते हैं?', 'Sacred Circle video library item. Suggested category: Karma.', 'https://www.youtube.com/watch?v=Ary1N4EqL8Y', 'https://i.ytimg.com/vi/Ary1N4EqL8Y/hqdefault.jpg', 'Spirituality', 25, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000026', 'Guided Meditation: Connecting with Higher Self', 'Sacred Circle video library item. Suggested category: Higher Self Meditation.', 'https://www.youtube.com/watch?v=0H1yUrW8WkA', 'https://i.ytimg.com/vi/0H1yUrW8WkA/hqdefault.jpg', 'Meditation', 26, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();


commit;
