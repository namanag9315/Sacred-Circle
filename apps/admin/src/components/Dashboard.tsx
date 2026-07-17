"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, Headphones, Link as LinkIcon, Users, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminLayout } from "./AdminLayout";

const statTables = [
  ["Members", "profiles"],
  ["Recordings", "resources"],
  ["Videos", "videos"],
] as const;

export function Dashboard() {
  const [stats, setStats] = useState<Record<string, number>>({
    Members: 0,
    Recordings: 0,
    Videos: 0
  });
  const [upcoming, setUpcoming] = useState<any>(null);
  const [recording, setRecording] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const client = supabase;
      const next: Record<string, number> = {};
      await Promise.all(statTables.map(async ([label, table]) => {
        let query = client.from(table).select("*", { count: "exact", head: true });
        if (table === "resources") query = query.eq("type", "audio").eq("access_type", "session_protected");
        const { count } = await query;
        next[label] = count || 0;
      }));
      setStats(next);

      const [upcomingResult, recordingResult] = await Promise.all([
        client.from("sessions").select("*").in("status", ["upcoming", "live"]).order("session_date", { ascending: true }).limit(1).maybeSingle(),
        client.from("resources").select("*").eq("access_type", "session_protected").order("created_at", { ascending: false }).limit(1).maybeSingle()
      ]);

      if (upcomingResult.data) setUpcoming(upcomingResult.data);
      if (recordingResult.data) setRecording(recordingResult.data);
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>What would you like to update?</h2>
          <p>Choose a task below. Each screen only asks for the details needed by the app.</p>
        </div>
        <a className="button ghost" href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} /> Preview app</a>
      </div>
      <div className="primary-task-grid">
        <Link className="task-card task-card-featured" href="/meditations">
          <div className="task-icon"><Headphones size={28} /></div>
          <span>Most common task</span>
          <strong>Upload Sunday recording</strong>
          <small>Add the session name, date and audio file. Everything else is handled automatically.</small>
          <b>Upload recording <ArrowRight size={17} /></b>
        </Link>
        <Link className="task-card" href="/videos">
          <div className="task-icon"><Video size={28} /></div>
          <span>Video library</span>
          <strong>Add a YouTube video</strong>
          <small>Paste the YouTube link and add a title. The thumbnail and publishing details are automatic.</small>
          <b>Manage videos <ArrowRight size={17} /></b>
        </Link>
      </div>
      <div className="secondary-task-grid">
        <Link href="/users"><Users size={21} /><div><strong>Members</strong><small>View or correct member details</small></div><ArrowRight size={17} /></Link>
        <Link href="/settings"><LinkIcon size={21} /><div><strong>App details</strong><small>Update WhatsApp, Zoom and contact links</small></div><ArrowRight size={17} /></Link>
      </div>
      <div className="stat-grid">
        {Object.entries(stats).map(([label, value]) => (
          <div className="card stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="dashboard-bottom-grid">
        <div className="card panel weekly-guide">
          <p className="eyebrow">Your weekly routine</p>
          <h3>After every Sunday session</h3>
          <div><CheckCircle2 size={19} /><span><strong>1. Name the session</strong><small>Use the topic people will recognise.</small></span></div>
          <div><CheckCircle2 size={19} /><span><strong>2. Choose the session date</strong><small>The recording will be organised date-wise.</small></span></div>
          <div><CheckCircle2 size={19} /><span><strong>3. Upload the audio</strong><small>Press Publish and it will appear in the app.</small></span></div>
        </div>
        <div className="card panel content-snapshot">
          <p className="eyebrow">At a glance</p>
          <h3>{upcoming?.title || "No upcoming session scheduled"}</h3>
          <p>{upcoming?.session_date ? `Next session: ${new Date(upcoming.session_date).toLocaleString("en-IN", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}` : "The next live-session link can be updated under App Details."}</p>
          <hr />
          <small>Latest recording</small>
          <strong>{recording?.title || "No recording uploaded yet"}</strong>
        </div>
      </div>
    </AdminLayout>
  );
}
