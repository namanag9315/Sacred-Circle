"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Link2, Mail, MessageCircle, RefreshCw, Save, ShieldCheck, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminLayout } from "./AdminLayout";

type SettingsForm = Record<string, string>;

const settingKeys = [
  "whatsapp_group_url",
  "youtube_channel_url",
  "contact_email",
  "default_zoom_link",
  "default_zoom_info",
  "home_quote",
  "home_quote_author",
  "disclaimer_text",
  "privacy_policy",
  "terms_text"
];

const emptySettings = Object.fromEntries(settingKeys.map((key) => [key, ""]));

export function SimpleSettingsPage() {
  const [form, setForm] = useState<SettingsForm>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("app_settings").select("key,value").in("key", settingKeys);
    if (error) {
      setMessage("App details could not be loaded. Please try again.");
    } else {
      const next = { ...emptySettings };
      for (const row of data || []) next[row.key] = row.value || "";
      setForm(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!supabase) return;
    setMessage("");
    const urlKeys = ["whatsapp_group_url", "youtube_channel_url", "default_zoom_link"];
    const invalidUrl = urlKeys.find((key) => form[key].trim() && !isWebUrl(form[key]));
    if (invalidUrl) {
      setMessage("Please check the highlighted web links. Each link should start with https://");
      return;
    }
    if (form.contact_email.trim() && !/^\S+@\S+\.\S+$/.test(form.contact_email.trim())) {
      setMessage("Please enter a valid contact email address.");
      return;
    }

    setBusy(true);
    const payload = settingKeys.map((key) => ({ key, value: form[key].trim() }));
    const { error } = await supabase.from("app_settings").upsert(payload, { onConflict: "key" });
    setBusy(false);
    setMessage(error ? "Changes could not be saved. Please try again." : "App details saved. Your links and text are now up to date.");
  }

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <p className="eyebrow">App details</p>
          <h2>Links and contact information</h2>
          <p>Update the information people use to join sessions, contact Sacred Circle, and connect with the community.</p>
        </div>
        <button className="button ghost" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Reload</button>
      </div>

      {message ? <p className="admin-message" role="status">{message}</p> : null}

      <div className="settings-layout">
        <section className="card settings-card">
          <div className="settings-card-title"><MessageCircle size={22} /><div><h3>Community links</h3><p>Where members join and follow Sacred Circle.</p></div></div>
          <label><span>WhatsApp community link</span><div className="input-with-icon"><MessageCircle size={17} /><input value={form.whatsapp_group_url} onChange={(event) => update("whatsapp_group_url", event.target.value)} placeholder="https://chat.whatsapp.com/..." /></div></label>
          <label><span>YouTube channel link</span><div className="input-with-icon"><Video size={17} /><input value={form.youtube_channel_url} onChange={(event) => update("youtube_channel_url", event.target.value)} placeholder="https://youtube.com/@..." /></div></label>
        </section>

        <section className="card settings-card">
          <div className="settings-card-title"><Link2 size={22} /><div><h3>Sunday session</h3><p>The default link shown when a session has no separate link.</p></div></div>
          <label><span>Zoom meeting link</span><div className="input-with-icon"><ExternalLink size={17} /><input value={form.default_zoom_link} onChange={(event) => update("default_zoom_link", event.target.value)} placeholder="https://zoom.us/j/..." /></div></label>
          <label><span>Session note</span><textarea className="textarea" value={form.default_zoom_info} onChange={(event) => update("default_zoom_info", event.target.value)} placeholder="Sunday meditation happens online at 4:00 PM IST." /></label>
        </section>

        <section className="card settings-card">
          <div className="settings-card-title"><Mail size={22} /><div><h3>Contact</h3><p>The email address shown throughout the app.</p></div></div>
          <label><span>Contact email</span><div className="input-with-icon"><Mail size={17} /><input type="email" value={form.contact_email} onChange={(event) => update("contact_email", event.target.value)} placeholder="hello@sacredcircle.com" /></div></label>
        </section>

        <section className="card settings-card">
          <div className="settings-card-title"><ShieldCheck size={22} /><div><h3>Home message</h3><p>A short spiritual quote used in the app.</p></div></div>
          <label><span>Quote</span><textarea className="textarea" value={form.home_quote} onChange={(event) => update("home_quote", event.target.value)} placeholder="Enter the quote" /></label>
          <label><span>Quote author</span><input className="input" value={form.home_quote_author} onChange={(event) => update("home_quote_author", event.target.value)} placeholder="Author name" /></label>
        </section>
      </div>

      <details className="card advanced-settings">
        <summary>Legal and policy text <span>Rarely changed</span></summary>
        <div className="guided-form-grid">
          <label className="full-field"><span>Wellbeing disclaimer</span><textarea className="textarea" value={form.disclaimer_text} onChange={(event) => update("disclaimer_text", event.target.value)} /></label>
          <label className="full-field"><span>Privacy policy</span><textarea className="textarea" value={form.privacy_policy} onChange={(event) => update("privacy_policy", event.target.value)} /></label>
          <label className="full-field"><span>Terms of use</span><textarea className="textarea" value={form.terms_text} onChange={(event) => update("terms_text", event.target.value)} /></label>
        </div>
      </details>

      <div className="sticky-save-bar">
        <div><strong>Ready to update the app?</strong><small>Review the links above, then save once.</small></div>
        <button className="button gold" onClick={() => void save()} disabled={busy || loading}><Save size={17} /> {busy ? "Saving..." : "Save all changes"}</button>
      </div>
    </AdminLayout>
  );
}

function isWebUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
