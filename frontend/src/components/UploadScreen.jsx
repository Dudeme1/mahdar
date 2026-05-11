import { useState, useEffect, useRef } from "react";
import supabase from "../supabase";
import MahdarScreen from "./MahdarScreen";

const css = `
  @keyframes up-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.08); }
  }
  @keyframes up-spin {
    to { transform: rotate(360deg); }
  }
  .up-spinner {
    width: 14px; height: 14px;
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
  .up-tab-btn {
    flex: 1;
    padding: 8px 0;
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #9ca3af;
    border-radius: 8px;
    transition: all 0.15s;
  }
  .up-tab-btn.active {
    background: #fff;
    color: #08060d;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .up-tab-btn:hover:not(.active) { color: #6b6375; }

  .up-textarea:focus { border-color: rgba(170,59,255,0.5) !important; }
  .up-select:focus { border-color: rgba(170,59,255,0.5) !important; outline: none; }
  .up-file-zone { transition: border-color 0.15s, background 0.15s; }
  .up-file-zone:hover { border-color: rgba(170,59,255,0.4) !important; background: rgba(170,59,255,0.03) !important; }
  .up-btn-secondary:hover { background: #f7f7f8 !important; }
  .up-sign-out:hover { background: #f7f7f8 !important; }
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

  topBar: { display: "flex", justifyContent: "flex-end", marginBottom: "16px" },
  signOut: {
    border: "1px solid #e5e4e7",
    background: "#fff",
    padding: "8px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "13px",
    color: "#08060d",
    fontFamily: "inherit",
  },

  hero: { marginBottom: "20px", textAlign: "center" },
  heroTitle: {
    fontSize: "30px",
    fontWeight: "700",
    color: "#08060d",
    letterSpacing: "-0.8px",
    margin: "0 0 6px",
  },
  heroSub: {
    fontSize: "14px",
    color: "#9ca3a8",
    lineHeight: "1.5",
    margin: 0,
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e4e7",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "rgba(0,0,0,0.08) 0 8px 20px -4px, rgba(0,0,0,0.04) 0 4px 6px -2px",
    marginBottom: "16px",
  },

  // ── Tab switcher ──
  tabBar: {
    display: "flex",
    background: "#f4f3f6",
    borderRadius: "10px",
    padding: "3px",
    marginBottom: "16px",
    gap: "2px",
  },

  // ── Textarea ──
  textarea: {
    width: "100%",
    minHeight: "130px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #e5e4e7",
    background: "#fafafa",
    fontSize: "14px",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: "1.6",
    color: "#08060d",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },

  // ── File zone ──
  fileZone: {
    border: "1.5px dashed #e5e4e7",
    borderRadius: "12px",
    padding: "20px",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    textAlign: "center",
  },
  fileZoneIcon: { fontSize: "22px", marginBottom: "2px" },
  fileZoneLabel: { fontSize: "13px", fontWeight: "600", color: "#08060d" },
  fileZoneHint: { fontSize: "12px", color: "#b0adb5" },
  fileZoneSelected: {
    fontSize: "12px",
    color: "#aa3bff",
    fontWeight: "500",
    marginTop: "4px",
    background: "rgba(170,59,255,0.07)",
    padding: "3px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(170,59,255,0.2)",
  },

  // ── Record UI ──
  recordArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "28px 20px",
    gap: "12px",
  },
  recordHint: { fontSize: "13px", color: "#9ca3a8" },

  // ── Divider ──
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "16px 0",
  },
  dividerLine: { flex: 1, height: "1px", background: "#f0eff2" },
  dividerText: { fontSize: "11px", color: "#c4bfca", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.06em" },

  // ── Controls row ──
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "16px",
    alignItems: "center",
  },

  // ── Buttons ──
  btnPrimary: {
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 18px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    transition: "opacity 0.15s",
  },
  btnSecondary: {
    background: "#fff",
    color: "#08060d",
    border: "1px solid #e5e4e7",
    borderRadius: "10px",
    padding: "9px 14px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  btnDanger: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "9px 14px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  btnRecord: {
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "50px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  btnRecordStop: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "50px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // ── Select ──
  select: {
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1px solid #e5e4e7",
    background: "#fff",
    fontSize: "13px",
    color: "#08060d",
    fontFamily: "inherit",
    marginLeft: "auto",
    transition: "border-color 0.15s",
  },

  // ── Template card ──
  templateCard: {
    background: "#fff",
    border: "1px solid #e5e4e7",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "rgba(0,0,0,0.06) 0 4px 12px -2px",
    marginBottom: "16px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#b0adb5",
    marginBottom: "12px",
  },
};

// Tab IDs
const TABS = { type: "type", record: "record", upload: "upload" };

function UploadScreen() {
  const [token, setToken] = useState(null);
  const [file, setFile] = useState(null);
  const [template, setTemplate] = useState(null);
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
    { id: TABS.type, label: "✏️  Type notes" },
    { id: TABS.record, label: "🎙️  Record audio" },
    { id: TABS.upload, label: "📎  Upload audio" },
  ];

  return (
    <>
      <style>{css}</style>
      <div style={S.page}>
        <div style={S.container}>

          {/* Top bar */}
          <div style={S.topBar}>
            <button className="up-sign-out" style={S.signOut} onClick={handleSignout}>Sign out</button>
          </div>

          {/* Hero */}
          <div style={S.hero}>
            <h1 style={S.heroTitle}>Mahdar 🎙️</h1>
            <p style={S.heroSub}>Upload, record, or type your meeting notes and instantly generate a clean MoM report.</p>
          </div>

          {/* Main card */}
          <div style={S.card}>

            {/* Tab switcher */}
            <div style={S.tabBar}>
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

            {/* ── Tab: Type ── */}
            {activeTab === TABS.type && (
              <textarea
                className="up-textarea"
                style={S.textarea}
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Paste or type your meeting notes here…"
              />
            )}

            {/* ── Tab: Record ── */}
            {activeTab === TABS.record && (
              <div style={S.recordArea}>
                <div style={S.recordHint}>
                  {recording
                    ? "Recording in progress — click stop when done"
                    : file && file.name === "recording.webm"
                      ? "Recording saved — ready to generate"
                      : "Tap to start recording your meeting audio"}
                </div>
                {recording ? (
                  <button style={S.btnRecordStop} onClick={stopRecording}>
                    <span className="up-rec-dot" />
                    Stop recording
                  </button>
                ) : (
                  <button style={S.btnRecord} onClick={startRecording}>
                    🎙️ Start recording
                  </button>
                )}
                {file && file.name === "recording.webm" && !recording && (
                  <div style={{ fontSize: "12px", color: "#aa3bff", background: "rgba(170,59,255,0.07)", padding: "4px 12px", borderRadius: "20px", border: "1px solid rgba(170,59,255,0.2)", fontWeight: 500 }}>
                    ✓ Audio captured
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Upload ── */}
            {activeTab === TABS.upload && (
              <>
                <input ref={audioFileRef} type="file" accept="audio/*" style={{ display: "none" }}
                  onChange={e => setFile(e.target.files[0])} />
                <div className="up-file-zone" style={S.fileZone} onClick={() => audioFileRef.current?.click()}>
                  <div style={S.fileZoneIcon}>🎵</div>
                  <div style={S.fileZoneLabel}>Click to upload audio file</div>
                  <div style={S.fileZoneHint}>MP3, WAV, WEBM, M4A supported</div>
                  {file && <div style={S.fileZoneSelected}>✓ {file.name}</div>}
                </div>
              </>
            )}

            {/* Divider */}
            <div style={S.divider}>
              <div style={S.dividerLine} />
              <div style={S.dividerText}>Options</div>
              <div style={S.dividerLine} />
            </div>

            {/* Controls */}
            <div style={S.controls}>
              <button
                onClick={processAudio}
                disabled={loading}
                style={{ ...S.btnPrimary, opacity: loading ? 0.75 : 1 }}
              >
                {loading ? <><span className="up-spinner" /> Generating…</> : <>✨ Generate Mahdar</>}
              </button>

              <select className="up-select" style={S.select} value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="english">English</option>
                <option value="arabic">Arabic</option>
              </select>
            </div>
          </div>

          {/* Template upload */}
          <div style={S.templateCard}>
            <div style={S.sectionLabel}>Word template (optional)</div>
            <input ref={templateFileRef} type="file" accept=".docx" style={{ display: "none" }}
              onChange={e => setTemplate(e.target.files[0])} />
            <div className="up-file-zone" style={{ ...S.fileZone, padding: "14px 20px" }} onClick={() => templateFileRef.current?.click()}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px" }}>📄</span>
                <div style={{ textAlign: "left" }}>
                  <div style={S.fileZoneLabel}>Upload .docx template</div>
                  <div style={S.fileZoneHint}>Your MoM will follow this document's structure</div>
                </div>
                {template && <div style={{ ...S.fileZoneSelected, marginLeft: "auto" }}>✓ {template.name}</div>}
              </div>
            </div>
          </div>

          {/* Generated MoM */}
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