import { useState, useEffect, useRef } from "react";
import supabase from "../supabase";

// ─── Data ─────────────────────────────────────────────────────────────────────
const SIMPLE_VARS = [
  { token: "{{ title }}",              label: "Meeting Title"      },
  { token: "{{ date }}",               label: "Date"               },
  { token: "{{ hijri_date }}",         label: "Hijri Date"         },
  { token: "{{ location }}",           label: "Location"           },
  { token: "{{ purpose }}",            label: "Purpose"            },
  { token: "{{ discussion }}",         label: "Discussion Points"  },
  { token: "{{ decisions }}",          label: "Decisions Made"     },
  { token: "{{ next_meeting }}",       label: "Next Meeting Date"  },
  { token: "{{ hijri_next_meeting }}", label: "Next Meeting Hijri" },
];

const LOOP_VARS = {
  attendees: {
    label:   "Attendees Table",
    forTag:  "{% for attendee in attendees %}",
    endTag:  "{% endfor %}",
    columns: [
      { token: "{{ attendee.name }}",  header: "Name"  },
      { token: "{{ attendee.role }}",  header: "Role"  },
      { token: "{{ attendee.email }}", header: "Email" },
    ],
  },
  action_items: {
    label:   "Action Items Table",
    forTag:  "{% for item in action_items %}",
    endTag:  "{% endfor %}",
    columns: [
      { token: "{{ item.task }}",     header: "Task"     },
      { token: "{{ item.owner }}",    header: "Owner"    },
      { token: "{{ item.deadline }}", header: "Deadline" },
    ],
  },
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
  * { box-sizing: border-box; }

  @keyframes tmpl-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .tmpl-root { animation: tmpl-fadein 0.28s ease; font-family:'DM Sans',system-ui,sans-serif; }

  @keyframes tmpl-spin { to { transform: rotate(360deg); } }
  .tmpl-spinner { width:15px;height:15px;border:2px solid #e2e0e5;border-top-color:#1a2e22;border-radius:50%;animation:tmpl-spin 0.7s linear infinite;flex-shrink:0; }
  .tmpl-spinner-white { width:13px;height:13px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:tmpl-spin 0.7s linear infinite;flex-shrink:0; }
  .tmpl-spinner-lg { width:28px;height:28px;border:3px solid #e2e0e5;border-top-color:#1a2e22;border-radius:50%;animation:tmpl-spin 0.8s linear infinite; }

  @keyframes tmpl-slide-in { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:translateX(0)} }
  .tmpl-panel { animation:tmpl-slide-in 0.22s cubic-bezier(0.2,0,0.2,1); }

  /* Guide toggle button */
  .tmpl-toggle {
    display:flex;align-items:center;gap:8px;
    padding:9px 16px;border-radius:10px;
    border:1.5px solid rgba(195,152,83,0.35);
    background:rgba(195,152,83,0.07);color:#a07830;
    font-family:'DM Sans',system-ui,sans-serif;
    font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;
    transition:background 0.15s,border-color 0.15s,color 0.15s;
  }
  .tmpl-toggle:hover { background:rgba(195,152,83,0.14);border-color:rgba(195,152,83,0.55); }
  .tmpl-toggle.open { background:#1a2e22;border-color:#1a2e22;color:#fff; }
  .tmpl-toggle.open:hover { background:#253d2e;border-color:#253d2e; }

  /* ── Preview drawer — slides in from right edge, fixed overlay ── */
  @keyframes tmpl-drawer-in  { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes tmpl-drawer-out { from{transform:translateX(0)} to{transform:translateX(100%)} }

  .tmpl-drawer-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(10,20,13,0.28);
    backdrop-filter: blur(2px);
    animation: tmpl-fadein 0.2s ease;
  }
  .tmpl-drawer {
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 201;
    width: min(520px, 90vw);
    background: #fff;
    box-shadow: -8px 0 40px rgba(0,0,0,0.18);
    display: flex; flex-direction: column;
    animation: tmpl-drawer-in 0.26s cubic-bezier(0.2,0,0.2,1);
  }
  .tmpl-drawer.closing {
    animation: tmpl-drawer-out 0.22s cubic-bezier(0.4,0,1,1) forwards;
  }

  /* Drawer header */
  .tmpl-drawer-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #eeeced;
    background: #fff;
    flex-shrink: 0;
  }

  /* Close button inside drawer */
  .tmpl-drawer-close {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px;
    border-radius: 8px; border: 1px solid #e8e7ea;
    background: #f5f4f7; cursor: pointer;
    color: #888; font-size: 14px; font-weight: 600;
    transition: background 0.13s, color 0.13s;
    flex-shrink: 0;
  }
  .tmpl-drawer-close:hover { background: #ebe9ed; color: #1a2e22; }

  /* Preview row button */
  .tmpl-btn-preview-row {
    background:transparent;color:#3d7a58;border:1px solid rgba(90,138,106,0.35);
    border-radius:8px;padding:5px 11px;font-size:12px;font-weight:500;
    font-family:'DM Sans',system-ui,sans-serif;cursor:pointer;
    display:inline-flex;align-items:center;gap:5px;transition:background 0.14s;
  }
  .tmpl-btn-preview-row:hover { background:rgba(90,138,106,0.08); }
  .tmpl-btn-preview-row.active { background:rgba(90,138,106,0.14);border-color:rgba(90,138,106,0.6); }

  /* Pulse dot */
  @keyframes tmpl-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.5} }
  .tmpl-pulse { width:7px;height:7px;border-radius:50%;background:#c39853;animation:tmpl-pulse 2s ease-in-out infinite;flex-shrink:0; }

  /* Input */
  .tmpl-input {
    width:100%;padding:10px 13px;border-radius:10px;border:1px solid #e2e0e5;
    background:#fafaf9;font-size:13px;color:#1a2e22;
    font-family:'DM Sans',system-ui,sans-serif;outline:none;
    transition:border-color 0.15s,box-shadow 0.15s;
  }
  .tmpl-input:focus { border-color:rgba(195,152,83,0.6);background:#fff;box-shadow:0 0 0 3px rgba(195,152,83,0.08); }
  .tmpl-input::placeholder { color:#c4bfca; }

  /* File zone */
  .tmpl-file-zone {
    border:1.5px dashed #e2e0e5;border-radius:11px;padding:22px 16px;
    background:#fafaf9;display:flex;flex-direction:column;align-items:center;
    gap:7px;cursor:pointer;text-align:center;
    transition:border-color 0.15s,background 0.15s;
  }
  .tmpl-file-zone:hover { border-color:rgba(195,152,83,0.5);background:rgba(195,152,83,0.03); }
  .tmpl-file-zone.has-file { border-color:rgba(195,152,83,0.5);background:rgba(195,152,83,0.04); }

  /* Buttons */
  .tmpl-btn-primary {
    background:#1a2e22;color:#fff;border:none;border-radius:10px;
    padding:11px 20px;font-size:13px;font-weight:600;
    font-family:'DM Sans',system-ui,sans-serif;cursor:pointer;
    display:flex;align-items:center;justify-content:center;gap:7px;
    transition:opacity 0.15s;width:100%;
  }
  .tmpl-btn-primary:hover:not(:disabled) { opacity:0.85; }
  .tmpl-btn-primary:disabled { opacity:0.45;cursor:not-allowed; }

  .tmpl-btn-dl {
    background:transparent;color:#a07830;border:1px solid rgba(195,152,83,0.35);
    border-radius:8px;padding:5px 11px;font-size:12px;font-weight:500;
    font-family:'DM Sans',system-ui,sans-serif;cursor:pointer;
    text-decoration:none;display:inline-flex;align-items:center;gap:5px;
    transition:background 0.14s;
  }
  .tmpl-btn-dl:hover { background:rgba(195,152,83,0.08); }

  .tmpl-btn-ghost {
    background:transparent;color:#c4bfca;border:1px solid transparent;
    border-radius:8px;padding:5px 8px;font-size:13px;
    font-family:'DM Sans',system-ui,sans-serif;cursor:pointer;
    transition:color 0.14s,background 0.14s;display:flex;align-items:center;line-height:1;
  }
  .tmpl-btn-ghost:hover { color:#dc2626;background:rgba(220,38,38,0.06); }

  /* Copy chip */
  .tmpl-chip {
    display:inline-flex;align-items:center;gap:5px;
    padding:3px 7px 3px 9px;border-radius:6px;
    font-family:'Courier New',monospace;font-size:12px;
    cursor:pointer;user-select:none;
    border:1px solid #d0e8d8;background:#f0f7f2;color:#1a2e22;
    transition:background 0.12s;white-space:normal;word-break:break-all;
  }
  .tmpl-chip:hover { background:#dff0e6; }
  .tmpl-chip.loop { background:#fff8ee;border-color:#f0d8a8;color:#7a5820; }
  .tmpl-chip.loop:hover { background:#fef0d0; }
  .tmpl-chip.copied { background:#dcfce7 !important;border-color:#86efac !important;color:#166534 !important; }
  .tmpl-chip-label { font-size:8.5px;font-weight:700;letter-spacing:0.05em;opacity:0.4;font-family:'DM Sans',system-ui,sans-serif; }

  /* Guide section label */
  .tmpl-guide-section {
    padding:10px 0 6px;font-size:9.5px;font-weight:700;letter-spacing:0.1em;
    text-transform:uppercase;color:#b0adb5;font-family:'DM Sans',system-ui,sans-serif;
    border-top:1px solid #f0eff2;margin-top:4px;
  }
  .tmpl-guide-section:first-child { border-top:none;margin-top:0;padding-top:0; }

  /* Loop diagram table */
  .tmpl-loop-table { width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e0e5;font-size:11px; }
  .tmpl-loop-table th { background:#1a2e22;color:#fff;padding:7px 8px;font-size:10.5px;font-weight:600;text-align:center;font-family:'DM Sans',system-ui,sans-serif; }
  .tmpl-loop-table .loop-band td { background:#fff8ee;padding:6px 8px;border:1px solid #e2e0e5; }
  .tmpl-loop-table .data-band td { background:#fff;padding:7px 8px;border:1px solid #e2e0e5;text-align:center; }

  /* Diagram cell */
  .tmpl-dcell { display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border-radius:5px;cursor:pointer;font-family:'Courier New',monospace;font-size:11px;background:rgba(26,46,34,0.06);color:#1a2e22;transition:background 0.12s;white-space:normal;word-break:break-all;user-select:none; }
  .tmpl-dcell:hover { background:rgba(26,46,34,0.12); }
  .tmpl-dcell.loop-cell { background:rgba(195,152,83,0.15);color:#a07830; }
  .tmpl-dcell.loop-cell:hover { background:rgba(195,152,83,0.28); }
  .tmpl-dcell.copied-cell { background:#dcfce7 !important;color:#166534 !important; }
  .tmpl-dcell-lbl { font-size:7.5px;font-weight:700;letter-spacing:0.05em;opacity:0.38;font-family:'DM Sans',system-ui,sans-serif; }

  /* Scan pills */
  .tmpl-pill { display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:20px;font-size:11.5px;font-family:'DM Sans',system-ui,sans-serif;font-weight:500; }
  .tmpl-pill.found  { background:#dcfce7;color:#166534;border:1px solid #86efac; }
  .tmpl-pill.missed { background:#fafaf9;color:#888;border:1px solid #e2e0e5; }

  /* Legend chips */
  .tmpl-legend-found   { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;background:#d1fae5;color:#065f46;border:1px solid #6ee7b7; }
  .tmpl-legend-unknown { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5; }
  .tmpl-legend-loop    { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1; }

  /* Saved rows */
  .tmpl-row { transition:background 0.12s; }
  .tmpl-row:hover td { background:#faf9f7 !important; }
  .tmpl-row:last-child td { border-bottom:none !important; }

  .tmpl-count-badge { font-size:11px;font-weight:600;color:#a07830;background:rgba(195,152,83,0.12);border:1px solid rgba(195,152,83,0.3);border-radius:20px;padding:2px 9px;font-family:'DM Sans',system-ui,sans-serif; }

  @media (max-width:880px) {
    .tmpl-layout { flex-direction:column !important; }
    .tmpl-panel { flex:none !important;width:100% !important;position:static !important;max-height:none !important; }
  }
`;

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ token, isLoop }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(token).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }); };
  return (
    <span className={`tmpl-chip${isLoop?" loop":""}${copied?" copied":""}`} onClick={copy} title="Click to copy">
      {copied ? "✓ copied" : token}
      {!copied && <span className="tmpl-chip-label">COPY</span>}
    </span>
  );
}

// ─── Diagram cell ─────────────────────────────────────────────────────────────
function DCell({ text, isLoop }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }); };
  return (
    <span className={`tmpl-dcell${isLoop?" loop-cell":""}${copied?" copied-cell":""}`} onClick={copy} title="Click to copy">
      {copied ? "✓ copied" : text}
      {!copied && <span className="tmpl-dcell-lbl">COPY</span>}
    </span>
  );
}

// ─── Loop diagram ─────────────────────────────────────────────────────────────
function LoopDiagram({ def }) {
  return (
    <div style={{ overflowX: "hidden" }}>
      <table className="tmpl-loop-table">
        <thead><tr>{def.columns.map(c => <th key={c.header}>{c.header}</th>)}</tr></thead>
        <tbody>
          <tr className="loop-band">
            <td colSpan={def.columns.length}>
              <div style={{ display:"flex",flexDirection:"column",gap:"3px",alignItems:"flex-start" }}>
                <DCell text={def.forTag} isLoop />
                <span style={{ fontSize:"10px",color:"#bbb",fontStyle:"italic",fontFamily:"DM Sans,sans-serif" }}>← paste in its own row, repeats the next row per item</span>
              </div>
            </td>
          </tr>
          <tr className="data-band">
            {def.columns.map(c => <td key={c.token}><DCell text={c.token} /></td>)}
          </tr>
          <tr className="loop-band">
            <td colSpan={def.columns.length}>
              <div style={{ display:"flex",flexDirection:"column",gap:"3px",alignItems:"flex-start" }}>
                <DCell text={def.endTag} isLoop />
                <span style={{ fontSize:"10px",color:"#bbb",fontStyle:"italic",fontFamily:"DM Sans,sans-serif" }}>← end of loop</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize:"11px",color:"#b0adb5",margin:"7px 0 0",lineHeight:1.5,fontFamily:"DM Sans,sans-serif" }}>
        In Word, create a table with this exact structure. The middle row repeats once per item. Click any cell to copy it.
      </p>
    </div>
  );
}

// ─── Guide panel ──────────────────────────────────────────────────────────────
function GuidePanel({ apiUrl }) {
  return (
    <div className="tmpl-panel" style={{ flex:"0 0 42%",minWidth:0,background:"#fff",border:"1px solid #e8e7ea",borderRadius:"14px",boxShadow:"0 4px 20px -4px rgba(26,46,34,0.1)",display:"flex",flexDirection:"column",maxHeight:"calc(100vh - 80px)",position:"sticky",top:"20px",overflow:"hidden" }}>
      <div style={{ padding:"16px 18px 14px",flexShrink:0,background:"linear-gradient(135deg,#1a2e22 0%,#253d2e 100%)",borderRadius:"13px 13px 0 0" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"9px",marginBottom:"4px" }}>
          <span style={{ fontSize:"16px" }}>📖</span>
          <span style={{ fontSize:"14px",fontWeight:"700",color:"#fff",fontFamily:"DM Sans,sans-serif" }}>How to build a template</span>
        </div>
        <p style={{ fontSize:"11.5px",color:"rgba(255,255,255,0.55)",margin:0,fontFamily:"DM Sans,sans-serif",lineHeight:1.5 }}>
          Place these tokens in your .docx wherever you want the data to appear. Click any token to copy it.
        </p>
      </div>

      <div style={{ flex:1,overflowY:"auto",overflowX:"hidden",padding:"16px 18px",display:"flex",flexDirection:"column",gap:"16px" }}>

        <div style={{ background:"rgba(195,152,83,0.07)",border:"1px solid rgba(195,152,83,0.25)",borderRadius:"10px",padding:"12px 14px",display:"flex",alignItems:"center",gap:"12px" }}>
          <span style={{ fontSize:"22px",flexShrink:0 }}>⬇️</span>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:"12px",fontWeight:"600",color:"#7a5820",fontFamily:"DM Sans,sans-serif",marginBottom:"2px" }}>Quickest way to start</div>
            <div style={{ fontSize:"11px",color:"#a07830",fontFamily:"DM Sans,sans-serif",marginBottom:"8px",lineHeight:1.4 }}>Download our pre-built template — all tokens already placed.</div>
            <a href={`${apiUrl}/starter-template`} download="mahdari_starter_template.docx" style={{ display:"inline-flex",alignItems:"center",gap:"5px",fontSize:"12px",fontWeight:"600",color:"#a07830",textDecoration:"none",fontFamily:"DM Sans,sans-serif",background:"rgba(195,152,83,0.15)",border:"1px solid rgba(195,152,83,0.35)",borderRadius:"7px",padding:"5px 11px" }}>
              ↓ Download starter template
            </a>
          </div>
        </div>

        <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
          <div style={{ flex:1,height:"1px",background:"#f0eff2" }} />
          <span style={{ fontSize:"11px",color:"#c4bfca",fontFamily:"DM Sans,sans-serif" }}>or build your own</span>
          <div style={{ flex:1,height:"1px",background:"#f0eff2" }} />
        </div>

        <div>
          <div className="tmpl-guide-section" style={{ borderTop:"none",marginTop:0,paddingTop:0 }}>Simple fields</div>
          <p style={{ fontSize:"11.5px",color:"#b0adb5",margin:"0 0 10px",lineHeight:1.5,fontFamily:"DM Sans,sans-serif" }}>Paste these anywhere — heading, paragraph, or table cell.</p>
          <div style={{ display:"flex",flexDirection:"column",gap:"6px" }}>
            {SIMPLE_VARS.map(v => (
              <div key={v.token} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px",flexWrap:"wrap",padding:"6px 10px",background:"#fafaf9",borderRadius:"8px",border:"1px solid #f0eff2" }}>
                <span style={{ fontSize:"12px",color:"#666",fontFamily:"DM Sans,sans-serif",fontWeight:"500" }}>{v.label}</span>
                <Chip token={v.token} />
              </div>
            ))}
          </div>
          <div style={{ marginTop:"10px",padding:"9px 11px",background:"#f9f8f5",borderRadius:"8px",border:"1px solid #ebe9ed",fontSize:"11px",color:"#aaa",lineHeight:1.5,fontFamily:"DM Sans,sans-serif" }}>
            💡 Spacing matters — <code style={{ background:"#eee",padding:"1px 4px",borderRadius:"3px" }}>{"{{title}}"}</code> won't work. Use exactly <code style={{ background:"#eee",padding:"1px 4px",borderRadius:"3px" }}>{"{{ title }}"}</code>.
          </div>
        </div>

        <div>
          <div className="tmpl-guide-section">Attendees table</div>
          <p style={{ fontSize:"11.5px",color:"#b0adb5",margin:"0 0 10px",lineHeight:1.5,fontFamily:"DM Sans,sans-serif" }}>Insert a table in Word and structure the rows exactly as below. The middle row auto-repeats per attendee.</p>
          <LoopDiagram def={LOOP_VARS.attendees} />
        </div>

        <div>
          <div className="tmpl-guide-section">Action items table</div>
          <p style={{ fontSize:"11.5px",color:"#b0adb5",margin:"0 0 10px",lineHeight:1.5,fontFamily:"DM Sans,sans-serif" }}>Same idea — three rows in a Word table. The middle row repeats per action item.</p>
          <LoopDiagram def={LOOP_VARS.action_items} />
        </div>

        <div style={{ height:"8px" }} />
      </div>
    </div>
  );
}

// ─── Preview drawer ───────────────────────────────────────────────────────────
function PreviewDrawer({ html, loading, error, templateName, onClose }) {
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(500);
  const [closing, setClosing] = useState(false);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 210);
  };

  const onLoad = () => {
    try {
      const body = iframeRef.current?.contentDocument?.body;
      if (body) setIframeHeight(Math.min(body.scrollHeight + 24, 2000));
    } catch { /* cross-origin guard */ }
  };

  return (
    <>
      {/* Dim overlay — click to close */}
      <div className="tmpl-drawer-overlay" onClick={close} />

      {/* The drawer itself */}
      <div className={`tmpl-drawer${closing ? " closing" : ""}`}>

        {/* Header — clean, no emojis */}
        <div className="tmpl-drawer-header">
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: "14px", fontWeight: "700", color: "#1a2e22",
              fontFamily: "DM Sans, sans-serif", letterSpacing: "-0.1px",
            }}>
              Template preview
            </div>
            {templateName && (
              <div style={{ fontSize: "11px", color: "#aaa", fontFamily: "DM Sans, sans-serif", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {templateName}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {/* Legend — shown once loaded */}
            {html && !loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span className="tmpl-legend-found">Detected</span>
                <span className="tmpl-legend-unknown">Unknown</span>
                <span className="tmpl-legend-loop">loop</span>
              </div>
            )}
            <button className="tmpl-drawer-close" onClick={close} title="Close preview">✕</button>
          </div>
        </div>

        {/* Hint bar */}
        {html && !loading && (
          <div style={{
            padding: "7px 20px",
            fontSize: "11px", color: "#94a3b8",
            fontFamily: "DM Sans, sans-serif",
            borderBottom: "1px solid #f0eff2",
            background: "#fafcff",
            flexShrink: 0,
          }}>
            Loop fields show sample values — in your actual export they fill separate rows.
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "14px", padding: "60px 20px" }}>
              <div className="tmpl-spinner-lg" />
              <div style={{ fontSize: "13px", color: "#888", fontFamily: "DM Sans, sans-serif" }}>Generating preview…</div>
            </div>
          )}
          {error && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "8px", padding: "60px 20px", textAlign: "center" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#991b1b", fontSize: "16px", fontWeight: "700" }}>!</span>
              </div>
              <div style={{ fontSize: "13px", color: "#991b1b", fontFamily: "DM Sans, sans-serif" }}>{error}</div>
            </div>
          )}
          {html && !loading && !error && (
            <iframe
              ref={iframeRef}
              srcDoc={html}
              onLoad={onLoad}
              sandbox="allow-same-origin"
              style={{ width: "100%", height: `${iframeHeight}px`, border: "none", display: "block", background: "#fff" }}
              title="Template preview"
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Scan panel ───────────────────────────────────────────────────────────────
function ScanPanel({ scanResult, onDismiss }) {
  if (!scanResult) return null;
  const { found = [], not_found = [], unknown_vars = [] } = scanResult;
  const hasNotFound = not_found.length > 0;
  return (
    <div style={{ border:"1px solid #e8e7ea",borderRadius:"11px",background:"#fafaf9",overflow:"hidden",marginBottom:"12px" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:hasNotFound?"#fffbf0":"#f0fdf4",borderBottom:"1px solid #e8e7ea" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"7px" }}>
          <span style={{ fontSize:"12.5px",fontWeight:"600",color:hasNotFound?"#92400e":"#166534",fontFamily:"DM Sans,sans-serif" }}>
            {hasNotFound ? `${found.length} detected · ${not_found.length} not in template` : "All variables detected!"}
          </span>
        </div>
        <button onClick={onDismiss} style={{ background:"transparent",border:"none",cursor:"pointer",color:"#ccc",fontSize:"14px",padding:"2px 5px",lineHeight:1 }}>✕</button>
      </div>
      <div style={{ padding:"12px 14px",display:"flex",flexDirection:"column",gap:"10px" }}>
        {found.length > 0 && (
          <div>
            <div style={{ fontSize:"10px",fontWeight:"700",color:"#166534",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:"DM Sans,sans-serif" }}>✓ Detected</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:"5px" }}>{found.map(v => <span key={v} className="tmpl-pill found">{v}</span>)}</div>
          </div>
        )}
        {hasNotFound && (
          <div>
            <div style={{ fontSize:"10px",fontWeight:"700",color:"#92400e",marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:"DM Sans,sans-serif" }}>Not in template — add if you want</div>
            <p style={{ fontSize:"11.5px",color:"#aaa",margin:"0 0 8px",fontFamily:"DM Sans,sans-serif" }}>These fields won't appear in your export. Click to copy and paste into your .docx.</p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:"6px" }}>{not_found.map(v => <Chip key={v} token={`{{ ${v} }}`} />)}</div>
          </div>
        )}
        {unknown_vars.length > 0 && (
          <div>
            <div style={{ fontSize:"10px",fontWeight:"700",color:"#777",marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:"DM Sans,sans-serif" }}>Unrecognised</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:"5px" }}>{unknown_vars.map(v => <span key={v} className="tmpl-pill missed">{v}</span>)}</div>
          </div>
        )}
        <p style={{ fontSize:"11px",color:"#ccc",margin:0,borderTop:"1px solid #f0eff2",paddingTop:"9px",fontFamily:"DM Sans,sans-serif" }}>
          Missing variables will be left blank in your export. You can still upload as-is.
        </p>
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
function TemplatesScreen({ user }) {
  const [token, setToken]               = useState(null);
  const [templates, setTemplates]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [scanning, setScanning]         = useState(false);
  const [newName, setNewName]           = useState("");
  const [newFile, setNewFile]           = useState(null);
  const [scanResult, setScanResult]     = useState(null);

  // Right-panel state — guide inline, preview is a drawer
  const [guideOpen, setGuideOpen]           = useState(false);
  const [previewOpen, setPreviewOpen]       = useState(false);
  const [everOpenedGuide, setEverOpenedGuide] = useState(false);

  // Preview data
  const [previewHtml, setPreviewHtml]       = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState(null);
  const [previewName, setPreviewName]       = useState(null);
  const [previewingId, setPreviewingId]     = useState(null);

  const fileRef = useRef(null);
  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setToken(session?.access_token));
  }, []);

  const fetchTemplates = async () => {
    const res = await fetch(`${API}/get-templates`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ token }) });
    const data = await res.json();
    setTemplates(data.templates || []);
    setLoading(false);
  };

  useEffect(() => { if (token) fetchTemplates(); }, [token]);

  const toggleGuide = () => {
    setGuideOpen(o => !o);
    if (!everOpenedGuide) setEverOpenedGuide(true);
  };

  const clearPreview = () => {
    setPreviewHtml(null); setPreviewError(null);
    setPreviewName(null); setPreviewingId(null);
    setPreviewOpen(false);
  };

  const runPreview = async (file) => {
    setPreviewHtml(null); setPreviewError(null);
    setPreviewLoading(true);
    setPreviewOpen(true);
    const fd = new FormData();
    fd.append("file", file); fd.append("token", token);
    try {
      const res = await fetch(`${API}/preview-template`, { method:"POST", body:fd });
      const data = await res.json();
      if (data.error) setPreviewError(data.error);
      else setPreviewHtml(data.html);
    } catch { setPreviewError("Network error — couldn't generate preview."); }
    setPreviewLoading(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewFile(file);
    setScanResult(null);
    setPreviewName(file.name);
    setPreviewingId(null);

    setScanning(true);
    const fd = new FormData();
    fd.append("file", file); fd.append("token", token);

    // scan + preview in parallel
    const [scanRes] = await Promise.allSettled([
      fetch(`${API}/scan-template`, { method:"POST", body:fd }).then(r => r.json()),
      runPreview(file),
    ]);
    if (scanRes.status === "fulfilled" && !scanRes.value?.error) setScanResult(scanRes.value);
    setScanning(false);
  };

  const handlePreviewSaved = async (t) => {
    if (previewingId === t.id && previewOpen) {
      clearPreview(); return;
    }
    setPreviewingId(t.id);
    setPreviewName(t.name);
    setPreviewHtml(null); setPreviewError(null);
    setPreviewLoading(true);
    setPreviewOpen(true);
    // Clear new-file state
    setNewFile(null); setScanResult(null);
    if (fileRef.current) fileRef.current.value = "";

    try {
      const res = await fetch(`${API}/preview-template-by-url`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ token, url:t.download_url }) });
      const data = await res.json();
      if (data.error) setPreviewError(data.error);
      else setPreviewHtml(data.html);
    } catch { setPreviewError("Network error — couldn't fetch template."); }
    setPreviewLoading(false);
  };

  const handleUpload = async () => {
    if (!newFile || uploading) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", newFile);
    fd.append("name", newName || newFile.name.replace(".docx",""));
    fd.append("token", token);
    await fetch(`${API}/upload-template`, { method:"POST", body:fd });
    setNewName(""); setNewFile(null); setScanResult(null);
    clearPreview();
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
    fetchTemplates();
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete "${t.name}"?`)) return;
    if (previewingId === t.id) clearPreview();
    await fetch(`${API}/delete-template`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ token, template_id:t.id, file_path:t.file_path }) });
    fetchTemplates();
  };

  const fmt = (iso) => new Date(iso).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });

  const card = { background:"#fff", border:"1px solid #e8e7ea", borderRadius:"14px", boxShadow:"0 4px 16px -4px rgba(26,46,34,0.07)" };

  if (loading) return (
    <><style>{css}</style>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",height:"100vh",fontFamily:"DM Sans,sans-serif",color:"#7a7585",background:"#f4f5f2",fontSize:"13px" }}>
        <div className="tmpl-spinner" /> Loading…
      </div>
    </>
  );

  const previewHasContent = previewLoading || previewHtml || previewError;

  return (
    <><style>{css}</style>
      <div className="tmpl-root" style={{ minHeight:"100vh",background:"#f4f5f2",padding:"28px 20px 48px",boxSizing:"border-box" }}>
        <div style={{ maxWidth:"1080px",margin:"0 auto" }}>

          {/* ── Header ── */}
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"12px",marginBottom:"20px",flexWrap:"wrap" }}>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"3px" }}>
                <h1 style={{ fontFamily:"'DM Serif Display',serif",fontSize:"26px",fontWeight:"400",color:"#1a2e22",letterSpacing:"-0.4px",margin:0 }}>Templates</h1>
                {templates.length > 0 && <span className="tmpl-count-badge">{templates.length}</span>}
              </div>
              <p style={{ fontSize:"13px",color:"#a09aaa",margin:0,fontFamily:"DM Sans,sans-serif" }}>Upload a .docx file — Mahdari fills in your meeting data on export.</p>
            </div>

            {/* Guide toggle only — preview opens as a drawer automatically */}
            <button className={`tmpl-toggle${guideOpen ? " open" : ""}`} onClick={toggleGuide}>
              {!everOpenedGuide && !guideOpen && <span className="tmpl-pulse" />}
              {guideOpen ? "✕ Close guide" : "How to build a template"}
            </button>
          </div>

          {/* ── Two-column layout ── */}
          <div className="tmpl-layout" style={{ display:"flex",gap:"16px",alignItems:"flex-start" }}>

            {/* LEFT — upload + saved list */}
            <div style={{ flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:"14px" }}>

              {/* Upload card */}
              <div style={{ ...card,padding:"22px" }}>
                <div style={{ fontSize:"10px",fontWeight:"600",letterSpacing:"0.09em",textTransform:"uppercase",color:"#b0adb5",marginBottom:"16px",fontFamily:"DM Sans,sans-serif" }}>Upload new template</div>

                <input ref={fileRef} type="file" accept=".docx" style={{ display:"none" }} onChange={handleFileChange} />
                <div className={`tmpl-file-zone${newFile?" has-file":""}`} onClick={() => fileRef.current?.click()} style={{ marginBottom:"12px" }}>
                  {scanning ? (
                    <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                      <div className="tmpl-spinner" />
                      <span style={{ fontSize:"12px",color:"#888",fontFamily:"DM Sans,sans-serif" }}>Scanning & previewing…</span>
                    </div>
                  ) : newFile ? (
                    <><span style={{ fontSize:"13px",fontWeight:"600",color:"#1a2e22",fontFamily:"DM Sans,sans-serif" }}>{newFile.name}</span>
                      <span style={{ fontSize:"11px",color:"#a07830",fontFamily:"DM Sans,sans-serif" }}>Click to change</span></>
                  ) : (
                    <><span style={{ fontSize:"13px",fontWeight:"600",color:"#1a2e22",fontFamily:"DM Sans,sans-serif" }}>Choose .docx file</span>
                      <span style={{ fontSize:"11px",color:"#bbb",fontFamily:"DM Sans,sans-serif" }}>We'll scan and preview it automatically</span></>
                  )}
                </div>

                {scanResult && !scanning && <ScanPanel scanResult={scanResult} onDismiss={() => setScanResult(null)} />}

                <div style={{ marginBottom:"12px" }}>
                  <label style={{ display:"block",fontSize:"11px",fontWeight:"500",color:"#9ca3a8",marginBottom:"5px",fontFamily:"DM Sans,sans-serif" }}>
                    Template name <span style={{ color:"#d0cdd6" }}>(optional)</span>
                  </label>
                  <input className="tmpl-input" placeholder="e.g. Board Meeting, Weekly Standup…" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==="Enter" && newFile && handleUpload()} />
                </div>

                <button className="tmpl-btn-primary" onClick={handleUpload} disabled={!newFile||uploading||scanning}>
                  {uploading ? <><span className="tmpl-spinner-white" /> Uploading…</> : newFile ? "↑ Upload template" : "Choose a file to upload"}
                </button>
              </div>

              {/* Saved templates */}
              <div style={{ ...card,overflow:"hidden" }}>
                <div style={{ padding:"15px 20px 12px",borderBottom:templates.length>0?"1px solid #f0eff2":"none",display:"flex",alignItems:"center",gap:"8px" }}>
                  <span style={{ fontSize:"10px",fontWeight:"600",letterSpacing:"0.09em",textTransform:"uppercase",color:"#b0adb5",fontFamily:"DM Sans,sans-serif" }}>Saved templates</span>
                  {templates.length > 0 && <span className="tmpl-count-badge">{templates.length}</span>}
                </div>

                {templates.length === 0 ? (
                  <div style={{ textAlign:"center",padding:"36px 20px",color:"#c4bfca",fontSize:"13px",fontFamily:"DM Sans,sans-serif" }}>
                    <div style={{ fontSize:"26px",marginBottom:"8px" }}>·</div>No templates yet
                  </div>
                ) : (
                  <table style={{ width:"100%",borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"#faf9f7" }}>
                        {["Name","Uploaded",""].map((h,i) => (
                          <th key={i} style={{ textAlign:i===2?"right":"left",fontSize:"10px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#b0adb5",padding:"10px 18px",borderBottom:"1px solid #e8e7ea",fontFamily:"DM Sans,sans-serif" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map(t => (
                        <tr key={t.id} className="tmpl-row">
                          <td style={{ padding:"13px 18px",borderBottom:"1px solid #f0eff2",verticalAlign:"middle" }}>
                            <div style={{ display:"flex",alignItems:"center",gap:"9px" }}>
                              <div style={{ width:"28px",height:"28px",borderRadius:"6px",background:"#f0f7f2",border:"1px solid #d0e8d8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                <svg width="13" height="15" viewBox="0 0 13 15" fill="none"><rect x="1" y="1" width="11" height="13" rx="2" stroke="#5a8a6a" strokeWidth="1.5"/><line x1="3.5" y1="5" x2="9.5" y2="5" stroke="#5a8a6a" strokeWidth="1.2"/><line x1="3.5" y1="8" x2="9.5" y2="8" stroke="#5a8a6a" strokeWidth="1.2"/><line x1="3.5" y1="11" x2="7" y2="11" stroke="#5a8a6a" strokeWidth="1.2"/></svg>
                              </div>
                              <span style={{ fontWeight:"600",color:"#1a2e22",fontSize:"13px",fontFamily:"DM Sans,sans-serif" }}>{t.name}</span>
                            </div>
                          </td>
                          <td style={{ padding:"13px 18px",borderBottom:"1px solid #f0eff2",verticalAlign:"middle",fontSize:"12px",color:"#b0adb5",fontFamily:"ui-monospace,Consolas,monospace",whiteSpace:"nowrap" }}>{fmt(t.created_at)}</td>
                          <td style={{ padding:"13px 18px",borderBottom:"1px solid #f0eff2",verticalAlign:"middle" }}>
                            <div style={{ display:"flex",alignItems:"center",gap:"7px",justifyContent:"flex-end" }}>
                              <button className={`tmpl-btn-preview-row${previewingId===t.id&&previewOpen?" active":""}`} onClick={() => handlePreviewSaved(t)}>
                                {previewingId===t.id&&previewOpen ? "✕ Close" : "Preview"}
                              </button>
                              <a className="tmpl-btn-dl" href={t.download_url} target="_blank" rel="noreferrer">↓ Download</a>
                              <button className="tmpl-btn-ghost" onClick={() => handleDelete(t)} title="Delete">✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* RIGHT — guide panel inline (pushes left column) */}
            {guideOpen && <GuidePanel apiUrl={API} />}

          </div>
        </div>
      </div>

      {/* Preview drawer — fixed overlay, rendered outside the layout */}
      {previewOpen && (
        <PreviewDrawer
          html={previewHtml}
          loading={previewLoading}
          error={previewError}
          templateName={previewName}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}

export default TemplatesScreen;