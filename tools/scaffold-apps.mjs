import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function writeFile(filePath, content) {
  const fullPath = path.join(root, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trimStart());
}

const mobileFiles = {
  "apps/mobile/package.json": `
{
  "name": "@sacred-circle/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "App.tsx",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "latest",
    "@react-navigation/bottom-tabs": "latest",
    "@react-navigation/native": "latest",
    "@react-navigation/native-stack": "latest",
    "@sacred-circle/lib": "*",
    "@sacred-circle/ui": "*",
    "@supabase/supabase-js": "latest",
    "expo": "latest",
    "expo-av": "latest",
    "expo-constants": "latest",
    "expo-linear-gradient": "latest",
    "expo-linking": "latest",
    "expo-notifications": "latest",
    "expo-secure-store": "latest",
    "lucide-react-native": "latest",
    "react": "latest",
    "react-native": "latest",
    "react-native-gesture-handler": "latest",
    "react-native-reanimated": "latest",
    "react-native-safe-area-context": "latest",
    "react-native-screens": "latest",
    "react-native-svg": "latest",
    "react-native-url-polyfill": "latest"
  },
  "devDependencies": {
    "@types/react": "latest",
    "typescript": "^5.5.4"
  }
}
`,
  "apps/mobile/app.json": `
{
  "expo": {
    "name": "Sacred Circle",
    "slug": "sacred-circle",
    "scheme": "sacredcircle",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.sacredcircle.app"
    },
    "android": {
      "package": "com.sacredcircle.app",
      "adaptiveIcon": {
        "backgroundColor": "#050716"
      }
    },
    "extra": {
      "supabaseUrl": "$EXPO_PUBLIC_SUPABASE_URL",
      "supabaseAnonKey": "$EXPO_PUBLIC_SUPABASE_ANON_KEY",
      "whatsappGroupUrl": "$EXPO_PUBLIC_WHATSAPP_GROUP_URL",
      "youtubeChannelUrl": "$EXPO_PUBLIC_YOUTUBE_CHANNEL_URL",
      "eas": {
        "projectId": "$EXPO_PUBLIC_EAS_PROJECT_ID"
      }
    },
    "plugins": [
      "expo-notifications"
    ]
  }
}
`,
  "apps/mobile/babel.config.js": `
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"]
  };
};
`,
  "apps/mobile/metro.config.js": `
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules")
];

module.exports = config;
`,
  "apps/mobile/tsconfig.json": `
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["App.tsx", "src/**/*.ts", "src/**/*.tsx"]
}
`,
  "apps/mobile/App.tsx": `
import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";

import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AuthProvider>
  );
}
`,
  "apps/mobile/src/theme/index.ts": `
import { colors, radii, spacing } from "@sacred-circle/ui";

export { colors, radii, spacing };

export const shadows = {
  gold: {
    shadowColor: colors.sacredGold,
    shadowOpacity: 0.32,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  }
};

export const gradients = {
  sanctuary: [colors.deepNight, colors.cosmicNavy, colors.indigoSoul],
  gold: [colors.saffronGold, colors.sacredGold],
  violet: [colors.indigoSoul, colors.mysticViolet]
};
`,
  "apps/mobile/src/lib/supabase.ts": `
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const extra = Constants.expoConfig?.extra || {};
const supabaseUrl = (extra.supabaseUrl as string) || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = (extra.supabaseAnonKey as string) || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !String(supabaseUrl).includes("$"));

export const supabase = isSupabaseConfigured
  ? createClient(String(supabaseUrl), String(supabaseAnonKey), {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  : null;
`,
  "apps/mobile/src/services/repository.ts": `
import {
  demoAnnouncements,
  demoEvents,
  demoPrograms,
  demoResources,
  demoSessions,
  demoSettings,
  demoWeeklyKeys,
  type Announcement,
  type AppSetting,
  type HealingRequest,
  type Profile,
  type Program,
  type Resource,
  type SacredEvent,
  type Session
} from "@sacred-circle/lib";
import { supabase } from "../lib/supabase";

function fallback<T>(data: T[], error?: unknown) {
  if (error) console.warn("Using Sacred Circle demo data", error);
  return data;
}

export async function listSessions(): Promise<Session[]> {
  if (!supabase) return demoSessions;
  const { data, error } = await supabase.from("sessions").select("*").order("session_date", { ascending: true });
  return error || !data ? fallback(demoSessions, error) : (data as Session[]);
}

export async function listPrograms(): Promise<Program[]> {
  if (!supabase) return demoPrograms;
  const { data, error } = await supabase.from("programs").select("*").order("is_featured", { ascending: false });
  return error || !data ? fallback(demoPrograms, error) : (data as Program[]);
}

export async function listResources(): Promise<Resource[]> {
  if (!supabase) return demoResources;
  const { data, error } = await supabase.from("resources").select("*").order("display_order", { ascending: true });
  return error || !data ? fallback(demoResources, error) : (data as Resource[]);
}

export async function listEvents(): Promise<SacredEvent[]> {
  if (!supabase) return demoEvents;
  const { data, error } = await supabase.from("events").select("*").order("start_time", { ascending: true });
  return error || !data ? fallback(demoEvents, error) : (data as SacredEvent[]);
}

export async function listAnnouncements(): Promise<Announcement[]> {
  if (!supabase) return demoAnnouncements;
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return error || !data ? fallback(demoAnnouncements, error) : (data as Announcement[]);
}

export async function listSettings(): Promise<AppSetting[]> {
  if (!supabase) return demoSettings;
  const { data, error } = await supabase.from("app_settings").select("*");
  return error || !data ? fallback(demoSettings, error) : (data as AppSetting[]);
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
  if (!supabase) return profile as Profile;
  const { data, error } = await supabase.from("profiles").upsert(profile).select("*").single();
  if (error) throw error;
  return data as Profile;
}

export async function unlockWeeklyKey(code: string) {
  if (!supabase) {
    return demoWeeklyKeys.some((key) => key.key_code === code && key.is_active);
  }

  const { error } = await supabase.rpc("unlock_weekly_key", { p_key_code: code });
  if (error) return false;
  return true;
}

export async function hasCurrentKeyUnlock(userId: string) {
  if (!supabase) return false;
  const { data, error } = await supabase.from("user_key_unlocks").select("id").eq("user_id", userId).limit(1);
  return !error && Boolean(data?.length);
}

export async function registerForSession(userId: string, sessionId: string) {
  if (!supabase) return true;
  const { error } = await supabase.from("session_registrations").upsert({
    user_id: userId,
    session_id: sessionId,
    attendance_status: "registered"
  });
  if (error) throw error;
  return true;
}

export async function registerForEvent(input: {
  user_id: string;
  event_id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  participants_count?: number;
  note?: string;
}) {
  if (!supabase) return true;
  const { error } = await supabase.from("event_registrations").upsert({
    ...input,
    participants_count: input.participants_count || 1,
    status: "registered"
  });
  if (error) throw error;
  return true;
}

export async function submitHealingRequest(input: Omit<HealingRequest, "id" | "status">) {
  if (!supabase) return true;
  const { error } = await supabase.from("healing_requests").insert({ ...input, status: "new" });
  if (error) throw error;
  return true;
}

export async function updateDirectoryVisibility(userId: string, visible: boolean) {
  if (!supabase) return true;
  const { error } = await supabase.from("profiles").update({ show_in_directory: visible }).eq("id", userId);
  if (error) throw error;
  return true;
}

export async function listDirectoryMembers(): Promise<Profile[]> {
  if (!supabase) {
    return [
      {
        id: "90000000-0000-4000-8000-000000000001",
        name: "Aarav",
        email: "hidden@sacred.local",
        city: "Mumbai",
        bio: "Daily meditator exploring Brahm Vidya.",
        interests: ["Meditation", "Brahm Vidya"],
        role: "member",
        show_in_directory: true
      },
      {
        id: "90000000-0000-4000-8000-000000000002",
        name: "Meera",
        email: "hidden@sacred.local",
        city: "Bengaluru",
        bio: "Drawn to healing, chants, and gentle practice.",
        interests: ["Healing", "Chants"],
        role: "member",
        show_in_directory: true
      }
    ];
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,email,city,bio,interests,role,show_in_directory,avatar_url")
    .eq("show_in_directory", true)
    .order("name", { ascending: true });
  return error || !data ? [] : (data as Profile[]);
}
`,
  "apps/mobile/src/services/notifications.ts": `
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export async function requestNotificationPermissions() {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status === "granted";
}

export async function getExpoPushToken() {
  const allowed = await requestNotificationPermissions();
  if (!allowed) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId || process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId || String(projectId).includes("$")) return null;

  const token = await Notifications.getExpoPushTokenAsync({ projectId: String(projectId) });
  return token.data;
}

export async function scheduleSundayReminder(title: string, body: string, date: Date) {
  if (Platform.OS === "web") return null;
  const allowed = await requestNotificationPermissions();
  if (!allowed) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: date
  });
}
`,
  "apps/mobile/src/context/AuthContext.tsx": `
import AsyncStorage from "@react-native-async-storage/async-storage";
import { demoProfile, INTERESTS, type Profile } from "@sacred-circle/lib";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { hasCurrentKeyUnlock, getProfile, unlockWeeklyKey, upsertProfile } from "../services/repository";
import { supabase } from "../lib/supabase";

type AuthMode = "login" | "register";

interface AuthContextValue {
  loading: boolean;
  userId: string | null;
  profile: Profile | null;
  keyUnlocked: boolean;
  signInOrRegister: (mode: AuthMode, input: { name?: string; email: string; password: string; city?: string; phone?: string }) => Promise<void>;
  completeSacredKey: (code: string) => Promise<boolean>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_PROFILE = "sacred-circle-demo-profile";
const DEMO_KEY = "sacred-circle-demo-key-unlocked";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [keyUnlocked, setKeyUnlocked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      if (!supabase) {
        const stored = await AsyncStorage.getItem(DEMO_PROFILE);
        const unlocked = await AsyncStorage.getItem(DEMO_KEY);
        if (stored && mounted) {
          const parsed = JSON.parse(stored) as Profile;
          setUserId(parsed.id);
          setProfile(parsed);
          setKeyUnlocked(unlocked === "true");
        }
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const authUser = data.session?.user;
      if (authUser) {
        const loadedProfile = await getProfile(authUser.id);
        const unlocked = await hasCurrentKeyUnlock(authUser.id);
        if (mounted) {
          setUserId(authUser.id);
          setProfile(loadedProfile);
          setKeyUnlocked(unlocked);
        }
      }
      if (mounted) setLoading(false);
    }

    boot();
    const subscription = supabase?.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user;
      setUserId(authUser?.id || null);
      if (!authUser) {
        setProfile(null);
        setKeyUnlocked(false);
        return;
      }
      const loadedProfile = await getProfile(authUser.id);
      setProfile(loadedProfile);
      setKeyUnlocked(await hasCurrentKeyUnlock(authUser.id));
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
    keyUnlocked,
    async signInOrRegister(mode, input) {
      if (!supabase) {
        const nextProfile: Profile = {
          ...demoProfile,
          name: input.name || input.email.split("@")[0] || demoProfile.name,
          email: input.email,
          phone: input.phone || "",
          city: input.city || "Delhi NCR",
          interests: mode === "register" ? INTERESTS.slice(0, 4) : demoProfile.interests
        };
        await AsyncStorage.setItem(DEMO_PROFILE, JSON.stringify(nextProfile));
        await AsyncStorage.removeItem(DEMO_KEY);
        setUserId(nextProfile.id);
        setProfile(nextProfile);
        setKeyUnlocked(false);
        return;
      }

      if (mode === "register") {
        const result = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: { data: { name: input.name || input.email.split("@")[0] } }
        });
        if (result.error) throw result.error;
        const authUser = result.data.user;
        if (authUser) {
          const saved = await upsertProfile({
            id: authUser.id,
            email: input.email,
            name: input.name || input.email.split("@")[0],
            phone: input.phone || null,
            city: input.city || null,
            interests: INTERESTS.slice(0, 4),
            role: "user",
            show_in_directory: false
          });
          setUserId(authUser.id);
          setProfile(saved);
          setKeyUnlocked(false);
        }
        return;
      }

      const result = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password
      });
      if (result.error) throw result.error;
    },
    async completeSacredKey(code) {
      const ok = await unlockWeeklyKey(code);
      if (ok) {
        await AsyncStorage.setItem(DEMO_KEY, "true");
        setKeyUnlocked(true);
      }
      return ok;
    },
    async updateProfile(patch) {
      if (!profile) return;
      const nextProfile = { ...profile, ...patch };
      setProfile(nextProfile);
      if (!supabase) {
        await AsyncStorage.setItem(DEMO_PROFILE, JSON.stringify(nextProfile));
        return;
      }
      await upsertProfile(nextProfile);
    },
    async signOut() {
      await AsyncStorage.removeItem(DEMO_PROFILE);
      await AsyncStorage.removeItem(DEMO_KEY);
      await supabase?.auth.signOut();
      setUserId(null);
      setProfile(null);
      setKeyUnlocked(false);
    }
  }), [loading, userId, profile, keyUnlocked]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
`,
  "apps/mobile/src/components/Sacred.tsx": `
import { formatDuration, type Program, type Resource, type SacredEvent, type Session } from "@sacred-circle/lib";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CalendarDays, Circle, Clock, Headphones, Lock, Moon, Play, Sparkles, Star, Video } from "lucide-react-native";
import { colors, gradients, radii, shadows, spacing } from "../theme";

export function SacredGradientBackground({ children }: { children: ReactNode }) {
  return (
    <LinearGradient colors={gradients.sanctuary} style={styles.background}>
      <View style={styles.particleOne} />
      <View style={styles.particleTwo} />
      <View style={styles.moonGlow} />
      {children}
    </LinearGradient>
  );
}

export function SacredLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const logoSize = size === "lg" ? 112 : size === "sm" ? 54 : 78;
  return (
    <View style={styles.logoWrap}>
      <LinearGradient colors={gradients.gold} style={[styles.logoCircle, { width: logoSize, height: logoSize, borderRadius: logoSize / 2 }]}>
        <Circle color={colors.deepNight} size={logoSize * 0.58} strokeWidth={1.2} />
        <Sparkles color={colors.deepNight} size={logoSize * 0.25} style={styles.logoSpark} />
      </LinearGradient>
      <Text style={[styles.logoText, size === "lg" && styles.logoTextLarge]}>Sacred Circle</Text>
      <Text style={styles.logoTagline}>Brahm Vidya · Wisdom of Mahavatar Babaji</Text>
    </View>
  );
}

export function AppHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export function GlassCard({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

export function CreamCard({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.creamCard, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, disabled, icon }: { label: string; onPress?: () => void; disabled?: boolean; icon?: ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, disabled && styles.disabled]}>
      {icon}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function GoldButton({ label, onPress, disabled, icon }: { label: string; onPress?: () => void; disabled?: boolean; icon?: ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}>
      <LinearGradient colors={gradients.gold} style={styles.goldButton}>
        {icon}
        <Text style={styles.goldButtonText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function SpiritualIconBadge({ icon }: { icon?: ReactNode }) {
  return <View style={styles.iconBadge}>{icon || <Sparkles color={colors.saffronGold} size={16} />}</View>;
}

export function SacredKeyInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.keyRow}>
      {[0, 1, 2, 3].map((index) => (
        <View key={index} style={[styles.keyBox, value[index] && styles.keyBoxFilled]}>
          <Text style={styles.keyDigit}>{value[index] || ""}</Text>
        </View>
      ))}
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, "").slice(0, 4))}
        keyboardType="number-pad"
        maxLength={4}
        style={styles.hiddenInput}
        autoFocus
      />
    </View>
  );
}

export function SessionCard({ session, onPress, onRegister, onJoin }: { session: Session; onPress?: () => void; onRegister?: () => void; onJoin?: () => void }) {
  const date = new Date(session.session_date);
  return (
    <GlassCard style={styles.entityCard}>
      <Pressable onPress={onPress}>
        <View style={styles.cardTopRow}>
          <SpiritualIconBadge icon={<Video color={colors.saffronGold} size={16} />} />
          <Text style={styles.badgeText}>{session.category}</Text>
        </View>
        <Text style={styles.cardTitle}>{session.title}</Text>
        <Text style={styles.cardBody}>{session.description}</Text>
        <View style={styles.metaRow}>
          <CalendarDays color={colors.mutedIvory} size={14} />
          <Text style={styles.metaText}>{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
        </View>
        <View style={styles.buttonRow}>
          <PrimaryButton label="Register" onPress={onRegister} />
          {session.zoom_link ? <GoldButton label="Join Zoom" onPress={onJoin} /> : null}
        </View>
      </Pressable>
    </GlassCard>
  );
}

export function ProgramCard({ program, onPress }: { program: Program; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.programCard, pressed && styles.pressed]}>
      <LinearGradient colors={[colors.indigoSoul, colors.cosmicNavy]} style={styles.programGradient}>
        <Text style={styles.badgeText}>{program.category}</Text>
        <Text style={styles.cardTitle}>{program.title}</Text>
        <Text style={styles.cardBody}>{program.description}</Text>
        {program.access_type !== "public" ? <Text style={styles.lockedText}>Protected teaching</Text> : null}
      </LinearGradient>
    </Pressable>
  );
}

export function ResourceCard({ resource, locked, onPress }: { resource: Resource; locked?: boolean; onPress?: () => void }) {
  const Icon = resource.type === "audio" ? Headphones : resource.type === "youtube" ? Video : Star;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.resourceCard, pressed && styles.pressed]}>
      <View style={styles.cardTopRow}>
        <SpiritualIconBadge icon={locked ? <Lock color={colors.saffronGold} size={16} /> : <Icon color={colors.saffronGold} size={16} />} />
        <Text style={styles.badgeText}>{resource.type.toUpperCase()} · {resource.category}</Text>
      </View>
      <Text style={styles.cardTitle}>{resource.title}</Text>
      <Text style={styles.cardBody}>{locked ? "This sacred recording is available to participants with access." : resource.description}</Text>
      {resource.duration_seconds ? (
        <View style={styles.metaRow}>
          <Clock color={colors.mutedIvory} size={14} />
          <Text style={styles.metaText}>{formatDuration(resource.duration_seconds)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function EventCard({ event, onPress }: { event: SacredEvent; onPress?: () => void }) {
  const date = new Date(event.start_time);
  return (
    <CreamCard style={styles.eventCard}>
      <Pressable onPress={onPress}>
        <Text style={styles.lightBadge}>{event.event_type}</Text>
        <Text style={styles.lightTitle}>{event.title}</Text>
        <Text style={styles.lightBody}>{event.description}</Text>
        <Text style={styles.lightMeta}>{date.toLocaleDateString()} · {event.is_online ? "Online" : event.location || "Location shared after registration"}</Text>
      </Pressable>
    </CreamCard>
  );
}

export function QuoteCard() {
  return (
    <GlassCard>
      <View style={styles.cardTopRow}>
        <Moon color={colors.saffronGold} size={16} />
        <Text style={styles.badgeText}>Daily Prompt</Text>
      </View>
      <Text style={styles.quote}>Enter the practice gently. Let silence do the deeper work.</Text>
      <Text style={styles.quoteSource}>Sacred Circle Reflection</Text>
    </GlassCard>
  );
}

export function AudioPlayerMini({ resource, onPress }: { resource?: Resource; onPress?: () => void }) {
  if (!resource) return null;
  return (
    <Pressable onPress={onPress} style={styles.miniPlayer}>
      <View style={styles.playDot}><Play color={colors.deepNight} size={16} fill={colors.deepNight} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.miniTitle}>Continue listening</Text>
        <Text style={styles.miniSubtitle}>{resource.title}</Text>
      </View>
      <Text style={styles.metaText}>{formatDuration(resource.duration_seconds)}</Text>
    </Pressable>
  );
}

export function AnnouncementBanner({ title, message }: { title: string; message: string }) {
  return (
    <LinearGradient colors={[colors.sacredGold, colors.roseClay]} style={styles.announcement}>
      <Text style={styles.announcementTitle}>{title}</Text>
      <Text style={styles.announcementMessage}>{message}</Text>
    </LinearGradient>
  );
}

export function LoadingState({ label = "Preparing your sacred space..." }: { label?: string }) {
  return (
    <SacredGradientBackground>
      <View style={styles.center}>
        <ActivityIndicator color={colors.saffronGold} />
        <Text style={styles.loadingText}>{label}</Text>
      </View>
    </SacredGradientBackground>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <GlassCard style={styles.emptyState}>
      <Sparkles color={colors.saffronGold} size={22} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </GlassCard>
  );
}

export function ProfileInfoCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.profileInfo}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>{value || "Not added"}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.deepNight },
  particleOne: { position: "absolute", top: 90, right: 24, width: 5, height: 5, borderRadius: 4, backgroundColor: colors.saffronGold, opacity: 0.8 },
  particleTwo: { position: "absolute", top: 220, left: 38, width: 3, height: 3, borderRadius: 3, backgroundColor: colors.softLavender, opacity: 0.7 },
  moonGlow: { position: "absolute", top: -120, right: -90, width: 260, height: 260, borderRadius: 180, backgroundColor: "rgba(216,168,66,0.12)" },
  logoWrap: { alignItems: "center" },
  logoCircle: { alignItems: "center", justifyContent: "center", ...shadows.gold },
  logoSpark: { position: "absolute" },
  logoText: { marginTop: 18, color: colors.warmIvory, fontSize: 30, fontFamily: "Georgia", letterSpacing: 0 },
  logoTextLarge: { fontSize: 42 },
  logoTagline: { marginTop: 8, color: colors.mutedIvory, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.4, textAlign: "center" },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md },
  eyebrow: { color: colors.saffronGold, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 8 },
  headerTitle: { color: colors.warmIvory, fontSize: 34, fontFamily: "Georgia", lineHeight: 40 },
  headerSubtitle: { color: colors.mutedIvory, fontSize: 15, marginTop: 8, lineHeight: 22 },
  sectionTitleRow: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.warmIvory, fontSize: 22, fontFamily: "Georgia" },
  sectionAction: { color: colors.saffronGold, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2 },
  glassCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: "rgba(255,246,223,0.13)", backgroundColor: "rgba(255,255,255,0.07)", ...shadows.soft },
  creamCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: radii.lg, padding: spacing.lg, backgroundColor: colors.pureCream, ...shadows.soft },
  primaryButton: { minHeight: 44, borderRadius: radii.round, borderWidth: 1, borderColor: "rgba(241,199,91,0.38)", paddingHorizontal: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryButtonText: { color: colors.warmIvory, fontWeight: "700" },
  goldButton: { minHeight: 44, borderRadius: radii.round, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  goldButtonText: { color: colors.deepNight, fontWeight: "800" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.4 },
  iconBadge: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(216,168,66,0.12)", borderWidth: 1, borderColor: "rgba(216,168,66,0.24)" },
  keyRow: { height: 82, marginHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  keyBox: { width: 58, height: 66, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,246,223,0.2)", backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  keyBoxFilled: { borderColor: colors.saffronGold, backgroundColor: "rgba(216,168,66,0.16)" },
  keyDigit: { color: colors.warmIvory, fontSize: 28, fontWeight: "800" },
  hiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1 },
  entityCard: { overflow: "hidden" },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  badgeText: { color: colors.saffronGold, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.4, flexShrink: 1 },
  cardTitle: { color: colors.warmIvory, fontSize: 21, fontFamily: "Georgia", marginBottom: 8, lineHeight: 26 },
  cardBody: { color: colors.mutedIvory, fontSize: 14, lineHeight: 21 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  metaText: { color: colors.mutedIvory, fontSize: 12 },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" },
  programCard: { width: 280, marginLeft: spacing.lg, marginRight: spacing.sm, marginBottom: spacing.md },
  programGradient: { minHeight: 190, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: "rgba(255,246,223,0.11)" },
  lockedText: { color: colors.saffronGold, marginTop: 12, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.1 },
  resourceCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: radii.lg, padding: spacing.lg, backgroundColor: "rgba(255,255,255,0.075)", borderWidth: 1, borderColor: "rgba(255,246,223,0.12)" },
  eventCard: {},
  lightBadge: { color: colors.roseClay, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.3, marginBottom: 8 },
  lightTitle: { color: colors.charcoal, fontSize: 22, fontFamily: "Georgia", marginBottom: 8 },
  lightBody: { color: "#4B4034", lineHeight: 21 },
  lightMeta: { color: colors.charcoal, fontWeight: "700", marginTop: 12 },
  quote: { color: colors.warmIvory, fontFamily: "Georgia", fontSize: 24, lineHeight: 32 },
  quoteSource: { color: colors.mutedIvory, marginTop: 14, fontSize: 12 },
  miniPlayer: { marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: radii.round, padding: 12, paddingRight: 16, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(241,199,91,0.18)", flexDirection: "row", alignItems: "center", gap: 12 },
  playDot: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.saffronGold, alignItems: "center", justifyContent: "center" },
  miniTitle: { color: colors.saffronGold, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 },
  miniSubtitle: { color: colors.warmIvory, fontWeight: "700", marginTop: 2 },
  announcement: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg, borderRadius: radii.lg },
  announcementTitle: { color: colors.deepNight, fontWeight: "900", fontSize: 16 },
  announcementMessage: { color: colors.deepNight, marginTop: 5, lineHeight: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  loadingText: { color: colors.mutedIvory, marginTop: 14 },
  emptyState: { alignItems: "flex-start" },
  profileInfo: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,246,223,0.1)" },
  profileLabel: { color: colors.saffronGold, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 },
  profileValue: { color: colors.warmIvory, marginTop: 5, fontSize: 16 }
});
`,
  "apps/mobile/src/screens/AuthScreens.tsx": `
import { DISCLAIMER, INTERESTS } from "@sacred-circle/lib";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { LockKeyhole, Mail, Sparkles } from "lucide-react-native";
import { AppHeader, GoldButton, PrimaryButton, SacredGradientBackground, SacredKeyInput, SacredLogo, styles as sacredStyles } from "../components/Sacred";
import { useAuth } from "../context/AuthContext";
import { colors, gradients, radii, spacing } from "../theme";

export function SplashScreenView() {
  const glow = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.45, duration: 1600, useNativeDriver: true })
      ])
    ).start();
  }, [glow]);

  return (
    <SacredGradientBackground>
      <View style={local.center}>
        <Animated.View style={{ opacity: glow, transform: [{ scale: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.96, 1.04] }) }] }}>
          <SacredLogo size="lg" />
        </Animated.View>
      </View>
    </SacredGradientBackground>
  );
}

const onboarding = [
  {
    title: "Enter a Sacred Digital Sanctuary",
    body: "A calm space for meditation, healing, manifestation, Brahm Vidya, and spiritual awakening."
  },
  {
    title: "Join Sunday Satsang and Meditation",
    body: "Register for weekly sessions and open Zoom externally when the circle begins."
  },
  {
    title: "Unlock Protected Teachings",
    body: "Use the weekly Sacred Key to access meditations, wisdom recordings, and participant resources."
  },
  {
    title: "Continue Your Practice",
    body: "Return to audio, notes, Shivirs, reminders, and community support from one sanctuary."
  }
];

export function OnboardingScreen({ navigation }: any) {
  const [index, setIndex] = useState(0);
  const item = onboarding[index];
  return (
    <SacredGradientBackground>
      <View style={local.onboarding}>
        <SacredLogo />
        <View style={local.orbit}>
          <LinearGradient colors={gradients.gold} style={local.orbitCenter}>
            <Sparkles color={colors.deepNight} size={32} />
          </LinearGradient>
        </View>
        <Text style={local.onboardingTitle}>{item.title}</Text>
        <Text style={local.onboardingBody}>{item.body}</Text>
        <View style={local.dots}>
          {onboarding.map((_, dotIndex) => <View key={dotIndex} style={[local.dot, dotIndex === index && local.dotActive]} />)}
        </View>
        <GoldButton label={index === onboarding.length - 1 ? "Begin" : "Continue"} onPress={() => index === onboarding.length - 1 ? navigation.navigate("Auth") : setIndex(index + 1)} />
        <Text style={local.disclaimer}>{DISCLAIMER}</Text>
      </View>
    </SacredGradientBackground>
  );
}

export function AuthScreen() {
  const { signInOrRegister } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setBusy(true);
    try {
      await signInOrRegister(mode, { name, email, password, city, phone });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to enter Sacred Circle right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SacredGradientBackground>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={local.authContent}>
          <SacredLogo />
          <AppHeader eyebrow="Member access" title={mode === "register" ? "Create your sanctuary profile" : "Welcome back"} subtitle="Use email access to continue into the Sacred Circle app." />
          <View style={local.modeRow}>
            <Pressable onPress={() => setMode("register")} style={[local.modePill, mode === "register" && local.modeActive]}><Text style={local.modeText}>Register</Text></Pressable>
            <Pressable onPress={() => setMode("login")} style={[local.modePill, mode === "login" && local.modeActive]}><Text style={local.modeText}>Login</Text></Pressable>
          </View>
          <View style={local.form}>
            {mode === "register" ? <Field label="Full name" value={name} onChangeText={setName} /> : null}
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" icon={<Mail color={colors.saffronGold} size={16} />} />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry icon={<LockKeyhole color={colors.saffronGold} size={16} />} />
            {mode === "register" ? (
              <>
                <Field label="City optional" value={city} onChangeText={setCity} />
                <Field label="Phone optional" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <Text style={local.interestsTitle}>Interests included</Text>
                <View style={local.chips}>{INTERESTS.slice(0, 7).map((interest) => <Text key={interest} style={local.chip}>{interest}</Text>)}</View>
              </>
            ) : null}
            {error ? <Text style={local.error}>{error}</Text> : null}
            <GoldButton label={busy ? "Opening..." : mode === "register" ? "Create Profile" : "Enter"} onPress={submit} disabled={!email || !password || busy} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SacredGradientBackground>
  );
}

function Field(props: any) {
  return (
    <View style={local.field}>
      <View style={local.fieldIcon}>{props.icon}</View>
      <TextInput
        {...props}
        placeholder={props.label}
        placeholderTextColor={colors.mutedIvory}
        style={local.input}
        autoCapitalize="none"
      />
    </View>
  );
}

export function SacredKeyScreen() {
  const { completeSacredKey } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function unlock() {
    setError("");
    const ok = await completeSacredKey(code);
    if (!ok) {
      setError("The Sacred Key does not match this week’s access. Please check the key shared by the Sacred Circle team.");
      return;
    }
    setSuccess(true);
  }

  return (
    <SacredGradientBackground>
      <View style={local.keyScreen}>
        <SacredLogo />
        <View style={local.keyMandala}>
          <LinearGradient colors={success ? gradients.gold : gradients.violet} style={local.keyInner}>
            <Sparkles color={success ? colors.deepNight : colors.warmIvory} size={44} />
          </LinearGradient>
        </View>
        <Text style={local.keyTitle}>{success ? "Sacred Space Unlocked" : "Enter this week’s Sacred Key"}</Text>
        <Text style={local.keyBody}>Protected teachings open only for logged-in seekers with the current weekly access.</Text>
        <SacredKeyInput value={code} onChange={setCode} />
        {error ? <Text style={local.error}>{error}</Text> : null}
        <GoldButton label="Unlock Sacred Space" onPress={unlock} disabled={code.length !== 4 || success} />
      </View>
    </SacredGradientBackground>
  );
}

const local = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  onboarding: { flex: 1, padding: spacing.lg, justifyContent: "center" },
  orbit: { alignSelf: "center", width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: "rgba(241,199,91,0.24)", alignItems: "center", justifyContent: "center", marginVertical: spacing.xl },
  orbitCenter: { width: 98, height: 98, borderRadius: 49, alignItems: "center", justifyContent: "center" },
  onboardingTitle: { color: colors.warmIvory, fontSize: 36, fontFamily: "Georgia", textAlign: "center", lineHeight: 42 },
  onboardingBody: { color: colors.mutedIvory, textAlign: "center", fontSize: 16, lineHeight: 24, marginTop: spacing.md, marginBottom: spacing.lg },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,246,223,0.25)" },
  dotActive: { width: 22, backgroundColor: colors.saffronGold },
  disclaimer: { color: colors.mutedIvory, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: spacing.lg },
  authContent: { paddingBottom: 40 },
  modeRow: { flexDirection: "row", marginHorizontal: spacing.lg, padding: 4, borderRadius: radii.round, backgroundColor: "rgba(255,255,255,0.08)", marginBottom: spacing.md },
  modePill: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: radii.round },
  modeActive: { backgroundColor: "rgba(216,168,66,0.22)" },
  modeText: { color: colors.warmIvory, fontWeight: "800" },
  form: { marginHorizontal: spacing.lg, gap: 12 },
  field: { minHeight: 54, borderRadius: radii.md, borderWidth: 1, borderColor: "rgba(255,246,223,0.13)", backgroundColor: "rgba(255,255,255,0.07)", flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  fieldIcon: { width: 24, alignItems: "center" },
  input: { color: colors.warmIvory, flex: 1, fontSize: 16 },
  interestsTitle: { color: colors.saffronGold, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.3, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { color: colors.warmIvory, borderColor: "rgba(241,199,91,0.28)", borderWidth: 1, borderRadius: radii.round, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12 },
  error: { color: "#FFD2CC", lineHeight: 20, marginHorizontal: spacing.lg, textAlign: "center" },
  keyScreen: { flex: 1, justifyContent: "center", padding: spacing.lg },
  keyMandala: { width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: "rgba(241,199,91,0.25)", alignSelf: "center", alignItems: "center", justifyContent: "center", marginTop: spacing.xl },
  keyInner: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  keyTitle: { color: colors.warmIvory, fontFamily: "Georgia", fontSize: 32, textAlign: "center", marginTop: spacing.xl, lineHeight: 38 },
  keyBody: { color: colors.mutedIvory, textAlign: "center", lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.md }
});
`,
  "apps/mobile/src/screens/MainScreens.tsx": `
import { AUDIO_CATEGORIES, DISCLAIMER, canAccessResource, formatDuration, type Program, type Resource, type SacredEvent, type Session } from "@sacred-circle/lib";
import { Audio } from "expo-av";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Bell, BookOpen, CalendarPlus, Download, HeartHandshake, LogOut, MessageCircle, Pause, Play, Search, Users } from "lucide-react-native";
import {
  AnnouncementBanner,
  AppHeader,
  AudioPlayerMini,
  CreamCard,
  EmptyState,
  EventCard,
  GlassCard,
  GoldButton,
  PrimaryButton,
  ProfileInfoCard,
  ProgramCard,
  QuoteCard,
  ResourceCard,
  SacredGradientBackground,
  SectionTitle,
  SessionCard
} from "../components/Sacred";
import { useAuth } from "../context/AuthContext";
import { colors, radii, spacing } from "../theme";
import {
  listAnnouncements,
  listDirectoryMembers,
  listEvents,
  listPrograms,
  listResources,
  listSessions,
  registerForEvent,
  registerForSession,
  submitHealingRequest
} from "../services/repository";
import { requestNotificationPermissions, scheduleSundayReminder } from "../services/notifications";

export function HomeScreen({ navigation }: any) {
  const { profile, keyUnlocked, userId } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [events, setEvents] = useState<SacredEvent[]>([]);
  const [announcement, setAnnouncement] = useState<any>(null);

  useEffect(() => {
    Promise.all([listSessions(), listResources(), listPrograms(), listEvents(), listAnnouncements()]).then(([s, r, p, e, a]) => {
      setSessions(s);
      setResources(r);
      setPrograms(p);
      setEvents(e);
      setAnnouncement(a[0]);
    });
  }, []);

  const nextSession = sessions.find((session) => session.status === "upcoming") || sessions[0];
  const latestAudio = resources.find((resource) => resource.type === "audio");
  const featuredProgram = programs.find((program) => program.is_featured) || programs[0];
  const upcomingEvent = events[0];

  async function register(session: Session) {
    if (!userId) return;
    await registerForSession(userId, session.id);
    Alert.alert("Registered", "You are registered for this Sacred Circle session.");
  }

  return (
    <SacredGradientBackground>
      <ScrollView contentContainerStyle={local.scrollBottom}>
        <AppHeader eyebrow="Sacred Circle" title={"Namaste, " + (profile?.name || "Seeker")} subtitle="Welcome back to your sacred space" />
        {announcement ? <AnnouncementBanner title={announcement.title} message={announcement.message} /> : null}
        {nextSession ? (
          <>
            <SectionTitle title="Next Sunday Session" action="Zoom ready" />
            <SessionCard
              session={nextSession}
              onPress={() => navigation.navigate("SessionDetail", { session: nextSession })}
              onRegister={() => register(nextSession)}
              onJoin={() => nextSession.zoom_link && Linking.openURL(nextSession.zoom_link)}
            />
          </>
        ) : null}
        <GlassCard>
          <Text style={local.statusLabel}>Sacred Key Status</Text>
          <Text style={local.statusTitle}>{keyUnlocked ? "Unlocked for this week" : "Locked for protected teachings"}</Text>
          <Text style={local.statusBody}>{keyUnlocked ? "Protected recordings and notes are available according to your access." : "Enter the weekly Sacred Key shared by the Sacred Circle team."}</Text>
        </GlassCard>
        <QuoteCard />
        <AudioPlayerMini resource={latestAudio} onPress={() => latestAudio && navigation.navigate("AudioPlayer", { resource: latestAudio })} />
        {featuredProgram ? (
          <>
            <SectionTitle title="Featured Program" />
            <ProgramCard program={featuredProgram} onPress={() => navigation.navigate("ProgramDetail", { program: featuredProgram })} />
          </>
        ) : null}
        {resources[2] ? <ResourceCard resource={resources[2]} locked={!keyUnlocked && resources[2].access_type !== "public"} onPress={() => navigation.navigate("ResourceDetail", { resource: resources[2] })} /> : null}
        {upcomingEvent ? (
          <>
            <SectionTitle title="Upcoming Shivir" />
            <EventCard event={upcomingEvent} onPress={() => navigation.navigate("EventDetail", { event: upcomingEvent })} />
          </>
        ) : null}
        <View style={local.actionGrid}>
          <PrimaryButton label="WhatsApp Group" icon={<MessageCircle color={colors.warmIvory} size={16} />} onPress={() => Linking.openURL(process.env.EXPO_PUBLIC_WHATSAPP_GROUP_URL || "https://wa.me/")} />
          <PrimaryButton label="YouTube Channel" icon={<BookOpen color={colors.warmIvory} size={16} />} onPress={() => Linking.openURL(process.env.EXPO_PUBLIC_YOUTUBE_CHANNEL_URL || "https://www.youtube.com/@sacredcirclegroup")} />
        </View>
      </ScrollView>
    </SacredGradientBackground>
  );
}

export function SessionsScreen({ navigation }: any) {
  const { userId } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState("upcoming");

  useEffect(() => {
    listSessions().then(setSessions);
  }, []);

  const visible = sessions.filter((session) => filter === "all" || session.status === filter);

  async function register(session: Session) {
    if (!userId) return;
    await registerForSession(userId, session.id);
    Alert.alert("Registration complete", "We saved your session registration.");
  }

  return (
    <SacredGradientBackground>
      <ScrollView contentContainerStyle={local.scrollBottom}>
        <AppHeader eyebrow="Sessions" title="Sunday Satsang and Classes" subtitle="Register, join Zoom externally, and revisit unlocked recordings." />
        <Segment options={["upcoming", "completed", "all"]} value={filter} onChange={setFilter} />
        {visible.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onPress={() => navigation.navigate("SessionDetail", { session })}
            onRegister={() => register(session)}
            onJoin={() => session.zoom_link && Linking.openURL(session.zoom_link)}
          />
        ))}
        {!visible.length ? <EmptyState title="No sessions here yet" body="The Sacred Circle team can publish new sessions from admin." /> : null}
      </ScrollView>
    </SacredGradientBackground>
  );
}

export function LibraryScreen({ navigation }: any) {
  const { keyUnlocked } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    listResources().then(setResources);
    listPrograms().then(setPrograms);
  }, []);

  const filtered = resources.filter((resource) => {
    const queryMatch = !query || (resource.title + resource.description + resource.category).toLowerCase().includes(query.toLowerCase());
    const categoryMatch = category === "All" || resource.category === category;
    return queryMatch && categoryMatch;
  });

  return (
    <SacredGradientBackground>
      <ScrollView contentContainerStyle={local.scrollBottom}>
        <AppHeader eyebrow="Library" title="Audio and Resources" subtitle="Meditations, PDFs, YouTube teachings, notes, and protected recordings." />
        <View style={local.searchBox}>
          <Search color={colors.saffronGold} size={18} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search sacred resources" placeholderTextColor={colors.mutedIvory} style={local.searchInput} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.categoryRow}>
          {["All", ...AUDIO_CATEGORIES].map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[local.categoryPill, category === item && local.categoryActive]}>
              <Text style={local.categoryText}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <SectionTitle title="Programs" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {programs.map((program) => <ProgramCard key={program.id} program={program} onPress={() => navigation.navigate("ProgramDetail", { program })} />)}
        </ScrollView>
        <SectionTitle title="Resources" action={String(filtered.length)} />
        {filtered.map((resource) => {
          const locked = !canAccessResource(resource, { unlockedWeeklyKeyIds: keyUnlocked && resource.required_weekly_key_id ? [resource.required_weekly_key_id] : [] });
          return <ResourceCard key={resource.id} resource={resource} locked={locked} onPress={() => navigation.navigate("ResourceDetail", { resource, locked })} />;
        })}
      </ScrollView>
    </SacredGradientBackground>
  );
}

export function EventsScreen({ navigation }: any) {
  const [events, setEvents] = useState<SacredEvent[]>([]);
  useEffect(() => {
    listEvents().then(setEvents);
  }, []);
  return (
    <SacredGradientBackground>
      <ScrollView contentContainerStyle={local.scrollBottom}>
        <AppHeader eyebrow="Events and Shivirs" title="Gatherings for Practice" subtitle="Register for Shivirs, workshops, retreats, temple visits, and online meditations." />
        {events.map((event) => <EventCard key={event.id} event={event} onPress={() => navigation.navigate("EventDetail", { event })} />)}
      </ScrollView>
    </SacredGradientBackground>
  );
}

export function ProfileScreen({ navigation }: any) {
  const { profile, keyUnlocked, updateProfile, signOut } = useAuth();
  const [visible, setVisible] = useState(Boolean(profile?.show_in_directory));

  async function toggle(value: boolean) {
    setVisible(value);
    await updateProfile({ show_in_directory: value });
  }

  return (
    <SacredGradientBackground>
      <ScrollView contentContainerStyle={local.scrollBottom}>
        <AppHeader eyebrow="Profile" title={profile?.name || "Sacred Seeker"} subtitle="Your member access, saved practice, privacy, and support." />
        <GlassCard>
          <ProfileInfoCard label="Email" value={profile?.email} />
          <ProfileInfoCard label="Phone" value={profile?.phone} />
          <ProfileInfoCard label="City" value={profile?.city} />
          <ProfileInfoCard label="Sacred Key" value={keyUnlocked ? "Unlocked this week" : "Locked"} />
          <View style={local.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={local.toggleTitle}>Appear in member directory</Text>
              <Text style={local.toggleText}>Your phone and email stay hidden by default.</Text>
            </View>
            <Switch value={visible} onValueChange={toggle} thumbColor={colors.saffronGold} />
          </View>
        </GlassCard>
        <View style={local.profileActions}>
          <PrimaryButton label="Member Directory" icon={<Users color={colors.warmIvory} size={16} />} onPress={() => navigation.navigate("Directory")} />
          <PrimaryButton label="Healing Request" icon={<HeartHandshake color={colors.warmIvory} size={16} />} onPress={() => navigation.navigate("HealingRequest")} />
          <PrimaryButton label="Notifications" icon={<Bell color={colors.warmIvory} size={16} />} onPress={async () => requestNotificationPermissions()} />
          <PrimaryButton label="Logout" icon={<LogOut color={colors.warmIvory} size={16} />} onPress={signOut} />
        </View>
        <Text style={local.disclaimer}>{DISCLAIMER}</Text>
      </ScrollView>
    </SacredGradientBackground>
  );
}

export function SessionDetailScreen({ route }: any) {
  const session: Session = route.params.session;
  return (
    <SacredGradientBackground>
      <ScrollView contentContainerStyle={local.scrollBottom}>
        <AppHeader eyebrow={session.category} title={session.title} subtitle={session.description} />
        <GlassCard>
          <ProfileInfoCard label="Guide" value={session.guide_name} />
          <ProfileInfoCard label="Date" value={new Date(session.session_date).toLocaleString()} />
          <ProfileInfoCard label="Duration" value={session.duration_minutes ? String(session.duration_minutes) + " minutes" : "To be announced"} />
          <View style={local.actionStack}>
            {session.zoom_link ? <GoldButton label="Join Zoom" onPress={() => Linking.openURL(session.zoom_link!)} /> : null}
            <PrimaryButton label="Add Reminder" icon={<CalendarPlus color={colors.warmIvory} size={16} />} onPress={() => scheduleSundayReminder(session.title, "Your Sacred Circle session begins soon.", new Date(session.session_date))} />
          </View>
        </GlassCard>
      </ScrollView>
    </SacredGradientBackground>
  );
}

export function ResourceDetailScreen({ route, navigation }: any) {
  const resource: Resource = route.params.resource;
  const locked = Boolean(route.params.locked);
  return (
    <SacredGradientBackground>
      <ScrollView contentContainerStyle={local.scrollBottom}>
        <AppHeader eyebrow={resource.category} title={resource.title} subtitle={locked ? "This sacred recording is available to participants with access." : resource.description} />
        <GlassCard>
          <ProfileInfoCard label="Type" value={resource.type} />
          <ProfileInfoCard label="Access" value={locked ? "Protected" : resource.access_type} />
          <ProfileInfoCard label="Duration" value={formatDuration(resource.duration_seconds)} />
          {locked ? (
            <Text style={local.lockedMessage}>This sacred recording is available to participants with access.</Text>
          ) : (
            <View style={local.actionStack}>
              {resource.type === "audio" ? <GoldButton label="Open Audio Player" icon={<Play color={colors.deepNight} size={16} />} onPress={() => navigation.navigate("AudioPlayer", { resource })} /> : null}
              {resource.youtube_url ? <GoldButton label="Open YouTube" onPress={() => Linking.openURL(resource.youtube_url!)} /> : null}
              {resource.external_url ? <PrimaryButton label="Open Resource" icon={<Download color={colors.warmIvory} size={16} />} onPress={() => Linking.openURL(resource.external_url!)} /> : null}
            </View>
          )}
        </GlassCard>
      </ScrollView>
    </SacredGradientBackground>
  );
}

export function AudioPlayerScreen({ route }: any) {
  const resource: Resource = route.params.resource;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  async function toggle() {
    if (!resource.file_url) {
      Alert.alert("Audio unavailable", "The audio URL is not attached yet.");
      return;
    }
    if (!sound) {
      const created = await Audio.Sound.createAsync({ uri: resource.file_url }, { shouldPlay: true });
      setSound(created.sound);
      setPlaying(true);
      return;
    }
    if (playing) {
      await sound.pauseAsync();
      setPlaying(false);
    } else {
      await sound.playAsync();
      setPlaying(true);
    }
  }

  return (
    <SacredGradientBackground>
      <View style={local.playerScreen}>
        <View style={local.playerDisc}>
          {playing ? <Pause color={colors.deepNight} size={46} /> : <Play color={colors.deepNight} size={46} fill={colors.deepNight} />}
        </View>
        <Text style={local.playerTitle}>{resource.title}</Text>
        <Text style={local.playerBody}>{resource.description}</Text>
        <Text style={local.playerDuration}>{formatDuration(resource.duration_seconds)}</Text>
        <GoldButton label={playing ? "Pause Practice" : "Begin Practice"} onPress={toggle} />
      </View>
    </SacredGradientBackground>
  );
}

export function ProgramDetailScreen({ route }: any) {
  const program: Program = route.params.program;
  const [resources, setResources] = useState<Resource[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => {
    listResources().then((items) => setResources(items.filter((resource) => resource.program_id === program.id)));
    listSessions().then(setSessions);
  }, [program.id]);
  return (
    <SacredGradientBackground>
      <ScrollView contentContainerStyle={local.scrollBottom}>
        <AppHeader eyebrow={program.category} title={program.title} subtitle={program.description} />
        <CreamCard>
          <Text style={local.lightTitle}>What you will practice</Text>
          <Text style={local.lightBody}>Silence, breath awareness, inner alignment, reflection, chanting where relevant, and practical integration for daily life.</Text>
        </CreamCard>
        <SectionTitle title="Related Resources" />
        {resources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
        <SectionTitle title="Related Sessions" />
        {sessions.slice(0, 2).map((session) => <SessionCard key={session.id} session={session} />)}
      </ScrollView>
    </SacredGradientBackground>
  );
}

export function EventDetailScreen({ route }: any) {
  const { userId, profile } = useAuth();
  const event: SacredEvent = route.params.event;
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [city, setCity] = useState(profile?.city || "");
  const [note, setNote] = useState("");

  async function submit() {
    if (!userId) return;
    await registerForEvent({ user_id: userId, event_id: event.id, name, email, phone, city, note });
    Alert.alert("Registration received", "The Sacred Circle team can view this registration in admin.");
  }

  return (
    <SacredGradientBackground>
      <ScrollView contentContainerStyle={local.scrollBottom}>
        <AppHeader eyebrow={event.event_type} title={event.title} subtitle={event.description} />
        <CreamCard>
          <Text style={local.lightMeta}>{new Date(event.start_time).toLocaleString()}</Text>
          <Text style={local.lightBody}>{event.is_online ? "Online gathering" : event.location || "Location shared after registration"}</Text>
          {event.price_amount ? <Text style={local.lightMeta}>Donation: ₹{event.price_amount}</Text> : <Text style={local.lightMeta}>Donation optional</Text>}
        </CreamCard>
        <FormCard title="Register for this event">
          <LightInput label="Name" value={name} onChangeText={setName} />
          <LightInput label="Email" value={email} onChangeText={setEmail} />
          <LightInput label="Phone" value={phone} onChangeText={setPhone} />
          <LightInput label="City" value={city} onChangeText={setCity} />
          <LightInput label="Special note" value={note} onChangeText={setNote} multiline />
          <GoldButton label="Submit Registration" onPress={submit} disabled={!name || !email} />
        </FormCard>
      </ScrollView>
    </SacredGradientBackground>
  );
}

export function DirectoryScreen() {
  const [members, setMembers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    listDirectoryMembers().then(setMembers);
  }, []);
  const filtered = members.filter((member) => !query || (member.name + member.city + member.interests.join(" ")).toLowerCase().includes(query.toLowerCase()));
  return (
    <SacredGradientBackground>
      <ScrollView contentContainerStyle={local.scrollBottom}>
        <AppHeader eyebrow="Community" title="Member Directory" subtitle="Privacy-first member discovery. Email and phone stay hidden." />
        <View style={local.searchBox}>
          <Search color={colors.saffronGold} size={18} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search city or interest" placeholderTextColor={colors.mutedIvory} style={local.searchInput} />
        </View>
        {filtered.map((member) => (
          <GlassCard key={member.id}>
            <Text style={local.memberName}>{member.name}</Text>
            <Text style={local.memberMeta}>{member.city || "Sacred Circle member"}</Text>
            <Text style={local.memberBio}>{member.bio}</Text>
            <View style={local.chipRow}>{member.interests.map((interest: string) => <Text key={interest} style={local.darkChip}>{interest}</Text>)}</View>
          </GlassCard>
        ))}
      </ScrollView>
    </SacredGradientBackground>
  );
}

export function HealingRequestScreen() {
  const { userId, profile } = useAuth();
  const [category, setCategory] = useState("Healing");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const categories = ["Healing", "Stress/Anxiety", "Relationship", "Career/Life Direction", "Family", "Spiritual Guidance", "Other"];

  async function submit() {
    if (!profile || !consent) return;
    await submitHealingRequest({
      user_id: userId,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      category,
      message,
      consent
    });
    Alert.alert("Request received", "The Sacred Circle team will review this with care.");
    setMessage("");
  }

  return (
    <SacredGradientBackground>
      <ScrollView contentContainerStyle={local.scrollBottom}>
        <AppHeader eyebrow="Support" title="Healing Request" subtitle="Share what kind of spiritual support or meditation guidance you are seeking." />
        <FormCard title="Request details">
          <Segment options={categories} value={category} onChange={setCategory} />
          <LightInput label="Message" value={message} onChangeText={setMessage} multiline />
          <Pressable style={local.consentRow} onPress={() => setConsent(!consent)}>
            <View style={[local.checkbox, consent && local.checkboxActive]} />
            <Text style={local.consentText}>I understand Sacred Circle offers spiritual support and meditation guidance, not medical or psychological treatment.</Text>
          </Pressable>
          <GoldButton label="Submit Request" onPress={submit} disabled={!message || !consent} />
        </FormCard>
      </ScrollView>
    </SacredGradientBackground>
  );
}

function Segment({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.segmentRow}>
      {options.map((option) => (
        <Pressable key={option} onPress={() => onChange(option)} style={[local.segmentPill, value === option && local.segmentActive]}>
          <Text style={local.segmentText}>{option}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <CreamCard>
      <Text style={local.formTitle}>{title}</Text>
      <View style={local.formStack}>{children}</View>
    </CreamCard>
  );
}

function LightInput(props: any) {
  return (
    <TextInput
      {...props}
      placeholder={props.label}
      placeholderTextColor="#776B5C"
      style={[local.lightInput, props.multiline && local.lightInputMulti]}
    />
  );
}

const local = StyleSheet.create({
  scrollBottom: { paddingBottom: 120 },
  actionGrid: { marginHorizontal: spacing.lg, gap: 10, marginTop: 4 },
  statusLabel: { color: colors.saffronGold, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.3 },
  statusTitle: { color: colors.warmIvory, fontSize: 24, fontFamily: "Georgia", marginTop: 8 },
  statusBody: { color: colors.mutedIvory, marginTop: 8, lineHeight: 21 },
  searchBox: { marginHorizontal: spacing.lg, minHeight: 54, borderRadius: radii.round, borderWidth: 1, borderColor: "rgba(241,199,91,0.2)", backgroundColor: "rgba(255,255,255,0.08)", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, marginBottom: spacing.md },
  searchInput: { flex: 1, color: colors.warmIvory, fontSize: 15 },
  categoryRow: { paddingHorizontal: spacing.lg, gap: 8, paddingBottom: spacing.md },
  categoryPill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.round, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,246,223,0.08)" },
  categoryActive: { backgroundColor: "rgba(216,168,66,0.24)", borderColor: colors.saffronGold },
  categoryText: { color: colors.warmIvory, fontWeight: "700", fontSize: 12 },
  profileActions: { marginHorizontal: spacing.lg, gap: 10 },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingTop: 14 },
  toggleTitle: { color: colors.warmIvory, fontWeight: "800", fontSize: 16 },
  toggleText: { color: colors.mutedIvory, lineHeight: 20, marginTop: 3 },
  disclaimer: { color: colors.mutedIvory, margin: spacing.lg, lineHeight: 18, fontSize: 11, textAlign: "center" },
  actionStack: { gap: 12, marginTop: spacing.lg },
  lockedMessage: { color: colors.saffronGold, lineHeight: 21, marginTop: spacing.md },
  playerScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  playerDisc: { width: 220, height: 220, borderRadius: 110, backgroundColor: colors.saffronGold, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  playerTitle: { color: colors.warmIvory, fontFamily: "Georgia", fontSize: 32, textAlign: "center", lineHeight: 38 },
  playerBody: { color: colors.mutedIvory, textAlign: "center", lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.lg },
  playerDuration: { color: colors.saffronGold, marginBottom: spacing.lg },
  lightTitle: { color: colors.charcoal, fontFamily: "Georgia", fontSize: 24, marginBottom: 8 },
  lightBody: { color: "#4B4034", lineHeight: 22 },
  lightMeta: { color: colors.charcoal, fontWeight: "800", marginTop: 8 },
  formTitle: { color: colors.charcoal, fontFamily: "Georgia", fontSize: 24, marginBottom: spacing.md },
  formStack: { gap: 12 },
  lightInput: { minHeight: 50, color: colors.charcoal, backgroundColor: "rgba(255,255,255,0.55)", borderRadius: radii.md, borderWidth: 1, borderColor: "rgba(38,30,22,0.12)", paddingHorizontal: 14 },
  lightInputMulti: { minHeight: 110, textAlignVertical: "top", paddingTop: 12 },
  segmentRow: { gap: 8, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  segmentPill: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: radii.round, borderWidth: 1, borderColor: "rgba(255,246,223,0.12)", backgroundColor: "rgba(255,255,255,0.08)" },
  segmentActive: { borderColor: colors.saffronGold, backgroundColor: "rgba(216,168,66,0.23)" },
  segmentText: { color: colors.warmIvory, fontWeight: "700", fontSize: 12 },
  memberName: { color: colors.warmIvory, fontSize: 22, fontFamily: "Georgia" },
  memberMeta: { color: colors.saffronGold, marginTop: 4 },
  memberBio: { color: colors.mutedIvory, lineHeight: 21, marginTop: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  darkChip: { color: colors.warmIvory, borderWidth: 1, borderColor: "rgba(241,199,91,0.24)", borderRadius: radii.round, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12 },
  consentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.charcoal, marginTop: 2 },
  checkboxActive: { backgroundColor: colors.sacredGold },
  consentText: { color: colors.charcoal, flex: 1, lineHeight: 20 }
});
`,
  "apps/mobile/src/navigation/AppNavigator.tsx": `
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, Home, Library, UserRound, Video } from "lucide-react-native";
import { LoadingState } from "../components/Sacred";
import { useAuth } from "../context/AuthContext";
import { AuthScreen, OnboardingScreen, SacredKeyScreen, SplashScreenView } from "../screens/AuthScreens";
import {
  AudioPlayerScreen,
  DirectoryScreen,
  EventDetailScreen,
  EventsScreen,
  HealingRequestScreen,
  HomeScreen,
  LibraryScreen,
  ProgramDetailScreen,
  ProfileScreen,
  ResourceDetailScreen,
  SessionDetailScreen,
  SessionsScreen
} from "../screens/MainScreens";
import { colors } from "../theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.deepNight,
    card: colors.deepNight,
    text: colors.warmIvory,
    border: "rgba(255,246,223,0.12)"
  }
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(5,7,22,0.96)",
          borderTopColor: "rgba(241,199,91,0.16)",
          minHeight: 72,
          paddingTop: 8,
          paddingBottom: 10
        },
        tabBarActiveTintColor: colors.saffronGold,
        tabBarInactiveTintColor: colors.mutedIvory,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Home") return <Home color={color} size={size} />;
          if (route.name === "Sessions") return <Video color={color} size={size} />;
          if (route.name === "Library") return <Library color={color} size={size} />;
          if (route.name === "Events") return <CalendarDays color={color} size={size} />;
          return <UserRound color={color} size={size} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Sessions" component={SessionsScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
      <Stack.Screen name="ResourceDetail" component={ResourceDetailScreen} />
      <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="Directory" component={DirectoryScreen} />
      <Stack.Screen name="HealingRequest" component={HealingRequestScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { loading, userId, keyUnlocked } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  if (!splashDone) return <SplashScreenView />;
  if (loading) return <LoadingState />;

  return (
    <NavigationContainer theme={theme}>
      {!userId ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      ) : !keyUnlocked ? (
        <SacredKeyScreen />
      ) : (
        <AppStack />
      )}
    </NavigationContainer>
  );
}
`
};

