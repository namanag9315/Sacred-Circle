export type UserRole = "user" | "admin";
export type SessionStatus = "upcoming" | "live" | "completed" | "cancelled";
export type RegistrationStatus = "registered" | "cancelled";
export type ResourceType = "audio" | "pdf" | "article" | "video";
export type AccessType = "public" | "session_protected" | "admin_only";
export type AudioGroup = "free" | "online_shivir" | "offline_shivir";
export type StorageProviderName = "r2" | "supabase" | "youtube" | "external";
export type PublishStatus = "published" | "archived" | "draft";

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  date_of_birth?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id: string;
  title: string;
  topic?: string | null;
  description: string;
  session_date: string;
  duration_minutes?: number | null;
  zoom_link?: string | null;
  status: SessionStatus | string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionRegistration {
  id: string;
  user_id: string;
  session_id: string;
  status: RegistrationStatus | string;
  created_at?: string;
}

export interface SessionAccessCode {
  id: string;
  session_id: string;
  code_label?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface UserSessionUnlock {
  id: string;
  user_id: string;
  session_id: string;
  access_code_id?: string | null;
  unlocked_at?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: string;
  audio_group?: AudioGroup | null;
  recorded_at?: string | null;
  shivir_location?: string | null;
  access_type: AccessType;
  storage_provider: StorageProviderName;
  storage_path?: string | null;
  youtube_url?: string | null;
  external_url?: string | null;
  session_id?: string | null;
  page_id?: string | null;
  duration_seconds?: number | null;
  is_featured: boolean;
  display_order?: number;
  source_url?: string | null;
  migration_status?: string | null;
  status?: PublishStatus | string;
  created_at?: string;
  updated_at?: string;
}

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  body: string;
  hero_image_url?: string | null;
  display_order?: number;
  source_url?: string | null;
  migration_status?: string | null;
  status: PublishStatus | string;
  created_at?: string;
  updated_at?: string;
}

export interface Program {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  image_url?: string | null;
  display_order: number;
  source_url?: string | null;
  migration_status?: string | null;
  status: PublishStatus | string;
  created_at?: string;
  updated_at?: string;
}

export interface SacredEvent {
  id: string;
  title: string;
  description: string;
  event_date?: string | null;
  location?: string | null;
  image_url?: string | null;
  registration_enabled: boolean;
  source_url?: string | null;
  migration_status?: string | null;
  status: PublishStatus | string;
  created_at?: string;
  updated_at?: string;
}

export interface EventRegistration {
  id: string;
  user_id?: string | null;
  event_id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  message?: string | null;
  created_at?: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string | null;
  youtube_url: string;
  thumbnail_url?: string | null;
  category?: string | null;
  display_order: number;
  source_url?: string | null;
  migration_status?: string | null;
  status: PublishStatus | string;
  created_at?: string;
  updated_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  target_type: string;
  is_active: boolean;
  created_at?: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  updated_at?: string;
}

export interface ContactSubmission {
  id: string;
  user_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: "new" | "reviewed" | "closed" | string;
  created_at?: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPreference {
  user_id: string;
  sunday_session_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export type RecordingState = "not_uploaded" | "locked" | "unlocked";
