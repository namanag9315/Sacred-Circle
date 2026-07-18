import AsyncStorage from "@react-native-async-storage/async-storage";
import { demoProfile, type Profile, type SessionRegistration } from "@sacred-circle/lib";
import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  deleteMyAccount as deleteAccountFromRepository,
  getProfile,
  listMySessionRegistrations,
  registerForSession,
  unlockSessionRecording,
  updateMyProfile,
  upsertProfile
} from "../services/repository";
import { supabase } from "../lib/supabase";
import {
  cleanOAuthCallbackUrl,
  clearOAuthRedirectPending,
  markOAuthRedirectPending
} from "../lib/authRedirect";

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  loading: boolean;
  userId: string | null;
  profile: Profile | null;
  sessionRegistrations: SessionRegistration[];
  authNotice: string;
  signInWithEmail: (input: { name?: string; email: string; password?: string; phone?: string; city?: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  completeSacredKey: (sessionId: string, code: string) => Promise<string>;
  recordSessionJoin: (sessionId: string) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  deleteMyAccount: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_PROFILE = "sacred-circle-demo-profile";
const LEGACY_DEMO_UNLOCKS = "sacred-circle-demo-unlocks";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionRegistrations, setSessionRegistrations] = useState<SessionRegistration[]>([]);
  const [authNotice, setAuthNotice] = useState("");

  useEffect(() => {
    let mounted = true;

    async function syncAuthUser(authUser: User) {
      let loadedProfile = await getProfile(authUser.id);
      if (!loadedProfile) {
        loadedProfile = await upsertProfile({
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Sacred Seeker",
          email: authUser.email || "",
          phone: authUser.user_metadata?.phone || null,
          city: authUser.user_metadata?.city || null,
          state: authUser.user_metadata?.state || null,
          date_of_birth: authUser.user_metadata?.date_of_birth || null,
          role: "user"
        });
      }
      return {
        ...loadedProfile,
        avatar_url: authAvatarUrl(authUser)
      };
    }

    async function boot() {
      try {
        if (!supabase) {
          if (__DEV__) {
            const stored = await AsyncStorage.getItem(DEMO_PROFILE);
            if (stored && mounted) {
              const parsed = JSON.parse(stored) as Profile;
              setUserId(parsed.id);
              setProfile(parsed);
              setSessionRegistrations([]);
            }
          } else {
            await AsyncStorage.multiRemove([DEMO_PROFILE, LEGACY_DEMO_UNLOCKS]);
          }
          if (mounted) setLoading(false);
          return;
        }

        const oauthNotice = await completeOAuthFromCurrentUrl();
        if (oauthNotice && mounted) setAuthNotice(oauthNotice);
        const { data } = await supabase.auth.getSession();
        const authUser = data.session?.user;
        if (authUser) {
          const loadedProfile = await syncAuthUser(authUser);
          if (mounted) {
            setUserId(authUser.id);
            setProfile(loadedProfile);
            setSessionRegistrations(await listMySessionRegistrations(authUser.id));
          }
        }
      } catch (err) {
        console.error("Auth boot error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    boot();
    const subscription = supabase?.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user;
      setUserId(authUser?.id || null);
      if (!authUser) {
        setProfile(null);
        setSessionRegistrations([]);
        return;
      }
      const loadedProfile = await syncAuthUser(authUser);
      setProfile(loadedProfile);
      setSessionRegistrations(await listMySessionRegistrations(authUser.id));
    });

    return () => {
      mounted = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    loading,
    userId,
    profile,
    sessionRegistrations,
    authNotice,
    async signInWithEmail(input) {
      setAuthNotice("");
      if (isLocalDemoLogin(input.email, input.password)) {
        const nextProfile: Profile = {
          ...demoProfile,
          name: input.name || input.email.split("@")[0] || demoProfile.name,
          email: input.email,
          phone: input.phone || "",
          city: input.city || "",
          state: "",
          date_of_birth: ""
        };
        await AsyncStorage.setItem(DEMO_PROFILE, JSON.stringify(nextProfile));
        setUserId(nextProfile.id);
        setProfile(nextProfile);
        setSessionRegistrations([]);
        return;
      }

      if (!supabase) throw new Error("Sacred Circle sign in is not configured for this build.");

      const result = await supabase.auth.signInWithOtp({
        email: input.email,
        options: {
          data: {
            name: input.name || input.email.split("@")[0],
            phone: input.phone || null,
            city: input.city || null,
            state: null,
            date_of_birth: null
          },
          emailRedirectTo: getAuthRedirectUrl()
        }
      });
      if (result.error) throw result.error;
      setAuthNotice("Please check your email. Tap the Sacred Circle login link to continue.");
    },
    async signInWithGoogle() {
      setAuthNotice("");
      if (!supabase && __DEV__) {
        const nextProfile: Profile = {
          ...demoProfile,
          name: "Sacred Seeker",
          email: "google-user@sacredcircle.local",
          phone: "",
          city: "",
          state: "",
          date_of_birth: ""
        };
        await AsyncStorage.setItem(DEMO_PROFILE, JSON.stringify(nextProfile));
        setUserId(nextProfile.id);
        setProfile(nextProfile);
        setSessionRegistrations([]);
        return;
      }

      if (!supabase) throw new Error("Google sign in is not configured for this build.");

      const redirectTo = getAuthRedirectUrl();
      const result = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true
        }
      });
      if (result.error) throw result.error;
      const authUrl = result.data.url;
      if (!authUrl) throw new Error("Google login URL was not returned.");

      if (Platform.OS === "web") {
        markOAuthRedirectPending();
        window.location.assign(authUrl);
        return;
      }

      const response = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
      if (response.type !== "success") {
        setAuthNotice("Google sign in was cancelled.");
        return;
      }

      const parsed = Linking.parse(response.url);
      const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;
      if (code) {
        const exchange = await supabase.auth.exchangeCodeForSession(code);
        if (exchange.error) throw exchange.error;
        return;
      }

      const hashParams = new URLSearchParams(response.url.split("#")[1] || "");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const session = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (session.error) throw session.error;
        return;
      }

      throw new Error("Unable to complete Google sign in.");
    },
    async completeSacredKey(sessionId, code) {
      return unlockSessionRecording(sessionId, code);
    },
    async recordSessionJoin(sessionId) {
      if (!userId) return;
      if (!supabase) {
        setSessionRegistrations((current) => current.some((item) => item.session_id === sessionId)
          ? current
          : [{
              id: "demo-session-registration-" + Date.now(),
              user_id: userId,
              session_id: sessionId,
              status: "registered",
              created_at: new Date().toISOString()
            }, ...current]);
        return;
      }
      await registerForSession(userId, sessionId);
      setSessionRegistrations(await listMySessionRegistrations(userId));
    },
    async updateProfile(patch) {
      if (!profile) return;
      const nextProfile = {
        ...profile,
        name: typeof patch.name === "string" ? patch.name : profile.name,
        phone: patch.phone === undefined ? profile.phone : patch.phone,
        city: patch.city === undefined ? profile.city : patch.city,
        state: patch.state === undefined ? profile.state : patch.state,
        date_of_birth: patch.date_of_birth === undefined ? profile.date_of_birth : patch.date_of_birth
      };
      if (!supabase) {
        if (!__DEV__) throw new Error("Sacred Circle profile service is not configured.");
        await AsyncStorage.setItem(DEMO_PROFILE, JSON.stringify(nextProfile));
        setProfile(nextProfile);
        return;
      }
      const saved = await updateMyProfile(profile.id, {
        name: nextProfile.name,
        phone: nextProfile.phone,
        city: nextProfile.city,
        state: nextProfile.state,
        date_of_birth: nextProfile.date_of_birth
      });
      setProfile({ ...saved, avatar_url: profile.avatar_url || null });
    },
    async deleteMyAccount() {
      if (!supabase) {
        if (!__DEV__) throw new Error("Sacred Circle account service is not configured.");
        await AsyncStorage.removeItem(DEMO_PROFILE);
        await AsyncStorage.removeItem(LEGACY_DEMO_UNLOCKS);
      } else {
        await deleteAccountFromRepository();
      }
      setUserId(null);
      setProfile(null);
      setSessionRegistrations([]);
      setAuthNotice("");
    },
    async signOut() {
      await AsyncStorage.removeItem(DEMO_PROFILE);
      await AsyncStorage.removeItem(LEGACY_DEMO_UNLOCKS);
      await supabase?.auth.signOut();
      setUserId(null);
      setProfile(null);
      setSessionRegistrations([]);
      setAuthNotice("");
    }
  }), [loading, userId, profile, sessionRegistrations, authNotice]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function authAvatarUrl(authUser: User) {
  const candidate = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture;
  if (typeof candidate !== "string") return null;
  const value = candidate.trim();
  return value.startsWith("https://") ? value : null;
}

