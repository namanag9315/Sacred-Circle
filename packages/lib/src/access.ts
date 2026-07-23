import type { Resource } from "./types";

export interface AccessContext {
  isAdmin?: boolean;
}

export function canAccessResource(resource: Resource, context: AccessContext = {}) {
  if (resource.access_type === "public") return true;
  if (context.isAdmin) return true;
  // Protected recordings are authorized for one player session by the access
  // key supplied when requesting the signed media URL. Historical unlock rows
  // must never make a recording permanently available in the client.
  return false;
}

export function getRecordingState(resource: Resource | undefined, context: AccessContext = {}) {
  if (!resource) return "not_uploaded";
  return canAccessResource(resource, context) ? "unlocked" : "locked";
}

export function formatDuration(seconds?: number | null) {
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return String(minutes) + ":" + String(remainingSeconds).padStart(2, "0");
}
