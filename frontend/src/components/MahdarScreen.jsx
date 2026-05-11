import { useState, useEffect } from "react";

const css = `
  @keyframes mah-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .mah-root { animation: mah-fadein 0.3s ease; }

  .mah-textarea:focus {
    border-color: rgba(170,59,255,0.5) !important;
    background: #fff !important;
    outline: none;
  }
  .mah-textarea { transition: border-color 0.15s, background 0.15s; }

  .mah-copy-btn {
    position: absolute; top: 9px; right: 9px;
    border: 1px solid #e5e4e7;
    background: #f7f7f8;
    border-radius: 7px;
    cursor: pointer;
    padding: 4px 9px;
    font-size: 11px;
    font-weight: 500;
    color: #6b6375;
    font-family: inherit;
    transition: all 0.15s;
  }
  .mah-copy-btn:hover { background: #f0eff2; color: #08060d; }
  .mah-copy-btn.copied { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }

  .mah-attendee-card { transition: box-shadow 0.15s; }
  .mah-attendee-card:hover { box-shadow: rgba(0,0,0,0.08) 0 4px 12px -2px; }

  .mah-override-select {
    padding: 7px 10px; border-radius: 8px;
    border: 1px solid #e5e4e7; background: #f7f7f8;
    font-size: 12px; color: #6b6375; font-family: inherit;
    cursor: pointer; outline: none; transition: border-color 0.15s;
  }
  .mah-override-select:focus { border-color: rgba(170,59,255,0.4); }

  .mah-remember-btn {
    padding: 7px 12px; border-radius: 8px;
    border: 1px solid #e5e4e7; background: #fff;
    font-size: 12px; font-weight: 500; color: #08060d;
    font-family: inherit; cursor: pointer; transition: background 0.15s;
  }
  .mah-remember-btn:hover { background: #f7f7f8; }

  .mah-export-btn {
    background: #111827; color: #fff; border: none;
    border-radius: 12px; padding: 12px 22px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    font-family: inherit; display: flex; align-items: center; gap: 8px;
    transition: opacity 0.15s;
  }
  .mah-export-btn:hover { opacity: 0.88; }

  .mah-action-row { transition: background 0.12s; }
  .mah-action-row:hover { background: #faf9fb; }
`;

