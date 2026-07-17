-- Final verified content integration from the client-approved Sacred Circle
-- workbook and JSON seed supplied on 15 July 2026.

alter table public.programs add column if not exists category text null;

with verified_programs(display_order, title, description, category) as (
  values
    (1, 'Healing Body and Mind', 'Explore simple practices intended to support physical relaxation, mental calm and spiritual wellbeing.', 'Healing and Wellbeing'),
    (2, 'Concentration in Studies', 'Practices designed to support attention, mental clarity and a more focused approach to study.', 'Meditation and Inner Development'),
    (3, 'Manifestation for Abundance', 'Explore reflective and meditation-based practices focused on identifying limiting beliefs and building clarity around career, opportunity and abundance.', 'Manifestation and Relationships'),
    (4, 'Resolving Relationship Issues', 'Practices for reflection, emotional balance and improving understanding in personal relationships.', 'Manifestation and Relationships'),
    (5, 'Removing all Kinds of Fears', 'Guided practices intended to help participants observe fear, develop calm and respond to anxious thoughts with greater awareness.', 'Healing and Wellbeing'),
    (6, 'Intuition Development', 'Meditative exercises focused on inner awareness, observation and intuitive reflection.', 'Meditation and Inner Development'),
    (7, 'DNA Activations', 'A spiritual-practice module presented by Sacred Circle around inner potential and personal transformation.', 'Meditation and Inner Development'),
    (8, 'Past Life Regression', 'A guided spiritual exploration of experiences participants may interpret as connected with previous lifetimes.', 'Sacred Exploration'),
    (9, 'Akashic Records', 'A spiritual reflection module exploring what the tradition describes as Akashic records and their relevance to present-life awareness.', 'Sacred Exploration'),
    (10, 'Guidance from Higher Self / I AM Presence', 'Meditative practices centred on connecting with the higher self and developing inner guidance.', 'Spiritual Wisdom and Guidance'),
    (11, 'Merkaba Activation', 'A spiritual-energy practice based on the Merkaba concept and visualisation.', 'Meditation and Inner Development'),
    (12, 'Connection to Great Central Sun', 'A guided spiritual visualisation focused on the Great Central Sun as a symbol of light and transformation.', 'Spiritual Wisdom and Guidance'),
    (13, 'Amrit Shakti', 'A Sacred Circle practice drawing on the spiritual symbolism of Dhanvantari, Shushrut and the Violet Flame.', 'Healing and Wellbeing'),
    (14, 'Connecting to Ascended Masters', 'A spiritual meditation module focused on seeking wisdom and guidance from Ascended Masters.', 'Spiritual Wisdom and Guidance'),
    (15, 'Getting Help from Galactic Beings', 'A spiritual visualisation module involving beings described in the Sacred Circle teachings as Arcturians, Pleiadians, Sirians and Andromedans.', 'Spiritual Wisdom and Guidance'),
    (16, 'Energetic Journey to Ancient Egypt', 'A guided spiritual journey inspired by the pyramids, Sphinx, temples and sacred figures of Ancient Egypt.', 'Sacred Exploration'),
    (17, 'Tachyon Energy', 'A Sacred Circle energy-practice module based on the concepts of the Zero Point Field and Tachyon energy.', 'Healing and Wellbeing')
)
update public.programs as program
set title = verified.title,
    description = verified.description,
    category = verified.category,
    source_url = 'https://sacredcirclegroup.com/programs',
    migration_status = 'ready',
    status = 'published',
    updated_at = now()
from verified_programs as verified
where program.display_order = verified.display_order;

