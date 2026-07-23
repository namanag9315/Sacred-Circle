"use client";

import { useState } from "react";
import { SACRED_CIRCLE_ADMIN_EMAIL } from "@/lib/adminAccess";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuth";

function LoginInner() {
  const auth = useAdminAuth();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function continueWithGoogle() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await auth.signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login.");
      setBusy(false);
    }
  }

  async function emailLoginLink() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await auth.sendLoginLink();
      setNotice(`A secure sign-in link was sent to ${SACRED_CIRCLE_ADMIN_EMAIL}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the sign-in link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="card login-card">
        <img src="/sacred-flame-logo.png" alt="Sacred Circle" className="brand-logo" />
        <p className="eyebrow">Sacred Circle content manager</p>
        <h2>Welcome back</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Access is restricted to the official Sacred Circle account.
        </p>
        <div className="form-grid">
          <button className="button gold" type="button" disabled={busy} onClick={continueWithGoogle}>
            Continue with Google
          </button>
          <button className="button" type="button" disabled={busy} onClick={emailLoginLink}>
            Email a secure sign-in link
          </button>
          {error ? <p className="admin-message" role="alert">{error}</p> : null}
          {notice ? <p className="admin-message" role="status">{notice}</p> : null}
        </div>
      </div>
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
