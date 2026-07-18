"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getYouTubeThumbnailUrl,
  isValidSacredAccessKey,
  normalizeSacredAccessKey,
  SACRED_KEY_LENGTH
} from "@sacred-circle/lib";
import { CalendarPlus, Download, KeyRound, Music2, Plus, Search, ShieldCheck, Trash2, Upload, Video } from "lucide-react";
import { FieldConfig, ModuleConfig } from "@/lib/adminConfig";
import { supabase } from "@/lib/supabase";
import { AdminLayout } from "./AdminLayout";

type RelationOption = { value: string; label: string; row?: any };

function newRow(config: ModuleConfig, preset?: "next-sunday" | "public-audio" | "protected-recording") {
  const row: Record<string, any> = {};
  for (const field of config.fields) {
    if (field.type === "boolean") row[field.key] = false;
    else if (field.type === "number") row[field.key] = 0;
    else row[field.key] = "";
  }

  if (config.table === "sessions") {
    return {
      ...row,
      title: "Sunday Meditation and Healing",
      topic: "Guided meditation, healing and spiritual wisdom",
      description: "Join our live Sunday session for guided meditation, healing energy and simple spiritual wisdom.",
      session_date: nextSundayAtFour(),
      duration_minutes: 60,
      status: "upcoming"
    };
  }

  if (config.table === "resources") {
    const protectedRecording = preset === "protected-recording";
    return {
      ...row,
      title: protectedRecording ? "Sunday Healing Recording" : "Morning Healing Meditation",
      description: protectedRecording
        ? "Protected Healing Recording. This audio is reserved for participants of the live Sunday session."
        : "A gentle public meditation for calm, clarity and inner balance.",
      type: "audio",
      category: protectedRecording ? "Online Shivir" : "Free",
      audio_group: protectedRecording ? "online_shivir" : "free",
      recorded_at: new Date().toISOString().slice(0, 10),
      shivir_location: null,
      access_type: protectedRecording ? "session_protected" : "public",
      storage_provider: "r2",
      duration_seconds: protectedRecording ? 3600 : 1200,
      is_featured: !protectedRecording,
      display_order: 0,
      migration_status: "ready",
      status: "published"
    };
  }

  if (config.table === "videos") {
    return {
      ...row,
      category: "Spirituality",
      display_order: 0,
      migration_status: "ready",
      status: "published"
    };
  }

  if (config.table === "events") return { ...row, registration_enabled: true, migration_status: "ready", status: "published" };
  if (config.table === "announcements") return { ...row, target_type: "all", is_active: true };
  if (config.table === "session_access_codes") return { ...row, code_label: "Sunday Sacred Access Key", is_active: true };
  if (["pages", "programs"].includes(config.table)) return { ...row, migration_status: "ready", status: "published" };
  return row;
}

