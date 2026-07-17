-- Production-safe baseline settings only.
-- Sessions, access keys, media, events, profiles, and user activity must be
-- created through the authenticated admin workflow or an approved import.

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
