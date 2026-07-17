import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function writeFile(filePath, content) {
  const fullPath = path.join(root, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trimStart());
}

const files = {
  ".gitignore": `
node_modules
.expo
.next
dist
build
coverage
.DS_Store
.env
.env.local
.env.*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
android
ios
`,
  ".env.example": `
# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Optional app links
EXPO_PUBLIC_WHATSAPP_GROUP_URL=
EXPO_PUBLIC_YOUTUBE_CHANNEL_URL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Payments are optional in V1. Never expose Razorpay secret keys in frontend apps.
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Push sending requires platform setup outside this scaffold.
EXPO_PUBLIC_EAS_PROJECT_ID=
`,
  "package.json": `
{
  "name": "sacred-circle-monorepo",
  "private": true,
  "version": "1.0.0",
  "description": "Sacred Circle premium spiritual community mobile app and admin panel.",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:mobile": "npm --workspace apps/mobile run start",
    "dev:admin": "npm --workspace apps/admin run dev",
    "typecheck": "npm --workspaces --if-present run typecheck",
    "lint": "npm --workspaces --if-present run lint"
  },
  "devDependencies": {
    "typescript": "^5.5.4"
  }
}
`,
  "README.md": `
# Sacred Circle

Sacred Circle is a premium spiritual community app for meditation, Brahm Vidya practice, protected weekly teachings, Sunday Zoom sessions, audio resources, Shivirs, healing requests, and admin-controlled content.

This monorepo contains:

- Expo React Native mobile app in \`apps/mobile\`
- Next.js admin panel in \`apps/admin\`
- Shared typed domain/data helpers in \`packages/lib\`
- Shared design tokens in \`packages/ui\`
- Supabase schema, RLS policies, and seed data in \`supabase\`
- Planning, deployment, and testing docs in \`docs\`

## Quick Start

1. Install dependencies:

   npm install

2. Copy environment template:

   cp .env.example .env.local

3. Add Supabase values to both mobile and admin env names:

   EXPO_PUBLIC_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY

4. Apply Supabase SQL in this order:

   supabase/schema.sql
   supabase/rls.sql
   supabase/seed.sql

5. Run the admin panel:

   npm run dev:admin

6. Run the mobile app:

   npm run dev:mobile

When Supabase credentials are missing, both apps use the bundled seed-shaped demo data so screens remain usable during design review. With credentials present, the apps use Supabase Auth, PostgreSQL, and Storage-ready URLs.

## Default Demo Access

- Demo mobile key: \`4567\`
- Admin demo mode is enabled only when Supabase env vars are not configured.

## Compliance Disclaimer

Sacred Circle offers meditation and spiritual awareness practices for personal growth and wellbeing. It is not a substitute for medical, psychological, or professional advice.
`,
  "docs/architecture.md": `
# Architecture Plan

## Product Shape

Sacred Circle V1 is a private spiritual community platform rather than a generic meditation app. The mobile app gives members a calm sanctuary for Sunday Satsang, weekly Sacred Key access, programs, recordings, events, healing requests, and profile/community participation. The admin panel lets the Sacred Circle team manage keys, sessions, resources, programs, events, users, announcements, registrations, and support requests.

## Stack

- Mobile: Expo React Native with TypeScript
- Admin: Next.js App Router with TypeScript
- Backend: Supabase Auth, PostgreSQL, Storage, Row Level Security
- Hosting: Vercel for admin, Expo/EAS or Expo Go for mobile preview
- Live sessions: external Zoom links only
- Videos: YouTube/external links only
- Payments: Razorpay-ready placeholders, optional in V1
- Push: Expo Notifications-ready database and service structure

## Low-Cost Scalability

- Supabase anon key is used in frontend apps; service role key is never shipped.
- Storage URLs are abstracted behind a storage provider interface so Supabase Storage can later move to Cloudflare R2.
- Protected content uses Supabase RLS plus weekly unlocks/manual grants/session attendance.
- Zoom and YouTube remain external to avoid expensive live-stream/video infrastructure.
- Lists are queryable by category/status and can be paginated as content grows.

## App Layers

- Presentation: React Native screens and reusable premium components
- Domain: shared TypeScript contracts, access helpers, seed data, constants
- Data: Supabase clients plus repository/service functions with demo fallback
- Security: RLS, admin role policies, RPC for weekly key unlocking
- Notifications: local Expo notification service plus history tables for server-side sending later

## Storage Abstraction

Resources store URLs today. Upload/serving logic should use the shared StorageProvider interface in \`packages/lib/src/storage.ts\`. V1 uses Supabase Storage public or signed URLs. R2 migration later only needs a provider swap and URL migration.

## Admin Access

Admin entry is guarded by Supabase Auth plus \`profiles.role = 'admin'\`. Client-side guards improve UX, while RLS is the source of truth for writes.
`,
  "docs/database-plan.md": `
# Database Plan

## Core Tables

The schema is organized around users, weekly keys, sessions, programs, resources, events, healing requests, announcements, settings, and notification history.

## Access Model

- Users can read their own profile, unlocks, bookmarks, registrations, and grants.
- Users can read public programs, sessions, events, active announcements, and accessible resources.
- A locked resource is accessible when it is public, manually granted, tied to a weekly key the user unlocked, or tied to an attended session.
- Users can create their own session/event registrations, bookmarks, and healing requests.
- Admins can manage all rows.
- Weekly key codes are not publicly selectable. Users unlock through the \`unlock_weekly_key\` RPC.

## Important Functions

- \`is_admin(user_id)\`: central admin role helper for RLS.
- \`user_can_access_resource(resource_id, user_id)\`: reusable protected resource resolver.
- \`unlock_weekly_key(key_code)\`: validates the active key and records user unlocks without exposing all key rows.

## Media

Files can be stored in Supabase Storage for V1. Database rows store \`file_url\`, \`youtube_url\`, or \`external_url\`. Private media should use signed URLs generated by a trusted backend/admin flow when content becomes sensitive.
`,
  "docs/screen-map.md": `
# Screen Map

## Mobile

- Splash
- Onboarding carousel
- Login/register
- Sacred Key unlock
- Bottom tabs: Home, Sessions, Library, Events, Profile
- Session detail
- Resource detail
- Full audio player
- Program detail
- Event detail and registration
- Member directory
- Healing request form

## Admin

- Login
- Dashboard
- Weekly Sacred Keys
- Sessions
- Resources
- Programs
- Events/Shivirs
- Users
- Member Directory
- Healing Requests
- Announcements/Notifications
- Settings

## Navigation Philosophy

The first touch should feel like entering a sacred sanctuary: splash, poetic onboarding, and Sacred Key unlock. The daily user path is Home -> next session, continue listening, latest recording, event, and community actions. The admin path is operational: dashboards, data tables, filters, and quick edit forms.
`,
  "docs/ui-design-system.md": `
# UI Design System

## Visual Language

- Dark-mode first, with deep navy, cosmic indigo, mystic violet, sacred gold, and warm ivory.
- Cream surfaces are reserved for content-heavy reading, notes, forms, and admin clarity.
- Motifs are abstract: sacred circles, lotus-like geometry, moon glow, particles, and soft radial light.
- No harsh colors, clutter, or cheap religious clipart.

## Typography

- Headings: elegant serif mood using Georgia/Cambria/Playfair-style fallback stacks.
- Body: clean system sans-serif.
- Labels: uppercase, spaced, compact.

## Components

Mobile components live in \`apps/mobile/src/components/Sacred.tsx\`:

- SacredGradientBackground
- SacredLogo
- AppHeader
- Bottom tab styling
- PrimaryButton and GoldButton
- GlassCard and CreamCard
- SessionCard, ProgramCard, ResourceCard, LockedResourceCard, EventCard
- QuoteCard, AudioPlayerMini, FullAudioPlayer
- SacredKeyInput, EmptyState, LoadingState
- ProfileInfoCard, AnnouncementBanner, SectionTitle, SpiritualIconBadge

Admin components live in \`apps/admin/src/components\`:

- AdminLayout
- Sidebar
- DataTable
- FormModal
- StatCard
- UploadField
- SearchFilterBar
- StatusBadge
- ConfirmDialog
`,
  "docs/implementation-checklist.md": `
# Implementation Checklist

- [x] Architecture plan
- [x] Database plan
- [x] Screen map
- [x] UI design system
- [x] Supabase schema
- [x] RLS policies
- [x] Seed data
- [x] Shared types and Supabase/data helpers
- [x] Mobile theme/design system
- [x] Auth flow
- [x] Onboarding
- [x] Sacred Key unlock
- [x] Home dashboard
- [x] Sessions module
- [x] Library/resources module
- [x] Audio player screen
- [x] Programs module
- [x] Events/Shivirs module
- [x] Profile, directory, healing request
- [x] Admin auth
- [x] Admin dashboard
- [x] Admin CRUD modules
- [x] Notification-ready structure
- [x] Setup and deployment docs
- [ ] Connect real Supabase project credentials
- [ ] Configure Expo push credentials and optional FCM
- [ ] Configure Supabase Storage buckets and signed URL policy
- [ ] Configure Razorpay production keys if donations are enabled
- [ ] Replace demo media URLs with final Sacred Circle files
`,
  "docs/deployment.md": `
# Deployment Guide

## Supabase

1. Create a Supabase project.
2. Run \`supabase/schema.sql\`.
3. Run \`supabase/rls.sql\`.
4. Run \`supabase/seed.sql\`.
5. Create Storage buckets such as \`audio\`, \`pdfs\`, and \`images\`.
6. Add production admin users through Supabase Auth, then update their profile role to \`admin\`.

## Admin on Vercel

1. Import the repository in Vercel.
2. Set root directory to \`apps/admin\` or use a monorepo project with the admin workspace.
3. Add:

   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_SITE_URL
   NEXT_PUBLIC_RAZORPAY_KEY_ID

4. Deploy.

## Mobile

1. Add:

   EXPO_PUBLIC_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_ANON_KEY
   EXPO_PUBLIC_WHATSAPP_GROUP_URL
   EXPO_PUBLIC_YOUTUBE_CHANNEL_URL
   EXPO_PUBLIC_EAS_PROJECT_ID

2. Run \`npm run dev:mobile\` for local preview.
3. Use EAS Build for Android/iOS production builds.

## Push Notifications

The mobile code registers for Expo push permissions and can schedule local reminders. Production remote pushes still need:

- EAS project ID
- Android FCM credentials
- iOS APNs setup
- A secure server or Supabase Edge Function that reads notification targets and sends pushes

## Payments

Razorpay placeholders are included for donation/event pricing. To enable production payments, add Razorpay checkout on admin/mobile as needed and verify payment webhooks on a secure backend. Do not put Razorpay secret keys in frontend env vars.
`,
  "docs/testing-checklist.md": `
# Testing Checklist

## Mobile

- Splash fades into onboarding/auth.
- New user can register with email/password.
- Logged-in user is routed to Sacred Key unlock.
- Incorrect key shows calm error copy.
- Correct weekly key unlocks the app.
- Home shows next session, key status, quote, featured program, latest recording, event, and links.
- Session registration writes to Supabase when configured.
- Zoom buttons open external links.
- Library search/category filters work.
- Locked resources show access message.
- Audio player opens and gracefully handles missing media URLs.
- Event registration form validates name/email/phone.
- Healing request requires consent.
- Profile can update directory visibility and log out.

## Admin

- Non-admin users cannot access admin data through RLS.
- Admin dashboard loads counts.
- Admin can create/edit/delete keys, sessions, resources, programs, events, announcements, and settings.
- Admin can review registrations, users, directory members, and healing requests.
- CSV export works for event registrations once Supabase data is present.

## Security

- Service role key is absent from mobile/admin env files.
- RLS is enabled on every public table.
- Locked resources are inaccessible without a valid access path.
- Weekly key codes are unlocked through RPC rather than public table reads.
`,
  "packages/ui/package.json": `
{
  "name": "@sacred-circle/ui",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
`,
  "packages/ui/src/tokens.ts": `
export const colors = {
  deepNight: "#050716",
  cosmicNavy: "#0A1028",
  indigoSoul: "#211144",
  mysticViolet: "#7D5CE7",
  softLavender: "#C8B9FF",
  sacredGold: "#D8A842",
  saffronGold: "#F1C75B",
  warmIvory: "#FFF6DF",
  pureCream: "#F8EED6",
  charcoal: "#261E16",
  mutedIvory: "#CFC4AA",
  roseClay: "#B97974",
  emeraldDeep: "#1C7C68"
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  round: 999
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44
} as const;

export const typography = {
  heading: "Georgia",
  body: "System",
  labelLetterSpacing: 1.6
} as const;
`,
  "packages/ui/src/index.ts": `
export * from "./tokens";
`,
  "packages/lib/package.json": `
{
  "name": "@sacred-circle/lib",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@supabase/supabase-js": "latest"
  }
}
`,
  "packages/lib/src/types.ts": `
export type UserRole = "user" | "member" | "admin";
export type ResourceType = "audio" | "pdf" | "youtube" | "article" | "external";
export type AccessType = "public" | "weekly_key" | "manual" | "attendance" | "program";
export type SessionStatus = "upcoming" | "completed" | "cancelled";
export type RegistrationStatus = "registered" | "confirmed" | "cancelled" | "attended" | "missed";
export type HealingRequestStatus = "new" | "reviewed" | "responded" | "closed";

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  dob?: string | null;
  bio?: string | null;
  interests: string[];
  role: UserRole;
  show_in_directory: boolean;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyKey {
  id: string;
  key_code?: string;
  title: string;
  description?: string | null;
  week_start: string;
  week_end: string;
  is_active: boolean;
  created_by?: string | null;
  created_at?: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  category: string;
  guide_name?: string | null;
  session_date: string;
  duration_minutes?: number | null;
  zoom_link?: string | null;
  zoom_passcode?: string | null;
  status: SessionStatus | string;
  is_featured: boolean;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SessionRegistration {
  id: string;
  user_id: string;
  session_id: string;
  attendance_status: RegistrationStatus | string;
  registered_at?: string;
}

export interface Program {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url?: string | null;
  is_featured: boolean;
  access_type: AccessType | string;
  created_at?: string;
  updated_at?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: string;
  file_url?: string | null;
  youtube_url?: string | null;
  external_url?: string | null;
  duration_seconds?: number | null;
  program_id?: string | null;
  session_id?: string | null;
  access_type: AccessType | string;
  required_weekly_key_id?: string | null;
  is_featured: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserResourceAccess {
  id: string;
  user_id: string;
  resource_id: string;
  access_reason?: string | null;
  granted_by?: string | null;
  created_at?: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  resource_id: string;
  created_at?: string;
}

export interface SacredEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_time: string;
  end_time?: string | null;
  location?: string | null;
  is_online: boolean;
  online_link?: string | null;
  image_url?: string | null;
  seats_total?: number | null;
  price_amount?: number | null;
  registration_enabled: boolean;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventRegistration {
  id: string;
  user_id: string;
  event_id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  participants_count: number;
  note?: string | null;
  status: string;
  registered_at?: string;
}

export interface HealingRequest {
  id: string;
  user_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  category: string;
  message: string;
  consent: boolean;
  status: HealingRequestStatus | string;
  admin_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  target_type: string;
  related_session_id?: string | null;
  related_event_id?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  updated_at?: string;
}

export interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  target_type: string;
  sent_by?: string | null;
  sent_at?: string;
}

export interface DirectoryMember {
  id: string;
  name: string;
  city?: string | null;
  bio?: string | null;
  interests: string[];
  avatar_url?: string | null;
}
`,
  "packages/lib/src/constants.ts": `
export const INTERESTS = [
  "Healing",
  "Manifestation",
  "Meditation",
  "Brahm Vidya",
  "Spiritual Growth",
  "Stress Relief",
  "Relationships",
  "Past Life Regression",
  "Akashic Records",
  "Mahavatar Babaji Wisdom"
];

export const AUDIO_CATEGORIES = [
  "Quantum Healing",
  "Babaji Wisdom",
  "Guided Meditation",
  "Chants",
  "Brahm Vidya Practice",
  "Manifestation",
  "Spiritual Awakening",
  "Stress Relief",
  "Relationship Healing",
  "Fear Release",
  "Akashic Records",
  "Past Life Regression",
  "Advanced Practices"
];

export const EVENT_TYPES = [
  "Sunday session",
  "Brahm Vidya Shivir",
  "Retreat",
  "Temple visit",
  "Satsang",
  "Workshop",
  "Online class",
  "Special meditation"
];

export const DISCLAIMER =
  "Sacred Circle offers meditation and spiritual awareness practices for personal growth and wellbeing. It is not a substitute for medical, psychological, or professional advice.";
`,
  "packages/lib/src/demo-data.ts": `
import type { Announcement, AppSetting, HealingRequest, Program, Profile, Resource, SacredEvent, Session, WeeklyKey } from "./types";

const now = new Date();
const isoFromNow = (days: number, hour = 9) => {
  const date = new Date(now);
  date.setDate(now.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const demoProfile: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Sacred Seeker",
  email: "seeker@sacredcircle.local",
  phone: "",
  city: "New Delhi",
  bio: "Walking the path with sincerity and quiet devotion.",
  interests: ["Meditation", "Brahm Vidya", "Mahavatar Babaji Wisdom"],
  role: "admin",
  show_in_directory: true
};

export const demoWeeklyKeys: WeeklyKey[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    key_code: "4567",
    title: "Sacred Key for Inner Stillness",
    description: "Weekly access for Sunday meditation recordings and guided practice.",
    week_start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().slice(0, 10),
    week_end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6).toISOString().slice(0, 10),
    is_active: true
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    key_code: "7391",
    title: "Sacred Key for Babaji Wisdom",
    description: "Upcoming weekly access for protected wisdom notes.",
    week_start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString().slice(0, 10),
    week_end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 13).toISOString().slice(0, 10),
    is_active: false
  }
];

export const demoSessions: Session[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    title: "Brahm Vidya Sunday Meditation",
    description: "A guided Sunday Satsang for silence, breath awareness, and inner alignment.",
    category: "Brahm Vidya",
    guide_name: "Sacred Circle Team",
    session_date: isoFromNow(3, 9),
    duration_minutes: 75,
    zoom_link: "https://zoom.us/j/1234567890",
    zoom_passcode: "sacred",
    status: "upcoming",
    is_featured: true
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    title: "Quantum Healing Practice",
    description: "A gentle group practice for energy clearing and luminous restoration.",
    category: "Quantum Healing",
    guide_name: "Aditi",
    session_date: isoFromNow(10, 9),
    duration_minutes: 60,
    zoom_link: "https://zoom.us/j/2234567890",
    status: "upcoming",
    is_featured: false
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    title: "Wisdom of Mahavatar Babaji",
    description: "Contemplation, chanting, and practical spiritual guidance.",
    category: "Babaji Wisdom",
    guide_name: "Sacred Circle Team",
    session_date: isoFromNow(17, 9),
    duration_minutes: 75,
    zoom_link: "https://zoom.us/j/3234567890",
    status: "upcoming",
    is_featured: true
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    title: "Fear Release Meditation",
    description: "Past Sunday recording for dissolving fear through breath and awareness.",
    category: "Fear Release",
    guide_name: "Sacred Circle Team",
    session_date: isoFromNow(-4, 9),
    duration_minutes: 58,
    status: "completed",
    is_featured: false
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    title: "Relationship Healing Circle",
    description: "A heart-centered practice for forgiveness, boundaries, and compassion.",
    category: "Relationship Healing",
    guide_name: "Aditi",
    session_date: isoFromNow(-11, 9),
    duration_minutes: 64,
    status: "completed",
    is_featured: false
  },
  {
    id: "20000000-0000-4000-8000-000000000006",
    title: "Akashic Records Introduction",
    description: "Introductory spiritual class on inner listening and sacred records.",
    category: "Akashic Records",
    guide_name: "Sacred Circle Team",
    session_date: isoFromNow(-18, 9),
    duration_minutes: 70,
    status: "completed",
    is_featured: false
  },
  {
    id: "20000000-0000-4000-8000-000000000007",
    title: "Manifestation and Inner Alignment",
    description: "A guided session for clarity, sankalp, and aligned action.",
    category: "Manifestation",
    guide_name: "Sacred Circle Team",
    session_date: isoFromNow(-25, 9),
    duration_minutes: 62,
    status: "completed",
    is_featured: false
  },
  {
    id: "20000000-0000-4000-8000-000000000008",
    title: "Sacred Chants and Mantras",
    description: "A devotional practice of sound, silence, and inner resonance.",
    category: "Chants",
    guide_name: "Sacred Circle Team",
    session_date: isoFromNow(-32, 9),
    duration_minutes: 52,
    status: "completed",
    is_featured: false
  }
];

export const demoPrograms: Program[] = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    title: "Brahm Vidya",
    description: "Foundational awareness practices for concentration, silence, and direct inner experience.",
    category: "Core Teaching",
    is_featured: true,
    access_type: "public"
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    title: "Wisdom of Mahavatar Babaji",
    description: "Contemplations, meditations, and sacred teachings inspired by Babaji wisdom.",
    category: "Wisdom",
    is_featured: true,
    access_type: "weekly_key"
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    title: "Quantum Healing",
    description: "Energy practices for restoration, release, and spiritual wellbeing.",
    category: "Healing",
    is_featured: true,
    access_type: "public"
  },
  {
    id: "30000000-0000-4000-8000-000000000004",
    title: "Manifestation",
    description: "Inner alignment, sankalp, and grounded spiritual manifestation.",
    category: "Practice",
    is_featured: false,
    access_type: "public"
  },
  {
    id: "30000000-0000-4000-8000-000000000005",
    title: "Past Life Regression",
    description: "Gentle preparatory resources for regression work and spiritual integration.",
    category: "Advanced",
    is_featured: false,
    access_type: "attendance"
  },
  {
    id: "30000000-0000-4000-8000-000000000006",
    title: "Chants and Mantras",
    description: "Sacred sound practices for devotion, grounding, and inner light.",
    category: "Devotion",
    is_featured: false,
    access_type: "public"
  }
];

export const demoResources: Resource[] = [];

export const demoEvents: SacredEvent[] = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    title: "Brahm Vidya Shivir",
    description: "A focused spiritual immersion with meditation, silence, and guided teachings.",
    event_type: "Brahm Vidya Shivir",
    start_time: isoFromNow(21, 10),
    end_time: isoFromNow(21, 17),
    location: "Delhi NCR",
    is_online: false,
    seats_total: 45,
    price_amount: null,
    registration_enabled: true,
    status: "upcoming"
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    title: "Online Special Meditation",
    description: "A moonlit guided meditation for release, blessing, and inner steadiness.",
    event_type: "Special meditation",
    start_time: isoFromNow(12, 20),
    online_link: "https://zoom.us/j/4234567890",
    is_online: true,
    registration_enabled: true,
    status: "upcoming"
  },
  {
    id: "50000000-0000-4000-8000-000000000003",
    title: "Temple Visit and Satsang",
    description: "A community temple visit followed by quiet reflection and shared Satsang.",
    event_type: "Temple visit",
    start_time: isoFromNow(35, 8),
    location: "To be shared with registered members",
    is_online: false,
    seats_total: 30,
    registration_enabled: true,
    status: "upcoming"
  }
];

export const demoAnnouncements: Announcement[] = [
  {
    id: "60000000-0000-4000-8000-000000000001",
    title: "Sunday Satsang opens this week",
    message: "The next Sacred Circle Sunday meditation is open for registration. Please join five minutes early.",
    target_type: "all",
    is_active: true
  },
  {
    id: "60000000-0000-4000-8000-000000000002",
    title: "New protected recording",
    message: "A Babaji Wisdom recording is available for members with this week's Sacred Key.",
    target_type: "all",
    is_active: true
  },
  {
    id: "60000000-0000-4000-8000-000000000003",
    title: "Brahm Vidya Shivir registration",
    message: "Seats are limited for the upcoming Shivir. Register from the Events tab.",
    target_type: "all",
    is_active: true
  }
];

export const demoHealingRequests: HealingRequest[] = [
  {
    id: "70000000-0000-4000-8000-000000000001",
    user_id: demoProfile.id,
    name: "Sacred Seeker",
    email: demoProfile.email,
    category: "Healing",
    message: "Requesting guidance for a steadier daily practice.",
    consent: true,
    status: "new"
  }
];

export const demoSettings: AppSetting[] = [
  {
    id: "80000000-0000-4000-8000-000000000001",
    key: "whatsapp_group_url",
    value: "https://wa.me/"
  },
  {
    id: "80000000-0000-4000-8000-000000000002",
    key: "youtube_channel_url",
    value: "https://www.youtube.com/@sacredcirclegroup"
  },
  {
    id: "80000000-0000-4000-8000-000000000003",
    key: "contact_email",
    value: "hello@sacredcirclegroup.com"
  },
  {
    id: "80000000-0000-4000-8000-000000000004",
    key: "app_disclaimer",
    value: "Sacred Circle offers meditation and spiritual awareness practices for personal growth and wellbeing. It is not a substitute for medical, psychological, or professional advice."
  }
];
`,
  "packages/lib/src/access.ts": `
import type { Resource, SessionRegistration, UserResourceAccess } from "./types";

export interface AccessContext {
  unlockedWeeklyKeyIds?: string[];
  manualAccess?: UserResourceAccess[];
  sessionRegistrations?: SessionRegistration[];
}

export function canAccessResource(resource: Resource, context: AccessContext = {}) {
  if (resource.access_type === "public") return true;

  if (context.manualAccess?.some((entry) => entry.resource_id === resource.id)) {
    return true;
  }

  if (
    resource.required_weekly_key_id &&
    context.unlockedWeeklyKeyIds?.includes(resource.required_weekly_key_id)
  ) {
    return true;
  }

  if (
    resource.session_id &&
    context.sessionRegistrations?.some(
      (entry) => entry.session_id === resource.session_id && entry.attendance_status === "attended"
    )
  ) {
    return true;
  }

  return false;
}

export function formatDuration(seconds?: number | null) {
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return String(minutes) + ":" + String(remainingSeconds).padStart(2, "0");
}
`,
  "packages/lib/src/supabase.ts": `
import { createClient } from "@supabase/supabase-js";

export function createSacredSupabaseClient(url?: string, anonKey?: string) {
  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
}
`,
  "packages/lib/src/storage.ts": `
export interface UploadInput {
  bucket: string;
  path: string;
  file: Blob | ArrayBuffer | Uint8Array;
  contentType?: string;
}

export interface StorageProvider {
  upload(input: UploadInput): Promise<string>;
  getPublicUrl(bucket: string, path: string): string;
  createSignedUrl?(bucket: string, path: string, expiresInSeconds: number): Promise<string>;
}

export class SupabaseStorageProvider implements StorageProvider {
  constructor(private client: any) {}

  async upload(input: UploadInput) {
    const result = await this.client.storage
      .from(input.bucket)
      .upload(input.path, input.file, {
        contentType: input.contentType,
        upsert: true
      });

    if (result.error) throw result.error;
    return this.getPublicUrl(input.bucket, input.path);
  }

  getPublicUrl(bucket: string, path: string) {
    return this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async createSignedUrl(bucket: string, path: string, expiresInSeconds: number) {
    const result = await this.client.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (result.error) throw result.error;
    return result.data.signedUrl;
  }
}
`,
  "packages/lib/src/index.ts": `
export * from "./access";
export * from "./constants";
export * from "./demo-data";
export * from "./storage";
export * from "./supabase";
export * from "./types";
`,
  "supabase/schema.sql": `
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  phone text null,
  city text null,
  dob date null,
  bio text null,
  interests text[] not null default '{}',
  role text not null default 'user' check (role in ('user', 'member', 'admin')),
  show_in_directory boolean not null default false,
  avatar_url text null,
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_keys (
  id uuid primary key default gen_random_uuid(),
  key_code text not null,
  title text not null,
  description text null,
  week_start date not null,
  week_end date not null,
  is_active boolean not null default true,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_key_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  weekly_key_id uuid not null references public.weekly_keys(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, weekly_key_id)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Meditation',
  guide_name text null,
  session_date timestamptz not null,
  duration_minutes integer null,
  zoom_link text null,
  zoom_passcode text null,
  status text not null default 'upcoming',
  is_featured boolean not null default false,
  image_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  attendance_status text not null default 'registered',
  registered_at timestamptz not null default now(),
  unique (user_id, session_id)
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Practice',
  image_url text null,
  is_featured boolean not null default false,
  access_type text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  type text not null check (type in ('audio', 'pdf', 'youtube', 'article', 'external')),
  category text not null default 'Meditation',
  file_url text null,
  youtube_url text null,
  external_url text null,
  duration_seconds integer null,
  program_id uuid null references public.programs(id) on delete set null,
  session_id uuid null references public.sessions(id) on delete set null,
  access_type text not null default 'public',
  required_weekly_key_id uuid null references public.weekly_keys(id) on delete set null,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_resource_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  access_reason text null,
  granted_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, resource_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, resource_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  event_type text not null default 'Satsang',
  start_time timestamptz not null,
  end_time timestamptz null,
  location text null,
  is_online boolean not null default false,
  online_link text null,
  image_url text null,
  seats_total integer null,
  price_amount numeric null,
  registration_enabled boolean not null default true,
  status text not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  email text not null,
  phone text null,
  city text null,
  participants_count integer not null default 1,
  note text null,
  status text not null default 'registered',
  registered_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table if not exists public.healing_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  phone text null,
  category text not null,
  message text not null,
  consent boolean not null default false,
  status text not null default 'new',
  admin_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_type text not null default 'all',
  related_session_id uuid null references public.sessions(id) on delete set null,
  related_event_id uuid null references public.events(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_history (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_type text not null,
  sent_by uuid null references public.profiles(id) on delete set null,
  sent_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  platform text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at before update on public.sessions for each row execute function public.set_updated_at();

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at before update on public.programs for each row execute function public.set_updated_at();

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at before update on public.resources for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();

drop trigger if exists healing_requests_set_updated_at on public.healing_requests;
create trigger healing_requests_set_updated_at before update on public.healing_requests for each row execute function public.set_updated_at();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at before update on public.app_settings for each row execute function public.set_updated_at();

drop trigger if exists push_tokens_set_updated_at on public.push_tokens;
create trigger push_tokens_set_updated_at before update on public.push_tokens for each row execute function public.set_updated_at();

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_sessions_date on public.sessions(session_date);
create index if not exists idx_resources_category on public.resources(category);
create index if not exists idx_resources_access on public.resources(access_type);
create index if not exists idx_events_start_time on public.events(start_time);
create index if not exists idx_healing_status on public.healing_requests(status);
`,
  "supabase/rls.sql": `
alter table public.profiles enable row level security;
alter table public.weekly_keys enable row level security;
alter table public.user_key_unlocks enable row level security;
alter table public.sessions enable row level security;
alter table public.session_registrations enable row level security;
alter table public.programs enable row level security;
alter table public.resources enable row level security;
alter table public.user_resource_access enable row level security;
alter table public.bookmarks enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.healing_requests enable row level security;
alter table public.announcements enable row level security;
alter table public.app_settings enable row level security;
alter table public.notification_history enable row level security;
alter table public.push_tokens enable row level security;

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user and role = 'admin' and disabled = false
  );
$$;

create or replace function public.user_can_access_resource(check_resource uuid, check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.resources r
    where r.id = check_resource
      and (
        r.access_type = 'public'
        or public.is_admin(check_user)
        or exists (
          select 1 from public.user_resource_access ura
          where ura.user_id = check_user and ura.resource_id = r.id
        )
        or (
          r.required_weekly_key_id is not null
          and exists (
            select 1 from public.user_key_unlocks uku
            where uku.user_id = check_user
              and uku.weekly_key_id = r.required_weekly_key_id
          )
        )
        or (
          r.session_id is not null
          and exists (
            select 1 from public.session_registrations sr
            where sr.user_id = check_user
              and sr.session_id = r.session_id
              and sr.attendance_status = 'attended'
          )
        )
      )
  );
$$;

create or replace function public.unlock_weekly_key(p_key_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_key uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select id into matched_key
  from public.weekly_keys
  where key_code = p_key_code
    and is_active = true
    and current_date between week_start and week_end
  order by created_at desc
  limit 1;

  if matched_key is null then
    raise exception 'Invalid weekly key';
  end if;

  insert into public.user_key_unlocks (user_id, weekly_key_id)
  values (auth.uid(), matched_key)
  on conflict (user_id, weekly_key_id) do nothing;

  return matched_key;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "profiles read own directory admin" on public.profiles;
create policy "profiles read own directory admin"
on public.profiles for select
using (
  id = auth.uid()
  or show_in_directory = true
  or public.is_admin(auth.uid())
);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles for insert
with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles update own admin" on public.profiles;
create policy "profiles update own admin"
on public.profiles for update
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles delete admin" on public.profiles;
create policy "profiles delete admin"
on public.profiles for delete
using (public.is_admin(auth.uid()));

drop policy if exists "weekly keys admin read" on public.weekly_keys;
create policy "weekly keys admin read"
on public.weekly_keys for select
using (public.is_admin(auth.uid()));

drop policy if exists "weekly keys admin write" on public.weekly_keys;
create policy "weekly keys admin write"
on public.weekly_keys for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "key unlocks own admin read" on public.user_key_unlocks;
create policy "key unlocks own admin read"
on public.user_key_unlocks for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "key unlocks own rpc insert" on public.user_key_unlocks;
create policy "key unlocks own rpc insert"
on public.user_key_unlocks for insert
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "key unlocks admin manage" on public.user_key_unlocks;
create policy "key unlocks admin manage"
on public.user_key_unlocks for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "sessions authenticated read" on public.sessions;
create policy "sessions authenticated read"
on public.sessions for select
using (auth.uid() is not null or public.is_admin(auth.uid()));

drop policy if exists "sessions admin manage" on public.sessions;
create policy "sessions admin manage"
on public.sessions for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "session registrations own admin read" on public.session_registrations;
create policy "session registrations own admin read"
on public.session_registrations for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "session registrations own insert" on public.session_registrations;
create policy "session registrations own insert"
on public.session_registrations for insert
with check (user_id = auth.uid());

drop policy if exists "session registrations own update admin" on public.session_registrations;
create policy "session registrations own update admin"
on public.session_registrations for update
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "programs authenticated read public accessible" on public.programs;
create policy "programs authenticated read public accessible"
on public.programs for select
using (auth.uid() is not null and (access_type = 'public' or public.is_admin(auth.uid())));

drop policy if exists "programs admin manage" on public.programs;
create policy "programs admin manage"
on public.programs for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "resources protected read" on public.resources;
create policy "resources protected read"
on public.resources for select
using (public.user_can_access_resource(id, auth.uid()));

drop policy if exists "resources admin manage" on public.resources;
create policy "resources admin manage"
on public.resources for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "resource grants own admin read" on public.user_resource_access;
create policy "resource grants own admin read"
on public.user_resource_access for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "resource grants admin manage" on public.user_resource_access;
create policy "resource grants admin manage"
on public.user_resource_access for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "bookmarks own read" on public.bookmarks;
create policy "bookmarks own read"
on public.bookmarks for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "bookmarks own insert" on public.bookmarks;
create policy "bookmarks own insert"
on public.bookmarks for insert
with check (user_id = auth.uid());

drop policy if exists "bookmarks own delete" on public.bookmarks;
create policy "bookmarks own delete"
on public.bookmarks for delete
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "events authenticated read" on public.events;
create policy "events authenticated read"
on public.events for select
using (auth.uid() is not null or public.is_admin(auth.uid()));

drop policy if exists "events admin manage" on public.events;
create policy "events admin manage"
on public.events for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "event registrations own admin read" on public.event_registrations;
create policy "event registrations own admin read"
on public.event_registrations for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "event registrations own insert" on public.event_registrations;
create policy "event registrations own insert"
on public.event_registrations for insert
with check (user_id = auth.uid());

drop policy if exists "event registrations own update admin" on public.event_registrations;
create policy "event registrations own update admin"
on public.event_registrations for update
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "healing requests own admin read" on public.healing_requests;
create policy "healing requests own admin read"
on public.healing_requests for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "healing requests own insert" on public.healing_requests;
create policy "healing requests own insert"
on public.healing_requests for insert
with check ((user_id = auth.uid() or user_id is null) and consent = true);

drop policy if exists "healing requests own admin update" on public.healing_requests;
create policy "healing requests own admin update"
on public.healing_requests for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "announcements authenticated active read" on public.announcements;
create policy "announcements authenticated active read"
on public.announcements for select
using ((auth.uid() is not null and is_active = true) or public.is_admin(auth.uid()));

drop policy if exists "announcements admin manage" on public.announcements;
create policy "announcements admin manage"
on public.announcements for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "settings authenticated read" on public.app_settings;
create policy "settings authenticated read"
on public.app_settings for select
using (auth.uid() is not null or public.is_admin(auth.uid()));

drop policy if exists "settings admin manage" on public.app_settings;
create policy "settings admin manage"
on public.app_settings for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "notification history admin read" on public.notification_history;
create policy "notification history admin read"
on public.notification_history for select
using (public.is_admin(auth.uid()));

drop policy if exists "notification history admin insert" on public.notification_history;
create policy "notification history admin insert"
on public.notification_history for insert
with check (public.is_admin(auth.uid()));

drop policy if exists "push tokens own admin read" on public.push_tokens;
create policy "push tokens own admin read"
on public.push_tokens for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "push tokens own insert" on public.push_tokens;
create policy "push tokens own insert"
on public.push_tokens for insert
with check (user_id = auth.uid());

drop policy if exists "push tokens own update" on public.push_tokens;
create policy "push tokens own update"
on public.push_tokens for update
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));
`,
  "supabase/seed.sql": `
insert into public.weekly_keys (id, key_code, title, description, week_start, week_end, is_active)
values
  ('10000000-0000-4000-8000-000000000001', '4567', 'Sacred Key for Inner Stillness', 'Weekly access for Sunday meditation recordings and guided practice.', current_date - interval '1 day', current_date + interval '6 days', true),
  ('10000000-0000-4000-8000-000000000002', '7391', 'Sacred Key for Babaji Wisdom', 'Upcoming weekly access for protected wisdom notes.', current_date + interval '7 days', current_date + interval '13 days', false)
on conflict (id) do nothing;

insert into public.sessions (id, title, description, category, guide_name, session_date, duration_minutes, zoom_link, zoom_passcode, status, is_featured)
values
  ('20000000-0000-4000-8000-000000000001', 'Brahm Vidya Sunday Meditation', 'A guided Sunday Satsang for silence, breath awareness, and inner alignment.', 'Brahm Vidya', 'Sacred Circle Team', now() + interval '3 days', 75, 'https://zoom.us/j/1234567890', 'sacred', 'upcoming', true),
  ('20000000-0000-4000-8000-000000000002', 'Quantum Healing Practice', 'A gentle group practice for energy clearing and luminous restoration.', 'Quantum Healing', 'Aditi', now() + interval '10 days', 60, 'https://zoom.us/j/2234567890', null, 'upcoming', false),
  ('20000000-0000-4000-8000-000000000003', 'Wisdom of Mahavatar Babaji', 'Contemplation, chanting, and practical spiritual guidance.', 'Babaji Wisdom', 'Sacred Circle Team', now() + interval '17 days', 75, 'https://zoom.us/j/3234567890', null, 'upcoming', true),
  ('20000000-0000-4000-8000-000000000004', 'Fear Release Meditation', 'Past Sunday recording for dissolving fear through breath and awareness.', 'Fear Release', 'Sacred Circle Team', now() - interval '4 days', 58, null, null, 'completed', false),
  ('20000000-0000-4000-8000-000000000005', 'Relationship Healing Circle', 'A heart-centered practice for forgiveness, boundaries, and compassion.', 'Relationship Healing', 'Aditi', now() - interval '11 days', 64, null, null, 'completed', false),
  ('20000000-0000-4000-8000-000000000006', 'Akashic Records Introduction', 'Introductory spiritual class on inner listening and sacred records.', 'Akashic Records', 'Sacred Circle Team', now() - interval '18 days', 70, null, null, 'completed', false),
  ('20000000-0000-4000-8000-000000000007', 'Manifestation and Inner Alignment', 'A guided session for clarity, sankalp, and aligned action.', 'Manifestation', 'Sacred Circle Team', now() - interval '25 days', 62, null, null, 'completed', false),
  ('20000000-0000-4000-8000-000000000008', 'Sacred Chants and Mantras', 'A devotional practice of sound, silence, and inner resonance.', 'Chants', 'Sacred Circle Team', now() - interval '32 days', 52, null, null, 'completed', false)
on conflict (id) do nothing;

insert into public.programs (id, title, description, category, is_featured, access_type)
values
  ('30000000-0000-4000-8000-000000000001', 'Brahm Vidya', 'Foundational awareness practices for concentration, silence, and direct inner experience.', 'Core Teaching', true, 'public'),
  ('30000000-0000-4000-8000-000000000002', 'Wisdom of Mahavatar Babaji', 'Contemplations, meditations, and sacred teachings inspired by Babaji wisdom.', 'Wisdom', true, 'weekly_key'),
  ('30000000-0000-4000-8000-000000000003', 'Quantum Healing', 'Energy practices for restoration, release, and spiritual wellbeing.', 'Healing', true, 'public'),
  ('30000000-0000-4000-8000-000000000004', 'Manifestation', 'Inner alignment, sankalp, and grounded spiritual manifestation.', 'Practice', false, 'public'),
  ('30000000-0000-4000-8000-000000000005', 'Past Life Regression', 'Gentle preparatory resources for regression work and spiritual integration.', 'Advanced', false, 'attendance'),
  ('30000000-0000-4000-8000-000000000006', 'Chants and Mantras', 'Sacred sound practices for devotion, grounding, and inner light.', 'Devotion', false, 'public')
on conflict (id) do nothing;

insert into public.events (id, title, description, event_type, start_time, end_time, location, is_online, online_link, seats_total, price_amount, registration_enabled, status)
values
  ('50000000-0000-4000-8000-000000000001', 'Brahm Vidya Shivir', 'A focused spiritual immersion with meditation, silence, and guided teachings.', 'Brahm Vidya Shivir', now() + interval '21 days', now() + interval '21 days 7 hours', 'Delhi NCR', false, null, 45, null, true, 'upcoming'),
  ('50000000-0000-4000-8000-000000000002', 'Online Special Meditation', 'A moonlit guided meditation for release, blessing, and inner steadiness.', 'Special meditation', now() + interval '12 days', null, null, true, 'https://zoom.us/j/4234567890', null, null, true, 'upcoming'),
  ('50000000-0000-4000-8000-000000000003', 'Temple Visit and Satsang', 'A community temple visit followed by quiet reflection and shared Satsang.', 'Temple visit', now() + interval '35 days', null, 'To be shared with registered members', false, null, 30, null, true, 'upcoming')
on conflict (id) do nothing;

insert into public.announcements (id, title, message, target_type, is_active)
values
  ('60000000-0000-4000-8000-000000000001', 'Sunday Satsang opens this week', 'The next Sacred Circle Sunday meditation is open for registration. Please join five minutes early.', 'all', true),
  ('60000000-0000-4000-8000-000000000002', 'New protected recording', 'A Babaji Wisdom recording is available for members with this week''s Sacred Key.', 'all', true),
  ('60000000-0000-4000-8000-000000000003', 'Brahm Vidya Shivir registration', 'Seats are limited for the upcoming Shivir. Register from the Events tab.', 'all', true)
on conflict (id) do nothing;

insert into public.app_settings (id, key, value)
values
  ('80000000-0000-4000-8000-000000000001', 'whatsapp_group_url', 'https://wa.me/'),
  ('80000000-0000-4000-8000-000000000002', 'youtube_channel_url', 'https://www.youtube.com/@sacredcirclegroup'),
  ('80000000-0000-4000-8000-000000000003', 'contact_email', 'hello@sacredcirclegroup.com'),
  ('80000000-0000-4000-8000-000000000004', 'default_zoom_link', 'https://zoom.us/'),
  ('80000000-0000-4000-8000-000000000005', 'about_sacred_circle', 'Sacred Circle is a spiritual awareness and Brahm Vidya community devoted to meditation, healing, manifestation, and awakening.'),
  ('80000000-0000-4000-8000-000000000006', 'app_disclaimer', 'Sacred Circle offers meditation and spiritual awareness practices for personal growth and wellbeing. It is not a substitute for medical, psychological, or professional advice.'),
  ('80000000-0000-4000-8000-000000000007', 'privacy_policy_url', 'https://sacredcirclegroup.com/privacy-policy'),
  ('80000000-0000-4000-8000-000000000008', 'terms_url', 'https://sacredcirclegroup.com/terms')
on conflict (key) do update set value = excluded.value;
`
};

for (const [filePath, content] of Object.entries(files)) {
  writeFile(filePath, content);
}

console.log("Base Sacred Circle scaffold generated.");
