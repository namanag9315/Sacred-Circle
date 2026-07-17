const OAUTH_REDIRECT_PENDING_KEY = "sacred-circle-oauth-redirect-pending";

function currentBrowserUrl() {
  if (typeof window === "undefined") return null;
  try {
    return new URL(window.location.href);
  } catch {
    return null;
  }
}

export function hasOAuthCallbackInUrl() {
  const url = currentBrowserUrl();
  if (!url) return false;

  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  return (
    url.searchParams.has("code") ||
    url.searchParams.has("error") ||
    url.searchParams.has("error_code") ||
    hash.has("access_token") ||
    hash.has("refresh_token") ||
    hash.has("error") ||
    hash.has("error_description")
  );
}

export function markOAuthRedirectPending() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(OAUTH_REDIRECT_PENDING_KEY, "1");
  } catch {
    // Some embedded browsers disable session storage. The callback URL check
    // still prevents the starter screen from interrupting the OAuth return.
  }
}

export function clearOAuthRedirectPending() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(OAUTH_REDIRECT_PENDING_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

export function shouldBypassStarterForOAuth() {
  if (hasOAuthCallbackInUrl()) return true;
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(OAUTH_REDIRECT_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function cleanOAuthCallbackUrl() {
  const url = currentBrowserUrl();
  if (!url || typeof window === "undefined") return;

  ["code", "state", "error", "error_code", "error_description"].forEach((key) => {
    url.searchParams.delete(key);
  });

  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  if (
    hash.has("access_token") ||
    hash.has("refresh_token") ||
    hash.has("expires_in") ||
    hash.has("token_type") ||
    hash.has("error") ||
    hash.has("error_description")
  ) {
    url.hash = "";
  }

  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
}
