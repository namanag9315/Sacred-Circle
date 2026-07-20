import {
  getYouTubeVideoId,
  type Announcement,
  type AppSetting,
  type ContactSubmission,
  type EventRegistration,
  type PageContent,
  type Profile,
  type Program,
  type Resource,
  type SacredEvent,
  type Session,
  type SessionRegistration,
  type Video
} from "@sacred-circle/lib";
import { supabase } from "../lib/supabase";

function requireDataClient() {
  if (!supabase) throw new Error("Sacred Circle data service is not configured.");
  return supabase;
}

function rowsOrThrow<T>(data: T[] | null, error: { message?: string } | null): T[] {
  if (error) throw error;
  return data || [];
}

export async function listSessions(): Promise<Session[]> {
  const client = requireDataClient();
  const { data, error } = await client.from("sessions").select("*").order("session_date", { ascending: true });
  return rowsOrThrow(data as Session[] | null, error);
}

export async function listResources(): Promise<Resource[]> {
  const client = requireDataClient();
  const { data, error } = await client
    .from("resources")
    .select("id,title,description,type,category,audio_group,recorded_at,shivir_location,access_type,storage_provider,storage_path,youtube_url,external_url,session_id,page_id,duration_seconds,is_featured,display_order,source_url,migration_status,status,created_at,updated_at")
    .eq("status", "published")
    .in("migration_status", ["ready", "imported"])
    .order("recorded_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return rowsOrThrow(data as Resource[] | null, error);
}

export async function listPrograms(): Promise<Program[]> {
  const client = requireDataClient();
  const { data, error } = await client
    .from("programs")
    .select("*")
    .eq("status", "published")
    .in("migration_status", ["ready", "imported"])
    .order("display_order", { ascending: true });
  return rowsOrThrow(data as Program[] | null, error);
}

export async function listEvents(): Promise<SacredEvent[]> {
  const client = requireDataClient();
  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("status", "published")
    .in("migration_status", ["ready", "imported"])
    .order("event_date", { ascending: true, nullsFirst: false });
  return rowsOrThrow(data as SacredEvent[] | null, error);
}

export async function listVideos(): Promise<Video[]> {
  const client = requireDataClient();
  const { data, error } = await client
    .from("videos")
    .select("*")
    .eq("status", "published")
    .in("migration_status", ["ready", "imported"])
    .order("display_order", { ascending: true });
  return rowsOrThrow(data as Video[] | null, error).filter((video) => Boolean(getYouTubeVideoId(video.youtube_url)));
}

export async function listPages(): Promise<PageContent[]> {
  const client = requireDataClient();
  const { data, error } = await client
    .from("pages")
    .select("*")
    .eq("status", "published")
    .in("migration_status", ["ready", "imported"])
    .order("display_order", { ascending: true });
  return rowsOrThrow(data as PageContent[] | null, error);
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const client = requireDataClient();
  const { data, error } = await client
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return rowsOrThrow(data as Announcement[] | null, error);
}

export async function listSettings(): Promise<AppSetting[]> {
  const client = requireDataClient();
  const { data, error } = await client.from("app_settings").select("*");
  return rowsOrThrow(data as AppSetting[] | null, error);
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    console.warn(error);
    return null;
  }
  return data as Profile | null;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string; email: string }) {
  const client = requireDataClient();
  const initialProfile = {
    id: profile.id,
    email: profile.email,
    name: profile.name?.trim() || profile.email.split("@")[0] || "Sacred Seeker",
    phone: profile.phone?.trim() || null,
    city: profile.city?.trim() || null,
    state: profile.state?.trim() || null,
    date_of_birth: profile.date_of_birth?.trim() || null,
    role: "user" as const
  };
  const { data, error } = await client.from("profiles").upsert(initialProfile).select("*").single();
  if (error) throw error;
  return data as Profile;
}

