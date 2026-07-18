# Testing Checklist

## Mobile

- Splash opens into onboarding/auth.
- Onboarding has exactly three skippable screens.
- Auth asks for name and email, with phone/city optional.
- Bottom navigation has exactly Home, Sessions, Meditations, More.
- Home shows next Sunday session, Sacred Access Key card, continue practice, shortcuts, announcement, and WhatsApp card.
- Sessions shows upcoming and past sessions with not uploaded and key-required states.
- Meditations has only Free Meditations and Session Recordings.
- More contains Programs, Events, Videos, About, Contact, WhatsApp, My Profile, Help, and Logout.
- Zoom buttons open external links.
- Audio player handles loading, playing, paused, completed, no internet, and missing media URL.
- Sacred Access Key accepts exactly six numbers and shows empty, incomplete, invalid, expired, rate-limited, and success messages.
- Leaving and reopening a protected recording requires the key again; pausing, seeking, or locking the screen during the current player session does not.
- Five failed Sacred Access Key attempts for one user trigger a fifteen-minute rate limit across protected sessions without storing the attempted key.

## Admin

- Non-admin users cannot access admin data through RLS.
- Admin nav has exactly Dashboard, Sessions, Meditations, Pages, Users, Announcements, Settings.
- Sessions can create/edit sessions and create session-specific Sacred Access Keys.
- Meditations can manage public audio and protected session audio.
- Pages can manage page content, programs, events, and videos.
- Legacy manual unlock rows do not grant protected playback access.
- Announcements can create/show a Home announcement.
- Settings can update WhatsApp, YouTube, contact email, Zoom info, disclaimer, and policies.

## Security

- Service role key is absent from mobile/admin env files.
- RLS is enabled on every public table.
- Anonymous users can read only the approved public catalog and whitelisted settings.
- Normal users cannot change their own profile role or auth-managed email.
- Sacred Access Keys are stored as hashes only.
- Protected audio is inaccessible without a valid six-digit key for that playback request; legacy `user_session_unlocks` rows grant nothing.
- Protected recordings configured with permanent external or YouTube URLs are rejected; they must use private Supabase Storage or R2 media.
- R2 protected audio returns only short-lived signed URLs through the Edge Function.
- Account deletion verifies the caller JWT and deletes only that caller's Auth user.
- Empty/error data responses never restore bundled demo audio or access keys.
