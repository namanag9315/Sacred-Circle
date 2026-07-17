import type {
  Announcement,
  AppSetting,
  PageContent,
  Program,
  Resource,
  SacredEvent,
  Session,
  UserSessionUnlock,
  Video
} from "./types";

export const demoProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Sacred Seeker",
  email: "seeker@sacredcircle.local",
  phone: "",
  city: "New Delhi",
  state: "",
  date_of_birth: "",
  role: "admin" as const
};

// Empty fallbacks keep unavailable content hidden instead of inventing dates,
// session links, programs, testimonials, announcements, or events.
export const demoSessions: Session[] = [];

export const demoUnlocks: UserSessionUnlock[] = [];

export const demoPrograms: Program[] = [];

// Review fixtures must never create a publishable audio catalog. Real audio is
// added through the admin panel after an approved file has been uploaded.
export const demoResources: Resource[] = [];

export const demoPages: PageContent[] = [
  {
    id: "90000000-0000-4000-8000-000000000001",
    slug: "home",
    title: "Sacred Circle",
    subtitle: "A sacred space for meditation, inner awareness and spiritual exploration.",
    body: "Join the Sunday session, listen to meditation audio, unlock protected recordings and explore Sacred Circle resources.",
    hero_image_url: null,
    migration_status: "ready",
    status: "published"
  },
  {
    id: "90000000-0000-4000-8000-000000000002",
    slug: "about",
    title: "About Sacred Circle",
    subtitle: "Meditation, inner awareness and spiritual practice.",
    body: "Sacred Circle is a community for meditation, inner awareness and spiritual growth. Free online Sunday sessions offer discussion, meditation and simple personal practices.",
    hero_image_url: null,
    migration_status: "ready",
    status: "published"
  },
  {
    id: "90000000-0000-4000-8000-000000000003",
    slug: "contact",
    title: "Contact Sacred Circle",
    subtitle: "Help with sessions, recordings and app access.",
    body: "For questions about a Sunday session, Sacred Access Key, audio recording or Shivir, contact Sacred Circle by email or use the in-app contact form.",
    hero_image_url: null,
    migration_status: "ready",
    status: "published"
  }
];

export const demoEvents: SacredEvent[] = [];

export const demoVideos: Video[] = [];

export const demoAnnouncements: Announcement[] = [];

export const demoSettings: AppSetting[] = [
  {
    id: "80000000-0000-4000-8000-000000000002",
    key: "youtube_channel_url",
    value: "https://www.youtube.com/@sacredcircle8336/videos"
  },
  {
    id: "80000000-0000-4000-8000-000000000003",
    key: "contact_email",
    value: "sacredcircle45@gmail.com"
  },
  {
    id: "80000000-0000-4000-8000-000000000004",
    key: "default_zoom_info",
    value: "Sunday meditation happens online through Zoom at 4:00 PM IST."
  },
  {
    id: "80000000-0000-4000-8000-000000000005",
    key: "sunday_session_time",
    value: "Every Sunday at 4:00 PM IST"
  },
  {
    id: "80000000-0000-4000-8000-000000000006",
    key: "disclaimer_text",
    value: "Sacred Circle provides meditation and spiritual-awareness content for personal reflection and wellbeing. It is not a substitute for medical, psychological, legal or other professional advice."
  },
  {
    id: "80000000-0000-4000-8000-000000000009",
    key: "privacy_policy",
    value: "Sacred Circle keeps profile details minimal and uses them only for sessions, meditation access, contact, and app support."
  },
  {
    id: "80000000-0000-4000-8000-000000000010",
    key: "terms_text",
    value: "Use Sacred Circle as a wellness and meditation companion. Live sessions remain on external Zoom links."
  }
];