export async function updateMyProfile(
  userId: string,
  patch: Pick<Profile, "name"> & Partial<Pick<Profile, "phone" | "city" | "state" | "date_of_birth">>
) {
  const client = requireDataClient();
  const name = patch.name.trim();
  if (!name) throw new Error("Name is required.");
  const safePatch = {
    name,
    phone: patch.phone?.trim() || null,
    city: patch.city?.trim() || null,
    state: patch.state?.trim() || null,
    date_of_birth: patch.date_of_birth?.trim() || null
  };
  const { data, error } = await client
    .from("profiles")
    .update(safePatch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function listMySessionRegistrations(userId: string): Promise<SessionRegistration[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("session_registrations")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "registered")
    .order("created_at", { ascending: false });
  return error || !data ? [] : (data as SessionRegistration[]);
}

export async function unlockSessionRecording(sessionId: string, code: string) {
  if (!supabase) return "service_unavailable";

  const { data, error } = await supabase.rpc("unlock_session_recording", {
    p_session_id: sessionId,
    p_code: code.trim()
  });

  if (error) {
    if (error.message.includes("rate_limited")) return "rate_limited";
    if (error.message.includes("auth_required") || error.message.toLowerCase().includes("jwt")) return "auth_required";
    if (error.message.includes("expired_code")) return "expired_code";
    if (error.message.includes("already_unlocked")) return "already_unlocked";
    return "invalid_code";
  }

  const result = String(data || "invalid_code");
  if (["unlocked", "already_unlocked", "expired_code", "invalid_code", "rate_limited", "auth_required"].includes(result)) {
    return result;
  }
  return "invalid_code";
}

export type SacredKeyRecordingLookup = {
  status: "matched" | "invalid_code" | "expired_code" | "rate_limited" | "auth_required" | "recording_unavailable" | "service_unavailable";
  recordings: Resource[];
};

export async function findRecordingsBySacredKey(code: string): Promise<SacredKeyRecordingLookup> {
  if (!supabase) return { status: "service_unavailable", recordings: [] };

  const { data, error } = await supabase.rpc("find_recordings_by_sacred_key", {
    p_code: code.trim()
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("rate_limited")) return { status: "rate_limited", recordings: [] };
    if (message.includes("auth") || message.includes("jwt")) return { status: "auth_required", recordings: [] };
    return { status: "service_unavailable", recordings: [] };
  }

  const payload = data && typeof data === "object" && !Array.isArray(data)
    ? data as { status?: unknown; recordings?: unknown }
    : {};
  const allowedStatuses: SacredKeyRecordingLookup["status"][] = [
    "matched",
    "invalid_code",
    "expired_code",
    "rate_limited",
    "auth_required",
    "recording_unavailable"
  ];
  const status = allowedStatuses.includes(payload.status as SacredKeyRecordingLookup["status"])
    ? payload.status as SacredKeyRecordingLookup["status"]
    : "service_unavailable";
  const recordings = Array.isArray(payload.recordings) ? payload.recordings as Resource[] : [];

  return { status, recordings };
}

export async function registerForSession(userId: string, sessionId: string) {
  const client = requireDataClient();
  const { error } = await client.from("session_registrations").upsert({
    user_id: userId,
    session_id: sessionId,
    status: "registered"
  }, {
    onConflict: "user_id,session_id"
  });
  if (error) throw error;
  return true;
}

export async function registerForEvent(input: Omit<EventRegistration, "id" | "created_at">) {
  const client = requireDataClient();
  const { error } = await client.from("event_registrations").insert(input);
  if (error) throw error;
  return true;
}

export async function createContactSubmission(input: Omit<ContactSubmission, "id" | "created_at" | "status"> & { status?: string }) {
  const client = requireDataClient();
  const { error } = await client.from("contact_submissions").insert({
    ...input,
    status: input.status || "new"
  });
  if (error) throw error;
  return true;
}

export async function registerPushToken(input: { user_id: string; expo_push_token: string; platform?: string | null }) {
  const client = requireDataClient();
  const { error } = await client.from("push_tokens").upsert(input, {
    onConflict: "user_id,expo_push_token"
  });
  if (error) throw error;
  return true;
}

export async function getPlayableResourceUrl(resource: Resource, accessCode?: string) {
  if (resource.access_type === "public" && resource.external_url) return resource.external_url;
  const client = requireDataClient();

  const { data, error } = await client.functions.invoke("get-resource-url", {
    body: {
      resource_id: resource.id,
      ...(resource.access_type === "session_protected" && accessCode ? { access_code: accessCode.trim() } : {})
    }
  });
  if (error) throw error;
  const url = typeof data?.url === "string" ? data.url : "";
  if (!url) throw new Error("No playable URL is attached to this resource.");
  return url;
}

export async function deleteMyAccount() {
  const client = requireDataClient();
  const { data: userResult, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userResult.user) throw new Error("Authentication required.");

  const { error } = await client.functions.invoke("delete-account", { body: {} });
  if (error) throw error;

  await client.auth.signOut({ scope: "local" });
  return true;
}
