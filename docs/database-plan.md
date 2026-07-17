# Database Plan

## Core Tables

The schema is organized around the product-needed tables only:

- `profiles`
- `sessions`
- `session_registrations`
- `session_access_codes`
- `session_unlock_attempts`
- `user_session_unlocks`
- `resources`
- `pages`
- `programs`
- `events`
- `event_registrations`
- `videos`
- `announcements`
- `app_settings`

Support tables exist for push tokens and notification history, but no extra user-facing features are built just because a table exists.

## Access Model

- Users can read and update their own profile.
- Anonymous clients can read non-cancelled sessions, published pages/programs/events/videos, public resources, and an explicit settings whitelist.
- Signed-in users can additionally read protected resource metadata and their own profile, registrations, and unlock rows.
- A normal user may edit only safe profile details; auth-managed email and the admin role are protected in the database.
- Users can register for their own sessions and events.
- Protected resources are playable only when `user_can_access_resource(resource_id, user_id)` returns true.
- Protected audio resources must be linked to a `session_id`.
- Admins can manage all content and manually grant/revoke session unlocks.

## Important Functions

- `is_admin(user_id)`: central admin role helper.
- `user_can_access_resource(resource_id, user_id)`: verifies public/admin/session-unlocked access.
- `unlock_session_recording(session_id, code)`: validates the session-specific Sacred Access Key and writes `user_session_unlocks`.
- `create_session_access_code(session_id, plain_code, ...)`: hashes a plain code before storing it.
- `grant_session_unlock(user_id, session_id)` and `revoke_session_unlock(user_id, session_id)`: admin manual access controls.

Account deletion is handled by the `delete-account` Edge Function. It derives the user id from a verified caller JWT and uses the service role only for deleting that same Auth user.

Failed Sacred Access Key attempts store only user, session, and timestamp in `session_unlock_attempts`. Five failures within fifteen minutes return `rate_limited`; the attempted key is never stored, and invalid/expired outcomes are returned as status strings so the failure record is committed.

## Media

Resources store metadata and paths. Public audio can use an external URL or public storage path. Protected R2 audio uses `storage_provider = 'r2'` and `storage_path`, then streams through a short-lived signed URL from the Edge Function.
