import { useState, useEffect } from "react";
import supabase from "../supabase";

const S = {
  page: {
    minHeight: "100vh",
    background: "#f7f7f8",
    padding: "16px 20px",
    fontFamily: "Inter, system-ui, 'Segoe UI', sans-serif",
    color: "#6b6375",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "820px",
    margin: "0 auto",
  },

  // ── Header ──
  header: {
    marginBottom: "20px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "2px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#08060d",
    letterSpacing: "-0.4px",
    margin: 0,
  },
  badge: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#aa3bff",
    background: "rgba(170,59,255,0.1)",
    border: "1px solid rgba(170,59,255,0.25)",
    borderRadius: "20px",
    padding: "2px 9px",
  },

  // ── Card ──
  card: {
    background: "#fff",
    border: "1px solid #e5e4e7",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "rgba(0,0,0,0.1) 0 10px 15px -3px, rgba(0,0,0,0.05) 0 4px 6px -2px",
    marginBottom: "16px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#b0adb5",
    marginBottom: "14px",
  },

  // ── Add form grid ──
  addGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1.4fr 0.9fr 1.6fr auto",
    gap: "10px",
    alignItems: "end",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  fieldLabel: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#9ca3a8",
  },
  input: {
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1px solid #e5e4e7",
    background: "#f7f7f8",
    fontSize: "13px",
    color: "#08060d",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
    width: "100%",
    boxSizing: "border-box",
  },

  // ── Buttons ──
  btnPrimary: {
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "9px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  },
  btnSecondary: {
    background: "#fff",
    color: "#08060d",
    border: "1px solid #e5e4e7",
    borderRadius: "10px",
    padding: "7px 13px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  btnAccent: {
    background: "rgba(170,59,255,0.1)",
    color: "#aa3bff",
    border: "1px solid rgba(170,59,255,0.25)",
    borderRadius: "10px",
    padding: "7px 13px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  btnDanger: {
    background: "transparent",
    color: "#c4b8cc",
    border: "none",
    borderRadius: "8px",
    padding: "5px 8px",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  // ── Table ──
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#b0adb5",
    padding: "10px 14px",
    borderBottom: "1px solid #e5e4e7",
  },
  td: {
    padding: "12px 14px",
    fontSize: "14px",
    borderBottom: "1px solid #f0eff2",
    verticalAlign: "middle",
    color: "#6b6375",
  },
  tdName: {
    fontWeight: "600",
    color: "#08060d",
    fontSize: "14px",
  },
  aliasTag: {
    display: "inline-block",
    background: "#f4f3ec",
    border: "1px solid #e5e4e7",
    borderRadius: "5px",
    padding: "1px 7px",
    fontSize: "11px",
    color: "#6b6375",
    margin: "1px 2px",
    fontFamily: "ui-monospace, Consolas, monospace",
  },
  actions: {
    display: "flex",
    gap: "6px",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  dash: {
    color: "#d1cdd7",
  },

  // ── Empty / Loading ──
  empty: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#b0adb5",
    fontSize: "14px",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    height: "100vh",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#6b6375",
    background: "#f7f7f8",
  },
};

const css = `
  @keyframes att-spin { to { transform: rotate(360deg); } }
  .att-spinner {
    width: 16px; height: 16px;
    border: 2px solid #e5e4e7;
    border-top-color: #aa3bff;
    border-radius: 50%;
    animation: att-spin 0.7s linear infinite;
  }
  .att-input:focus {
    border-color: rgba(170,59,255,0.5) !important;
    background: #fff !important;
  }
  .att-row:hover td { background: #faf9fb; }
  .att-row:last-child td { border-bottom: none !important; }
  .att-btn-danger:hover { color: #dc2626 !important; background: rgba(220,38,38,0.07) !important; }
  .att-btn-secondary:hover { background: #f7f7f8 !important; }
`;

const Dash = () => <span style={S.dash}>—</span>;

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

  useEffect(() => {
    if (token) fetchAttendees();
  }, [token]);

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

  if (loading) return (
    <>
      <style>{css}</style>
      <div style={S.loading}>
        <div className="att-spinner" />
        <span>Loading attendees…</span>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div style={S.page}>
        <div style={S.container}>

          {/* Header */}
          <div style={S.header}>
            <div style={S.titleRow}>
              <h1 style={S.title}>Attendees</h1>
              {attendees.length > 0 && <span style={S.badge}>{attendees.length}</span>}
            </div>
          </div>

          {/* Add form */}
          <div style={S.card}>
            <div style={S.sectionLabel}>Add attendee</div>
            <div style={S.addGrid}>
              {[
                { key: "name", label: "Name *", placeholder: "Jane Smith" },
                { key: "email", label: "Email", placeholder: "jane@example.com" },
                { key: "role", label: "Role", placeholder: "Designer" },
                { key: "aliases", label: "Aliases (comma separated)", placeholder: "J, Janie" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={S.field}>
                  <label style={S.fieldLabel}>{label}</label>
                  <input
                    className="att-input"
                    style={S.input}
                    placeholder={placeholder}
                    value={newAttendee[key]}
                    onChange={e => setNewAttendee({ ...newAttendee, [key]: e.target.value })}
                    onKeyDown={e => key === "name" && e.key === "Enter" && handleAdd()}
                  />
                </div>
              ))}
              <button style={S.btnPrimary} onClick={handleAdd}>Add</button>
            </div>
          </div>

          {/* Table */}
          <div style={S.card}>
            {attendees.length === 0 ? (
              <div style={S.empty}>No attendees yet. Add one above to get started.</div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Name</th>
                      <th style={S.th}>Email</th>
                      <th style={S.th}>Role</th>
                      <th style={S.th}>Aliases</th>
                      <th style={{ ...S.th, textAlign: "right" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map(a => (
                      <tr key={a.id} className="att-row">
                        {editingId === a.id ? (
                          <>
                            {["name", "email", "role", "aliases"].map(field => (
                              <td key={field} style={S.td}>
                                <input
                                  className="att-input"
                                  style={S.input}
                                  value={editForm[field]}
                                  placeholder={field === "aliases" ? "alias1, alias2" : ""}
                                  onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                                />
                              </td>
                            ))}
                            <td style={S.td}>
                              <div style={S.actions}>
                                <button style={S.btnAccent} onClick={() => handleUpdate(a.id)}>Save</button>
                                <button className="att-btn-secondary" style={S.btnSecondary} onClick={() => setEditingId(null)}>Cancel</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ ...S.td, ...S.tdName }}>{a.name}</td>
                            <td style={S.td}>{a.email || <Dash />}</td>
                            <td style={S.td}>{a.role || <Dash />}</td>
                            <td style={S.td}>
                              {(a.aliases || []).length > 0
                                ? a.aliases.map((alias, i) => <span key={i} style={S.aliasTag}>{alias}</span>)
                                : <Dash />}
                            </td>
                            <td style={S.td}>
                              <div style={S.actions}>
                                <button className="att-btn-secondary" style={S.btnSecondary} onClick={() => handleEdit(a)}>Edit</button>
                                <button className="att-btn-danger" style={S.btnDanger} onClick={() => handleDelete(a.id)} title="Delete">✕</button>
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