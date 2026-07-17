# Testing Checklist

## Mobile

- Splash opens into onboarding/auth.
- Onboarding has exactly three skippable screens.
- Auth asks for name and email, with phone/city optional.
- Bottom navigation has exactly Home, Sessions, Meditations, More.
- Home shows next Sunday session, Sacred Access Key card, continue practice, shortcuts, announcement, and WhatsApp card.
- Sessions shows upcoming and past sessions with not uploaded, locked, and unlocked states.
- Meditations has only Free Meditations and Session Recordings.
- More contains Programs, Events, Videos, About, Contact, WhatsApp, My Profile, Help, and Logout.
- Zoom buttons open external links.
- Audio player handles loading, playing, paused, completed, no internet, and missing media URL.
- Sacred Access Key states show empty, invalid, expired, correct, already unlocked, and success messages.
- Five failed Sacred Access Key attempts for one user/session trigger a fifteen-minute rate limit without storing the attempted key.

## Admin

- Non-admin users cannot access admin data through RLS.
- Admin nav has exactly Dashboard, Sessions, Meditations, Pages, Users, Announcements, Settings.
- Sessions can create/edit sessions and create session-specific Sacred Access Keys.
- Meditations can manage public audio and protected session audio.
- Pages can manage page content, programs, events, and videos.
- Users can view users and manual unlock rows.
- Announcements can create/show a Home announcement.
- Settings can update WhatsApp, YouTube, contact email, Zoom info, disclaimer, and policies.

## Security

- Service role key is absent from mobile/admin env files.
- RLS is enabled on every public table.
- Anonymous users can read only the approved public catalog and whitelisted settings.
- Normal users cannot change their own profile role or auth-managed email.
- Sacred Access Keys are stored as hashes only.
- Protected audio is inaccessible without a valid `user_session_unlocks` row.
- R2 protected audio returns only short-lived signed URLs through the Edge Function.
- Account deletion verifies the caller JWT and deletes only that caller's Auth user.
- Empty/error data responses never restore bundled demo audio or access keys.
