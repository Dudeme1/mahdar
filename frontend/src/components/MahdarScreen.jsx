import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import MahdarLoader from "./MahdarLoader";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

  @keyframes mah-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .mah-root { animation: mah-fadein 0.3s ease; font-family:'DM Sans',system-ui,sans-serif; }

  @keyframes mah-spin { to { transform:rotate(360deg); } }
  .mah-spinner-lg { width:26px;height:26px;border:3px solid #e2e0e5;border-top-color:#1a2e22;border-radius:50%;animation:mah-spin 0.8s linear infinite; }

  /* Sticky column header */
  .mah-col-header {
    position: sticky; top: 0; z-index: 10;
    background: #f4f5f2;
    padding: 16px 20px 12px;
    border-bottom: 1px solid #e8e7ea;
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap;
    flex-shrink: 0;
  }

  /* Editable textarea */
  .mah-textarea {
    width: 100%; padding: 10px 42px 10px 12px;
    border-radius: 10px; border: 1px solid #e2e0e5;
    background: #fafaf9; font-size: 13px; color: #1a2e22;
    resize: vertical; box-sizing: border-box; line-height: 1.6;
    font-family: 'DM Sans', system-ui, sans-serif;
    min-height: 72px;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .mah-textarea:focus {
    border-color: rgba(195,152,83,0.6) !important;
    background: #fff !important; outline: none;
    box-shadow: 0 0 0 3px rgba(195,152,83,0.08);
  }

  /* Copy button */
  .mah-copy-btn {
    position: absolute; top: 9px; right: 9px;
    border: 1px solid #e8e7ea; background: #f4f5f2;
    border-radius: 6px; cursor: pointer; padding: 3px 9px;
    font-size: 11px; font-weight: 500; color: #7a7585;
    font-family: 'DM Sans', system-ui, sans-serif;
    transition: all 0.15s; z-index: 1;
  }
  .mah-copy-btn:hover { background: #ebe9ed; color: #1a2e22; }
  .mah-copy-btn.copied { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }

  /* Attendee card */
  .mah-attendee-card { transition: box-shadow 0.15s, border-color 0.15s; }
  .mah-attendee-card:hover { box-shadow: rgba(26,46,34,0.08) 0 4px 14px -2px; border-color: #d8d5dc; }

  /* Override select */
  .mah-override-select {
    padding: 7px 10px; border-radius: 8px; border: 1px solid #e2e0e5;
    background: #fafaf9; font-size: 12px; color: #7a7585;
    font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer; outline: none; flex: 1; min-width: 0;
    transition: border-color 0.15s;
  }
  .mah-override-select:focus { border-color: rgba(195,152,83,0.5); }

  /* Remember button */
  .mah-remember-btn {
    padding: 7px 13px; border-radius: 8px;
    border: 1px solid rgba(195,152,83,0.3);
    background: rgba(195,152,83,0.08); font-size: 12px; font-weight: 500;
    color: #a07830; font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer; transition: background 0.15s; white-space: nowrap;
  }
  .mah-remember-btn:hover { background: rgba(195,152,83,0.16); }
  .mah-remember-btn.saved { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }

  /* Export button */
  .mah-export-btn {
    background: #1a2e22; color: #fff; border: none; border-radius: 10px;
    padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', system-ui, sans-serif;
    display: inline-flex; align-items: center; gap: 7px;
    transition: opacity 0.15s, transform 0.1s; letter-spacing: 0.01em;
    white-space: nowrap; flex-shrink: 0;
  }
  .mah-export-btn:hover { opacity: 0.88; }
  .mah-export-btn:active { transform: scale(0.98); }

  /* Preview button */
  .mah-preview-btn {
    background: transparent; color: #3d7a58;
    border: 1px solid rgba(90,138,106,0.4); border-radius: 10px;
    padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', system-ui, sans-serif;
    display: inline-flex; align-items: center; gap: 7px;
    transition: background 0.14s, border-color 0.14s;
    white-space: nowrap; flex-shrink: 0;
  }
  .mah-preview-btn:hover { background: rgba(90,138,106,0.08); border-color: rgba(90,138,106,0.6); }
  .mah-preview-btn:disabled { opacity: 0.38; cursor: not-allowed; }
  .mah-preview-btn.open { background: #1a2e22; border-color: #1a2e22; color: #fff; }
  .mah-preview-btn.open:hover { background: #253d2e; }

  /* Action item row/input */
  .mah-action-row { transition: background 0.12s; }
  .mah-action-row:hover { background: #faf9f7; }
  .mah-action-input {
    width: 100%; padding: 7px 9px; border-radius: 8px;
    border: 1px solid transparent; background: transparent;
    font-size: 13px; color: #1a2e22; font-family: 'DM Sans', system-ui, sans-serif;
    box-sizing: border-box; outline: none;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .mah-action-input:focus {
    border-color: rgba(195,152,83,0.5); background: #fff;
    box-shadow: 0 0 0 3px rgba(195,152,83,0.07);
  }
  .mah-action-input::placeholder { color: #c4bfca; }

  /* Drag handle */
  .mah-drag-handle {
    display:flex;align-items:center;justify-content:center;
    width:22px;height:22px;flex-shrink:0;
    cursor:grab;color:#c4bfca;border-radius:4px;
    opacity:0.35;transition:opacity 0.15s;
    user-select:none;
  }
  .mah-drag-handle:active { cursor:grabbing; }
  .mah-attendee-card:hover .mah-drag-handle,
  .mah-action-row:hover .mah-drag-handle { opacity:0.85; }

  /* Remove button */
  .mah-remove-btn {
    display:flex;align-items:center;justify-content:center;
    width:26px;height:26px;flex-shrink:0;padding:0;
    border-radius:7px;border:1.5px solid rgba(220,38,38,0.18);
    background:transparent;color:#e07070;font-size:15px;
    font-weight:700;line-height:1;cursor:pointer;
    opacity:0;transition:opacity 0.15s,background 0.12s,color 0.12s,border-color 0.12s;
  }
  .mah-attendee-card:hover .mah-remove-btn,
  .mah-action-row:hover .mah-remove-btn { opacity:1; }
  .mah-remove-btn:hover { background:#fee2e2;color:#dc2626;border-color:#fca5a5; }

  /* Drag visual feedback */
  .mah-attendee-card.drag-source { opacity:0.4; }
  .mah-attendee-card.drag-over   { border-top:2.5px solid #c89b58 !important; }
  .mah-action-row.drag-source > td { opacity:0.4; }
  .mah-action-row.drag-over > td   { border-top:2.5px solid #c89b58; }

  /* ── Preview drawer ── */
  @keyframes mah-drawer-in  { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes mah-drawer-out { from{transform:translateX(0)} to{transform:translateX(100%)} }
  @keyframes mah-overlay-in { from{opacity:0} to{opacity:1} }

  .mah-drawer-overlay {
    position:fixed; inset:0; z-index:200;
    background:rgba(10,20,13,0.28); backdrop-filter:blur(2px);
    animation:mah-overlay-in 0.2s ease;
  }
  .mah-drawer {
    position:fixed; top:0; right:0; bottom:0; z-index:201;
    width:min(520px,90vw); background:#fff;
    box-shadow:-8px 0 40px rgba(0,0,0,0.18);
    display:flex; flex-direction:column;
    animation:mah-drawer-in 0.26s cubic-bezier(0.2,0,0.2,1);
  }
  .mah-drawer.closing { animation:mah-drawer-out 0.22s cubic-bezier(0.4,0,1,1) forwards; }
  .mah-drawer-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:16px 20px; border-bottom:1px solid #eeeced;
    background:#fff; flex-shrink:0;
  }
  .mah-drawer-close {
    display:flex; align-items:center; justify-content:center;
    width:30px; height:30px; border-radius:8px; border:1px solid #e8e7ea;
    background:#f5f4f7; cursor:pointer; color:#888;
    font-size:14px; font-weight:600;
    transition:background 0.13s,color 0.13s; flex-shrink:0;
  }
  .mah-drawer-close:hover { background:#ebe9ed; color:#1a2e22; }
  .mah-legend-found   { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;background:#d1fae5;color:#065f46;border:1px solid #6ee7b7; }
  .mah-legend-unknown { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5; }
  .mah-legend-loop    { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1; }
`;

// ─── Shared style tokens ──────────────────────────────────────────────────────
const card = {
  background: "#fff", border: "1px solid #e8e7ea", borderRadius: "14px",
  padding: "18px 20px", boxShadow: "rgba(26,46,34,0.05) 0 4px 16px -4px", marginBottom: "12px",
};
const sectionTitle = {
  fontSize: "10px", fontWeight: "700", color: "#b0adb5",
  letterSpacing: "0.1em", textTransform: "uppercase",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};
const fieldLabel = {
  fontSize: "10px", fontWeight: "600", color: "#b0adb5",
  letterSpacing: "0.07em", textTransform: "uppercase",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function CopyButton({ value }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(value || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button className={`mah-copy-btn${copied ? " copied" : ""}`} onClick={handle}>
      {copied ? t("common.copied") : t("common.copy")}
    </button>
  );
}

function Field({ label: lbl, value, onChange, large }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={fieldLabel}>{lbl}</label>
      <div style={{ position: "relative" }}>
        <CopyButton value={value} />
        <textarea
          className="mah-textarea"
          style={large ? { minHeight: "96px" } : {}}
          value={value || ""}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function SectionHead({ title }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px",paddingBottom:"10px",borderBottom:"1px solid #f0eff2" }}>
      <span style={sectionTitle}>{title}</span>
    </div>
  );
}

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
      <circle cx="2.5" cy="2"  r="1.3"/>
      <circle cx="7.5" cy="2"  r="1.3"/>
      <circle cx="2.5" cy="7"  r="1.3"/>
      <circle cx="7.5" cy="7"  r="1.3"/>
      <circle cx="2.5" cy="12" r="1.3"/>
      <circle cx="7.5" cy="12" r="1.3"/>
    </svg>
  );
}

function RememberButton({ onClick }) {
  const { t } = useLanguage();
  const [state, setState] = useState("idle");
  const handle = async () => {
    setState("saving");
    await onClick();
    setState("saved");
    setTimeout(() => setState("idle"), 2000);
  };
  return (
    <button
      className={`mah-remember-btn${state === "saved" ? " saved" : ""}`}
      onClick={handle} disabled={state === "saving"}
    >
      {state === "saved" ? t("common.saved") : state === "saving" ? t("common.saving") : t("mahdar.fieldRemember")}
    </button>
  );
}

// ─── Preview drawer ───────────────────────────────────────────────────────────
function PreviewDrawer({ html, loading, onClose }) {
  const { t } = useLanguage();
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(500);
  const [closing, setClosing] = useState(false);

  const close = () => { setClosing(true); setTimeout(onClose, 210); };
  const onLoad = () => {
    try {
      const body = iframeRef.current?.contentDocument?.body;
      if (body) setIframeHeight(Math.min(body.scrollHeight + 24, 2000));
    } catch { /* cross-origin */ }
  };

  return (
    <>
      <div className="mah-drawer-overlay" onClick={close} />
      <div className={`mah-drawer${closing ? " closing" : ""}`}>
        <div className="mah-drawer-header">
          <div>
            <div style={{ fontSize:"14px",fontWeight:"700",color:"#1a2e22",fontFamily:"DM Sans,sans-serif" }}>
              {t("mahdar.drawerTitle")}
            </div>
            <div style={{ fontSize:"11px",color:"#aaa",fontFamily:"DM Sans,sans-serif",marginTop:"1px" }}>
              {t("mahdar.drawerSubtitle")}
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",flexShrink:0 }}>
            {html && !loading && (
              <div style={{ display:"flex",gap:"5px" }}>
                <span className="mah-legend-found">{t("mahdar.filled")}</span>
                <span className="mah-legend-unknown">{t("mahdar.unknown")}</span>
                <span className="mah-legend-loop">{t("mahdar.loop")}</span>
              </div>
            )}
            <button className="mah-drawer-close" onClick={close}>✕</button>
          </div>
        </div>

        {html && !loading && (
          <div style={{ padding:"7px 20px",fontSize:"11px",color:"#94a3b8",fontFamily:"DM Sans,sans-serif",borderBottom:"1px solid #f0eff2",background:"#fafcff",flexShrink:0 }}>
            {t("mahdar.drawerPreviewNote")}
          </div>
        )}

        <div style={{ flex:1,overflowY:"auto",display:"flex",flexDirection:"column" }}>
          {loading && (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:"14px",padding:"60px 20px" }}>
              <MahdarLoader size="lg" />
              <div style={{ fontSize:"13px",color:"#888",fontFamily:"DM Sans,sans-serif" }}>{t("mahdar.generatingPreview")}</div>
            </div>
          )}
          {html && !loading && (
            <iframe
              ref={iframeRef} srcDoc={html} onLoad={onLoad}
              sandbox="allow-same-origin"
              style={{ width:"100%",height:`${iframeHeight}px`,border:"none",display:"block",background:"#fff" }}
              title="Report preview"
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function MahdarScreen({
  token, date, hijri_date, title, purpose, location,
  attendees, discussion, decisions, action_items,
  next_meeting, hijri_next_meeting, template,
}) {
  const { t } = useLanguage();
  const [edit_date,               setDate]               = useState(date);
  const [edit_hijri_date,         setHijriDate]          = useState(hijri_date);
  const [edit_title,              setTitle]              = useState(title);
  const [edit_purpose,            setPurpose]            = useState(purpose);
  const [edit_location,           setLocation]           = useState(location);
  const [edit_next_meeting,       setNextMeeting]        = useState(next_meeting);
  const [edit_hijri_next_meeting, setHijriNextMeeting]   = useState(hijri_next_meeting);
  const [edit_attendees,          setAttendees]          = useState(() => (attendees||[]).map((a,i) => ({...a, _id:i})));
  const [saved_attendees,         setSavedAttendees]     = useState([]);
  const [edit_discussion,         setDiscussion]         = useState(discussion);
  const [edit_decisions,          setDecisions]          = useState(decisions);
  const [edit_actionItems,        setActionItems]        = useState(() => (action_items||[]).map((a,i) => ({...a, _id:100+i})));
  const [dragState,               setDragState]          = useState({ type: null, from: null, over: null });

  // Preview drawer state
  const [previewOpen,    setPreviewOpen]    = useState(false);
  const [previewHtml,    setPreviewHtml]    = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API}/get-attendees`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(r => r.json()).then(d => setSavedAttendees(d.attendees || []));
  }, []);

  const updateAttendee = (i, field, val) => {
    const u = [...edit_attendees]; u[i] = { ...u[i], [field]: val }; setAttendees(u);
  };
  const updateActionItem = (i, field, val) => {
    const u = [...edit_actionItems]; u[i] = { ...u[i], [field]: val }; setActionItems(u);
  };
  const saveAttendee = async (a) => {
    await fetch(`${API}/save-attendee`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name: a.name, email: a.email, role: a.role, aliases: [] }),
    });
  };

  const removeAttendee   = (id) => setAttendees(list => list.filter(a => a._id !== id));
  const removeActionItem = (id) => setActionItems(list => list.filter(a => a._id !== id));

  const reorder = (list, from, to) => {
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  const onDragStart = (type, index) => (e) => {
    e.dataTransfer.effectAllowed = "move";
    setDragState({ type, from: index, over: null });
  };
  const onDragOver = (type, index) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragState(s => s.over === index ? s : { ...s, over: index });
  };
  const onDrop = (type, index) => (e) => {
    e.preventDefault();
    const from = dragState.from;
    if (from !== null && from !== index) {
      if (type === "attendee") setAttendees(list => reorder(list, from, index));
      else                     setActionItems(list => reorder(list, from, index));
    }
    setDragState({ type: null, from: null, over: null });
  };
  const onDragEnd = () => setDragState({ type: null, from: null, over: null });

  const handleExport = async () => {
    if (!template) return alert(t("mahdar.selectTemplateAlert"));
    const fd = new FormData();
    fd.append("template", template);
    fd.append("date", edit_date);
    fd.append("title", edit_title);
    fd.append("location", edit_location);
    fd.append("attendees", JSON.stringify(edit_attendees.map(({_id, ...a}) => a)));
    fd.append("purpose", edit_purpose);
    fd.append("discussion", edit_discussion);
    fd.append("decisions", edit_decisions);
    fd.append("action_items", JSON.stringify(edit_actionItems.map(({_id, ...a}) => a)));
    fd.append("next_meeting", edit_next_meeting);
    const res = await fetch(`${API}/export`, { method: "POST", body: fd });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mahdar_${new Date().toISOString()}.docx`; a.click();
  };

  // Build preview HTML with real meeting data filled in
  const handlePreview = async () => {
    if (!template) return alert(t("mahdar.selectTemplateFirst"));
    if (previewOpen) { setPreviewOpen(false); return; }

    setPreviewOpen(true);
    setPreviewHtml(null);
    setPreviewLoading(true);

    // Send the template file + real meeting data to a dedicated endpoint
    const fd = new FormData();
    fd.append("template", template);
    fd.append("date", edit_date || "");
    fd.append("hijri_date", edit_hijri_date || "");
    fd.append("title", edit_title || "");
    fd.append("location", edit_location || "");
    fd.append("purpose", edit_purpose || "");
    fd.append("discussion", edit_discussion || "");
    fd.append("decisions", edit_decisions || "");
    fd.append("next_meeting", edit_next_meeting || "");
    fd.append("hijri_next_meeting", edit_hijri_next_meeting || "");
    fd.append("attendees", JSON.stringify((edit_attendees || []).map(({_id, ...a}) => a)));
    fd.append("action_items", JSON.stringify((edit_actionItems || []).map(({_id, ...a}) => a)));
    fd.append("token", token);

    try {
      const res = await fetch(`${API}/preview-mahdar`, { method: "POST", body: fd });
      const data = await res.json();
      setPreviewHtml(data.html || null);
    } catch {
      setPreviewHtml(null);
    }
    setPreviewLoading(false);
  };

  const th = {
    textAlign: "left", fontSize: "10px", fontWeight: "600",
    letterSpacing: "0.08em", textTransform: "uppercase", color: "#b0adb5",
    padding: "10px 14px", borderBottom: "1px solid #e8e7ea",
    background: "#faf9f7", fontFamily: "'DM Sans', system-ui, sans-serif",
  };
  const td = { padding: "10px 14px", borderBottom: "1px solid #f0eff2", verticalAlign: "middle" };

  return (
    <>
      <style>{css}</style>
      <div className="mah-root" style={{ display:"flex",flexDirection:"column",height:"100%" }}>

        {/* ── Sticky header ── */}
        <div className="mah-col-header">
          <div>
            <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:"18px",fontWeight:"400",color:"#1a2e22",letterSpacing:"-0.3px" }}>
              {t("mahdar.reportTitle")}
            </div>
            <div style={{ fontSize:"11.5px",color:"#a09aaa",marginTop:"1px",fontFamily:"DM Sans,sans-serif" }}>
              {edit_title || t("mahdar.untitledMeeting")} · {t("mahdar.subtitle")}
            </div>
          </div>
          <div style={{ display:"flex",gap:"8px",alignItems:"center" }}>
            <button
              className={`mah-preview-btn${previewOpen ? " open" : ""}`}
              onClick={handlePreview}
              disabled={!template}
              title={template ? t("mahdar.previewWithTemplate") : t("mahdar.selectTemplateFirst")}
            >
              {previewOpen ? t("mahdar.closePreview") : t("common.preview")}
            </button>
            <button className="mah-export-btn" onClick={handleExport}>
              {t("mahdar.exportWord")}
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex:1,overflowY:"auto",padding:"16px 20px 40px" }}>

          {/* Meeting Info */}
          <div style={card}>
            <SectionHead title={t("mahdar.meetingInfo")} />
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"12px" }}>
              <Field label={t("mahdar.fieldDate")} value={edit_date} onChange={setDate} />
              <Field label={t("mahdar.fieldHijriDate")} value={edit_hijri_date} onChange={setHijriDate} />
              <Field label={t("mahdar.fieldTitle")} value={edit_title} onChange={setTitle} />
              <Field label={t("mahdar.fieldLocation")} value={edit_location} onChange={setLocation} />
              <Field label={t("mahdar.fieldNextMeeting")} value={edit_next_meeting} onChange={setNextMeeting} />
              <Field label={t("mahdar.fieldHijriNext")} value={edit_hijri_next_meeting} onChange={setHijriNextMeeting} />
            </div>
          </div>

          {/* Attendees */}
          <div style={card}>
            <SectionHead title={t("mahdar.attendeesSection")} />
            <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
              {edit_attendees.map((attendee, index) => {
                const isDragSource = dragState.type === "attendee" && dragState.from === index;
                const isDragOver   = dragState.type === "attendee" && dragState.over === index && dragState.from !== index;
                return (
                  <div
                    key={attendee._id}
                    className={`mah-attendee-card${isDragSource ? " drag-source" : ""}${isDragOver ? " drag-over" : ""}`}
                    style={{ display:"flex",alignItems:"flex-start",gap:"6px",border:"1px solid #e8e7ea",borderRadius:"12px",padding:"12px 14px",background:"#fafaf9" }}
                    onDragOver={onDragOver("attendee", index)}
                    onDrop={onDrop("attendee", index)}
                    onDragEnd={onDragEnd}
                  >
                    {/* Drag handle */}
                    <div
                      className="mah-drag-handle"
                      draggable="true"
                      onDragStart={onDragStart("attendee", index)}
                      style={{ marginTop:"4px" }}
                    >
                      <GripIcon />
                    </div>

                    {/* Card content */}
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"10px" }}>
                        <Field label={t("mahdar.fieldName")}  value={attendee.name}  onChange={v => updateAttendee(index, "name",  v)} />
                        <Field label={t("mahdar.fieldEmail")} value={attendee.email} onChange={v => updateAttendee(index, "email", v)} />
                        <Field label={t("mahdar.fieldRole")}  value={attendee.role}  onChange={v => updateAttendee(index, "role",  v)} />
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:"8px",marginTop:"10px",paddingTop:"10px",borderTop:"1px solid #f0eff2",flexWrap:"wrap" }}>
                        <span style={{ fontSize:"11px",color:"#b0adb5",whiteSpace:"nowrap" }}>{t("mahdar.fieldOverride")}</span>
                        <select className="mah-override-select" onChange={e => {
                          const sel = saved_attendees.find(a => a.name === e.target.value);
                          if (sel) { const u = [...edit_attendees]; u[index] = { ...u[index], name:sel.name, email:sel.email||"", role:sel.role||"" }; setAttendees(u); }
                        }}>
                          <option value="">{t("mahdar.fieldSavedAttendeePlaceholder")}</option>
                          {saved_attendees.map((a, i) => <option key={i} value={a.name}>{a.name}</option>)}
                        </select>
                        <RememberButton onClick={() => saveAttendee(attendee)} />
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      className="mah-remove-btn"
                      onClick={() => removeAttendee(attendee._id)}
                      title={t("mahdar.removeAttendee")}
                      style={{ marginTop:"2px" }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meeting Details */}
          <div style={card}>
            <SectionHead title={t("mahdar.meetingDetails")} />
            <div style={{ display:"flex",flexDirection:"column",gap:"14px" }}>
              <Field label={t("mahdar.fieldPurpose")}    value={edit_purpose}    onChange={setPurpose}    large />
              <Field label={t("mahdar.fieldDiscussion")} value={edit_discussion} onChange={setDiscussion} large />
              <Field label={t("mahdar.fieldDecisions")}  value={edit_decisions}  onChange={setDecisions}  large />
            </div>
          </div>

          {/* Action Items */}
          <div style={{ ...card, padding:0, overflow:"hidden" }}>
            <div style={{ padding:"16px 20px 0" }}>
              <SectionHead title={t("mahdar.actionItemsSection")} />
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...th,width:"28px",padding:"10px 6px" }}></th>
                    <th style={{ ...th,width:"36px" }}>{t("mahdar.fieldNumber")}</th>
                    <th style={th}>{t("mahdar.fieldTask")}</th>
                    <th style={th}>{t("mahdar.fieldOwner")}</th>
                    <th style={th}>{t("mahdar.fieldDeadline")}</th>
                    <th style={{ ...th,width:"28px",padding:"10px 6px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {edit_actionItems.map((item, index) => {
                    const isLast       = index === edit_actionItems.length - 1;
                    const isDragSource = dragState.type === "action" && dragState.from === index;
                    const isDragOver   = dragState.type === "action" && dragState.over === index && dragState.from !== index;
                    const cellStyle    = { ...td, borderBottom: isLast ? "none" : "1px solid #f0eff2" };
                    return (
                      <tr
                        key={item._id}
                        className={`mah-action-row${isDragSource ? " drag-source" : ""}${isDragOver ? " drag-over" : ""}`}
                        onDragOver={onDragOver("action", index)}
                        onDrop={onDrop("action", index)}
                        onDragEnd={onDragEnd}
                      >
                        <td style={{ ...cellStyle,width:"28px",padding:"10px 6px",textAlign:"center" }}>
                          <div className="mah-drag-handle" draggable="true" onDragStart={onDragStart("action", index)}>
                            <GripIcon />
                          </div>
                        </td>
                        <td style={{ ...cellStyle,color:"#c4bfca",fontSize:"12px",fontFamily:"ui-monospace,Consolas,monospace",textAlign:"center" }}>
                          {index + 1}
                        </td>
                        {["task","owner","deadline"].map(field => (
                          <td key={field} style={cellStyle}>
                            <input
                              className="mah-action-input"
                              value={item[field] || ""}
                              placeholder={t(`mahdar.field${field.charAt(0).toUpperCase() + field.slice(1)}`)}
                              onChange={e => updateActionItem(index, field, e.target.value)}
                            />
                          </td>
                        ))}
                        <td style={{ ...cellStyle,width:"28px",padding:"10px 6px",textAlign:"center" }}>
                          <button className="mah-remove-btn" onClick={() => removeActionItem(item._id)} title={t("mahdar.removeAction")}>×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>{/* end scrollable body */}

        {/* Preview drawer — fixed overlay */}
        {previewOpen && (
          <PreviewDrawer
            html={previewHtml}
            loading={previewLoading}
            onClose={() => setPreviewOpen(false)}
          />
        )}

      </div>
    </>
  );
}

export default MahdarScreen;