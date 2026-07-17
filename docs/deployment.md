# Deployment Guide

## Supabase

1. Create a Supabase project.
2. For a new project, run `supabase/schema.sql` and `supabase/rls.sql`.
3. Apply the timestamped files in `supabase/migrations` in filename order. For an existing project, apply only migrations that have not already run. Review the cleanup migration before applying it to production.
4. Run `supabase/seed.sql` only when baseline public settings are needed. It intentionally contains no sessions, access keys, profiles, events, or media.
5. Deploy Edge Functions:

   supabase functions deploy get-resource-url
   supabase functions deploy create-upload-url
   supabase functions deploy delete-account

6. Add production admin users through Supabase Auth, then update their profile role to `admin` from a trusted service-role context. Normal users cannot change their own role or auth-managed email.
7. In **Authentication → URL Configuration**, replace local-only URLs with the deployed web origin and add `sacredcircle://auth/callback` to the additional redirect URLs. The web and Expo clients deliberately reject a localhost redirect in production.

## Cloudflare R2

Create the `sacred-circle-media` bucket and use this structure:

- `public/audios/basic-meditation/`
- `public/audios/chants/`
- `public/audios/healing/`
- `public/audios/babaji-wisdom/`
- `public/audios/manifestation/`
- `public/images/`
- `public/pdfs/`
- `protected/sunday-sessions/yyyy-mm-dd/healing-recording.mp3`

Use compressed audio:

- Voice meditation: MP3/AAC 64-96 kbps
- Music-heavy meditation: MP3/AAC 128 kbps
- Do not serve WAV files

## Edge Function Environment

Set these Supabase secrets for `get-resource-url`, `create-upload-url`, and `delete-account`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Set these additional R2 secrets for `get-resource-url` and `create-upload-url`:

- `R2_ENDPOINT` (optional when `R2_ACCOUNT_ID` is set)
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Do not place `SUPABASE_SERVICE_ROLE_KEY` or R2 credentials in Expo or browser-visible Vercel variables.

`delete-account` accepts no user id from the client. It verifies the caller JWT and deletes only that authenticated Auth user; database rows then follow the schema's cascade/set-null rules.

## Admin on Vercel

1. Import the repository in Vercel.
2. Set root directory to `apps/admin` or use a monorepo project with the admin workspace.
3. Add:

   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY

4. Deploy.
5. In Supabase Auth URL Configuration, set the Vercel production URL as the Site URL and an allowed redirect URL before testing magic-link sign-in.

## Mobile

1. Add:

   EXPO_PUBLIC_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_ANON_KEY
   EXPO_PUBLIC_AUTH_REDIRECT_URL

2. Run `npm run dev:mobile` for local preview.
3. Run `npm --workspace apps/mobile run typecheck`, `npm --workspace apps/mobile run doctor`, and `npm --workspace apps/mobile run export:web` before every release.
4. From the Sacred Circle Expo account, run `eas init` once to link the app and record its EAS project ID. Do not use a different owner's project ID.
5. Add the same production redirect URL to Supabase Auth, then use `eas build --profile production --platform all` with the real Apple and Google Play credentials.

For Expo web development, run the app on `http://localhost:8082` and include that exact origin in Supabase Auth's allowed redirect URLs. Web OAuth returns to the current app origin; do not leave an old local port or retired deployment URL in `EXPO_PUBLIC_AUTH_REDIRECT_URL`.

## Mobile Web / iOS Home Screen

1. Build the static web app:

   npm --workspace apps/mobile run export:web

2. Deploy `apps/mobile/dist` to a static HTTPS host. The export script prepares the production manifest, correctly sized install icons, iPhone launch images, safe viewport handling, an offline app shell, and automatic update activation. Deploy the entire directory; do not upload only `index.html`.
3. Configure the host to serve `index.html` with `no-cache`, `sw.js` with `no-cache` plus `Service-Worker-Allowed: /`, and fingerprinted files under `_expo/static` and `assets` with immutable one-year caching. Cloudflare Pages and Netlify can use the generated `_headers` and `_redirects` files directly.
4. In Supabase **Authentication → URL Configuration**, set the exact deployed HTTPS origin as the Site URL and add both `https://your-domain.example/` and `https://your-domain.example/**` to allowed redirect URLs. Keep the local `http://localhost:8082/` entry only for development. Google OAuth on web deliberately returns to the origin from which the installed app was launched.
5. In Google Cloud Console, keep the Supabase callback URL shown in **Supabase → Authentication → Providers → Google** as the authorised redirect URI. The application domain itself belongs in Supabase's redirect allow-list, not as a replacement for the Supabase callback URI.
6. On an iPhone, open the deployed URL in Safari, use **Share → Add to Home Screen**, then launch **Sacred Circle** from the home-screen icon. Verify the starter screen, Google login return, audio playback, Sacred Access Key, bottom safe area, keyboard fields, and a second launch while temporarily offline.
7. After every release, run `npm --workspace apps/mobile run export:web` and redeploy all of `apps/mobile/dist`. The generated service-worker cache version changes with the exported files and activates the new build on the next launch.

The installed iOS web app must use `/` as its start URL. Do not publish with `?preview=app`; that query is only for local visual testing and bypasses the normal starter/authentication flow.

## Content Migration

Manual inventory is the source of truth. Crawling can help find pages/assets, but every item must be reviewed before final import.

1. Fill CSV files in `content-migration/templates`.
2. Keep `migration_status=manual_review` until the client approves the copy.
3. Dry-run with:

   npm run import:content -- --dry-run

4. Import from a trusted machine with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Release Data Checks

Before publishing:

1. Confirm there are no SoundHelix URLs, `/demo/` storage paths, channel-only rows in `videos`, or known review access-code rows.
2. Confirm public resources have approved files and `access_type=public`; protected recordings should be visible in the catalog but playable only after the linked session is unlocked.
3. Confirm public settings contain real WhatsApp and Zoom values or omit those keys until they are ready.
4. Confirm at least one trusted profile has the admin role and that a normal user cannot change `profiles.role` or `profiles.email`.
5. Confirm six rapid invalid unlock calls return five `invalid_code`/`expired_code` statuses followed by `rate_limited`, and confirm `session_unlock_attempts` contains no code column.
