"use client";

import { demoProfile } from "@sacred-circle/lib";
import type { ReactNode } from "react";
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
const DEV_ADMIN_SESSION = "sacred-circle-dev-admin-session";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(!supabase);
  const [email, setEmail] = useState<string | null>(!supabase ? demoProfile.email : null);

  useEffect(() => {
    async function boot() {
      if (isLocalDevAdminSession()) {
        setEmail("admin@sacredcircle.com");
        setIsAdmin(true);
        setLoading(false);
        return;
      }

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
      if (isLocalDevAdminLogin(nextEmail, password)) {
        localStorage.setItem(DEV_ADMIN_SESSION, "true");
        setEmail("admin@sacredcircle.com");
        setIsAdmin(true);
        return;
      }
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
      if (typeof window !== "undefined") localStorage.removeItem(DEV_ADMIN_SESSION);
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

function isLocalhost() {
  return typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function isLocalDevAdminLogin(email: string, password: string) {
  return isLocalhost() && password === "sacred123" && ["admin@sacredcircle.com", "demo@sacredcircle.com", "admin@sacredcircle.local", "demo@sacredcircle.local"].includes(email.trim().toLowerCase());
}

function isLocalDevAdminSession() {
  return isLocalhost() && localStorage.getItem(DEV_ADMIN_SESSION) === "true";
}
