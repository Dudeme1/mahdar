import { useState, useEffect, useRef } from "react";
import supabase from "../supabase";

const css = `
  @keyframes tmpl-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .tmpl-root { animation: tmpl-fadein 0.3s ease; }

  @keyframes tmpl-spin { to { transform: rotate(360deg); } }
  .tmpl-spinner {
    width: 16px; height: 16px;
    border: 2px solid #e5e4e7;
    border-top-color: #aa3bff;
    border-radius: 50%;
    animation: tmpl-spin 0.7s linear infinite;
  }

  .tmpl-input {
    width: 100%;
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid #e5e4e7;
    background: #f7f7f8;
    font-size: 13px;
    color: #08060d;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s;
  }
  .tmpl-input:focus {
    border-color: rgba(170,59,255,0.5);
    background: #fff;
  }
  .tmpl-input::placeholder { color: #c4bfca; }

  .tmpl-file-zone {
    border: 1.5px dashed #e5e4e7;
    border-radius: 12px;
    padding: 18px;
    background: #fafafa;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    text-align: center;
    transition: border-color 0.15s, background 0.15s;
  }
  .tmpl-file-zone:hover {
    border-color: rgba(170,59,255,0.4);
    background: rgba(170,59,255,0.03);
  }

  .tmpl-btn-primary {
    background: #111827;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    transition: opacity 0.15s;
    white-space: nowrap;
  }
  .tmpl-btn-primary:hover { opacity: 0.88; }

  .tmpl-btn-ghost {
    background: transparent;
    color: #b0adb5;
    border: none;
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .tmpl-btn-ghost:hover {
    color: #dc2626;
    background: rgba(220,38,38,0.07);
  }

  .tmpl-btn-dl {
    background: transparent;
    color: #aa3bff;
    border: 1px solid rgba(170,59,255,0.25);
    border-radius: 8px;
    padding: 5px 11px;
    font-size: 12px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: background 0.15s;
  }
  .tmpl-btn-dl:hover { background: rgba(170,59,255,0.07); }

  .tmpl-row { transition: background 0.12s; }
  .tmpl-row:hover td { background: #faf9fb; }
  .tmpl-row:last-child td { border-bottom: none !important; }
`;

const S = {
  page: {
    minHeight: "100vh",
    background: "#f7f7f8",
    padding: "16px 20px",
    fontFamily: "Inter, system-ui, 'Segoe UI', sans-serif",
    color: "#6b6375",
    boxSizing: "border-box",
  },
  container: { maxWidth: "820px", margin: "0 auto" },

  header: { marginBottom: "20px" },
  titleRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" },
  title: { fontSize: "22px", fontWeight: "700", color: "#08060d", letterSpacing: "-0.4px", margin: 0 },
  badge: {
    fontSize: "12px", fontWeight: "500", color: "#aa3bff",
    background: "rgba(170,59,255,0.1)", border: "1px solid rgba(170,59,255,0.25)",
    borderRadius: "20px", padding: "2px 9px",
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e4e7",
    borderRadius: "18px",
    padding: "20px 22px",
    boxShadow: "rgba(0,0,0,0.08) 0 8px 20px -4px, rgba(0,0,0,0.04) 0 4px 6px -2px",
    marginBottom: "16px",
  },
  sectionLabel: {
    fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em",
    textTransform: "uppercase", color: "#b0adb5", marginBottom: "14px",
  },

  uploadGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr auto",
    gap: "10px",
    alignItems: "end",
  },
  field: { display: "flex", flexDirection: "column", gap: "5px" },
  fieldLabel: { fontSize: "11px", fontWeight: "500", color: "#9ca3a8" },

  fileZoneIcon: { fontSize: "20px", marginBottom: "2px" },
  fileZoneLabel: { fontSize: "13px", fontWeight: "600", color: "#08060d" },
  fileZoneHint: { fontSize: "12px", color: "#b0adb5" },
  fileZoneSelected: {
    fontSize: "12px", color: "#aa3bff", fontWeight: "500",
    background: "rgba(170,59,255,0.07)", padding: "2px 10px",
    borderRadius: "20px", border: "1px solid rgba(170,59,255,0.2)", marginTop: "2px",
  },

  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", fontSize: "11px", fontWeight: "600",
    letterSpacing: "0.07em", textTransform: "uppercase", color: "#b0adb5",
    padding: "8px 14px", borderBottom: "1px solid #e5e4e7",
  },
  td: {
    padding: "13px 14px", fontSize: "14px",
    borderBottom: "1px solid #f0eff2", verticalAlign: "middle", color: "#6b6375",
  },
  tdName: { fontWeight: "600", color: "#08060d", fontSize: "14px" },
  tdDate: { fontSize: "12px", color: "#b0adb5", fontFamily: "ui-monospace, Consolas, monospace" },
  tdActions: { display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" },

  empty: { textAlign: "center", padding: "40px 20px", color: "#b0adb5", fontSize: "14px" },
  loading: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "10px", height: "100vh", fontFamily: "Inter, system-ui, sans-serif",
    color: "#6b6375", background: "#f7f7f8",
  },
};

