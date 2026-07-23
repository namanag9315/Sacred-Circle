"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSacredCircleAdminEmail, SACRED_CIRCLE_ADMIN_EMAIL } from "@/lib/adminAccess";
import { supabase } from "@/lib/supabase";

interface AdminAuthValue {
  loading: boolean;
  isAdmin: boolean;
  email: string | null;
  signInWithGoogle: () => Promise<void>;
  sendLoginLink: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function boot() {
      if (!supabase) {
        setIsAdmin(false);
        setEmail(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        const allowed = await hasAdminAccess(user.id, user.email);
        if (!allowed) {
          await supabase.auth.signOut();
          setEmail(null);
          setIsAdmin(false);
        } else {
          setEmail(user.email || SACRED_CIRCLE_ADMIN_EMAIL);
          setIsAdmin(true);
        }
      } else {
        setEmail(null);
        setIsAdmin(false);
      }
      setLoading(false);
    }

    boot();
  }, []);

  const value = useMemo<AdminAuthValue>(() => ({
    loading,
    isAdmin,
    email,
    async signInWithGoogle() {
      if (!supabase) {
        throw new Error("Admin authentication is not configured.");
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` }
      });
      if (error) throw error;
    },
    async sendLoginLink() {
      if (!supabase) {
        throw new Error("Admin authentication is not configured.");
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: SACRED_CIRCLE_ADMIN_EMAIL,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    },
    async signOut() {
      await supabase?.auth.signOut();
      setIsAdmin(false);
      setEmail(null);
    }
  }), [loading, isAdmin, email]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}

async function hasAdminAccess(userId: string, userEmail: string | null | undefined) {
  if (!supabase || !isSacredCircleAdminEmail(userEmail)) return false;
  const profile = await supabase.from("profiles").select("role,email").eq("id", userId).maybeSingle();
  return profile.data?.role === "admin" && isSacredCircleAdminEmail(profile.data.email);
}