const S = {
  page: {
    background: "#f7f7f8",
    padding: "32px 20px",
    fontFamily: "Inter, system-ui, 'Segoe UI', sans-serif",
    color: "#6b6375",
  },
  container: { maxWidth: "820px", margin: "0 auto" },

  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  pageTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#08060d",
    letterSpacing: "-0.4px",
    margin: 0,
  },
  pageTitleSub: { fontSize: "13px", color: "#b0adb5", marginTop: "2px" },

  card: {
    background: "#fff",
    border: "1px solid #e5e4e7",
    borderRadius: "18px",
    padding: "20px 22px",
    boxShadow: "rgba(0,0,0,0.08) 0 8px 20px -4px, rgba(0,0,0,0.04) 0 4px 6px -2px",
    marginBottom: "16px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "18px",
  },
  sectionIcon: { fontSize: "16px" },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#08060d",
    letterSpacing: "-0.1px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "12px",
  },

  field: { display: "flex", flexDirection: "column", gap: "5px" },
  label: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#b0adb5",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  textareaWrap: { position: "relative" },
  textarea: {
    width: "100%",
    minHeight: "72px",
    padding: "10px 38px 10px 12px",
    borderRadius: "10px",
    border: "1px solid #e5e4e7",
    background: "#fafafa",
    fontSize: "13px",
    color: "#08060d",
    resize: "vertical",
    boxSizing: "border-box",
    lineHeight: "1.5",
    fontFamily: "inherit",
  },
  textareaLg: { minHeight: "100px" },

  // Attendees
  attendeeCard: {
    border: "1px solid #e5e4e7",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "12px",
    background: "#fafafa",
  },
  attendeeFooter: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #f0eff2",
    flexWrap: "wrap",
  },
  attendeeFooterLabel: { fontSize: "11px", color: "#b0adb5", marginRight: "2px" },

  // Action items table
  actionTable: { width: "100%", borderCollapse: "collapse" },
  actionTh: {
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#b0adb5",
    padding: "8px 12px",
    borderBottom: "1px solid #e5e4e7",
  },
  actionTd: {
    padding: "10px 12px",
    borderBottom: "1px solid #f0eff2",
    verticalAlign: "top",
  },
  actionInput: {
    width: "100%",
    padding: "6px 8px",
    borderRadius: "8px",
    border: "1px solid transparent",
    background: "transparent",
    fontSize: "13px",
    color: "#08060d",
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.15s, background 0.15s",
  },

  divider: { height: "1px", background: "#f0eff2", margin: "16px 0" },
};

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(value || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className={`mah-copy-btn${copied ? " copied" : ""}`} onClick={handle}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function Field({ label, value, onChange, large }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <div style={S.textareaWrap}>
        <CopyButton value={value} />
        <textarea
          className="mah-textarea"
          style={{ ...S.textarea, ...(large ? S.textareaLg : {}) }}
          value={value || ""}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div style={S.sectionHeader}>
      <span style={S.sectionIcon}>{icon}</span>
      <span style={S.sectionTitle}>{title}</span>
    </div>
  );
}

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

  return (
    <>
      <style>{css}</style>
      <div className="mah-root" style={S.page}>
        <div style={S.container}>

          {/* Page header */}
          <div style={S.pageHeader}>
            <div>
              <h1 style={S.pageTitle}>MoM Report</h1>
              <div style={S.pageTitleSub}>Review and edit before exporting</div>
            </div>
            <button className="mah-export-btn" onClick={handleExport}>
              📄 Export to Word
            </button>
          </div>

          {/* ── Metadata ── */}
          <div style={S.card}>
            <SectionHeader icon="🗂️" title="Meeting Info" />
            <div style={S.grid2}>
              <Field label="Date" value={edit_date} onChange={setDate} />
              <Field label="Hijri Date" value={edit_hijri_date} onChange={setHijriDate} />
              <Field label="Title" value={edit_title} onChange={setTitle} />
              <Field label="Location" value={edit_location} onChange={setLocation} />
              <Field label="Next Meeting" value={edit_next_meeting} onChange={setNextMeeting} />
              <Field label="Hijri Next Meeting" value={edit_hijri_next_meeting} onChange={setHijriNextMeeting} />
            </div>
          </div>

          {/* ── Attendees ── */}
          <div style={S.card}>
            <SectionHeader icon="👥" title="Attendees" />
            {edit_attendees.map((attendee, index) => (
              <div key={index} className="mah-attendee-card" style={S.attendeeCard}>
                <div style={S.grid3}>
                  <Field label="Name" value={attendee.name} onChange={v => updateAttendee(index, "name", v)} />
                  <Field label="Email" value={attendee.email} onChange={v => updateAttendee(index, "email", v)} />
                  <Field label="Role" value={attendee.role} onChange={v => updateAttendee(index, "role", v)} />
                </div>
                <div style={S.attendeeFooter}>
                  <span style={S.attendeeFooterLabel}>Override:</span>
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
                    {saved_attendees.map((a, i) => <option key={i} value={a.name}>{a.name}</option>)}
                  </select>
                  <button
                    className="mah-remember-btn"
                    onClick={async () => {
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/save-attendee`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token, name: attendee.name, email: attendee.email, role: attendee.role, aliases: [] }),
                      });
                      const data = await res.json();
                      alert(data.message);
                    }}
                  >
                    💾 Remember
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Meeting Details ── */}
          <div style={S.card}>
            <SectionHeader icon="📋" title="Meeting Details" />
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <Field label="Purpose" value={edit_purpose} onChange={setPurpose} large />
              <Field label="Discussion" value={edit_discussion} onChange={setDiscussion} large />
              <Field label="Decisions" value={edit_decisions} onChange={setDecisions} large />
            </div>
          </div>

          {/* ── Action Items ── */}
          <div style={S.card}>
            <SectionHeader icon="✅" title="Action Items" />
            <div style={{ overflowX: "auto" }}>
              <table style={S.actionTable}>
                <thead>
                  <tr>
                    <th style={S.actionTh}>#</th>
                    <th style={S.actionTh}>Task</th>
                    <th style={S.actionTh}>Owner</th>
                    <th style={S.actionTh}>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {edit_actionItems.map((item, index) => (
                    <tr key={index} className="mah-action-row" style={index === edit_actionItems.length - 1 ? { ...S.actionTd, borderBottom: "none" } : {}}>
                      <td style={{ ...S.actionTd, color: "#b0adb5", fontSize: "12px", width: "32px", borderBottom: index === edit_actionItems.length - 1 ? "none" : "1px solid #f0eff2" }}>
                        {index + 1}
                      </td>
                      {["task", "owner", "deadline"].map(field => (
                        <td key={field} style={{ ...S.actionTd, borderBottom: index === edit_actionItems.length - 1 ? "none" : "1px solid #f0eff2" }}>
                          <input
                            className="mah-action-input"
                            style={S.actionInput}
                            value={item[field] || ""}
                            onChange={e => updateActionItem(index, field, e.target.value)}
                            onFocus={e => {
                              e.target.style.borderColor = "rgba(170,59,255,0.4)";
                              e.target.style.background = "#fff";
                            }}
                            onBlur={e => {
                              e.target.style.borderColor = "transparent";
                              e.target.style.background = "transparent";
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom export */}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: "32px" }}>
            <button className="mah-export-btn" onClick={handleExport}>
              📄 Export to Word
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

export default MahdarScreen;