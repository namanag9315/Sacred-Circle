# Architecture Plan

## Product Shape

Sacred Circle V1 is a simple mobile-first meditation and healing app. The main user tasks are joining the Sunday Zoom session, listening to free meditations, unlocking protected Sunday healing recordings with a session-specific Sacred Access Key, reading existing website content in a cleaner format, and contacting or joining WhatsApp.

The app intentionally excludes in-app video calling, social feeds, member directories, AI chat, payments, and complex community features.

## Stack

- Mobile: Expo React Native with TypeScript
- Admin: Next.js App Router with TypeScript
- Backend: Supabase Auth, PostgreSQL, Row Level Security, and Edge Functions
- Auth: Supabase email OTP/magic link for the mobile app
- Audio storage: Cloudflare R2
- Small images/PDFs: Supabase Storage or R2
- Videos: YouTube URLs only
- Live sessions: external Zoom links only
- Hosting: Vercel for admin, Expo/EAS for mobile builds

## App Layers

- Presentation: simple light React Native screens and reusable premium components
- Domain: shared TypeScript contracts, access helpers, constants, and seed data
- Data: Supabase repository helpers with explicit empty/error states and no production demo fallback
- Security: RLS, admin role policies, per-playback Sacred Access Key authorization, and signed media Edge Function
- Notifications: push-token tables and local notification helper structure for later useful reminders

## Access Model

- Public meditation audios are available to logged-in users.
- Protected Sunday healing recordings require the six-digit Sacred Access Key for each new playback request. A successful check does not create a permanent entitlement.
- The Sacred Access Key is never a weekly app password.
- The code is hashed in `session_access_codes.code_hash`.
- The app requests a protected media URL through `supabase/functions/get-resource-url`, which verifies the key against the resource's linked session and returns a time-limited signed URL.

## Admin Access

Admin entry is guarded by Supabase Auth plus `profiles.role = 'admin'`. Visible admin sections are only Dashboard, Sessions, Meditations, Pages, Users, Announcements, and Settings.
