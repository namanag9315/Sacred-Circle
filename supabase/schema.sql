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