const adminFiles = {
  "apps/admin/package.json": `
{
  "name": "@sacred-circle/admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "next lint"
  },
  "dependencies": {
    "@sacred-circle/lib": "*",
    "@sacred-circle/ui": "*",
    "@supabase/supabase-js": "latest",
    "lucide-react": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "typescript": "^5.5.4"
  }
}
`,
  "apps/admin/next-env.d.ts": `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`,
  "apps/admin/next.config.mjs": `
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@sacred-circle/lib", "@sacred-circle/ui"]
};

export default nextConfig;
`,
  "apps/admin/tsconfig.json": `
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`,
  "apps/admin/src/app/layout.tsx": `
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sacred Circle Admin",
  description: "Admin panel for Sacred Circle community content, sessions, keys, and members."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
  "apps/admin/src/app/page.tsx": `
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/dashboard");
}
`,
  "apps/admin/src/app/globals.css": `
:root {
  --deep-night: #050716;
  --cosmic-navy: #0a1028;
  --indigo-soul: #211144;
  --mystic-violet: #7d5ce7;
  --sacred-gold: #d8a842;
  --saffron-gold: #f1c75b;
  --warm-ivory: #fff6df;
  --pure-cream: #f8eed6;
  --charcoal: #261e16;
  --muted: #cfc4aa;
  --line: rgba(255, 246, 223, 0.12);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--warm-ivory);
  background:
    radial-gradient(circle at 86% -5%, rgba(216, 168, 66, 0.18), transparent 30%),
    radial-gradient(circle at 18% 10%, rgba(125, 92, 231, 0.18), transparent 34%),
    linear-gradient(135deg, var(--deep-night), var(--cosmic-navy) 48%, var(--indigo-soul));
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
textarea,
select {
  font: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
}

