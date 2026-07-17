"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuth";

function LoginInner() {
  const auth = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
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
        <img src="/sacred-flame-logo.png" alt="Sacred Circle" className="brand-logo" />
        <p className="eyebrow">Sacred Circle content manager</p>
        <h2>Welcome back</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Sign in to update recordings, videos, member details, and app links.
        </p>
        <div className="form-grid">
          <input className="dark-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" type="email" autoComplete="email" />
          <input className="dark-input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" autoComplete="current-password" />
          {error ? <p className="admin-message" role="alert">{error}</p> : null}
          <button className="button gold" type="submit">Sign in</button>
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
