import { useState, useEffect, useRef } from "react";
import supabase from "../supabase";
import MahdarScreen from "./MahdarScreen";
import logoUrl from "/icon-512.png";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .ms-spinner {
    width: 14px; height: 14px;
    border: 1.5px solid rgba(255,255,255,0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  .ms-rec {
    width: 7px; height: 7px;
    background: #c0392b;
    border-radius: 50%;
    animation: pulse 1s ease-in-out infinite;
    display: inline-block;
  }

  .ms-root {
    min-height: 100vh;
    background: #f7f6f3;
    font-family: 'Nunito', system-ui, sans-serif;
    color: #3a3530;
    padding: 0 0 80px;
  }

  .ms-header {
    border-bottom: 1px solid #e4e0d8;
    background: #f7f6f3;
    padding: 18px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ms-logo-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ms-logo-img {
    width: 28px; height: 28px;
    border-radius: 6px;
  }
  .ms-logo-text {
    font-family: 'Fraunces', serif;
    font-size: 20px;
    font-weight: 500;
    color: #1c1c18;
    letter-spacing: -0.2px;
  }
  .ms-logo-text span { color: #b07d3a; }

  .ms-signout {
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #9a9387;
    background: none;
    border: 1px solid #ddd9d0;
    border-radius: 20px;
    padding: 5px 14px;
    cursor: pointer;
    letter-spacing: 0.01em;
    transition: color 0.15s, border-color 0.15s;
  }
  .ms-signout:hover { color: #3a3530; border-color: #b8b2a6; }

  .ms-body { max-width: 680px; margin: 0 auto; padding: 40px 24px 0; }

  .ms-title {
    font-family: 'Fraunces', serif;
    font-size: 34px;
    font-weight: 500;
    color: #1c1c18;
    letter-spacing: -0.3px;
    margin: 0 0 4px;
  }
  .ms-title span { color: #b07d3a; }
  .ms-sub {
    font-size: 13.5px;
    color: #9a9387;
    font-weight: 400;
    margin: 0 0 32px;
    letter-spacing: 0.01em;
  }

  /* Main panel */
  .ms-panel {
    background: #fff;
    border: 1px solid #e4e0d8;
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 1px;
  }

  /* Tab bar — text-only, no box */
  .ms-tabs {
    display: flex;
    border-bottom: 1px solid #e4e0d8;
    padding: 0 20px;
    gap: 0;
  }
  .ms-tab {
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #b0a89e;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 14px 14px 12px;
    cursor: pointer;
    margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s;
  }
  .ms-tab.active {
    color: #1c1c18;
    border-bottom-color: #b07d3a;
  }
  .ms-tab:hover:not(.active) { color: #5a524a; }

  /* Tab content */
  .ms-tab-body { padding: 20px; }

  textarea.ms-input {
    width: 100%;
    min-height: 130px;
    padding: 12px 14px;
    border: 1px solid #e4e0d8;
    border-radius: 12px;
    background: #fbfaf8;
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 13.5px;
    font-weight: 400;
    color: #1c1c18;
    line-height: 1.7;
    resize: vertical;
    transition: border-color 0.15s;
    outline: none;
  }
  textarea.ms-input:focus { border-color: #b07d3a; background: #fff; }
  textarea.ms-input::placeholder { color: #c4bdb4; }

  /* Record tab */
  .ms-record-area {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
  }
  .ms-record-status {
    font-size: 13px;
    color: #9a9387;
    font-weight: 300;
    flex: 1;
  }
  .ms-record-btn {
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.03em;
    padding: 8px 18px;
    border-radius: 20px;
    cursor: pointer;
    border: 1px solid;
    display: flex;
    align-items: center;
    gap: 7px;
    transition: opacity 0.15s;
    white-space: nowrap;
  }
  .ms-record-btn:hover { opacity: 0.8; }
  .ms-record-start { background: #1c1c18; color: #fff; border-color: #1c1c18; }
  .ms-record-stop  { background: #fdf1f1; color: #c0392b; border-color: #f3c9c9; }

  /* Upload tab */
  .ms-upload-zone {
    border: 1px dashed #d5cfc5;
    border-radius: 12px;
    background: #fbfaf8;
    padding: 28px 20px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .ms-upload-zone:hover { border-color: #b07d3a; background: #fdf8f2; }
  .ms-upload-title { font-size: 13px; font-weight: 500; color: #3a3530; margin-bottom: 3px; }
  .ms-upload-hint  { font-size: 11.5px; color: #b0a89e; letter-spacing: 0.02em; }

  /* Bottom row of panel */
  .ms-panel-foot {
    border-top: 1px solid #e4e0d8;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .ms-generate-btn {
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    background: #1c1c18;
    color: #fff;
    border: none;
    border-radius: 20px;
    padding: 10px 22px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity 0.15s;
  }
  .ms-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ms-generate-btn:not(:disabled):hover { opacity: 0.82; }

  select.ms-select {
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #3a3530;
    background: #fff;
    border: 1px solid #e4e0d8;
    border-radius: 20px;
    padding: 8px 28px 8px 14px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%239a9387' d='M5 7L1 3h8z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 11px center;
    outline: none;
    transition: border-color 0.15s;
  }
  select.ms-select:focus { border-color: #b07d3a; }

  .ms-template-row {
    background: #fff;
    border: 1px solid #e4e0d8;
    border-radius: 20px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .ms-template-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #b0a89e;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .ms-template-upload {
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 12.5px;
    font-weight: 600;
    color: #5a524a;
    background: #fbfaf8;
    border: 1px solid #e4e0d8;
    border-radius: 20px;
    padding: 6px 14px;
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.15s;
  }
  .ms-template-upload:hover { border-color: #b07d3a; }
  .ms-template-divider { font-size: 11px; color: #c4bdb4; }

  .ms-badge {
    font-size: 11px;
    color: #8a6525;
    background: #fdf3e0;
    border: 1px solid #e8d5a8;
    border-radius: 20px;
    padding: 3px 10px;
    font-weight: 600;
    letter-spacing: 0.01em;
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

  return (
    <>
      <style>{css}</style>
      <div className="ms-root">

        {/* Header
        <header className="ms-header">
          <div className="ms-logo-row">
            <img src={logoUrl} alt="Mahdari" className="ms-logo-img" />
            <span className="ms-logo-text">Mah<span>dari</span></span>
          </div>
          <button className="ms-signout" onClick={handleSignout}>Sign out</button>
        </header> */}

        <div className="ms-body">
          <h1 className="ms-title">New  Mah<span>dar</span></h1>
          <p className="ms-sub">Generate a clean minutes-of-meeting from audio or notes.</p>

          {/* Main input panel */}
          <div className="ms-panel">

            {/* Tabs */}
            <div className="ms-tabs">
              {[
                { id: TABS.type,   label: "Type notes" },
                { id: TABS.record, label: "Record audio" },
                { id: TABS.upload, label: "Upload audio" },
              ].map(t => (
                <button
                  key={t.id}
                  className={`ms-tab${activeTab === t.id ? " active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab bodies */}
            <div className="ms-tab-body">

              {activeTab === TABS.type && (
                <textarea
                  className="ms-input"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Paste or type your meeting notes here…"
                />
              )}

              {activeTab === TABS.record && (
                <div className="ms-record-area">
                  <span className="ms-record-status">
                    {recording
                      ? "Recording in progress…"
                      : file?.name === "recording.webm"
                        ? <span className="ms-badge">✓ Audio captured</span>
                        : "Tap the button to start recording."}
                  </span>
                  {recording ? (
                    <button className="ms-record-btn ms-record-stop" onClick={stopRecording}>
                      <span className="ms-rec" /> Stop
                    </button>
                  ) : (
                    <button className="ms-record-btn ms-record-start" onClick={startRecording}>
                      ● Start recording
                    </button>
                  )}
                </div>
              )}

              {activeTab === TABS.upload && (
                <>
                  <input ref={audioFileRef} type="file" accept="audio/*" style={{ display: "none" }}
                    onChange={e => setFile(e.target.files[0])} />
                  <div className="ms-upload-zone" onClick={() => audioFileRef.current?.click()}>
                    <div className="ms-upload-title">Click to upload audio</div>
                    <div className="ms-upload-hint">MP3 · WAV · WEBM · M4A</div>
                    {file && (
                      <span className="ms-badge" style={{ display: "inline-block", marginTop: "10px" }}>
                        ✓ {file.name}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer: generate + options */}
            <div className="ms-panel-foot">
              <button
                className="ms-generate-btn"
                onClick={processAudio}
                disabled={loading}
              >
                {loading
                  ? <><span className="ms-spinner" /> Generating…</>
                  : "Generate Mahdar"}
              </button>

              <select
                className="ms-select"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="english">English</option>
                <option value="arabic">Arabic</option>
              </select>
            </div>
          </div>

          {/* Template row — compact, same visual weight as the panel */}
          <div className="ms-template-row" style={{ marginTop: "8px" }}>
            <span className="ms-template-label">Template</span>

            <input ref={templateFileRef} type="file" accept=".docx" style={{ display: "none" }}
              onChange={e => setTemplate(e.target.files[0])} />
            <button className="ms-template-upload" onClick={() => templateFileRef.current?.click()}>
              {template ? <span className="ms-badge">✓ {template.name}</span> : "Upload .docx"}
            </button>

            {savedTemplates.length > 0 && (
              <>
                <span className="ms-template-divider">or</span>
                <select
                  className="ms-select"
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
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <option value="">Choose saved template…</option>
                  {savedTemplates.map((t) => (
                    <option key={t.id} value={t.download_url}>{t.name}</option>
                  ))}
                </select>
              </>
            )}

            {!template && savedTemplates.length === 0 && (
              <span className="ms-template-divider" style={{ fontSize: "12px", color: "#c4bdb4" }}>
                Optional — your MoM will follow its structure
              </span>
            )}
          </div>

          {/* Generated output */}
          {text && mom && (
            <div style={{ marginTop: "32px" }}>
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default UploadScreen;