.sidebar {
  border-right: 1px solid var(--line);
  background: rgba(5, 7, 22, 0.7);
  padding: 24px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.brand-mark {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--deep-night);
  background: linear-gradient(135deg, var(--saffron-gold), var(--sacred-gold));
  font-weight: 900;
  box-shadow: 0 18px 50px rgba(216, 168, 66, 0.25);
}

.brand h1 {
  font-family: Georgia, Cambria, serif;
  font-size: 28px;
  margin: 14px 0 4px;
}

.brand p {
  margin: 0 0 22px;
  color: var(--muted);
  line-height: 1.5;
}

.nav {
  display: grid;
  gap: 6px;
}

.nav a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 8px;
  color: var(--muted);
}

.nav a:hover,
.nav a.active {
  color: var(--warm-ivory);
  background: rgba(255, 255, 255, 0.08);
}

.main {
  padding: 32px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
}

.eyebrow {
  color: var(--saffron-gold);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 12px;
  font-weight: 800;
}

h2,
h3 {
  font-family: Georgia, Cambria, serif;
  letter-spacing: 0;
}

.page-head h2 {
  margin: 6px 0 8px;
  font-size: clamp(32px, 4vw, 52px);
}

.page-head p {
  margin: 0;
  color: var(--muted);
  max-width: 760px;
  line-height: 1.65;
}