with verified_programs(display_order, title, description, category) as (
  values
    (1, 'Healing Body and Mind', 'Explore simple practices intended to support physical relaxation, mental calm and spiritual wellbeing.', 'Healing and Wellbeing'),
    (2, 'Concentration in Studies', 'Practices designed to support attention, mental clarity and a more focused approach to study.', 'Meditation and Inner Development'),
    (3, 'Manifestation for Abundance', 'Explore reflective and meditation-based practices focused on identifying limiting beliefs and building clarity around career, opportunity and abundance.', 'Manifestation and Relationships'),
    (4, 'Resolving Relationship Issues', 'Practices for reflection, emotional balance and improving understanding in personal relationships.', 'Manifestation and Relationships'),
    (5, 'Removing all Kinds of Fears', 'Guided practices intended to help participants observe fear, develop calm and respond to anxious thoughts with greater awareness.', 'Healing and Wellbeing'),
    (6, 'Intuition Development', 'Meditative exercises focused on inner awareness, observation and intuitive reflection.', 'Meditation and Inner Development'),
    (7, 'DNA Activations', 'A spiritual-practice module presented by Sacred Circle around inner potential and personal transformation.', 'Meditation and Inner Development'),
    (8, 'Past Life Regression', 'A guided spiritual exploration of experiences participants may interpret as connected with previous lifetimes.', 'Sacred Exploration'),
    (9, 'Akashic Records', 'A spiritual reflection module exploring what the tradition describes as Akashic records and their relevance to present-life awareness.', 'Sacred Exploration'),
    (10, 'Guidance from Higher Self / I AM Presence', 'Meditative practices centred on connecting with the higher self and developing inner guidance.', 'Spiritual Wisdom and Guidance'),
    (11, 'Merkaba Activation', 'A spiritual-energy practice based on the Merkaba concept and visualisation.', 'Meditation and Inner Development'),
    (12, 'Connection to Great Central Sun', 'A guided spiritual visualisation focused on the Great Central Sun as a symbol of light and transformation.', 'Spiritual Wisdom and Guidance'),
    (13, 'Amrit Shakti', 'A Sacred Circle practice drawing on the spiritual symbolism of Dhanvantari, Shushrut and the Violet Flame.', 'Healing and Wellbeing'),
    (14, 'Connecting to Ascended Masters', 'A spiritual meditation module focused on seeking wisdom and guidance from Ascended Masters.', 'Spiritual Wisdom and Guidance'),
    (15, 'Getting Help from Galactic Beings', 'A spiritual visualisation module involving beings described in the Sacred Circle teachings as Arcturians, Pleiadians, Sirians and Andromedans.', 'Spiritual Wisdom and Guidance'),
    (16, 'Energetic Journey to Ancient Egypt', 'A guided spiritual journey inspired by the pyramids, Sphinx, temples and sacred figures of Ancient Egypt.', 'Sacred Exploration'),
    (17, 'Tachyon Energy', 'A Sacred Circle energy-practice module based on the concepts of the Zero Point Field and Tachyon energy.', 'Healing and Wellbeing')
)
insert into public.programs (title, description, category, display_order, source_url, migration_status, status)
select verified.title, verified.description, verified.category, verified.display_order,
       'https://sacredcirclegroup.com/programs', 'ready', 'published'
from verified_programs as verified
where not exists (
  select 1 from public.programs as existing where existing.display_order = verified.display_order
);

with video_categories(display_order, category) as (
  values
    (1, 'Cosmic Teachings'), (2, 'Spiritual Wisdom'), (3, 'Spiritual Wisdom'),
    (4, 'Spiritual Wisdom'), (5, 'Cosmic Teachings'), (6, 'Cosmic Teachings'),
    (7, 'Spiritual Wisdom'), (8, 'Meditation'), (9, 'Spiritual Wisdom'),
    (10, 'Meditation'), (11, 'Healing'), (12, 'Healing'),
    (13, 'Spiritual Wisdom'), (14, 'Spiritual Wisdom'), (15, 'Manifestation'),
    (16, 'Manifestation'), (17, 'Relationships'), (18, 'Relationships'),
    (19, 'Manifestation'), (20, 'Manifestation'), (21, 'Spiritual Wisdom'),
    (22, 'Healing'), (23, 'Meditation'), (24, 'Meditation'),
    (25, 'Spiritual Wisdom'), (26, 'Meditation')
)
update public.videos as video
set category = mapped.category,
    description = case mapped.category
      when 'Meditation' then 'A Sacred Circle guided meditation intended for personal practice.'
      when 'Healing' then 'A Sacred Circle teaching and guided spiritual practice intended for personal reflection and wellbeing.'
      when 'Manifestation' then 'A Sacred Circle teaching focused on reflection, clarity and personal goals.'
      when 'Relationships' then 'A Sacred Circle teaching and guided practice about reflection and relationships.'
      when 'Cosmic Teachings' then 'A Sacred Circle teaching presented as guided spiritual exploration.'
      else 'A Sacred Circle teaching for spiritual reflection and inner awareness.'
    end,
    migration_status = 'ready',
    status = 'published',
    updated_at = now()
from video_categories as mapped
where video.display_order = mapped.display_order
  and nullif(trim(video.youtube_url), '') is not null;

