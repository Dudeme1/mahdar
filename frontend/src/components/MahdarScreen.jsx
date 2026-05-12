import { useState, useEffect } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

  @keyframes mah-fadein {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .mah-root {
    animation: mah-fadein 0.35s ease;
    font-family: 'DM Sans', system-ui, 'Segoe UI', sans-serif;
  }

  /* Textarea */
  .mah-textarea {
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .mah-textarea:focus {
    border-color: rgba(195,152,83,0.6) !important;
    background: #fff !important;
    outline: none;
    box-shadow: 0 0 0 3px rgba(195,152,83,0.08);
  }

  /* Copy button */
  .mah-copy-btn {
    position: absolute; top: 9px; right: 9px;
    border: 1px solid #e8e7ea;
    background: #f4f5f2;
    border-radius: 6px;
    cursor: pointer;
    padding: 3px 9px;
    font-size: 11px;
    font-weight: 500;
    color: #7a7585;
    font-family: 'DM Sans', system-ui, sans-serif;
    transition: all 0.15s;
    z-index: 1;
  }
  .mah-copy-btn:hover { background: #ebe9ed; color: #1a2e22; }
  .mah-copy-btn.copied { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }

  /* Attendee card */
  .mah-attendee-card {
    transition: box-shadow 0.15s, border-color 0.15s;
  }
  .mah-attendee-card:hover {
    box-shadow: rgba(26,46,34,0.08) 0 4px 14px -2px;
    border-color: #d8d5dc;
  }

  /* Override select */
  .mah-override-select {
    padding: 7px 10px;
    border-radius: 8px;
    border: 1px solid #e2e0e5;
    background: #fafaf9;
    font-size: 12px;
    color: #7a7585;
    font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
    flex: 1;
    min-width: 0;
  }
  .mah-override-select:focus { border-color: rgba(195,152,83,0.5); }

  /* Remember button */
  .mah-remember-btn {
    padding: 7px 13px;
    border-radius: 8px;
    border: 1px solid rgba(195,152,83,0.3);
    background: rgba(195,152,83,0.08);
    font-size: 12px;
    font-weight: 500;
    color: #a07830;
    font-family: 'DM Sans', system-ui, sans-serif;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .mah-remember-btn:hover { background: rgba(195,152,83,0.16); }
  .mah-remember-btn.saved {
    background: #f0fdf4;
    color: #166534;
    border-color: #bbf7d0;
  }

  /* Export button */
  .mah-export-btn {
    background: #1a2e22;
    color: #fff;
    border: none;
    border-radius: 11px;
    padding: 11px 22px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', system-ui, sans-serif;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity 0.15s;
  }
  .mah-export-btn:hover { opacity: 0.86; }

  /* Action rows */
  .mah-action-row { transition: background 0.12s; }
  .mah-action-row:hover { background: #faf9f7; }

  /* Action inputs */
  .mah-action-input {
    width: 100%;
    padding: 7px 9px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    font-size: 13px;
    color: #1a2e22;
    font-family: 'DM Sans', system-ui, sans-serif;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .mah-action-input:focus {
    border-color: rgba(195,152,83,0.5);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(195,152,83,0.07);
  }
  .mah-action-input::placeholder { color: #c4bfca; }

  /* Section divider between cards */
  .mah-divider {
    height: 1px;
    background: #f0eff2;
    margin: 18px 0;
  }
`;

// ── Shared tokens ──
const card = {
  background: "#fff",
  border: "1px solid #e8e7ea",
  borderRadius: "16px",
  padding: "20px 22px",
  boxShadow: "rgba(26,46,34,0.06) 0 8px 24px -4px, rgba(0,0,0,0.03) 0 2px 6px -1px",
  marginBottom: "14px",
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "18px",
  paddingBottom: "14px",
  borderBottom: "1px solid #f0eff2",
};

const sectionTitle = {
  fontSize: "10.5px",
  fontWeight: "700",
  color: "#b0adb5",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

const label = {
  fontSize: "10.5px",
  fontWeight: "600",
  color: "#b0adb5",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

const textarea = {
  width: "100%",
  minHeight: "72px",
  padding: "10px 42px 10px 12px",
  borderRadius: "10px",
  border: "1px solid #e2e0e5",
  background: "#fafaf9",
  fontSize: "13px",
  color: "#1a2e22",
  resize: "vertical",
  boxSizing: "border-box",
  lineHeight: "1.6",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

// ── Sub-components ──

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(value || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button className={`mah-copy-btn${copied ? " copied" : ""}`} onClick={handle}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function Field({ label: lbl, value, onChange, large }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <label style={label}>{lbl}</label>
      <div style={{ position: "relative" }}>
        <CopyButton value={value} />
        <textarea
          className="mah-textarea"
          style={{ ...textarea, ...(large ? { minHeight: "108px" } : {}) }}
          value={value || ""}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function SectionHead({ icon, title }) {
  return (
    <div style={sectionHeader}>
      <span style={{ fontSize: "15px" }}>{icon}</span>
      <span style={sectionTitle}>{title}</span>
    </div>
  );
}

function RememberButton({ onClick }) {
  const [state, setState] = useState("idle"); // idle | saving | saved

  const handle = async () => {
    setState("saving");
    await onClick();
    setState("saved");
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <button
      className={`mah-remember-btn${state === "saved" ? " saved" : ""}`}
      onClick={handle}
      disabled={state === "saving"}
    >
      {state === "saved" ? "✓ Saved" : state === "saving" ? "Saving…" : "💾 Remember"}
    </button>
  );
}

// ── Main component ──

function MahdarScreen({
  token, date, hijri_date, title, purpose, location,
  attendees, discussion, decisions, action_items,
  next_meeting, hijri_next_meeting, template,
}) {
  const [edit_date, setDate] = useState(date);
  const [edit_hijri_date, setHijriDate] = useState(hijri_date);
  const [edit_title, setTitle] = useState(title);
  const [edit_purpose, setPurpose] = useState(purpose);
  const [edit_location, setLocation] = useState(location);
  const [edit_next_meeting, setNextMeeting] = useState(next_meeting);
  const [edit_hijri_next_meeting, setHijriNextMeeting] = useState(hijri_next_meeting);
  const [edit_attendees, setAttendees] = useState(attendees);
  const [saved_attendees, setSavedAttendees] = useState([]);
  const [edit_discussion, setDiscussion] = useState(discussion);
  const [edit_decisions, setDecisions] = useState(decisions);
  const [edit_actionItems, setActionItems] = useState(action_items);

  useEffect(() => {
    const fetchAttendees = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get-attendees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setSavedAttendees(data.attendees || []);
    };
    fetchAttendees();
  }, []);

  const updateAttendee = (index, field, value) => {
    const updated = [...edit_attendees];
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);
  };

  const updateActionItem = (index, field, value) => {
    const updated = [...edit_actionItems];
    updated[index] = { ...updated[index], [field]: value };
    setActionItems(updated);
  };

  const saveAttendee = async (attendee) => {
    await fetch(`${import.meta.env.VITE_API_URL}/save-attendee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        name: attendee.name,
        email: attendee.email,
        role: attendee.role,
        aliases: [],
      }),
    });
  };

  const handleExport = async () => {
    if (!template) return alert("Please upload a Word template first!");
    const formData = new FormData();
    formData.append("template", template);
    formData.append("date", edit_date);
    formData.append("title", edit_title);
    formData.append("location", edit_location);
    formData.append("attendees", JSON.stringify(edit_attendees));
    formData.append("purpose", edit_purpose);
    formData.append("discussion", edit_discussion);
    formData.append("decisions", edit_decisions);
    formData.append("action_items", JSON.stringify(edit_actionItems));
    formData.append("next_meeting", edit_next_meeting);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/export`, { method: "POST", body: formData });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mahdar_report_${new Date().toISOString()}.docx`;
    a.click();
  };

  const th = {
    textAlign: "left",
    fontSize: "10.5px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#b0adb5",
    padding: "10px 14px",
    borderBottom: "1px solid #e8e7ea",
    background: "#faf9f7",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  };

  const td = {
    padding: "10px 14px",
    borderBottom: "1px solid #f0eff2",
    verticalAlign: "middle",
  };

  return (
    <>
      <style>{css}</style>

      {/* ── Separator between upload form and MoM result ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        margin: "28px 0 22px",
      }}>
        <div style={{ flex: 1, height: "1px", background: "#e8e7ea" }} />
        <span style={{
          fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em",
          textTransform: "uppercase", color: "#c4bfca",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          Generated Report
        </span>
        <div style={{ flex: 1, height: "1px", background: "#e8e7ea" }} />
      </div>

      <div className="mah-root">

        {/* ── Report header ── */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap", gap: "12px",
          marginBottom: "18px",
        }}>
          <div>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "22px", fontWeight: "400",
              color: "#1a2e22", letterSpacing: "-0.3px", margin: "0 0 3px",
            }}>
              MoM Report
            </h2>
            <p style={{ fontSize: "12px", color: "#a09aaa", margin: 0 }}>
              Review and edit before exporting
            </p>
          </div>
          <button className="mah-export-btn" onClick={handleExport}>
            📄 Export to Word
          </button>
        </div>

        {/* ── Meeting Info ── */}
        <div style={card}>
          <SectionHead icon="🗂️" title="Meeting Info" />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}>
            <Field label="Date" value={edit_date} onChange={setDate} />
            <Field label="Hijri Date" value={edit_hijri_date} onChange={setHijriDate} />
            <Field label="Title" value={edit_title} onChange={setTitle} />
            <Field label="Location" value={edit_location} onChange={setLocation} />
            <Field label="Next Meeting" value={edit_next_meeting} onChange={setNextMeeting} />
            <Field label="Hijri Next Meeting" value={edit_hijri_next_meeting} onChange={setHijriNextMeeting} />
          </div>
        </div>

        {/* ── Attendees ── */}
        <div style={card}>
          <SectionHead icon="👥" title="Attendees" />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {edit_attendees.map((attendee, index) => (
              <div
                key={index}
                className="mah-attendee-card"
                style={{
                  border: "1px solid #e8e7ea",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "#fafaf9",
                }}
              >
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "12px",
                }}>
                  <Field label="Name" value={attendee.name} onChange={v => updateAttendee(index, "name", v)} />
                  <Field label="Email" value={attendee.email} onChange={v => updateAttendee(index, "email", v)} />
                  <Field label="Role" value={attendee.role} onChange={v => updateAttendee(index, "role", v)} />
                </div>

                {/* Footer: override + remember */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  marginTop: "12px", paddingTop: "12px",
                  borderTop: "1px solid #f0eff2",
                  flexWrap: "wrap",
                }}>
                  <span style={{ fontSize: "11px", color: "#b0adb5", whiteSpace: "nowrap" }}>
                    Override:
                  </span>
                  <select
                    className="mah-override-select"
                    onChange={e => {
                      const sel = saved_attendees.find(a => a.name === e.target.value);
                      if (sel) {
                        const updated = [...edit_attendees];
                        updated[index] = { name: sel.name, email: sel.email || "", role: sel.role || "" };
                        setAttendees(updated);
                      }
                    }}
                  >
                    <option value="">Select saved attendee…</option>
                    {saved_attendees.map((a, i) => (
                      <option key={i} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                  <RememberButton onClick={() => saveAttendee(attendee)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Meeting Details ── */}
        <div style={card}>
          <SectionHead icon="📋" title="Meeting Details" />
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Field label="Purpose" value={edit_purpose} onChange={setPurpose} large />
            <Field label="Discussion" value={edit_discussion} onChange={setDiscussion} large />
            <Field label="Decisions" value={edit_decisions} onChange={setDecisions} large />
          </div>
        </div>

        {/* ── Action Items ── */}
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px 0" }}>
            <SectionHead icon="✅" title="Action Items" />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: "36px" }}>#</th>
                  <th style={th}>Task</th>
                  <th style={th}>Owner</th>
                  <th style={th}>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {edit_actionItems.map((item, index) => {
                  const isLast = index === edit_actionItems.length - 1;
                  const cellStyle = { ...td, borderBottom: isLast ? "none" : "1px solid #f0eff2" };
                  return (
                    <tr key={index} className="mah-action-row">
                      <td style={{ ...cellStyle, color: "#c4bfca", fontSize: "12px", fontFamily: "ui-monospace, Consolas, monospace", textAlign: "center" }}>
                        {index + 1}
                      </td>
                      {["task", "owner", "deadline"].map(field => (
                        <td key={field} style={cellStyle}>
                          <input
                            className="mah-action-input"
                            value={item[field] || ""}
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            onChange={e => updateActionItem(index, field, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Bottom export ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px", paddingBottom: "8px" }}>
          <button className="mah-export-btn" onClick={handleExport}>
            📄 Export to Word
          </button>
        </div>

      </div>
    </>
  );
}

export default MahdarScreen;