.card {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.075);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.26);
}

.cream-card {
  color: var(--charcoal);
  border-radius: 8px;
  background: var(--pure-cream);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.stat {
  padding: 18px;
}

.stat span {
  color: var(--saffron-gold);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 800;
}

.stat strong {
  display: block;
  font-family: Georgia, Cambria, serif;
  font-size: 34px;
  margin-top: 8px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.input,
.select,
.textarea {
  width: 100%;
  border: 1px solid rgba(38, 30, 22, 0.18);
  border-radius: 8px;
  padding: 11px 12px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--charcoal);
}

.dark-input {
  border: 1px solid var(--line);
  border-radius: 8px;
  min-height: 44px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--warm-ivory);
}

.button {
  border: 0;
  border-radius: 8px;
  min-height: 44px;
  padding: 0 16px;
  cursor: pointer;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.button.gold {
  color: var(--deep-night);
  background: linear-gradient(135deg, var(--saffron-gold), var(--sacred-gold));
}

.button.ghost {
  color: var(--warm-ivory);
  border: 1px solid rgba(241, 199, 91, 0.28);
  background: rgba(255, 255, 255, 0.06);
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 14px 12px;
  border-bottom: 1px solid var(--line);
  vertical-align: top;
}

th {
  color: var(--saffron-gold);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
}

td {
  color: var(--warm-ivory);
  max-width: 340px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.62);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 40;
}

