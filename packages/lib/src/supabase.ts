import { createClient } from "@supabase/supabase-js";

export function createSacredSupabaseClient(url?: string, anonKey?: string) {
  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
}