function getAuthRedirectUrl() {
  const configured = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    // Web OAuth must always return to the same origin serving the app. This
    // avoids stale local ports or an old deployment URL sending people to a
    // site that is no longer reachable.
    return `${window.location.origin}/`;
  }
  if (configured && !isLocalHttpUrl(configured)) return configured;
  return Linking.createURL("auth/callback");
}

function isLocalHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ["localhost", "127.0.0.1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function isLocalDemoLogin(email?: string, password?: string) {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const normalizedEmail = (email || "").trim().toLowerCase();
  return isLocalhost && password === "sacred123" && ["demo@sacredcircle.com", "admin@sacredcircle.com", "demo@sacredcircle.local", "admin@sacredcircle.local"].includes(normalizedEmail);
}

let oauthCompletionPromise: Promise<string | null> | null = null;

async function completeOAuthFromCurrentUrl() {
  if (!supabase || Platform.OS !== "web" || typeof window === "undefined") return;
  if (oauthCompletionPromise) return oauthCompletionPromise;

  oauthCompletionPromise = (async () => {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const errorDescription =
      url.searchParams.get("error_description") ||
      hashParams.get("error_description") ||
      url.searchParams.get("error");

    try {
      if (errorDescription) return decodeURIComponent(errorDescription.replace(/\+/g, " "));

      const code = url.searchParams.get("code");
      if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        if (result.error) throw result.error;
        return null;
      }

      // Complete callbacks created by an older implicit-flow build so anyone
      // already in the middle of signing in is not stranded after this update.
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const result = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (result.error) throw result.error;
      }
      return null;
    } catch (err) {
      console.error("OAuth callback error:", err);
      return err instanceof Error
        ? `Google sign in could not be completed: ${err.message}`
        : "Google sign in could not be completed. Please try again.";
    } finally {
      cleanOAuthCallbackUrl();
      clearOAuthRedirectPending();
    }
  })();

  return oauthCompletionPromise;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
