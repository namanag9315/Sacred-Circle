# Sacred Circle

Sacred Circle is a simple, premium, light-themed meditation and healing app for Sunday Zoom sessions, free meditations, session-specific Sacred Access Key unlocks, and app-friendly website content.

The product rule is simple: if a 55-65 year old user cannot understand a screen without explanation, simplify it.

This monorepo contains:

- Expo React Native mobile app in `apps/mobile`
- Next.js admin panel in `apps/admin`
- Shared typed domain/data helpers in `packages/lib`
- Shared design tokens in `packages/ui`
- Supabase schema, RLS policies, seed data, and Edge Functions in `supabase`
- Manual content migration templates in `content-migration/templates`
- Planning, deployment, and testing docs in `docs`

## Quick Start

1. Install dependencies:

   npm install

2. Copy environment template if present, or create `.env.local`.

3. Add Supabase values:

   EXPO_PUBLIC_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_ANON_KEY
   EXPO_PUBLIC_AUTH_REDIRECT_URL
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY

4. For a new Supabase project, apply SQL in this order:

   supabase/schema.sql
   supabase/rls.sql
   supabase/migrations/202607110001_cleanup_demo_content.sql
   supabase/migrations/202607110002_public_content_read_policies.sql
   supabase/migrations/202607110003_protect_profile_identity_and_role.sql
   supabase/seed.sql

   For an existing project, apply only the unapplied timestamped migrations.
   Review every migration before running it against production.

5. Configure the Edge Function environment for protected audio and admin uploads:

   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   R2_ACCOUNT_ID
   R2_ACCESS_KEY_ID
   R2_SECRET_ACCESS_KEY
   R2_BUCKET

6. Deploy Supabase Edge Functions:

   supabase functions deploy get-resource-url
   supabase functions deploy create-upload-url
   supabase functions deploy delete-account

7. Run the admin panel:

   npm run dev:admin

8. Run the mobile app:

   npm run dev:mobile

When Supabase credentials are missing or a query fails, user-facing apps show an unavailable or empty state. Production content is never replaced with demo media.

## Product Shape

- Mobile bottom tabs: Home, Sessions, Meditations, More.
- More contains Programs, Events, Videos, About, Contact, WhatsApp, Profile, Help, and Logout.
- The Sacred Access Key is session-specific. It unlocks only the protected healing audio for that Sunday session.
- Videos are YouTube links only.
- Live sessions use external Zoom links only.
- Protected audio is streamed through short-lived signed URLs, not permanent public URLs.
- Admin audio uploads use a short-lived R2 upload URL and then save only provider/path metadata.

## Content Migration

Manual inventory is the source of truth. Start with:

   content-migration/manual-inventory.md
   content-migration/templates/*.csv

Dry-run the importer:

   npm run import:content -- --dry-run

Run a real import only from a trusted local/admin machine with:

   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY

## Release Data

The production seed contains only non-secret baseline settings. Create sessions and Sacred Access Keys through the authenticated admin workflow, upload approved audio files, and publish only reviewed content. No sample access key or sample audio is shipped.

## Compliance Disclaimer

Sacred Circle offers meditation and spiritual awareness practices for personal growth and wellbeing. It is not a substitute for medical, psychological, or professional advice.
