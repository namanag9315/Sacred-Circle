begin;

-- Remove the exact media rows that were created by the original review seed.
delete from public.resources
where id in (
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000003',
  '40000000-0000-4000-8000-000000000004',
  '40000000-0000-4000-8000-000000000005',
  '40000000-0000-4000-8000-000000000006',
  '40000000-0000-4000-8000-000000000007'
)
or external_url in (
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
)
or storage_path in (
  'protected/sunday-sessions/demo/fear-release-healing-recording.mp3',
  'protected/sunday-sessions/demo/relationship-healing-recording.mp3'
);

-- The review keys were published in source control and must never survive a release.
delete from public.session_access_codes
where id in (
  '21000000-0000-4000-8000-000000000002',
  '21000000-0000-4000-8000-000000000003'
);

-- This row points to a channel, not a playable YouTube video.
delete from public.videos
where id = '51000000-0000-4000-8000-000000000001'
  and youtube_url = 'https://www.youtube.com/@sacredcirclegroup';

-- Remove internal review placeholders that were accidentally published.
delete from public.pages
where id = '90000000-0000-4000-8000-000000000004'
  and slug = 'manual-content-inventory';

delete from public.events
where id = '50000000-0000-4000-8000-000000000002'
  and title = 'Upcoming Meditation Event';

update public.sessions
set zoom_link = null
where id = '20000000-0000-4000-8000-000000000001'
  and zoom_link = 'https://zoom.us/j/1234567890';

delete from public.app_settings
where (key = 'whatsapp_group_url' and value = 'https://wa.me/')
   or (key = 'default_zoom_link' and value = 'https://zoom.us/j/1234567890');

commit;