.modal {
  width: min(760px, 100%);
  max-height: 88vh;
  overflow: auto;
  padding: 22px;
}

.form-grid {
  display: grid;
  gap: 12px;
}

.form-grid label {
  display: grid;
  gap: 6px;
  color: var(--charcoal);
  font-weight: 800;
}

.status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 9px;
  background: rgba(216, 168, 66, 0.14);
  color: var(--saffron-gold);
  font-size: 12px;
  font-weight: 800;
}

.login-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 22px;
}

.login-card {
  width: min(460px, 100%);
  padding: 28px;
}

@media (max-width: 980px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    height: auto;
  }

  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .main {
    padding: 20px;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }
}
`,
  "apps/admin/src/lib/supabase.ts": `
"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(String(url), String(anonKey), {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;
`,
  "apps/admin/src/lib/adminConfig.ts": `
import {
  demoAnnouncements,
  demoEvents,
  demoHealingRequests,
  demoProfile,
  demoPrograms,
  demoResources,
  demoSessions,
  demoSettings,
  demoWeeklyKeys
} from "@sacred-circle/lib";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "date" | "datetime" | "select" | "array";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
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
  weeklyKeys: {
    title: "Weekly Sacred Keys",
    eyebrow: "Access",
    description: "Create, activate, and review the weekly four-digit keys that unlock protected teachings.",
    table: "weekly_keys",
    columns: ["title", "key_code", "week_start", "week_end", "is_active"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "key_code", label: "4-digit key", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "week_start", label: "Week start", type: "date" },
      { key: "week_end", label: "Week end", type: "date" },
      { key: "is_active", label: "Active", type: "boolean" }
    ],
    demoRows: demoWeeklyKeys
  },
  sessions: {
    title: "Sessions",
    eyebrow: "Zoom classes",
    description: "Manage Sunday Satsang, spiritual classes, Zoom links, recordings, registration status, and reminders.",
    table: "sessions",
    columns: ["title", "category", "guide_name", "session_date", "status", "is_featured"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "category", label: "Category", type: "text" },
      { key: "guide_name", label: "Guide", type: "text" },
      { key: "session_date", label: "Date/time", type: "datetime" },
      { key: "duration_minutes", label: "Duration minutes", type: "number" },
      { key: "zoom_link", label: "Zoom link", type: "text" },
      { key: "zoom_passcode", label: "Zoom passcode", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["upcoming", "completed", "cancelled"] },
      { key: "is_featured", label: "Featured", type: "boolean" }
    ],
    demoRows: demoSessions
  },
  resources: {
    title: "Resources",
    eyebrow: "Library",
    description: "Upload audio/PDF links, add YouTube resources, lock content, attach programs/sessions/keys, and feature recordings.",
    table: "resources",
    columns: ["title", "type", "category", "access_type", "is_featured", "display_order"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "type", label: "Type", type: "select", options: ["audio", "pdf", "youtube", "article", "external"] },
      { key: "category", label: "Category", type: "text" },
      { key: "file_url", label: "File URL", type: "text" },
      { key: "youtube_url", label: "YouTube URL", type: "text" },
      { key: "external_url", label: "External URL", type: "text" },
      { key: "duration_seconds", label: "Duration seconds", type: "number" },
      { key: "program_id", label: "Program ID", type: "text" },
      { key: "session_id", label: "Session ID", type: "text" },
      { key: "access_type", label: "Access", type: "select", options: ["public", "weekly_key", "manual", "attendance", "program"] },
      { key: "required_weekly_key_id", label: "Required weekly key ID", type: "text" },
      { key: "is_featured", label: "Featured", type: "boolean" },
      { key: "display_order", label: "Display order", type: "number" }
    ],
    demoRows: demoResources
  },
  programs: {
    title: "Programs",
    eyebrow: "Teachings",
    description: "Create premium program collections and connect them to sessions, resources, and events.",
    table: "programs",
    columns: ["title", "category", "access_type", "is_featured"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "category", label: "Category", type: "text" },
      { key: "image_url", label: "Banner image URL", type: "text" },
      { key: "access_type", label: "Access", type: "select", options: ["public", "weekly_key", "manual", "attendance", "program"] },
      { key: "is_featured", label: "Featured", type: "boolean" }
    ],
    demoRows: demoPrograms
  },
  events: {
    title: "Events and Shivirs",
    eyebrow: "Gatherings",
    description: "Manage Shivirs, retreats, workshops, online classes, seats, donation placeholders, and registrations.",
    table: "events",
    columns: ["title", "event_type", "start_time", "location", "is_online", "registration_enabled", "status"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "event_type", label: "Event type", type: "text" },
      { key: "start_time", label: "Start time", type: "datetime" },
      { key: "end_time", label: "End time", type: "datetime" },
      { key: "location", label: "Location", type: "text" },
      { key: "is_online", label: "Online", type: "boolean" },
      { key: "online_link", label: "Online link", type: "text" },
      { key: "image_url", label: "Image URL", type: "text" },
      { key: "seats_total", label: "Seats total", type: "number" },
      { key: "price_amount", label: "Price/donation", type: "number" },
      { key: "registration_enabled", label: "Registration enabled", type: "boolean" },
      { key: "status", label: "Status", type: "select", options: ["upcoming", "completed", "cancelled"] }
    ],
    demoRows: demoEvents
  },
  users: {
    title: "Users",
    eyebrow: "Members",
    description: "Search members, update roles, review access state, and disable accounts if needed.",
    table: "profiles",
    columns: ["name", "email", "city", "role", "show_in_directory", "disabled"],
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "interests", label: "Interests", type: "array" },
      { key: "role", label: "Role", type: "select", options: ["user", "member", "admin"] },
      { key: "show_in_directory", label: "Show in directory", type: "boolean" },
      { key: "disabled", label: "Disabled", type: "boolean" }
    ],
    demoRows: [demoProfile]
  },
  directory: {
    title: "Member Directory",
    eyebrow: "Community privacy",
    description: "Approve, hide, and review directory-visible community members.",
    table: "profiles",
    columns: ["name", "city", "interests", "show_in_directory"],
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "interests", label: "Interests", type: "array" },
      { key: "show_in_directory", label: "Show in directory", type: "boolean" }
    ],
    demoRows: [demoProfile]
  },
  healingRequests: {
    title: "Healing Requests",
    eyebrow: "Support",
    description: "Review spiritual support requests, update status, and keep internal notes.",
    table: "healing_requests",
    columns: ["name", "email", "category", "status", "created_at"],
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "category", label: "Category", type: "select", options: ["Healing", "Stress/Anxiety", "Relationship", "Career/Life Direction", "Family", "Spiritual Guidance", "Other"] },
      { key: "message", label: "Message", type: "textarea" },
      { key: "consent", label: "Consent", type: "boolean" },
      { key: "status", label: "Status", type: "select", options: ["new", "reviewed", "responded", "closed"] },
      { key: "admin_notes", label: "Admin notes", type: "textarea" }
    ],
    demoRows: demoHealingRequests
  },
  announcements: {
    title: "Announcements and Notifications",
    eyebrow: "Broadcasts",
    description: "Publish announcements, log notification history, and prepare targeted push campaigns.",
    table: "announcements",
    columns: ["title", "target_type", "is_active", "created_at"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "message", label: "Message", type: "textarea" },
      { key: "target_type", label: "Target", type: "select", options: ["all", "session", "event"] },
      { key: "related_session_id", label: "Related session ID", type: "text" },
      { key: "related_event_id", label: "Related event ID", type: "text" },
      { key: "is_active", label: "Active", type: "boolean" }
    ],
    demoRows: demoAnnouncements
  },
  settings: {
    title: "Settings",
    eyebrow: "App controls",
    description: "Manage WhatsApp, YouTube, contact email, default Zoom link, disclaimer, policies, and app copy.",
    table: "app_settings",
    columns: ["key", "value", "updated_at"],
    fields: [
      { key: "key", label: "Key", type: "text" },
      { key: "value", label: "Value", type: "textarea" }
    ],
    demoRows: demoSettings
  },
  sessionRegistrations: {
    title: "Session Registrations",
    eyebrow: "Attendance",
    description: "Review session registrations and mark attendance manually to unlock related recordings.",
    table: "session_registrations",
    columns: ["user_id", "session_id", "attendance_status", "registered_at"],
    fields: [
      { key: "user_id", label: "User ID", type: "text" },
      { key: "session_id", label: "Session ID", type: "text" },
      { key: "attendance_status", label: "Attendance", type: "select", options: ["registered", "attended", "missed", "cancelled"] }
    ],
    demoRows: []
  },
  eventRegistrations: {
    title: "Event Registrations",
    eyebrow: "Bookings",
    description: "View Shivir/event registrations and export current rows as CSV.",
    table: "event_registrations",
    columns: ["name", "email", "phone", "city", "participants_count", "status"],
    fields: [
      { key: "event_id", label: "Event ID", type: "text" },
      { key: "user_id", label: "User ID", type: "text" },
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "participants_count", label: "Participants", type: "number" },
      { key: "note", label: "Note", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["registered", "confirmed", "cancelled"] }
    ],
    demoRows: []
  }
};