function TemplatesScreen() {
  const [token, setToken] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFile, setNewFile] = useState(null);
  const fileRef = useRef(null);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token);
    });
  }, []);

  const fetchTemplates = async () => {
    const res = await fetch(`${API}/get-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setTemplates(data.templates || []);
    setLoading(false);
  };

  useEffect(() => { if (token) fetchTemplates(); }, [token]);

  const handleUpload = async () => {
    if (!newFile) return alert("Please select a file!");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", newFile);
    formData.append("name", newName || newFile.name);
    formData.append("token", token);
    await fetch(`${API}/upload-template`, { method: "POST", body: formData });
    setNewName("");
    setNewFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
    fetchTemplates();
  };

  const handleDelete = async (template) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`${API}/delete-template`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, template_id: template.id, file_path: template.file_path }),
    });
    fetchTemplates();
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  if (loading) return (
    <>
      <style>{css}</style>
      <div style={S.loading}>
        <div className="tmpl-spinner" />
        <span>Loading templates…</span>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="tmpl-root" style={S.page}>
        <div style={S.container}>

          {/* Header */}
          <div style={S.header}>
            <div style={S.titleRow}>
              <h1 style={S.title}>Templates</h1>
              {templates.length > 0 && <span style={S.badge}>{templates.length}</span>}
            </div>
          </div>

          {/* Upload card */}
          <div style={S.card}>
            <div style={S.sectionLabel}>Upload template</div>
            <div style={S.uploadGrid}>
              <div style={S.field}>
                <label style={S.fieldLabel}>Template name</label>
                <input
                  className="tmpl-input"
                  placeholder="e.g. Board Meeting"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleUpload()}
                />
              </div>

              <div style={S.field}>
                <label style={S.fieldLabel}>File (.docx)</label>
                <input ref={fileRef} type="file" accept=".docx" style={{ display: "none" }}
                  onChange={e => setNewFile(e.target.files[0])} />
                <div className="tmpl-file-zone" onClick={() => fileRef.current?.click()}>
                  {newFile ? (
                    <span style={S.fileZoneSelected}>✓ {newFile.name}</span>
                  ) : (
                    <>
                      <span style={S.fileZoneIcon}>📄</span>
                      <span style={S.fileZoneLabel}>Click to choose file</span>
                      <span style={S.fileZoneHint}>.docx only</span>
                    </>
                  )}
                </div>
              </div>

              <button className="tmpl-btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading
                  ? <><span className="tmpl-spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Uploading…</>
                  : <>↑ Upload</>}
              </button>
            </div>
          </div>

          {/* Templates list */}
          <div style={S.card}>
            {templates.length === 0 ? (
              <div style={S.empty}>No templates yet. Upload one above to get started.</div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Name</th>
                    <th style={S.th}>Uploaded</th>
                    <th style={{ ...S.th, textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(t => (
                    <tr key={t.id} className="tmpl-row">
                      <td style={{ ...S.td, ...S.tdName }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                          <span style={{ fontSize: "16px" }}>📄</span>
                          {t.name}
                        </div>
                      </td>
                      <td style={{ ...S.td, ...S.tdDate }}>{formatDate(t.created_at)}</td>
                      <td style={S.td}>
                        <div style={S.tdActions}>
                          <a className="tmpl-btn-dl" href={t.download_url} target="_blank" rel="noreferrer">
                            ↓ Download
                          </a>
                          <button className="tmpl-btn-ghost" onClick={() => handleDelete(t)} title="Delete">
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

export default TemplatesScreen;