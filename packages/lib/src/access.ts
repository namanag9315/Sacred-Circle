import type { Resource, UserSessionUnlock } from "./types";

export interface AccessContext {
  sessionUnlocks?: UserSessionUnlock[];
  isAdmin?: boolean;
}

export function canAccessResource(resource: Resource, context: AccessContext = {}) {
  if (resource.access_type === "public") return true;
  if (context.isAdmin) return true;
  if (resource.access_type !== "session_protected") return false;
  if (!resource.session_id) return false;

  return Boolean(context.sessionUnlocks?.some((unlock) => unlock.session_id === resource.session_id));
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
