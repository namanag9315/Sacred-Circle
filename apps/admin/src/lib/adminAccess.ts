export const SACRED_CIRCLE_ADMIN_EMAIL = "sacredcircle45@gmail.com";

export function isSacredCircleAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === SACRED_CIRCLE_ADMIN_EMAIL;
}
