"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, MapPin, Pencil, RefreshCw, Search, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminLayout } from "./AdminLayout";

type Member = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  date_of_birth?: string | null;
  role: string;
  created_at?: string | null;
};

type MemberForm = Member;

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MemberForm | null>(null);
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
    const [profileResult, registrationResult] = await Promise.all([
      supabase.from("profiles").select("id,name,email,phone,city,state,date_of_birth,role,created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("session_registrations").select("user_id,status").eq("status", "registered")
    ]);
    if (profileResult.error) setMessage("The member list could not be loaded. Please try again.");
    setMembers((profileResult.data || []) as Member[]);
    const counts: Record<string, number> = {};
    for (const row of registrationResult.data || []) counts[row.user_id] = (counts[row.user_id] || 0) + 1;
    setAttendance(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((member) => `${member.name} ${member.email} ${member.phone || ""} ${member.city || ""} ${member.state || ""}`.toLowerCase().includes(needle));
  }, [members, query]);

  async function save() {
    if (!supabase || !editing) return;
    setMessage("");
    if (editing.name.trim().length < 2) {
      setMessage("Please enter the member’s name.");
      return;
    }
    if (editing.phone && !/^[0-9+()\-\s]{8,18}$/.test(editing.phone)) {
      setMessage("Please check the mobile number.");
      return;
    }
    setBusy(true);
    const payload = {
      name: editing.name.trim(),
      phone: editing.phone?.trim() || null,
      city: editing.city?.trim() || null,
      state: editing.state?.trim() || null,
      date_of_birth: editing.date_of_birth || null,
      role: editing.role
    };
    const { data, error } = await supabase.from("profiles").update(payload).eq("id", editing.id).select("id,name,email,phone,city,state,date_of_birth,role,created_at").single();
    setBusy(false);
    if (error || !data) {
      setMessage("Member details could not be saved. Please try again.");
      return;
    }
    setMembers((current) => current.map((member) => member.id === data.id ? data as Member : member));
    setEditing(null);
    setMessage("Member details updated.");
  }

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <p className="eyebrow">Members</p>
          <h2>Member directory</h2>
          <p>Members are added automatically after Google sign-in. Use this page only to correct their profile details.</p>
        </div>
        <button className="button ghost" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Refresh</button>
      </div>

      {message ? <p className="admin-message" role="status">{message}</p> : null}

      <div className="member-summary">
        <div><UsersRound size={22} /><span><strong>{members.length}</strong><small>Total members</small></span></div>
        <div><ShieldCheck size={22} /><span><strong>{members.filter((member) => member.role === "admin").length}</strong><small>Administrators</small></span></div>
        <p>No manual account creation is needed—new members appear here after their first sign-in.</p>
      </div>

      <div className="library-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, phone or city" />
        </label>
        <span className="item-count">{filtered.length} shown</span>
      </div>

      <div className="card table-wrap member-table">
        <table>
          <thead><tr><th>Member</th><th>Contact</th><th>Location</th><th>Sessions</th><th></th></tr></thead>
          <tbody>
            {filtered.map((member) => (
              <tr key={member.id}>
                <td><div className="member-name"><span>{initials(member.name || member.email)}</span><div><strong>{member.name || "Name not added"}</strong><small>{member.role === "admin" ? "Administrator" : "Member"}</small></div></div></td>
                <td><strong>{member.email}</strong><br /><small>{member.phone || "No mobile number"}</small></td>
                <td>{member.city || member.state ? <span className="inline-icon"><MapPin size={15} /> {[member.city, member.state].filter(Boolean).join(", ")}</span> : <small>Not added</small>}</td>
                <td><span className="inline-icon"><CalendarCheck size={15} /> {attendance[member.id] || 0}</span></td>
                <td><button className="icon-text-button" onClick={() => { setMessage(""); setEditing({ ...member }); }}><Pencil size={15} /> Edit</button></td>
              </tr>
            ))}
            {!filtered.length ? <tr><td colSpan={5}>{loading ? "Loading members..." : "No members match your search."}</td></tr> : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="modal-backdrop" role="presentation">
          <div className="card modal simple-modal" role="dialog" aria-modal="true" aria-label="Edit member">
            <div className="modal-title-row">
              <div><p className="eyebrow">Member profile</p><h3>Edit details</h3></div>
              <button className="modal-close" aria-label="Close" onClick={() => setEditing(null)}>×</button>
            </div>
            <div className="member-edit-header"><span>{initials(editing.name || editing.email)}</span><div><strong>{editing.email}</strong><small>Email comes from Google sign-in and cannot be changed here.</small></div></div>
            <div className="guided-form-grid">
              <label className="full-field"><span>Full name</span><input className="input" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label>
              <label><span>Mobile number</span><input className="input" inputMode="tel" value={editing.phone || ""} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} /></label>
              <label><span>Date of birth</span><input className="input" type="date" value={editing.date_of_birth || ""} onChange={(event) => setEditing({ ...editing, date_of_birth: event.target.value })} /></label>
              <label><span>City</span><input className="input" value={editing.city || ""} onChange={(event) => setEditing({ ...editing, city: event.target.value })} /></label>
              <label><span>State</span><input className="input" value={editing.state || ""} onChange={(event) => setEditing({ ...editing, state: event.target.value })} /></label>
              <label className="toggle-field full-field">
                <input type="checkbox" checked={editing.role === "admin"} onChange={(event) => setEditing({ ...editing, role: event.target.checked ? "admin" : "user" })} />
                <span><strong>Allow access to this admin portal</strong><small>Keep this off for regular members.</small></span>
              </label>
            </div>
            {message ? <p className="admin-message" role="alert">{message}</p> : null}
            <div className="modal-actions"><button className="button ghost" onClick={() => setEditing(null)}>Cancel</button><button className="button gold" disabled={busy} onClick={() => void save()}>{busy ? "Saving..." : "Save member"}</button></div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || <UserRound size={16} />;
}
