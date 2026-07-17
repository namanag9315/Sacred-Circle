"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Headphones, Pencil, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminLayout } from "./AdminLayout";

type SessionAudioRow = {
  id: string;
  title: string;
  description?: string | null;
  audio_group?: AudioGroup | null;
  recorded_at?: string | null;
  shivir_location?: string | null;
  access_type?: string | null;
  category?: string | null;
  session_id?: string | null;
  storage_path?: string | null;
  duration_seconds?: number | null;
  is_featured?: boolean | null;
  status?: string | null;
  created_at?: string | null;
  sessions?: {
    id: string;
    title: string;
    session_date: string;
    zoom_link?: string | null;
    status?: string | null;
  } | null;
};

type AudioGroup = "free" | "online_shivir" | "offline_shivir";

type SessionRow = {
  id: string;
  title: string;
  session_date: string;
};

const emptyForm = {
  audioGroup: "online_shivir" as AudioGroup,
  sessionName: "",
  sessionDate: "",
  shivirLocation: "",
  zoomLink: "",
  accessKey: ""
};

export function SessionAudioPage() {
  const [rows, setRows] = useState<SessionAudioRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [editingRow, setEditingRow] = useState<SessionAudioRow | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [commonAccessKey, setCommonAccessKey] = useState("");
  const [keyBusy, setKeyBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    if (!supabase) {
      setRows([]);
      setSessions([]);
      setLoading(false);
      return;
    }

    const [audioResult, sessionResult] = await Promise.all([
      supabase
        .from("resources")
        .select("id,title,description,audio_group,recorded_at,shivir_location,access_type,category,session_id,storage_path,duration_seconds,is_featured,status,created_at,sessions(id,title,session_date,zoom_link,status)")
        .eq("type", "audio")
        .order("recorded_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("sessions")
        .select("id,title,session_date")
        .order("session_date", { ascending: false })
        .limit(250)
    ]);

    if (audioResult.error) setMessage(audioResult.error.message);
    if (sessionResult.error) setMessage(sessionResult.error.message);

    const sortedRows = ((audioResult.data || []) as unknown as SessionAudioRow[]).sort((left, right) => {
      const leftTime = Date.parse(left.recorded_at || left.sessions?.session_date || left.created_at || "") || 0;
      const rightTime = Date.parse(right.recorded_at || right.sessions?.session_date || right.created_at || "") || 0;
      return rightTime - leftTime;
    });

    setRows(sortedRows);
    setSessions((sessionResult.data || []) as SessionRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      const date = row.recorded_at || row.sessions?.session_date ? formatDisplayDate(row.recorded_at || row.sessions?.session_date || "") : "";
      return `${row.title} ${row.description || ""} ${row.sessions?.title || ""} ${audioGroupLabel(row)} ${row.shivir_location || ""} ${date}`.toLowerCase().includes(needle);
    });
  }, [query, rows]);

  const stats = useMemo(() => {
    const published = rows.filter((row) => row.status === "published").length;
    const withAudio = rows.filter((row) => row.storage_path).length;
    const offline = rows.filter((row) => audioGroupValue(row) === "offline_shivir").length;
    return { published, withAudio, offline, total: rows.length };
  }, [rows]);

  async function handleFile(nextFile: File | null) {
    setFile(nextFile);
    setDurationSeconds(null);
    if (!nextFile) return;
    const extension = extensionFor(nextFile.name);
    if (![".mp3", ".m4a", ".aac"].includes(extension)) {
      setFile(null);
      setMessage("Please choose an MP3, M4A, or AAC file for app playback.");
      return;
    }
    const duration = await readAudioDuration(nextFile);
    if (duration) setDurationSeconds(duration);
  }

  async function applyCommonAccessKey() {
    setMessage("");
    if (!/^\d{4}$/.test(commonAccessKey)) {
      setMessage("Enter exactly four numbers for the common Sacred Access Key.");
      return;
    }
    if (!supabase) {
      setMessage("Supabase is not configured for this admin portal.");
      return;
    }

    setKeyBusy(true);
    try {
      const { data, error } = await supabase.rpc("set_common_session_access_code", {
        p_plain_code: commonAccessKey
      });
      if (error) throw error;
      setMessage(`Sacred Access Key updated for ${Number(data || 0)} locked recordings.`);
      setCommonAccessKey("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update the Sacred Access Key.");
    } finally {
      setKeyBusy(false);
    }
  }

  async function saveSessionAudio() {
    setMessage("");
    const sessionName = form.sessionName.trim();
    const sessionDate = form.sessionDate.trim();
    const audioGroup = form.audioGroup;
    const shivirLocation = form.shivirLocation.trim();

    if (!supabase) {
      setMessage("Supabase is not configured for this admin portal.");
      return;
    }
    if (sessionName.length < 2) {
      setMessage("Enter the session name first.");
      return;
    }
    if (!isValidDate(sessionDate)) {
      setMessage("Choose a valid recording date.");
      return;
    }
    if (audioGroup === "offline_shivir" && shivirLocation.length < 2) {
      setMessage("Enter the Offline Shivir location.");
      return;
    }
    if (!file && !editingRow?.storage_path) {
      setMessage("Choose the audio file to upload.");
      return;
    }

    const accessKey = form.accessKey.trim();
    if (audioGroup !== "free" && accessKey && !/^\d{4}$/.test(accessKey)) {
      setMessage("The Sacred Access Key must contain exactly 4 numbers.");
      return;
    }

    if (form.zoomLink.trim() && !isWebUrl(form.zoomLink)) {
      setMessage("Please enter a valid Zoom link beginning with https://");
      return;
    }

    const extension = file ? extensionFor(file.name) : extensionFor(editingRow?.storage_path || "recording.mp3");
    if (file && ![".mp3", ".m4a", ".aac"].includes(extension)) {
      setMessage("Please upload MP3, M4A, or AAC audio only.");
      return;
    }

    setBusy(true);
    try {
      const session = audioGroup === "free"
        ? null
        : await upsertSession(sessionName, sessionDate, form.zoomLink.trim(), audioGroup, shivirLocation, editingRow?.session_id);
      const basePath = audioGroup === "free"
        ? "public/audios/free"
        : audioGroup === "offline_shivir"
          ? `protected/offline-shivir/${slugify(shivirLocation)}`
          : "protected/online-shivir";
      const storagePath = editingRow?.storage_path || `${basePath}/${sessionDate}/${slugify(sessionName)}-${sessionDate}${extension}`;
      let finalStoragePath = storagePath;

      if (file) {
        const { data: uploadData, error: uploadError } = await supabase.functions.invoke("create-upload-url", {
          body: {
            path: storagePath,
            content_type: file.type || contentTypeFor(extension)
          }
        });
        if (uploadError) throw uploadError;
        if (!uploadData?.url) throw new Error("The upload could not be prepared. Please try again.");

        const upload = await fetch(uploadData.url, {
          method: "PUT",
          headers: { "Content-Type": file.type || contentTypeFor(extension) },
          body: file
        });
        if (!upload.ok) throw new Error("The audio file could not be uploaded.");
        finalStoragePath = uploadData.path || storagePath;
      }

      const displayDate = formatDateLabel(sessionDate);
      const audioTitle = `${sessionName} - ${displayDate}`;
      const groupLabel = audioGroupLabel({ audio_group: audioGroup } as SessionAudioRow);
      const resourcePayload = {
        title: audioTitle,
        description: `${groupLabel} recording from ${displayDate}${shivirLocation ? ` in ${shivirLocation}` : ""}.`,
        type: "audio",
        category: groupLabel,
        audio_group: audioGroup,
        recorded_at: sessionDate,
        shivir_location: audioGroup === "offline_shivir" ? shivirLocation : null,
        access_type: audioGroup === "free" ? "public" : "session_protected",
        storage_provider: "r2",
        storage_path: finalStoragePath,
        external_url: null,
        youtube_url: null,
        session_id: session?.id || null,
        duration_seconds: durationSeconds,
        is_featured: editingRow?.is_featured || false,
        display_order: -Number(sessionDate.replaceAll("-", "")),
        migration_status: "imported",
        status: "published"
      };

      let existingResourceId = editingRow?.id || null;
      if (!existingResourceId) {
        const { data: existingResource, error: existingError } = await supabase
          .from("resources")
          .select("id")
          .eq("storage_path", resourcePayload.storage_path)
          .maybeSingle();
        if (existingError) throw existingError;
        existingResourceId = existingResource?.id || null;
      }

      const write = existingResourceId
        ? supabase.from("resources").update(resourcePayload).eq("id", existingResourceId).select("id").single()
        : supabase.from("resources").insert(resourcePayload).select("id").single();
      const { error: writeError } = await write;
      if (writeError) throw writeError;

      if (accessKey && session) {
        const { error: keyError } = await supabase.rpc("create_session_access_code", {
          p_session_id: session.id,
          p_plain_code: accessKey,
          p_code_label: `${sessionName} Access Key`,
          p_starts_at: null,
          p_expires_at: null
        });
        if (keyError) throw keyError;
      }

      setMessage(editingRow ? `Updated ${audioTitle}.` : `Published ${audioTitle}.`);
      setForm(emptyForm);
      setFile(null);
      setEditingRow(null);
      setDurationSeconds(null);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save this session audio.");
    } finally {
      setBusy(false);
    }
  }

  async function upsertSession(
    sessionName: string,
    sessionDate: string,
    zoomLink: string,
    audioGroup: AudioGroup,
    shivirLocation: string,
    existingSessionId?: string | null
  ) {
    if (!supabase) throw new Error("Supabase is not configured.");
    const dayStart = `${sessionDate}T00:00:00+05:30`;
    const dayEnd = `${addDays(sessionDate, 1)}T00:00:00+05:30`;
    const sessionAtFour = `${sessionDate}T16:00:00+05:30`;

    let existing: SessionRow | null = null;
    if (existingSessionId) {
      const { data, error } = await supabase.from("sessions").select("id,title,session_date").eq("id", existingSessionId).maybeSingle();
      if (error) throw error;
      existing = data as SessionRow | null;
    } else {
      const { data, error } = await supabase
        .from("sessions")
        .select("id,title,session_date")
        .eq("title", sessionName)
        .gte("session_date", dayStart)
        .lt("session_date", dayEnd)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      existing = data as SessionRow | null;
    }

    const groupLabel = audioGroup === "offline_shivir" ? "Offline Shivir" : "Online Shivir";
    const payload = {
      title: sessionName,
      topic: sessionName,
      description: `${groupLabel} audio for ${formatDateLabel(sessionDate)}${shivirLocation ? ` in ${shivirLocation}` : ""}.`,
      session_date: sessionAtFour,
      duration_minutes: durationSeconds ? Math.max(1, Math.round(durationSeconds / 60)) : null,
      zoom_link: zoomLink || null,
      status: "completed"
    };

    if (existing?.id) {
      const { data, error } = await supabase.from("sessions").update(payload).eq("id", existing.id).select("id,title,session_date").single();
      if (error) throw error;
      return data as SessionRow;
    }

    const { data, error } = await supabase.from("sessions").insert(payload).select("id,title,session_date").single();
    if (error) throw error;
    return data as SessionRow;
  }

  async function removeAudio(row: SessionAudioRow) {
    if (!supabase || !window.confirm(`Remove "${row.title}" from the app library?`)) return;
    const { error } = await supabase.from("resources").delete().eq("id", row.id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRows((current) => current.filter((item) => item.id !== row.id));
  }

  function fillFromSession(sessionId: string) {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;
    setForm((current) => ({
      ...current,
      sessionName: session.title,
      sessionDate: dateInputValue(session.session_date)
    }));
  }

  function editAudio(row: SessionAudioRow) {
    setEditingRow(row);
    setFile(null);
    setDurationSeconds(row.duration_seconds || null);
    setMessage("");
    setForm({
      audioGroup: audioGroupValue(row),
      sessionName: row.sessions?.title || row.title.replace(/\s+-\s+\d{1,2}\s+\w+\s+\d{4}$/, ""),
      sessionDate: row.recorded_at ? dateInputValue(row.recorded_at) : row.sessions?.session_date ? dateInputValue(row.sessions.session_date) : row.created_at ? dateInputValue(row.created_at) : "",
      shivirLocation: row.shivir_location || "",
      zoomLink: row.sessions?.zoom_link || "",
      accessKey: ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearForm() {
    setForm(emptyForm);
    setFile(null);
    setDurationSeconds(null);
    setEditingRow(null);
    setMessage("");
  }

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <p className="eyebrow">Audio library</p>
          <h2>Publish an audio</h2>
          <p>Choose Free, Online Shivir or Offline Shivir. The app will organise every audio chronologically.</p>
        </div>
        <button className="button ghost" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Refresh</button>
      </div>

      <div className="three-step-strip"><span><b>1</b> Choose group</span><span><b>2</b> Add audio</span><span><b>3</b> Publish</span></div>

      <section className="card common-key-card">
        <div>
          <p className="eyebrow">Common access</p>
          <h3>Sacred Access Key</h3>
          <p>Set one four-digit key for every currently locked Online or Offline Shivir recording.</p>
        </div>
        <div className="common-key-actions">
          <input
            aria-label="Common Sacred Access Key"
            className="input"
            inputMode="numeric"
            maxLength={4}
            value={commonAccessKey}
            onChange={(event) => setCommonAccessKey(event.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="4-digit key"
          />
          <button className="button gold" disabled={keyBusy || commonAccessKey.length !== 4} onClick={() => void applyCommonAccessKey()}>
            {keyBusy ? "Applying..." : "Apply to all locked recordings"}
          </button>
        </div>
      </section>

      <section className="card simple-upload-card">
        <div className="simple-section-head">
          <div>
            <p className="eyebrow">{editingRow ? "Update" : "New recording"}</p>
            <h3>{editingRow ? "Edit audio details" : "Tell us about the audio"}</h3>
            <p>{editingRow ? "Correct the group, date or location. Choose a new file only when replacing the audio." : "Use a clear title and the actual session or recording date."}</p>
          </div>
        </div>

        <div className="form-grid simple-form-grid">
          <label>
            Audio group
            <select className="select" value={form.audioGroup} onChange={(event) => setForm({ ...form, audioGroup: event.target.value as AudioGroup, shivirLocation: event.target.value === "offline_shivir" ? form.shivirLocation : "" })}>
              <option value="free">Free</option>
              <option value="online_shivir">Online Shivir</option>
              <option value="offline_shivir">Offline Shivir</option>
            </select>
            <small>Unlocked is created automatically for each member after they enter a valid Sacred Access Key.</small>
          </label>
          <label>
            Audio or session name
            <input className="input" value={form.sessionName} onChange={(event) => setForm({ ...form, sessionName: event.target.value })} placeholder="Theta Self Healing" />
            <small>Example: Theta Self Healing</small>
          </label>
          <label>
            Recording date
            <input className="input" type="date" value={form.sessionDate} onChange={(event) => setForm({ ...form, sessionDate: event.target.value })} />
            <small>Audios are sorted newest to oldest using this date.</small>
          </label>
          {form.audioGroup === "offline_shivir" ? (
            <label className="full-field">
              Offline Shivir location
              <input className="input" value={form.shivirLocation} onChange={(event) => setForm({ ...form, shivirLocation: event.target.value })} placeholder="Example: Rishikesh, Uttarakhand" />
              <small>Members can filter Offline Shivir recordings by this location.</small>
            </label>
          ) : null}
          <div className="upload-helper">
            <div>
              <strong>{file ? file.name : editingRow?.storage_path ? "Current audio will be kept" : "Choose the audio recording"}</strong>
              <small>{durationSeconds ? `Duration: ${formatDuration(durationSeconds)}` : editingRow?.storage_path ? "Choose a new file only if you want to replace it." : "MP3, M4A or AAC files are supported."}</small>
            </div>
            <label className="button ghost upload-button">
              <Upload size={16} />
              Choose Audio
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/aac,audio/mp4,.mp3,.m4a,.aac"
                onChange={(event) => {
                  void handleFile(event.target.files?.[0] || null);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          {form.audioGroup !== "free" ? <details className="optional-details full-field">
            <summary>Optional details <span>Zoom link, access key, or existing session</span></summary>
            <div className="optional-grid">
              <label>
                Zoom link
                <input className="input" value={form.zoomLink} onChange={(event) => setForm({ ...form, zoomLink: event.target.value })} placeholder="https://zoom.us/..." />
              </label>
              <label>
                4-digit Sacred Access Key
                <input className="input" inputMode="numeric" maxLength={4} value={form.accessKey} onChange={(event) => setForm({ ...form, accessKey: event.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="Example: 1088" />
              </label>
              {sessions.length ? (
                <label className="full-field">
                  Use details from an existing session
                  <select className="select" defaultValue="" onChange={(event) => fillFromSession(event.target.value)}>
                    <option value="">Choose a session</option>
                    {sessions.map((session) => <option key={session.id} value={session.id}>{session.title} · {formatDisplayDate(session.session_date)}</option>)}
                  </select>
                </label>
              ) : null}
            </div>
          </details> : null}
          <div className="toolbar">
            <button className="button gold" disabled={busy} onClick={() => void saveSessionAudio()}>{busy ? "Saving recording..." : editingRow ? "Save changes" : "Publish recording"}</button>
            <button className="button ghost" disabled={busy} onClick={clearForm}>{editingRow ? "Cancel editing" : "Clear"}</button>
          </div>
        </div>
        {message ? <p className="admin-message">{message}</p> : null}
      </section>

      <div className="library-section-head"><div><p className="eyebrow">Audio library</p><h3>Published audios</h3></div><span>{stats.published} visible · {stats.offline} offline</span></div>
      <div className="toolbar">
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 14, color: "var(--gold)" }} />
          <input className="dark-input" style={{ width: "100%", paddingLeft: 38 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, group, date or location" />
        </div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Audio title</th>
              <th>Group</th>
              <th>Location</th>
              <th>Recording date</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.title}</strong><br /><small>{row.sessions?.title || "Standalone audio"}</small></td>
                <td><span className="status">{audioGroupLabel(row)}</span></td>
                <td>{row.shivir_location || "—"}</td>
                <td>{row.recorded_at || row.sessions?.session_date ? <span><Calendar size={14} /> {formatDisplayDate(row.recorded_at || row.sessions?.session_date || "")}</span> : "—"}</td>
                <td>{row.duration_seconds ? <span><Clock size={14} /> {formatDuration(row.duration_seconds)}</span> : "—"}</td>
                <td><span className="status">{row.status || "draft"}</span></td>
                <td><div className="row-actions compact"><button onClick={() => editAudio(row)}><Pencil size={14} /> Edit</button><button className="danger-action" aria-label={`Delete ${row.title}`} onClick={() => void removeAudio(row)}><Trash2 size={14} /></button></div></td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr><td colSpan={7}>{loading ? "Loading audios..." : "No audios uploaded yet."}</td></tr>
            ) : null}
          </tbody>
        </table>
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

function audioGroupValue(row: Pick<SessionAudioRow, "audio_group" | "access_type">): AudioGroup {
  if (row.audio_group === "offline_shivir") return "offline_shivir";
  if (row.audio_group === "online_shivir") return "online_shivir";
  return row.access_type === "public" ? "free" : "online_shivir";
}

function audioGroupLabel(row: Pick<SessionAudioRow, "audio_group" | "access_type">) {
  const value = audioGroupValue(row);
  if (value === "offline_shivir") return "Offline Shivir";
  if (value === "online_shivir") return "Online Shivir";
  return "Free";
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateInputValue(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function formatDateLabel(value: string) {
  const parsed = new Date(`${value}T00:00:00+05:30`);
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDisplayDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function extensionFor(filename: string) {
  const match = filename.toLowerCase().match(/\.(mp3|m4a|aac)$/);
  return match ? `.${match[1]}` : "";
}

function contentTypeFor(extension: string) {
  if (extension === ".m4a") return "audio/mp4";
  if (extension === ".aac") return "audio/aac";
  return "audio/mpeg";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "sacred-circle";
}

function readAudioDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    audio.src = url;
  });
}
