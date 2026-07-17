"use client";

import { getYouTubeThumbnailUrl } from "@sacred-circle/lib";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, RefreshCw, Search, Trash2, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminLayout } from "./AdminLayout";

type VideoRow = {
  id: string;
  title: string;
  description?: string | null;
  youtube_url: string;
  thumbnail_url?: string | null;
  category?: string | null;
  display_order?: number | null;
  source_url?: string | null;
  migration_status?: string | null;
  status: string;
};

type VideoForm = {
  id?: string;
  title: string;
  description: string;
  youtubeUrl: string;
  category: string;
  published: boolean;
  displayOrder: number;
};

const categories = ["Spirituality", "Healing", "Meditation", "Relationships", "Manifestation"];

const emptyForm: VideoForm = {
  title: "",
  description: "",
  youtubeUrl: "",
  category: "Spirituality",
  published: true,
  displayOrder: 0
};

export function VideoAdminPage() {
  const [rows, setRows] = useState<VideoRow[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<VideoForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    if (!supabase) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("videos").select("*").order("display_order", { ascending: true }).limit(500);
    if (error) setMessage("The video list could not be loaded. Please try again.");
    setRows((data || []) as VideoRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => `${row.title} ${row.description || ""} ${row.category || ""}`.toLowerCase().includes(needle));
  }, [query, rows]);

  const thumbnail = editing?.youtubeUrl ? getYouTubeThumbnailUrl(editing.youtubeUrl, "hqdefault") : null;

  function startNew() {
    const nextOrder = rows.reduce((highest, row) => Math.max(highest, Number(row.display_order) || 0), 0) + 1;
    setMessage("");
    setEditing({ ...emptyForm, displayOrder: nextOrder });
  }

  function startEdit(row: VideoRow) {
    setMessage("");
    setEditing({
      id: row.id,
      title: row.title,
      description: row.description || "",
      youtubeUrl: row.youtube_url,
      category: row.category || "Spirituality",
      published: row.status === "published",
      displayOrder: Number(row.display_order) || 0
    });
  }

  async function save() {
    if (!editing || !supabase) return;
    setMessage("");
    if (editing.title.trim().length < 3) {
      setMessage("Please enter a clear video title.");
      return;
    }
    const nextThumbnail = getYouTubeThumbnailUrl(editing.youtubeUrl.trim(), "hqdefault");
    if (!nextThumbnail) {
      setMessage("Please paste a valid YouTube video link.");
      return;
    }

    setBusy(true);
    const payload = {
      title: editing.title.trim(),
      description: editing.description.trim() || null,
      youtube_url: editing.youtubeUrl.trim(),
      thumbnail_url: nextThumbnail,
      category: editing.category,
      display_order: editing.displayOrder,
      source_url: editing.youtubeUrl.trim(),
      migration_status: "ready",
      status: editing.published ? "published" : "draft"
    };
    const request = editing.id
      ? supabase.from("videos").update(payload).eq("id", editing.id).select("*").single()
      : supabase.from("videos").insert(payload).select("*").single();
    const { data, error } = await request;
    setBusy(false);
    if (error || !data) {
      setMessage("This video could not be saved. Please try again.");
      return;
    }
    setRows((current) => current.some((row) => row.id === data.id)
      ? current.map((row) => row.id === data.id ? data as VideoRow : row)
      : [...current, data as VideoRow]);
    setEditing(null);
    setMessage(`“${data.title}” is now ${data.status === "published" ? "visible in the app" : "saved as a draft"}.`);
  }

  async function toggleVisibility(row: VideoRow) {
    if (!supabase) return;
    const nextStatus = row.status === "published" ? "draft" : "published";
    const { data, error } = await supabase.from("videos").update({ status: nextStatus }).eq("id", row.id).select("*").single();
    if (error || !data) {
      setMessage("The video visibility could not be changed.");
      return;
    }
    setRows((current) => current.map((item) => item.id === row.id ? data as VideoRow : item));
    setMessage(nextStatus === "published" ? "Video is now visible in the app." : "Video is now hidden from the app.");
  }

  async function remove(row: VideoRow) {
    if (!supabase || !window.confirm(`Permanently delete “${row.title}”?`)) return;
    const { error } = await supabase.from("videos").delete().eq("id", row.id);
    if (error) {
      setMessage("The video could not be deleted.");
      return;
    }
    setRows((current) => current.filter((item) => item.id !== row.id));
    setMessage("Video deleted.");
  }

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <p className="eyebrow">Video library</p>
          <h2>Manage YouTube videos</h2>
          <p>Paste a YouTube link, add a title and choose a category. The thumbnail is added automatically.</p>
        </div>
        <button className="button gold" onClick={startNew}><Plus size={17} /> Add video</button>
      </div>

      <div className="three-step-strip">
        <span><b>1</b> Paste YouTube link</span>
        <span><b>2</b> Add title and category</span>
        <span><b>3</b> Publish</span>
      </div>

      {message ? <p className="admin-message" role="status">{message}</p> : null}

      <div className="library-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search videos" />
        </label>
        <button className="icon-text-button" onClick={() => void load()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
        <span className="item-count">{filtered.length} {filtered.length === 1 ? "video" : "videos"}</span>
      </div>

      <div className="content-list">
        {filtered.map((row) => (
          <article className="content-row" key={row.id}>
            <div className="video-thumb">
              {row.thumbnail_url ? <img src={row.thumbnail_url} alt="" /> : <Video size={28} />}
            </div>
            <div className="content-row-copy">
              <div><span className={row.status === "published" ? "status" : "status status-muted"}>{row.status === "published" ? "Visible" : "Hidden"}</span><span className="category-pill">{row.category || "Uncategorised"}</span></div>
              <h3>{row.title}</h3>
              <p>{row.description || "No description added."}</p>
            </div>
            <div className="row-actions">
              <button onClick={() => startEdit(row)}><Pencil size={16} /> Edit</button>
              <button onClick={() => void toggleVisibility(row)}>{row.status === "published" ? <EyeOff size={16} /> : <Eye size={16} />}{row.status === "published" ? "Hide" : "Show"}</button>
              <button className="danger-action" aria-label={`Delete ${row.title}`} onClick={() => void remove(row)}><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
        {!filtered.length ? <div className="empty-state"><Video size={30} /><h3>{loading ? "Loading videos..." : "No videos found"}</h3><p>{loading ? "Please wait a moment." : "Add the first YouTube video or try another search."}</p></div> : null}
      </div>

      {editing ? (
        <div className="modal-backdrop" role="presentation">
          <div className="card modal simple-modal" role="dialog" aria-modal="true" aria-label={editing.id ? "Edit video" : "Add video"}>
            <div className="modal-title-row">
              <div><p className="eyebrow">{editing.id ? "Update" : "New video"}</p><h3>{editing.id ? "Edit video details" : "Add a YouTube video"}</h3></div>
              <button className="modal-close" aria-label="Close" onClick={() => setEditing(null)}>×</button>
            </div>
            <div className="guided-form-grid">
              <label className="full-field">
                <span>YouTube video link <b>Required</b></span>
                <input className="input" value={editing.youtubeUrl} onChange={(event) => setEditing({ ...editing, youtubeUrl: event.target.value })} placeholder="https://www.youtube.com/watch?v=..." autoFocus />
                <small>Copy the link directly from YouTube.</small>
              </label>
              <div className="video-preview full-field">
                {thumbnail ? <img src={thumbnail} alt="YouTube thumbnail preview" /> : <div><Video size={26} /><span>The YouTube thumbnail will appear here</span></div>}
              </div>
              <label className="full-field">
                <span>Video title <b>Required</b></span>
                <input className="input" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} placeholder="Enter the title shown in the app" />
              </label>
              <label>
                <span>Category</span>
                <select className="select" value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="toggle-field">
                <input type="checkbox" checked={editing.published} onChange={(event) => setEditing({ ...editing, published: event.target.checked })} />
                <span><strong>Show in the app</strong><small>Turn this off to save without publishing.</small></span>
              </label>
              <label className="full-field">
                <span>Short description <em>Optional</em></span>
                <textarea className="textarea" value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} placeholder="One or two lines about this video" />
              </label>
            </div>
            {message ? <p className="admin-message" role="alert">{message}</p> : null}
            <div className="modal-actions">
              <button className="button ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
              <button className="button gold" onClick={() => void save()} disabled={busy}>{busy ? "Saving..." : editing.published ? "Publish video" : "Save draft"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
