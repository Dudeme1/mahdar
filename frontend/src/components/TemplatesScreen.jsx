import { useState, useEffect, useRef } from "react";
import supabase from "../supabase";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

  @keyframes tmpl-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .tmpl-root {
    animation: tmpl-fadein 0.3s ease;
    font-family: 'DM Sans', system-ui, 'Segoe UI', sans-serif;
  }

  @keyframes tmpl-spin { to { transform: rotate(360deg); } }
  .tmpl-spinner {
    width: 15px; height: 15px;
    border: 2px solid #e2e0e5;
    border-top-color: #1a2e22;
    border-radius: 50%;
    animation: tmpl-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  .tmpl-spinner-white {
    width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: tmpl-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* Input */
  .tmpl-input {
    width: 100%;
    padding: 10px 13px;
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
  .tmpl-input:focus {
    border-color: rgba(195,152,83,0.6);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(195,152,83,0.08);
  }
  .tmpl-input::placeholder { color: #c4bfca; }

  /* File zone */
  .tmpl-file-zone {
    border: 1.5px dashed #e2e0e5;
    border-radius: 11px;
    padding: 14px 16px;
    background: #fafaf9;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .tmpl-file-zone:hover {
    border-color: rgba(195,152,83,0.5);
    background: rgba(195,152,83,0.03);
  }

  /* Buttons */
  .tmpl-btn-primary {
    background: #1a2e22;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: opacity 0.15s;
    white-space: nowrap;
    width: 100%;
  }
  .tmpl-btn-primary:hover:not(:disabled) { opacity: 0.86; }
  .tmpl-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .tmpl-btn-dl {
    background: transparent;
    color: #a07830;
    border: 1px solid rgba(195,152,83,0.35);
    border-radius: 8px;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: background 0.15s, border-color 0.15s;
  }
  .tmpl-btn-dl:hover {
    background: rgba(195,152,83,0.08);
    border-color: rgba(195,152,83,0.5);
  }

  .tmpl-btn-ghost {
    background: transparent;
    color: #c4bfca;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 5px 8px;
    font-size: 13px;
    font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
    display: flex;
    align-items: center;
    line-height: 1;
  }
  .tmpl-btn-ghost:hover {
    color: #dc2626;
    background: rgba(220,38,38,0.06);
    border-color: rgba(220,38,38,0.15);
  }

  /* Table rows */
  .tmpl-row { transition: background 0.12s; }
  .tmpl-row:hover td { background: #faf9f7 !important; }
  .tmpl-row:last-child td { border-bottom: none !important; }

  /* Badge */
  .tmpl-count-badge {
    font-size: 11px;
    font-weight: 600;
    color: #a07830;
    background: rgba(195,152,83,0.12);
    border: 1px solid rgba(195,152,83,0.3);
    border-radius: 20px;
    padding: 2px 9px;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  /* Selected file badge */
  .tmpl-file-badge {
    font-size: 12px;
    color: #a07830;
    background: rgba(195,152,83,0.1);
    padding: 3px 10px;
    border-radius: 20px;
    border: 1px solid rgba(195,152,83,0.28);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
`;

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

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // ── Shared tokens ──
  const card = {
    background: "#fff",
    border: "1px solid #e8e7ea",
    borderRadius: "16px",
    padding: "20px 22px",
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
        <div className="tmpl-spinner" />
        Loading templates…
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="tmpl-root" style={{
        minHeight: "100vh",
        background: "#f4f5f2",
        padding: "28px 20px 48px",
        color: "#7a7585",
        boxSizing: "border-box",
      }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>

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
                Templates
              </h1>
              {templates.length > 0 && (
                <span className="tmpl-count-badge">{templates.length}</span>
              )}
            </div>
            <p style={{ fontSize: "13px", color: "#a09aaa", margin: 0 }}>
              Upload .docx templates to apply consistent formatting to your MoM reports.
            </p>
          </div>

          {/* ── Upload card ── */}
          <div style={card}>
            <div style={sectionLabel}>Upload new template</div>

            {/* Stacked layout — much less cramped than 3-col grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Name + file side by side on wider screens */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#9ca3a8", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    Template name
                  </label>
                  <input
                    className="tmpl-input"
                    placeholder="e.g. Board Meeting"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleUpload()}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#9ca3a8", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    File (.docx)
                  </label>
                  <input ref={fileRef} type="file" accept=".docx" style={{ display: "none" }}
                    onChange={e => setNewFile(e.target.files[0])} />
                  <div className="tmpl-file-zone" onClick={() => fileRef.current?.click()}>
                    <span style={{ fontSize: "18px", flexShrink: 0 }}>📄</span>
                    {newFile ? (
                      <span className="tmpl-file-badge">✓ {newFile.name}</span>
                    ) : (
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a2e22" }}>Choose file</div>
                        <div style={{ fontSize: "11px", color: "#b0adb5", marginTop: "1px" }}>.docx only</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload button full-width below */}
              <button className="tmpl-btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading
                  ? <><span className="tmpl-spinner-white" /> Uploading…</>
                  : <>↑ Upload template</>}
              </button>
            </div>
          </div>

          {/* ── Templates list ── */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            {templates.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "48px 20px",
                color: "#b0adb5", fontSize: "14px",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>📄</div>
                No templates yet. Upload one above to get started.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#faf9f7" }}>
                    <th style={{
                      textAlign: "left", fontSize: "10.5px", fontWeight: "600",
                      letterSpacing: "0.08em", textTransform: "uppercase", color: "#b0adb5",
                      padding: "11px 20px", borderBottom: "1px solid #e8e7ea",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}>Name</th>
                    <th style={{
                      textAlign: "left", fontSize: "10.5px", fontWeight: "600",
                      letterSpacing: "0.08em", textTransform: "uppercase", color: "#b0adb5",
                      padding: "11px 20px", borderBottom: "1px solid #e8e7ea",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}>Uploaded</th>
                    <th style={{ padding: "11px 20px", borderBottom: "1px solid #e8e7ea" }} />
                  </tr>
                </thead>
                <tbody>
                  {templates.map(t => (
                    <tr key={t.id} className="tmpl-row">
                      <td style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid #f0eff2",
                        verticalAlign: "middle",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "15px" }}>📄</span>
                          <span style={{
                            fontWeight: "600", color: "#1a2e22", fontSize: "13px",
                            fontFamily: "'DM Sans', system-ui, sans-serif",
                          }}>
                            {t.name}
                          </span>
                        </div>
                      </td>
                      <td style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid #f0eff2",
                        verticalAlign: "middle",
                        fontSize: "12px",
                        color: "#b0adb5",
                        fontFamily: "ui-monospace, Consolas, monospace",
                      }}>
                        {formatDate(t.created_at)}
                      </td>
                      <td style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid #f0eff2",
                        verticalAlign: "middle",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                          <a className="tmpl-btn-dl" href={t.download_url} target="_blank" rel="noreferrer">
                            ↓ Download
                          </a>
                          <button className="tmpl-btn-ghost" onClick={() => handleDelete(t)} title="Delete template">
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