insert into public.pages (slug, title, subtitle, body, display_order, source_url, migration_status, status)
values
  ('home', 'Sacred Circle', 'A sacred space for meditation, inner awareness and spiritual exploration.', 'Join the Sunday session, listen to meditation audio, unlock protected recordings and explore Sacred Circle resources.', 1, 'https://sacredcirclegroup.com/', 'ready', 'published'),
  ('about', 'About Sacred Circle', 'Meditation, inner awareness and spiritual practice.', 'Sacred Circle is a community for meditation, inner awareness and spiritual growth. Free online Sunday sessions offer discussion, meditation and simple personal practices. Lina and Diwakar Raipure are the main mentors. The Sacred Circle website states that Diwakar holds an M.Tech. from IIT Madras and Lina holds an M.Sc. from the Institute of Science, Nagpur. It describes 28 years of study and practice across more than 100 modalities and spiritual methods, with training in India and abroad.', 2, 'https://sacredcirclegroup.com/about', 'ready', 'published'),
  ('contact', 'Contact Sacred Circle', 'Help with sessions, recordings and app access.', 'For questions about a Sunday session, Sacred Access Key, audio recording or Shivir, contact Sacred Circle by email or use the in-app contact form.', 3, 'https://sacredcirclegroup.com/contact', 'ready', 'published'),
  ('getting-started', 'Getting Started with Sacred Circle', 'A simple guide to the app.', 'Use Home to join the next Sunday session, play the featured free audio or enter a Sacred Access Key. Audio, Video and More contain the remaining libraries and help pages.', 10, null, 'ready', 'published'),
  ('joining-sunday-sessions', 'How to Join Sunday Sessions', 'Join the published Zoom session.', 'Open Home or Sunday Sessions, check the displayed date and time, then tap Join Session. Registration is available from the same session card.', 11, null, 'ready', 'published'),
  ('sacred-access-key', 'How the Sacred Access Key Works', 'Unlock the recording linked to your session.', 'Enter the key shared during the live Sunday session. A valid key unlocks only the protected recording linked to that session.', 12, null, 'ready', 'published'),
  ('preparing-for-meditation', 'Preparing for a Meditation Session', 'Create a calm space for personal practice.', 'Choose a quiet place, sit comfortably, reduce distractions and use headphones if helpful. Pause the practice whenever you need to.', 13, null, 'ready', 'published'),
  ('offline-listening-help', 'Audio Download and Offline Listening Help', 'Use downloads only when available.', 'Open an audio to check whether a download option is available. Protected recordings remain subject to your Sacred Access Key access.', 14, null, 'ready', 'published'),
  ('frequently-asked-questions', 'Frequently Asked Questions', 'Quick answers for sessions and recordings.', 'Use Contact and Help if a session link does not open, an access key is not accepted, or an audio does not play.', 15, null, 'ready', 'published')
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  body = excluded.body,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.app_settings (key, value)
values
  ('contact_email', 'sacredcircle45@gmail.com'),
  ('youtube_channel_url', 'https://www.youtube.com/@sacredcircle8336/videos'),
  ('sunday_session_time', 'Every Sunday at 4:00 PM IST'),
  ('default_zoom_info', 'Sunday meditation happens online through Zoom at 4:00 PM IST.'),
  ('disclaimer_text', 'Sacred Circle provides meditation and spiritual-awareness content for personal reflection and wellbeing. It is not a substitute for medical, psychological, legal or other professional advice.')
on conflict (key) do update set value = excluded.value, updated_at = now();

delete from public.app_settings
where key in ('home_quote', 'home_quote_author');

delete from public.app_settings
where key = 'whatsapp_group_url'
  and value = 'https://chat.whatsapp.com/EHGerecRhvnE6zINAACbY5';

update public.events
set status = 'archived',
    migration_status = 'archived',
    registration_enabled = false,
    updated_at = now()
where migration_status not in ('ready', 'imported')
   or event_date is null
   or nullif(trim(location), '') is null
   or nullif(trim(description), '') is null;

delete from public.sessions
where id in (
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000004'
);

update public.sessions
set session_date = '2026-07-19T10:30:00Z',
    description = 'Join the live Sunday session for guided meditation, spiritual practices and simple teachings for personal reflection.',
    updated_at = now()
where id = '7e136488-9807-4bef-93c8-2295468673c0';

drop policy if exists "pages published read" on public.pages;
create policy "pages published read" on public.pages for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

drop policy if exists "resources published catalog read" on public.resources;
create policy "resources published catalog read" on public.resources for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

drop policy if exists "programs published read" on public.programs;
create policy "programs published read" on public.programs for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

drop policy if exists "events published read" on public.events;
create policy "events published read" on public.events for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

drop policy if exists "videos published read" on public.videos;
create policy "videos published read" on public.videos for select
using ((status = 'published' and migration_status in ('ready', 'imported')) or public.is_admin(auth.uid()));

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
