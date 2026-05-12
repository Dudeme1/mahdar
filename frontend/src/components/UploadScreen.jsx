import { useState, useEffect, useRef } from "react";
import supabase from "../supabase";
import MahdarScreen from "./MahdarScreen";
import logoUrl from "/icon-512.png";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

  @keyframes up-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.08); }
  }
  @keyframes up-spin {
    to { transform: rotate(360deg); }
  }

  .up-spinner {
    width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: up-spin 0.7s linear infinite;
    display: inline-block;
  }
  .up-rec-dot {
    width: 8px; height: 8px;
    background: #ef4444;
    border-radius: 50%;
    animation: up-pulse 1.2s ease-in-out infinite;
    display: inline-block;
    margin-right: 6px;
    vertical-align: middle;
  }

  /* Tab buttons */
  .up-tab-btn {
    flex: 1;
    padding: 8px 0;
    font-size: 13px;
    font-weight: 500;
    font-family: 'DM Sans', system-ui, sans-serif;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #9ca3af;
    border-radius: 8px;
    transition: all 0.15s;
    letter-spacing: 0.01em;
  }
  .up-tab-btn.active {
    background: #fff;
    color: #1a2e22;
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(26,46,34,0.1);
  }
  .up-tab-btn:hover:not(.active) { color: #1a2e22; }

  /* Inputs */
  .up-textarea { transition: border-color 0.15s; }
  .up-textarea:focus { border-color: rgba(195,152,83,0.6) !important; outline: none; box-shadow: 0 0 0 3px rgba(195,152,83,0.08); }
  .up-select:focus { border-color: rgba(195,152,83,0.6) !important; outline: none; box-shadow: 0 0 0 3px rgba(195,152,83,0.08); }

  /* File zone */
  .up-file-zone {
    transition: border-color 0.15s, background 0.15s;
    cursor: pointer;
  }
  .up-file-zone:hover {
    border-color: rgba(195,152,83,0.5) !important;
    background: rgba(195,152,83,0.03) !important;
  }

  /* Buttons */
  .up-btn-primary:hover:not(:disabled) { opacity: 0.88; }
  .up-btn-secondary:hover { background: #f4f5f2 !important; }
  .up-btn-record:hover { opacity: 0.88; }
  .up-btn-record-stop:hover { background: #fee2e2 !important; }

  /* Select */
  .up-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237a7585' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 30px !important;
  }

  /* Captured badge */
  .up-captured-badge {
    font-size: 12px;
    color: #a07830;
    background: rgba(195,152,83,0.1);
    padding: 3px 12px;
    border-radius: 20px;
    border: 1px solid rgba(195,152,83,0.3);
    font-weight: 500;
  }

  /* Section label */
  .up-section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #b0adb5;
    margin-bottom: 12px;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
`;

const TABS = { type: "type", record: "record", upload: "upload" };

function UploadScreen() {
  const [token, setToken] = useState(null);
  const [file, setFile] = useState(null);
  const [template, setTemplate] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateUrl, setSelectedTemplateUrl] = useState(null);
  const [text, setText] = useState("");
  const [textInput, setTextInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mom, setMom] = useState(null);
  const [language, setLanguage] = useState("english");
  const [activeTab, setActiveTab] = useState(TABS.type);
  const audioFileRef = useRef(null);
  const templateFileRef = useRef(null);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchTemplates = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/get-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      setSavedTemplates(data.templates || []);
    };
    fetchTemplates();
  }, [token]);

  const handleSignout = async () => { await supabase.auth.signOut(); };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      setFile(new File([blob], "recording.webm", { type: "audio/webm" }));
    };
    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  };

  const stopRecording = () => { mediaRecorder.stop(); setRecording(false); };

  const processAudio = async () => {
    if (!file && !textInput) return alert("Please provide audio or text!");
    setLoading(true);
    let transcript = "";
    try {
      if (file && !textInput) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API}/transcribe`, { method: "POST", body: formData });
        const data = await res.json();
        transcript = data.transcript;
      } else {
        transcript = textInput;
      }
      if (transcript) {
        const res = await fetch(`${API}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, language, token }),
        });
        const gen_data = await res.json();
        setText(JSON.stringify(gen_data));
        setMom(gen_data);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const tabConfig = [
    { id: TABS.type,   label: "✏️  Type notes" },
    { id: TABS.record, label: "🎙️  Record audio" },
    { id: TABS.upload, label: "📎  Upload audio" },
  ];

  // ── Shared style tokens ──
  const card = {
    background: "#fff",
    border: "1px solid #e8e7ea",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "rgba(26,46,34,0.06) 0 8px 24px -4px, rgba(0,0,0,0.03) 0 2px 6px -1px",
    marginBottom: "14px",
  };

  const fileZoneBase = {
    border: "1.5px dashed #e2e0e5",
    borderRadius: "12px",
    padding: "20px",
    background: "#fafaf9",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
    textAlign: "center",
  };

  const divider = {
    display: "flex", alignItems: "center", gap: "10px", margin: "16px 0",
  };

  return (
    <>
      <style>{css}</style>
      <div style={{
        minHeight: "100vh",
        background: "#f4f5f2",
        padding: "28px 20px 48px",
        fontFamily: "'DM Sans', system-ui, 'Segoe UI', sans-serif",
        color: "#7a7585",
        boxSizing: "border-box",
      }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>

          {/* ── Hero ── */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <img
              src={logoUrl}
              alt="Mahdari"
              style={{ width: "52px", height: "52px", borderRadius: "14px", marginBottom: "14px", display: "block", margin: "0 auto 14px" }}
            />
            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "28px",
              fontWeight: "400",
              color: "#1a2e22",
              letterSpacing: "-0.5px",
              margin: "0 0 8px",
            }}>
              New Mah<span style={{ color: "#c39853" }}>dar</span>
            </h1>
            <p style={{ fontSize: "14px", color: "#a09aaa", lineHeight: "1.6", margin: 0 }}>
              Upload, record, or type your meeting notes and instantly generate a clean MoM report.
            </p>
          </div>

          {/* ── Main input card ── */}
          <div style={card}>

            {/* Tab switcher */}
            <div style={{
              display: "flex",
              background: "#f2f1f4",
              borderRadius: "10px",
              padding: "3px",
              marginBottom: "18px",
              gap: "2px",
            }}>
              {tabConfig.map(t => (
                <button
                  key={t.id}
                  className={`up-tab-btn${activeTab === t.id ? " active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Type tab ── */}
            {activeTab === TABS.type && (
              <textarea
                className="up-textarea"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Paste or type your meeting notes here…"
                style={{
                  width: "100%",
                  minHeight: "140px",
                  padding: "14px",
                  borderRadius: "11px",
                  border: "1px solid #e2e0e5",
                  background: "#fafaf9",
                  fontSize: "14px",
                  resize: "vertical",
                  boxSizing: "border-box",
                  lineHeight: "1.65",
                  color: "#1a2e22",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              />
            )}

            {/* ── Record tab ── */}
            {activeTab === TABS.record && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "32px 20px", gap: "14px",
              }}>
                <p style={{ fontSize: "13px", color: "#a09aaa", margin: 0, textAlign: "center" }}>
                  {recording
                    ? "Recording in progress — click stop when done"
                    : file?.name === "recording.webm"
                      ? "Recording saved — ready to generate"
                      : "Tap to start recording your meeting audio"}
                </p>

                {recording ? (
                  <button
                    className="up-btn-record-stop"
                    onClick={stopRecording}
                    style={{
                      background: "#fef2f2", color: "#dc2626",
                      border: "1px solid #fecaca", borderRadius: "50px",
                      padding: "12px 26px", fontSize: "13px", fontWeight: "600",
                      cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif",
                      display: "flex", alignItems: "center", gap: "8px",
                    }}
                  >
                    <span className="up-rec-dot" />
                    Stop recording
                  </button>
                ) : (
                  <button
                    className="up-btn-record"
                    onClick={startRecording}
                    style={{
                      background: "#1a2e22", color: "#fff",
                      border: "none", borderRadius: "50px",
                      padding: "12px 26px", fontSize: "13px", fontWeight: "600",
                      cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif",
                      display: "flex", alignItems: "center", gap: "8px",
                    }}
                  >
                    🎙️ Start recording
                  </button>
                )}

                {file?.name === "recording.webm" && !recording && (
                  <span className="up-captured-badge">✓ Audio captured</span>
                )}
              </div>
            )}

            {/* ── Upload tab ── */}
            {activeTab === TABS.upload && (
              <>
                <input ref={audioFileRef} type="file" accept="audio/*" style={{ display: "none" }}
                  onChange={e => setFile(e.target.files[0])} />
                <div className="up-file-zone" style={fileZoneBase} onClick={() => audioFileRef.current?.click()}>
                  <span style={{ fontSize: "22px" }}>🎵</span>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a2e22", marginTop: "2px" }}>
                    Click to upload audio file
                  </div>
                  <div style={{ fontSize: "12px", color: "#b0adb5" }}>MP3, WAV, WEBM, M4A supported</div>
                  {file && (
                    <span className="up-captured-badge" style={{ marginTop: "4px" }}>✓ {file.name}</span>
                  )}
                </div>
              </>
            )}

            {/* Divider */}
            <div style={divider}>
              <div style={{ flex: 1, height: "1px", background: "#eeecf0" }} />
              <span style={{ fontSize: "10.5px", color: "#c4bfca", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Options
              </span>
              <div style={{ flex: 1, height: "1px", background: "#eeecf0" }} />
            </div>

            {/* Controls */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <button
                className="up-btn-primary"
                onClick={processAudio}
                disabled={loading}
                style={{
                  background: "#1a2e22",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  opacity: loading ? 0.72 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {loading
                  ? <><span className="up-spinner" /> Generating…</>
                  : <>✨ Generate Mahdar</>}
              </button>

              <select
                className="up-select"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{
                  padding: "9px 30px 9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e0e5",
                  background: "#fff",
                  fontSize: "13px",
                  color: "#1a2e22",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  marginLeft: "auto",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <option value="english">English</option>
                <option value="arabic">Arabic</option>
              </select>
            </div>
          </div>

          {/* ── Template card ── */}
          <div style={{ ...card, padding: "18px 20px" }}>
            <div className="up-section-label">Word template (optional)</div>
            <input ref={templateFileRef} type="file" accept=".docx" style={{ display: "none" }}
              onChange={e => setTemplate(e.target.files[0])} />

            <div
              className="up-file-zone"
              style={{ ...fileZoneBase, flexDirection: "row", padding: "14px 16px", gap: "12px", textAlign: "left" }}
              onClick={() => templateFileRef.current?.click()}
            >
              <span style={{ fontSize: "20px", flexShrink: 0 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a2e22" }}>Upload .docx template</div>
                <div style={{ fontSize: "12px", color: "#b0adb5", marginTop: "2px" }}>
                  Your MoM will follow this document's structure
                </div>
              </div>
              {template && (
                <span className="up-captured-badge" style={{ flexShrink: 0 }}>✓ {template.name}</span>
              )}
            </div>

            {savedTemplates.length > 0 && (
              <>
                <div style={{ ...divider, margin: "14px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "#eeecf0" }} />
                  <span style={{ fontSize: "10.5px", color: "#c4bfca", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    or choose saved
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "#eeecf0" }} />
                </div>
                <select
                  className="up-select"
                  value={selectedTemplateUrl || ""}
                  onChange={async (e) => {
                    const url = e.target.value;
                    setSelectedTemplateUrl(url);
                    if (!url) { setTemplate(null); return; }
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const fileName = url.split("/").pop()?.split("?")[0] || "template.docx";
                    setTemplate(new File([blob], fileName, {
                      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    }));
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 30px 9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #e2e0e5",
                    background: "#fff",
                    fontSize: "13px",
                    color: "#1a2e22",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                >
                  <option value="">Select a saved template…</option>
                  {savedTemplates.map((t) => (
                    <option key={t.id} value={t.download_url}>{t.name}</option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* ── Generated MoM ── */}
          {text && mom && (
            <MahdarScreen
              token={token}
              date={mom.date}
              hijri_date={mom.hijri_date}
              title={mom.title}
              purpose={mom.purpose}
              location={mom.location}
              attendees={mom.attendees}
              discussion={mom.discussion}
              decisions={mom.decisions}
              action_items={mom.action_items}
              next_meeting={mom.next_meeting}
              hijri_next_meeting={mom.hijri_next_meeting}
              template={template}
            />
          )}

        </div>
      </div>
    </>
  );
}

export default UploadScreen;