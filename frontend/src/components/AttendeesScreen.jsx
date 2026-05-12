import { useState, useEffect } from "react";
import supabase from "../supabase";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

  @keyframes att-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .att-root {
    animation: att-fadein 0.3s ease;
    font-family: 'DM Sans', system-ui, 'Segoe UI', sans-serif;
  }

  @keyframes att-spin { to { transform: rotate(360deg); } }
  .att-spinner {
    width: 15px; height: 15px;
    border: 2px solid #e2e0e5;
    border-top-color: #1a2e22;
    border-radius: 50%;
    animation: att-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* Inputs */
  .att-input {
    width: 100%;
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid #e2e0e5;
    background: #fafaf9;
    font-size: 13px;
    color: #1a2e22;
    font-family: 'DM Sans', system-ui, sans-serif;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .att-input:focus {
    border-color: rgba(195,152,83,0.6);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(195,152,83,0.08);
  }
  .att-input::placeholder { color: #c4bfca; }

  /* Inline edit input (inside table cell) */
  .att-input-inline {
    width: 100%;
    padding: 7px 10px;
    border-radius: 8px;
    border: 1px solid #e2e0e5;
    background: #fafaf9;
    font-size: 13px;
    color: #1a2e22;
    font-family: 'DM Sans', system-ui, sans-serif;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .att-input-inline:focus {
    border-color: rgba(195,152,83,0.6);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(195,152,83,0.08);
  }
  .att-input-inline::placeholder { color: #c4bfca; }

  /* Table rows */
  .att-row { transition: background 0.12s; }
  .att-row:hover td { background: #faf9f7 !important; }
  .att-row.editing td { background: rgba(195,152,83,0.04) !important; }
  .att-row:last-child td { border-bottom: none !important; }

  /* Buttons */
  .att-btn-primary {
    background: #1a2e22;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.15s;
    width: 100%;
  }
  .att-btn-primary:hover { opacity: 0.86; }

  .att-btn-save {
    background: rgba(195,152,83,0.12);
    color: #a07830;
    border: 1px solid rgba(195,152,83,0.35);
    border-radius: 8px;
    padding: 6px 13px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
  }
  .att-btn-save:hover { background: rgba(195,152,83,0.2); }

  .att-btn-cancel {
    background: transparent;
    color: #b0adb5;
    border: 1px solid #e2e0e5;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
  }
  .att-btn-cancel:hover { background: #f4f5f2; color: #7a7585; }

  .att-btn-edit {
    background: transparent;
    color: #b0adb5;
    border: 1px solid #e2e0e5;
    border-radius: 8px;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .att-btn-edit:hover {
    background: #f4f5f2;
    color: #1a2e22;
    border-color: #c8c5cc;
  }

  .att-btn-delete {
    background: transparent;
    color: #d1cdd7;
    border: none;
    border-radius: 8px;
    padding: 5px 8px;
    font-size: 13px;
    cursor: pointer;
    font-family: 'DM Sans', system-ui, sans-serif;
    line-height: 1;
    transition: color 0.15s, background 0.15s;
  }
  .att-btn-delete:hover {
    color: #dc2626;
    background: rgba(220,38,38,0.06);
  }

  /* Alias tag */
  .att-alias-tag {
    display: inline-block;
    background: #f2f1f4;
    border: 1px solid #e8e7ea;
    border-radius: 5px;
    padding: 1px 7px;
    font-size: 11px;
    color: #7a7585;
    margin: 1px 2px;
    font-family: ui-monospace, Consolas, monospace;
  }

  /* Count badge */
  .att-count-badge {
    font-size: 11px;
    font-weight: 600;
    color: #a07830;
    background: rgba(195,152,83,0.12);
    border: 1px solid rgba(195,152,83,0.3);
    border-radius: 20px;
    padding: 2px 9px;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  /* Mobile responsive form */
  @media (max-width: 640px) {
    .att-add-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

const Dash = () => <span style={{ color: "#d1cdd7" }}>—</span>;

function AttendeesScreen() {
  const [token, setToken] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newAttendee, setNewAttendee] = useState({ name: "", email: "", role: "", aliases: "" });

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token);
    });
  }, []);

  const fetchAttendees = async () => {
    const res = await fetch(`${API}/get-attendees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setAttendees(data.attendees || []);
    setLoading(false);
  };

  useEffect(() => { if (token) fetchAttendees(); }, [token]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this attendee?")) return;
    await fetch(`${API}/delete-attendee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, attendee_id: id }),
    });
    fetchAttendees();
  };

  const handleEdit = (a) => {
    setEditingId(a.id);
    setEditForm({
      name: a.name,
      email: a.email || "",
      role: a.role || "",
      aliases: (a.aliases || []).join(", "),
    });
  };

  const handleUpdate = async (id) => {
    await fetch(`${API}/update-attendee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        attendee_id: id,
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        aliases: editForm.aliases.split(",").map(a => a.trim()).filter(Boolean),
      }),
    });
    setEditingId(null);
    fetchAttendees();
  };

  const handleAdd = async () => {
    if (!newAttendee.name) return alert("Name is required!");
    await fetch(`${API}/save-attendee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        name: newAttendee.name,
        email: newAttendee.email,
        role: newAttendee.role,
        aliases: newAttendee.aliases.split(",").map(a => a.trim()).filter(Boolean),
      }),
    });
    setNewAttendee({ name: "", email: "", role: "", aliases: "" });
    fetchAttendees();
  };

  // ── Shared tokens ──
  const card = {
    background: "#fff",
    border: "1px solid #e8e7ea",
    borderRadius: "16px",
    boxShadow: "rgba(26,46,34,0.06) 0 8px 24px -4px, rgba(0,0,0,0.03) 0 2px 6px -1px",
    marginBottom: "14px",
  };

  const sectionLabel = {
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    color: "#b0adb5",
    marginBottom: "14px",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  };

  const th = {
    textAlign: "left",
    fontSize: "10.5px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#b0adb5",
    padding: "11px 18px",
    borderBottom: "1px solid #e8e7ea",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: "#faf9f7",
  };

  const td = {
    padding: "13px 18px",
    fontSize: "13px",
    borderBottom: "1px solid #f0eff2",
    verticalAlign: "middle",
    color: "#7a7585",
  };

  if (loading) return (
    <>
      <style>{css}</style>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "10px", height: "100vh",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#7a7585", background: "#f4f5f2",
        fontSize: "13px",
      }}>
        <div className="att-spinner" />
        Loading attendees…
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="att-root" style={{
        minHeight: "100vh",
        background: "#f4f5f2",
        padding: "28px 20px 48px",
        color: "#7a7585",
        boxSizing: "border-box",
      }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h1 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "26px",
                fontWeight: "400",
                color: "#1a2e22",
                letterSpacing: "-0.4px",
                margin: 0,
              }}>
                Attendees
              </h1>
              {attendees.length > 0 && (
                <span className="att-count-badge">{attendees.length}</span>
              )}
            </div>
            <p style={{ fontSize: "13px", color: "#a09aaa", margin: 0 }}>
              Save recurring attendees so they're recognized automatically in your meeting notes.
            </p>
          </div>

          {/* ── Add form card ── */}
          <div style={{ ...card, padding: "20px 22px" }}>
            <div style={sectionLabel}>Add attendee</div>

            {/* 2-col grid for the 4 fields, button full-width below */}
            <div
              className="att-add-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              {[
                { key: "name",    label: "Name *",                   placeholder: "Jane Smith" },
                { key: "email",   label: "Email",                    placeholder: "jane@example.com" },
                { key: "role",    label: "Role",                     placeholder: "Designer" },
                { key: "aliases", label: "Aliases (comma-separated)", placeholder: "J, Janie" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{
                    fontSize: "11px", fontWeight: "500", color: "#9ca3a8",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}>
                    {label}
                  </label>
                  <input
                    className="att-input"
                    placeholder={placeholder}
                    value={newAttendee[key]}
                    onChange={e => setNewAttendee({ ...newAttendee, [key]: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                  />
                </div>
              ))}
            </div>

            <button className="att-btn-primary" onClick={handleAdd}>
              + Add attendee
            </button>
          </div>

          {/* ── Attendees table ── */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            {attendees.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "48px 20px",
                color: "#b0adb5", fontSize: "14px",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>👥</div>
                No attendees yet. Add one above to get started.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>Name</th>
                      <th style={th}>Email</th>
                      <th style={th}>Role</th>
                      <th style={th}>Aliases</th>
                      <th style={{ ...th, textAlign: "right" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map(a => (
                      <tr key={a.id} className={`att-row${editingId === a.id ? " editing" : ""}`}>

                        {editingId === a.id ? (
                          /* ── Edit mode ── */
                          <>
                            {["name", "email", "role", "aliases"].map(field => (
                              <td key={field} style={{ ...td, paddingTop: "10px", paddingBottom: "10px" }}>
                                <input
                                  className="att-input-inline"
                                  value={editForm[field]}
                                  placeholder={field === "aliases" ? "alias1, alias2" : ""}
                                  onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                                  onKeyDown={e => e.key === "Enter" && handleUpdate(a.id)}
                                />
                              </td>
                            ))}
                            <td style={{ ...td, paddingTop: "10px", paddingBottom: "10px" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                                <button className="att-btn-save" onClick={() => handleUpdate(a.id)}>Save</button>
                                <button className="att-btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          /* ── View mode ── */
                          <>
                            <td style={{ ...td, fontWeight: "600", color: "#1a2e22" }}>{a.name}</td>
                            <td style={td}>{a.email || <Dash />}</td>
                            <td style={td}>{a.role || <Dash />}</td>
                            <td style={td}>
                              {(a.aliases || []).length > 0
                                ? a.aliases.map((alias, i) => (
                                    <span key={i} className="att-alias-tag">{alias}</span>
                                  ))
                                : <Dash />}
                            </td>
                            <td style={td}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                                <button className="att-btn-edit" onClick={() => handleEdit(a)}>Edit</button>
                                <button className="att-btn-delete" onClick={() => handleDelete(a.id)} title="Delete">✕</button>
                              </div>
                            </td>
                          </>
                        )}

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

export default AttendeesScreen;