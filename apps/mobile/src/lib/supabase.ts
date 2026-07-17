import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const extra = Constants.expoConfig?.extra || {};
function runtimeValue(extraValue: unknown, envValue?: string) {
  const value = typeof extraValue === "string" ? extraValue : "";
  if (!value || value.startsWith("$") || value.includes("$EXPO_PUBLIC_")) return envValue;
  return value;
}

const supabaseUrl = runtimeValue(extra.supabaseUrl, process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = runtimeValue(extra.supabaseAnonKey, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !String(supabaseUrl).includes("$"));

export const supabase = isSupabaseConfigured
  ? createClient(String(supabaseUrl), String(supabaseAnonKey), {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: "pkce"
      }
    })
  : null;
