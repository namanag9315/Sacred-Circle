begin;

-- The public website reads approved catalog content with the anon key. Private
-- profile, registration, unlock, and protected-media access remains unchanged.
drop policy if exists "sessions logged in read" on public.sessions;
drop policy if exists "sessions public read" on public.sessions;
create policy "sessions public read" on public.sessions for select
using (status <> 'cancelled' or public.is_admin(auth.uid()));

drop policy if exists "pages published read" on public.pages;
create policy "pages published read" on public.pages for select
using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists "resources catalog read" on public.resources;
drop policy if exists "resources published catalog read" on public.resources;
create policy "resources published catalog read" on public.resources for select
using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists "programs published read" on public.programs;
create policy "programs published read" on public.programs for select
using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists "events published read" on public.events;
create policy "events published read" on public.events for select
using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists "videos published read" on public.videos;
create policy "videos published read" on public.videos for select
using (status = 'published' or public.is_admin(auth.uid()));

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
    'disclaimer_text',
    'home_quote',
    'home_quote_author',
    'privacy_policy',
    'terms_text'
  )
  or public.is_admin(auth.uid())
);

commit;