export const navItems = [
  ["Dashboard", "/dashboard"],
  ["Weekly Keys", "/weekly-keys"],
  ["Sessions", "/sessions"],
  ["Session Regs", "/session-registrations"],
  ["Resources", "/resources"],
  ["Programs", "/programs"],
  ["Events", "/events"],
  ["Event Regs", "/event-registrations"],
  ["Users", "/users"],
  ["Directory", "/directory"],
  ["Healing", "/healing-requests"],
  ["Announcements", "/announcements"],
  ["Settings", "/settings"]
] as const;
`,
  "apps/admin/src/components/AdminAuth.tsx": `
"use client";

import { demoProfile } from "@sacred-circle/lib";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AdminAuthValue {
  loading: boolean;
  isAdmin: boolean;
  demoMode: boolean;
  email: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(!supabase);
  const [email, setEmail] = useState<string | null>(!supabase ? demoProfile.email : null);

  useEffect(() => {
    async function boot() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setEmail(user?.email || null);
      if (user) {
        const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        setIsAdmin(profile.data?.role === "admin");
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    }

    boot();
  }, []);

  const value = useMemo<AdminAuthValue>(() => ({
    loading,
    isAdmin,
    demoMode: !supabase,
    email,
    async signIn(nextEmail, password) {
      if (!supabase) {
        setEmail(nextEmail || demoProfile.email);
        setIsAdmin(true);
        return;
      }
      const result = await supabase.auth.signInWithPassword({ email: nextEmail, password });
      if (result.error) throw result.error;
      const user = result.data.user;
      setEmail(user.email || nextEmail);
      const profile = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile.data?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("This account is not an admin.");
      }
      setIsAdmin(true);
    },
    async signOut() {
      await supabase?.auth.signOut();
      setIsAdmin(!supabase);
      setEmail(!supabase ? demoProfile.email : null);
    }
  }), [loading, isAdmin, email]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}
