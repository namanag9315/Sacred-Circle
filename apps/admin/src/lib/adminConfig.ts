export type FieldType = "text" | "textarea" | "number" | "boolean" | "date" | "datetime" | "select" | "relation";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  helper?: string;
  relation?: {
    table: string;
    valueKey: string;
    labelKeys: string[];
    orderKey?: string;
  };
}

export interface ModuleConfig {
  title: string;
  eyebrow: string;
  description: string;
  table: string;
  columns: string[];
  fields: FieldConfig[];
  demoRows: any[];
}

export const moduleConfigs: Record<string, ModuleConfig> = {
  sessions: {
    title: "Sunday Sessions",
    eyebrow: "Sunday Zoom",
    description: "Create each Sunday Zoom session, add the live link, and keep recordings/date-wise access organized.",
    table: "sessions",
    columns: ["title", "topic", "session_date", "zoom_link", "status"],
    fields: [
      { key: "title", label: "Session title", type: "text", helper: "Example: Sunday Meditation and Healing" },
      { key: "topic", label: "Topic", type: "text", helper: "Short theme shown in the app." },
      { key: "description", label: "Short description", type: "textarea", helper: "Keep this simple. Users should understand it in one glance." },
      { key: "session_date", label: "Date and time", type: "datetime", helper: "Use Sunday 4:00 PM IST unless the session timing changes." },
      { key: "duration_minutes", label: "Duration in minutes", type: "number" },
      { key: "zoom_link", label: "Zoom link", type: "text", helper: "Paste the external Zoom meeting link only. The app does not host video calls." },
      { key: "status", label: "Status", type: "select", options: ["upcoming", "live", "completed", "cancelled"] }
    ],
    demoRows: []
  },
  sessionAccessCodes: {
    title: "Sacred Access Keys",
    eyebrow: "Session unlock",
    description: "Create session-specific Sacred Access Keys. Use the database function in production so the plain code is hashed before storage.",
    table: "session_access_codes",
    columns: ["session_id", "code_label", "starts_at", "expires_at", "is_active"],
    fields: [
      { key: "session_id", label: "Session", type: "relation", relation: { table: "sessions", valueKey: "id", labelKeys: ["title", "session_date"], orderKey: "session_date" } },
      { key: "__plain_code", label: "Sacred Access Key", type: "text", helper: "This is hashed through the database function. It is not saved as plain text." },
      { key: "code_label", label: "Key label", type: "text" },
      { key: "starts_at", label: "Starts at", type: "datetime" },
      { key: "expires_at", label: "Expires at", type: "datetime" },
      { key: "is_active", label: "Active", type: "boolean" }
    ],
    demoRows: []
  },
  meditations: {
    title: "Audio & Resources",
    eyebrow: "Media library",
    description: "Add Free, Online Shivir and Offline Shivir audios. Unlocked is calculated automatically for each member.",
    table: "resources",
    columns: ["title", "type", "audio_group", "recorded_at", "shivir_location", "access_type", "status"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "type", label: "Type", type: "select", options: ["audio", "pdf", "article", "video"] },
      { key: "audio_group", label: "Audio group", type: "select", options: ["free", "online_shivir", "offline_shivir"], helper: "Unlocked is user-specific and does not need to be selected here." },
      { key: "recorded_at", label: "Recording date", type: "date", helper: "The library is sorted newest to oldest by this date." },
      { key: "shivir_location", label: "Offline Shivir location", type: "text", helper: "Required only for Offline Shivir audio." },
      { key: "category", label: "Internal label", type: "text", helper: "Use Free, Online Shivir or Offline Shivir." },
      { key: "access_type", label: "Access", type: "select", options: ["public", "session_protected", "admin_only"], helper: "Use session_protected only for Sunday healing recordings unlocked by Sacred Access Key." },
      { key: "storage_provider", label: "Storage", type: "select", options: ["r2", "supabase", "youtube", "external"] },
      { key: "storage_path", label: "R2 or storage path", type: "text" },
      { key: "external_url", label: "Public external audio URL", type: "text" },
      { key: "youtube_url", label: "YouTube URL", type: "text" },
      { key: "session_id", label: "Linked session for protected recording", type: "relation", relation: { table: "sessions", valueKey: "id", labelKeys: ["title", "session_date"], orderKey: "session_date" } },
      { key: "duration_seconds", label: "Duration seconds", type: "number" },
      { key: "is_featured", label: "Feature on Home", type: "boolean" },
      { key: "display_order", label: "Display order", type: "number", helper: "Recording date controls the audio library order." },
      { key: "source_url", label: "Original website/source URL", type: "text" },
      { key: "migration_status", label: "Migration status", type: "select", options: ["manual_review", "ready", "imported", "needs_update", "archived"] },
      { key: "status", label: "Status", type: "select", options: ["published", "archived", "draft"] }
    ],
    demoRows: []
  },
  pages: {
    title: "Pages",
    eyebrow: "Website content",
    description: "Manage app-friendly content copied from the website after manual review.",
    table: "pages",
    columns: ["slug", "title", "subtitle", "status"],
    fields: [
      { key: "slug", label: "Slug", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
      { key: "hero_image_url", label: "Hero image URL", type: "text" },
      { key: "display_order", label: "Display order", type: "number" },
      { key: "source_url", label: "Original website/source URL", type: "text" },
      { key: "migration_status", label: "Migration status", type: "select", options: ["manual_review", "ready", "imported", "needs_update", "archived"] },
      { key: "status", label: "Status", type: "select", options: ["published", "archived", "draft"] }
    ],
    demoRows: []
  },
  programs: {
    title: "Programs",
    eyebrow: "More content",
    description: "Program cards shown inside More, not as a bottom tab.",
    table: "programs",
    columns: ["title", "category", "display_order", "status"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "category", label: "Program group", type: "select", options: ["Healing and Wellbeing", "Meditation and Inner Development", "Manifestation and Relationships", "Spiritual Wisdom and Guidance", "Sacred Exploration"] },
      { key: "image_url", label: "Image URL", type: "text" },
      { key: "display_order", label: "Display order", type: "number" },
      { key: "source_url", label: "Original website/source URL", type: "text" },
      { key: "migration_status", label: "Migration status", type: "select", options: ["manual_review", "ready", "imported", "needs_update", "archived"] },
      { key: "status", label: "Status", type: "select", options: ["published", "archived", "draft"] }
    ],
    demoRows: []
  },
  events: {
    title: "Events",
    eyebrow: "More content",
    description: "Simple upcoming events and shivirs. No payment workflow in V1.",
    table: "events",
    columns: ["title", "event_date", "location", "registration_enabled", "status"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "event_date", label: "Event date", type: "datetime" },
      { key: "location", label: "Location", type: "text" },
      { key: "image_url", label: "Image URL", type: "text" },
      { key: "registration_enabled", label: "Registration enabled", type: "boolean" },
      { key: "source_url", label: "Original website/source URL", type: "text" },
      { key: "migration_status", label: "Migration status", type: "select", options: ["manual_review", "ready", "imported", "needs_update", "archived"] },
      { key: "status", label: "Status", type: "select", options: ["published", "archived", "draft"] }
    ],
    demoRows: []
  },
  videos: {
    title: "Video Library",
    eyebrow: "YouTube",
    description: "Paste YouTube links here. The admin automatically uses the original YouTube thumbnail, and videos are never downloaded or hosted.",
    table: "videos",
    columns: ["title", "category", "youtube_url", "thumbnail_url", "display_order", "status"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "youtube_url", label: "YouTube video link", type: "text", helper: "Paste the original YouTube URL. The thumbnail is filled automatically from YouTube." },
      { key: "thumbnail_url", label: "Original thumbnail URL", type: "text", helper: "Usually auto-filled. Keep this as an i.ytimg.com URL unless there is a special reason." },
      { key: "category", label: "Category", type: "text" },
      { key: "display_order", label: "Display order", type: "number" },
      { key: "source_url", label: "Original website/source URL", type: "text" },
      { key: "migration_status", label: "Migration status", type: "select", options: ["manual_review", "ready", "imported", "needs_update", "archived"] },
      { key: "status", label: "Status", type: "select", options: ["published", "archived", "draft"] }
    ],
    demoRows: []
  },
  users: {
    title: "Users",
    eyebrow: "Access",
    description: "Search users, update minimal profile details, and change role only when needed.",
    table: "profiles",
    columns: ["name", "email", "phone", "city", "state", "date_of_birth", "role"],
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "date_of_birth", label: "Date of Birth", type: "text", helper: "Use YYYY-MM-DD." },
      { key: "role", label: "Role", type: "select", options: ["user", "admin"] }
    ],
    demoRows: []
  },
  userUnlocks: {
    title: "Manual Unlocks",
    eyebrow: "User access",
    description: "Grant or revoke access to a specific session recording for one user. Each unlock is session-specific.",
    table: "user_session_unlocks",
    columns: ["user_id", "session_id", "unlocked_at"],
    fields: [
      { key: "user_id", label: "User", type: "relation", relation: { table: "profiles", valueKey: "id", labelKeys: ["name", "email", "phone"], orderKey: "name" } },
      { key: "session_id", label: "Session", type: "relation", relation: { table: "sessions", valueKey: "id", labelKeys: ["title", "session_date"], orderKey: "session_date" } }
    ],
    demoRows: []
  },
  contactSubmissions: {
    title: "Contact Messages",
    eyebrow: "Contact",
    description: "Read and triage simple messages submitted from the app Contact screen.",
    table: "contact_submissions",
    columns: ["name", "email", "phone", "message", "status", "created_at"],
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "message", label: "Message", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["new", "reviewed", "closed"] }
    ],
    demoRows: []
  },
  announcements: {
    title: "Announcements",
    eyebrow: "Home card",
    description: "Create one clear announcement for Home. Push notifications can be wired later.",
    table: "announcements",
    columns: ["title", "message", "target_type", "is_active", "created_at"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "message", label: "Message", type: "textarea" },
      { key: "target_type", label: "Target", type: "select", options: ["all"] },
      { key: "is_active", label: "Show in app", type: "boolean" }
    ],
    demoRows: []
  },
  settings: {
    title: "Settings",
    eyebrow: "Links and copy",
    description: "Manage WhatsApp, YouTube, contact email, home quote, default Zoom information, disclaimer and policy links.",
    table: "app_settings",
    columns: ["key", "value", "updated_at"],
    fields: [
      { key: "key", label: "Setting key", type: "text" },
      { key: "value", label: "Value", type: "textarea" }
    ],
    demoRows: []
  }
};

export const navItems = [
  ["Home", "/dashboard"],
  ["Upload Recording", "/meditations"],
  ["Video Library", "/videos"],
  ["Members", "/users"],
  ["App Details", "/settings"]
] as const;

export const mediaConfigs = [
  moduleConfigs.meditations,
  moduleConfigs.videos
];

export const pageContentConfigs = [
  moduleConfigs.pages,
  moduleConfigs.programs,
  moduleConfigs.events,
  moduleConfigs.contactSubmissions
];

export const sessionConfigs = [
  moduleConfigs.sessions,
  moduleConfigs.sessionAccessCodes
];

export const userConfigs = [
  moduleConfigs.users,
  moduleConfigs.userUnlocks
];