export function CrudPage({ config, configs }: { config: ModuleConfig; configs?: ModuleConfig[] }) {
  const [activeTable, setActiveTable] = useState(config.table);
  const activeConfig = configs?.find((item) => item.table === activeTable) || config;
  const [rows, setRows] = useState<any[]>(config.demoRows);
  const [relationOptions, setRelationOptions] = useState<Record<string, RelationOption[]>>({});
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    async function load() {
      setRows(activeConfig.demoRows);
      if (!supabase) return;
      const request = applyDefaultOrder(supabase.from(activeConfig.table).select("*").limit(250), activeConfig.table);
      const { data, error } = await request;
      if (!error && data) setRows(data);
    }
    load();
  }, [activeConfig]);

  useEffect(() => {
    async function loadRelations() {
      const relationFields = activeConfig.fields.filter((field) => field.relation);
      if (!relationFields.length) {
        setRelationOptions({});
        return;
      }

      const next: Record<string, RelationOption[]> = {};
      await Promise.all(relationFields.map(async (field) => {
        if (!field.relation) return;
        if (!supabase) {
          next[field.key] = demoRelationOptions(field);
          return;
        }

        let query = supabase.from(field.relation.table).select("*").limit(250);
        if (field.relation.orderKey) query = query.order(field.relation.orderKey, { ascending: true });
        const { data } = await query;
        next[field.key] = (data || []).map((row: any) => ({
          value: String(row[field.relation!.valueKey] || ""),
          label: field.relation!.labelKeys.map((key) => formatRelationLabelValue(row[key])).filter(Boolean).join(" · ") || String(row[field.relation!.valueKey] || ""),
          row
        }));
      }));
      setRelationOptions(next);
    }

    loadRelations();
  }, [activeConfig]);

  const filtered = useMemo(() => rows.filter((row) => {
    if (!query) return true;
    return JSON.stringify(row).toLowerCase().includes(query.toLowerCase());
  }), [rows, query]);

  function startNew(preset?: "next-sunday" | "public-audio" | "protected-recording") {
    setEditing(newRow(activeConfig, preset));
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      const payload = { ...editing };
      for (const field of activeConfig.fields) {
        if (field.type === "number") payload[field.key] = payload[field.key] === "" ? null : Number(payload[field.key]);
        if (payload[field.key] === "") payload[field.key] = null;
      }

      if (activeConfig.table === "resources" && payload.access_type === "session_protected" && !payload.session_id) {
        throw new Error("Protected Sunday recordings must be linked to the correct Sunday session first.");
      }
      if (activeConfig.table === "resources" && payload.audio_group === "offline_shivir" && !String(payload.shivir_location || "").trim()) {
        throw new Error("Offline Shivir audio requires a location.");
      }
      if (activeConfig.table === "resources" && payload.type === "audio") {
        if (payload.audio_group === "free") payload.access_type = "public";
        if (["online_shivir", "offline_shivir"].includes(payload.audio_group)) payload.access_type = "session_protected";
        payload.category = payload.audio_group === "offline_shivir" ? "Offline Shivir" : payload.audio_group === "online_shivir" ? "Online Shivir" : "Free";
      }
      if (activeConfig.table === "session_access_codes" && (!payload.id || payload.__plain_code) && !isValidSacredAccessKey(String(payload.__plain_code || ""))) {
        throw new Error("The Sacred Access Key must contain exactly 6 numbers.");
      }

      if (activeConfig.table === "videos" && payload.youtube_url) {
        payload.thumbnail_url = getYouTubeThumbnailUrl(payload.youtube_url, "hqdefault") || payload.thumbnail_url || null;
      }
      if (!supabase) {
        setRows((current) => {
          if (payload.id) return current.map((row) => row.id === payload.id ? payload : row);
          return [{ ...payload, id: "demo-" + Date.now() }, ...current];
        });
      } else if (activeConfig.table === "session_access_codes" && payload.__plain_code) {
        const { data, error } = await supabase.rpc("create_session_access_code", {
          p_session_id: payload.session_id,
          p_plain_code: payload.__plain_code,
          p_code_label: payload.code_label,
          p_starts_at: payload.starts_at,
          p_expires_at: payload.expires_at
        });
        if (error) throw error;
        const { data: created } = await supabase.from("session_access_codes").select("*").eq("id", data).single();
        if (created) setRows((current) => [created, ...current]);
      } else {
        delete payload.__plain_code;
        const { data, error } = await supabase.from(activeConfig.table).upsert(payload).select("*").single();
        if (error) throw error;
        setRows((current) => current.some((row) => row.id === data.id) ? current.map((row) => row.id === data.id ? data : row) : [data, ...current]);
      }
      setEditing(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to save this record.");
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
    const { error } = await supabase.from(activeConfig.table).delete().eq("id", row.id);
    if (!error) setRows((current) => current.filter((item) => item.id !== row.id));
  }

  function exportCsv() {
    const header = activeConfig.columns.join(",");
    const lines = filtered.map((row) => activeConfig.columns.map((column) => JSON.stringify(row[column] ?? "")).join(","));
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = activeConfig.table + ".csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function uploadResourceFile(file: File) {
    if (!editing || activeConfig.table !== "resources") return;
    if (!supabase) {
      window.alert("Upload URLs require Supabase and the create-upload-url Edge Function.");
      return;
    }
    if (editing.access_type === "session_protected" && !editing.session_id) {
      window.alert("Please link this protected recording to the correct Sunday session before uploading audio.");
      return;
    }

    const storagePath = editing.storage_path || defaultStoragePath(editing, file, relationOptions.session_id || []);
    setUploadBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-upload-url", {
        body: {
          path: storagePath,
          content_type: file.type || "application/octet-stream"
        }
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Upload URL was not returned.");

      const upload = await fetch(data.url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file
      });
      if (!upload.ok) throw new Error("R2 upload failed.");

      setEditing({
        ...editing,
        storage_provider: "r2",
        storage_path: data.path || storagePath,
        external_url: null,
        youtube_url: null
      });
      window.alert("Upload complete. Review the metadata, then save this meditation.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to upload this file.");
    } finally {
      setUploadBusy(false);
    }
  }

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <p className="eyebrow">{activeConfig.eyebrow}</p>
          <h2>{activeConfig.title}</h2>
          <p>{activeConfig.description}</p>
        </div>
        <button className="button gold" onClick={() => startNew(activeConfig.table === "sessions" ? "next-sunday" : undefined)}>
          {activeConfig.table === "sessions" ? <CalendarPlus size={16} /> : <Plus size={16} />}
          {activeConfig.table === "sessions" ? "Next Sunday Session" : "New"}
        </button>
      </div>
      <ModuleGuide table={activeConfig.table} onCreate={startNew} />
      {configs?.length ? (
        <div className="tab-row">
          {configs.map((item) => (
            <button key={item.table} className={item.table === activeConfig.table ? "tab active" : "tab"} onClick={() => setActiveTable(item.table)}>
              {item.title}
            </button>
          ))}
        </div>
      ) : null}
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
              {activeConfig.columns.map((column) => <th key={column}>{column.replaceAll("_", " ")}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr key={row.id || index}>
                {activeConfig.columns.map((column) => <td key={column}>{formatCell(row[column])}</td>)}
                <td>
                  <button className="button ghost" onClick={() => setEditing(row)}>Edit</button>{" "}
                  <button className="button ghost" onClick={() => remove(row)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr><td colSpan={activeConfig.columns.length + 1}>No records yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {editing ? (
        <div className="modal-backdrop">
          <div className="cream-card modal">
            <h3>{editing.id ? "Edit " + activeConfig.title : "New " + activeConfig.title}</h3>
            <div className="form-grid">
              {activeConfig.fields.map((field) => (
                <label key={field.key}>
                  {field.label}
                  {renderField(field, editing, setEditing, relationOptions[field.key] || [])}
                  {field.helper ? <small>{field.helper}</small> : null}
                </label>
              ))}
              {activeConfig.table === "videos" ? (
                <YouTubeThumbnailTool editing={editing} setEditing={setEditing} />
              ) : null}
              {activeConfig.table === "resources" ? (
                <div className="upload-helper">
                  <div>
                    <strong>Upload audio to Cloudflare R2</strong>
                    <small>Use MP3/AAC only. Protected session recordings must be linked to a session before users can play them.</small>
                  </div>
                  <label className="button ghost upload-button">
                    <Upload size={16} />
                    {uploadBusy ? "Uploading..." : "Choose Audio"}
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/aac,audio/mp4,.mp3,.m4a,.aac"
                      disabled={uploadBusy}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) uploadResourceFile(file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              ) : null}
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

function YouTubeThumbnailTool({ editing, setEditing }: { editing: any; setEditing: (next: any) => void }) {
  const thumbnail = getYouTubeThumbnailUrl(editing.youtube_url, "hqdefault");
  return (
    <div className="youtube-thumb-tool">
      <div>
        <strong>Original YouTube thumbnail</strong>
        <small>The app will use YouTube&apos;s real thumbnail for this video. No AI/generated artwork is used.</small>
      </div>
      {thumbnail ? <img src={thumbnail} alt="YouTube thumbnail preview" /> : <span className="thumb-empty">Paste a YouTube URL</span>}
      <button
        className="button ghost"
        type="button"
        disabled={!thumbnail}
        onClick={() => setEditing({ ...editing, thumbnail_url: thumbnail })}
      >
        Use this thumbnail
      </button>
    </div>
  );
}

function ModuleGuide({
  table,
  onCreate
}: {
  table: string;
  onCreate: (preset?: "next-sunday" | "public-audio" | "protected-recording") => void;
}) {
  if (table === "sessions") {
    return (
      <div className="workflow-card">
        <div className="workflow-step">
          <CalendarPlus size={20} />
          <strong>1. Create Sunday session</strong>
          <span>Date defaults to next Sunday at 4:00 PM IST. Add the Zoom link before publishing.</span>
        </div>
        <div className="workflow-step">
          <KeyRound size={20} />
          <strong>2. Add Sacred Access Key</strong>
          <span>The key authorizes this Sunday recording and must be entered for each new playback.</span>
        </div>
        <div className="workflow-step">
          <Music2 size={20} />
          <strong>3. Upload protected audio</strong>
          <span>Go to Media Library and choose Protected Sunday Recording. The R2 path uses the session date.</span>
        </div>
      </div>
    );
  }

  if (table === "resources") {
    return (
      <div className="workflow-card split">
        <div className="workflow-step">
          <Music2 size={20} />
          <strong>Audio workflow</strong>
          <span>Use Public Audio for free meditations. Use Protected Sunday Recording for live-session healing audio.</span>
        </div>
        <div className="workflow-actions">
          <button className="button ghost" onClick={() => onCreate("public-audio")}><Music2 size={16} /> Public Audio</button>
          <button className="button gold" onClick={() => onCreate("protected-recording")}><ShieldCheck size={16} /> Protected Sunday Recording</button>
        </div>
      </div>
    );
  }

  if (table === "videos") {
    return (
      <div className="workflow-card split">
        <div className="workflow-step">
          <Video size={20} />
          <strong>YouTube only</strong>
          <span>Paste the YouTube URL. The app stores the link and uses YouTube&apos;s original thumbnail.</span>
        </div>
        <div className="workflow-actions">
          <button className="button gold" onClick={() => onCreate()}><Plus size={16} /> Add YouTube Video</button>
        </div>
      </div>
    );
  }

  return null;
}

function renderField(field: FieldConfig, editing: any, setEditing: (next: any) => void, relationOptions: RelationOption[] = []) {
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
  if (field.type === "relation") {
    return (
      <select className="select" value={value || ""} onChange={(event) => update(event.target.value || null)}>
        <option value="">Select</option>
        {relationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  }
  if (field.key === "__plain_code") {
    return <input className="input" type="text" inputMode="numeric" maxLength={SACRED_KEY_LENGTH} pattern="[0-9]{6}" value={value || ""} onChange={(event) => update(normalizeSacredAccessKey(event.target.value))} />;
  }
  return <input className="input" type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"} value={formatInputValue(field, value)} onChange={(event) => update(event.target.value)} />;
}

function demoRelationOptions(field: FieldConfig) {
  if (field.relation?.table === "sessions") {
    return [
      { value: "20000000-0000-4000-8000-000000000001", label: "Sunday Meditation and Healing" },
      { value: "20000000-0000-4000-8000-000000000002", label: "Fear Release Healing Session" },
      { value: "20000000-0000-4000-8000-000000000003", label: "Relationship Healing Circle" }
    ];
  }
  if (field.relation?.table === "profiles") {
    return [{ value: "00000000-0000-4000-8000-000000000001", label: "Sacred Seeker · seeker@sacredcircle.local" }];
  }
  return [];
}

function applyDefaultOrder(query: any, table: string) {
  if (table === "sessions") return query.order("session_date", { ascending: false });
  if (table === "resources") return query.order("recorded_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  if (["videos", "programs"].includes(table)) return query.order("display_order", { ascending: true });
  if (table === "events") return query.order("event_date", { ascending: false });
  if (table === "app_settings") return query.order("key", { ascending: true });
  if (table === "announcements") return query.order("created_at", { ascending: false });
  return query;
}

function nextSundayAtFour() {
  const date = new Date();
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  date.setDate(date.getDate() + daysUntilSunday);
  date.setHours(16, 0, 0, 0);
  return toDatetimeLocal(date);
}

function toDatetimeLocal(value: Date) {
  const pad = (next: number) => String(next).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function formatInputValue(field: FieldConfig, value: any) {
  if (!value) return "";
  if (field.type === "datetime") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return toDatetimeLocal(parsed);
    return String(value).slice(0, 16);
  }
  if (field.type === "date") return String(value).slice(0, 10);
  return value;
}

function formatRelationLabelValue(value: any) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    }
  }
  return String(value);
}

function dateKey(value: any) {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  const pad = (next: number) => String(next).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

function defaultStoragePath(editing: any, file: File, sessionOptions: RelationOption[] = []) {
  const extension = extensionFor(file.name);
  const title = slugify(editing.title || file.name.replace(/\.[^.]+$/, "") || "sacred-circle-audio");
  if (editing.audio_group === "offline_shivir") {
    return `protected/offline-shivir/${slugify(editing.shivir_location || "location")}/${dateKey(editing.recorded_at)}/${title}${extension}`;
  }
  if (editing.audio_group === "online_shivir") {
    return `protected/online-shivir/${dateKey(editing.recorded_at)}/${title}${extension}`;
  }
  if (editing.access_type === "session_protected") {
    const linkedSession = sessionOptions.find((option) => option.value === editing.session_id)?.row;
    const day = dateKey(linkedSession?.session_date);
    return `protected/online-shivir/${day}/${title}${extension}`;
  }
  return `public/audios/free/${dateKey(editing.recorded_at)}/${title}${extension}`;
}

function extensionFor(filename: string) {
  const match = filename.toLowerCase().match(/\.(mp3|m4a|aac)$/);
  return match ? `.${match[1]}` : ".mp3";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "sacred-circle";
}

function formatCell(value: any) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return <span className="status">{value ? "Yes" : "No"}</span>;
  if (Array.isArray(value)) return value.join(", ");
  const text = String(value);
  return text.length > 110 ? text.slice(0, 110) + "..." : text;
}