`,
  "apps/admin/src/components/AdminLayout.tsx": `
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LockKeyhole, LogOut } from "lucide-react";
import { navItems } from "@/lib/adminConfig";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuth";

function ShellInner({ children }: { children: React.ReactNode }) {
  const auth = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (auth.loading) {
    return <div className="login-shell"><div className="card login-card">Preparing admin sanctuary...</div></div>;
  }

  if (!auth.isAdmin && pathname !== "/login") {
    router.replace("/login");
    return null;
  }

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SC</div>
          <h1>Sacred Circle</h1>
          <p>Admin sanctuary for keys, sessions, resources, events, and members.</p>
        </div>
        <nav className="nav">
          {navItems.map(([label, href]) => (
            <Link key={href} href={href} className={pathname === href ? "active" : ""}>
              <LockKeyhole size={15} />
              {label}
            </Link>
          ))}
          <button className="button ghost" onClick={async () => { await auth.signOut(); router.push("/login"); }}>
            <LogOut size={15} />
            Logout
          </button>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <ShellInner>{children}</ShellInner>
    </AdminAuthProvider>
  );
}
`,
  "apps/admin/src/components/LoginPage.tsx": `
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuth";

function LoginInner() {
  const auth = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await auth.signIn(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login.");
    }
  }

  return (
    <div className="login-shell">
      <form className="card login-card" onSubmit={submit}>
        <div className="brand-mark">SC</div>
        <p className="eyebrow">Admin access</p>
        <h2>Enter Sacred Circle Admin</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Supabase Auth plus role-based access. Demo mode is available only when env vars are empty.
        </p>
        <div className="form-grid">
          <input className="dark-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={auth.demoMode ? "Demo mode email optional" : "Admin email"} />
          <input className="dark-input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={auth.demoMode ? "Demo mode password optional" : "Password"} type="password" />
          {error ? <p style={{ color: "#ffd2cc" }}>{error}</p> : null}
          <button className="button gold" type="submit">Enter Admin</button>
        </div>
      </form>
    </div>
  );
}

export function LoginPage() {
  return (
    <AdminAuthProvider>
      <LoginInner />
    </AdminAuthProvider>
  );
}
`,
  "apps/admin/src/components/Dashboard.tsx": `
"use client";

import { useEffect, useState } from "react";
import { demoEvents, demoResources, demoSessions, demoWeeklyKeys } from "@sacred-circle/lib";
import { supabase } from "@/lib/supabase";
import { AdminLayout } from "./AdminLayout";

const statTables = [
  ["Users", "profiles"],
  ["Resources", "resources"],
  ["Sessions", "sessions"],
  ["Events", "events"],
  ["Healing", "healing_requests"],
  ["Announcements", "announcements"]
] as const;

export function Dashboard() {
  const [stats, setStats] = useState<Record<string, number>>({
    Users: 1,
    Resources: demoResources.length,
    Sessions: demoSessions.length,
    Events: demoEvents.length,
    Healing: 1,
    Announcements: 3
  });

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const next: Record<string, number> = {};
      await Promise.all(statTables.map(async ([label, table]) => {
        const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
        next[label] = count || 0;
      }));
      setStats(next);
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Admin Dashboard</h2>
          <p>Manage the weekly key, Sunday sessions, protected recordings, Shivirs, healing requests, announcements, and community access.</p>
        </div>
      </div>
      <div className="stat-grid">
        {Object.entries(stats).map(([label, value]) => (
          <div className="card stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 22, marginBottom: 18 }}>
        <p className="eyebrow">Active key</p>
        <h3>{demoWeeklyKeys[0].title}</h3>
        <p style={{ color: "var(--muted)" }}>Use the Weekly Keys module to create, activate, and link keys to protected resources. The unlock RPC keeps key validation off public table reads.</p>
      </div>
      <div className="cream-card" style={{ padding: 22 }}>
        <p className="eyebrow" style={{ color: "var(--charcoal)" }}>Operational note</p>
        <h3>Push and payments are ready for credentials</h3>
        <p>Expo notification tables and announcement history are in place. Razorpay remains optional and should be finished with webhook verification before accepting donations.</p>
      </div>
    </AdminLayout>
  );
}
`,
  "apps/admin/src/components/CrudPage.tsx": `
"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Search, Trash2 } from "lucide-react";
import { ModuleConfig } from "@/lib/adminConfig";
import { supabase } from "@/lib/supabase";
import { AdminLayout } from "./AdminLayout";

function newRow(config: ModuleConfig) {
  const row: Record<string, any> = {};
  for (const field of config.fields) {
    if (field.type === "boolean") row[field.key] = false;
    else if (field.type === "number") row[field.key] = 0;
    else if (field.type === "array") row[field.key] = [];
    else row[field.key] = "";
  }
  return row;
}

export function CrudPage({ config }: { config: ModuleConfig }) {
  const [rows, setRows] = useState<any[]>(config.demoRows);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data, error } = await supabase.from(config.table).select("*").limit(250);
      if (!error && data) setRows(data);
    }
    load();
  }, [config.table]);

  const filtered = useMemo(() => rows.filter((row) => {
    if (!query) return true;
    return JSON.stringify(row).toLowerCase().includes(query.toLowerCase());
  }), [rows, query]);

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      const payload = { ...editing };
      for (const field of config.fields) {
        if (field.type === "number") payload[field.key] = payload[field.key] === "" ? null : Number(payload[field.key]);
        if (field.type === "array" && typeof payload[field.key] === "string") {
          payload[field.key] = payload[field.key].split(",").map((item: string) => item.trim()).filter(Boolean);
        }
        if (payload[field.key] === "") payload[field.key] = null;
      }
      if (!supabase) {
        setRows((current) => {
          if (payload.id) return current.map((row) => row.id === payload.id ? payload : row);
          return [{ ...payload, id: "demo-" + Date.now() }, ...current];
        });
      } else {
        const { data, error } = await supabase.from(config.table).upsert(payload).select("*").single();
        if (error) throw error;
        setRows((current) => current.some((row) => row.id === data.id) ? current.map((row) => row.id === data.id ? data : row) : [data, ...current]);
      }
      setEditing(null);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: any) {
    if (!window.confirm("Delete this item?")) return;
    if (!supabase) {
      setRows((current) => current.filter((item) => item.id !== row.id));
      return;
    }
    const { error } = await supabase.from(config.table).delete().eq("id", row.id);
    if (!error) setRows((current) => current.filter((item) => item.id !== row.id));
  }

  function exportCsv() {
    const header = config.columns.join(",");
    const lines = filtered.map((row) => config.columns.map((column) => JSON.stringify(row[column] ?? "")).join(","));
    const blob = new Blob([[header, ...lines].join("\\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = config.table + ".csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <p className="eyebrow">{config.eyebrow}</p>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
        <button className="button gold" onClick={() => setEditing(newRow(config))}><Plus size={16} /> New</button>
      </div>
      <div className="toolbar">
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 14, color: "var(--saffron-gold)" }} />
          <input className="dark-input" style={{ width: "100%", paddingLeft: 38 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this module" />
        </div>
        <button className="button ghost" onClick={exportCsv}><Download size={16} /> Export CSV</button>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              {config.columns.map((column) => <th key={column}>{column.replaceAll("_", " ")}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr key={row.id || index}>
                {config.columns.map((column) => <td key={column}>{formatCell(row[column])}</td>)}
                <td>
                  <button className="button ghost" onClick={() => setEditing(row)}>Edit</button>{" "}
                  <button className="button ghost" onClick={() => remove(row)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr><td colSpan={config.columns.length + 1}>No records yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {editing ? (
        <div className="modal-backdrop">
          <div className="cream-card modal">
            <h3>{editing.id ? "Edit " + config.title : "New " + config.title}</h3>
            <div className="form-grid">
              {config.fields.map((field) => (
                <label key={field.key}>
                  {field.label}
                  {renderField(field, editing, setEditing)}
                </label>
              ))}
              <div className="toolbar">
                <button className="button gold" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save"}</button>
                <button className="button ghost" style={{ color: "var(--charcoal)", borderColor: "rgba(38,30,22,0.24)" }} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

function renderField(field: any, editing: any, setEditing: (next: any) => void) {
  const value = editing[field.key];
  const update = (next: any) => setEditing({ ...editing, [field.key]: next });

  if (field.type === "textarea") return <textarea className="textarea" rows={4} value={value || ""} onChange={(event) => update(event.target.value)} />;
  if (field.type === "boolean") return <input type="checkbox" checked={Boolean(value)} onChange={(event) => update(event.target.checked)} />;
  if (field.type === "select") {
    return (
      <select className="select" value={value || ""} onChange={(event) => update(event.target.value)}>
        <option value="">Select</option>
        {field.options?.map((option: string) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }
  if (field.type === "array") {
    return <input className="input" value={Array.isArray(value) ? value.join(", ") : value || ""} onChange={(event) => update(event.target.value)} />;
  }
  return <input className="input" type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"} value={value || ""} onChange={(event) => update(event.target.value)} />;
}

function formatCell(value: any) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return <span className="status">{value ? "Yes" : "No"}</span>;
  if (Array.isArray(value)) return value.join(", ");
  const text = String(value);
  return text.length > 110 ? text.slice(0, 110) + "..." : text;
}
`
};

const routeFiles = {
  "apps/admin/src/app/login/page.tsx": `
import { LoginPage } from "@/components/LoginPage";

export default function Page() {
  return <LoginPage />;
}
`,
  "apps/admin/src/app/dashboard/page.tsx": `
import { Dashboard } from "@/components/Dashboard";

export default function Page() {
  return <Dashboard />;
}
`
};

const routeMap = {
  "weekly-keys": "weeklyKeys",
  "sessions": "sessions",
  "session-registrations": "sessionRegistrations",
  "resources": "resources",
  "programs": "programs",
  "events": "events",
  "event-registrations": "eventRegistrations",
  "users": "users",
  "directory": "directory",
  "healing-requests": "healingRequests",
  "announcements": "announcements",
  "settings": "settings"
};

for (const [route, key] of Object.entries(routeMap)) {
  routeFiles["apps/admin/src/app/" + route + "/page.tsx"] = `
import { CrudPage } from "@/components/CrudPage";
import { moduleConfigs } from "@/lib/adminConfig";

export default function Page() {
  return <CrudPage config={moduleConfigs.${key}} />;
}
`;
}

for (const [filePath, content] of Object.entries({ ...mobileFiles, ...adminFiles, ...routeFiles })) {
  writeFile(filePath, content);
}

console.log("Mobile and admin apps generated.");
