import { useState } from "react";

function MahdarScreen({
  date,
  hijri_date,
  title,
  purpose,
  location,
  attendees,
  discussion,
  decisions,
  action_items,
  next_meeting,
  hijri_next_meeting,
  template,
}) {
  // Metadata
  const [edit_date, setDate] = useState(date);
  const [edit_hijri_date, setHijriDate] = useState(hijri_date);
  const [edit_title, setTitle] = useState(title);
  const [edit_purpose, setPurpose] = useState(purpose);
  const [edit_location, setLocation] = useState(location);
  const [edit_next_meeting, setNextMeeting] = useState(next_meeting);
  const [edit_hijri_next_meeting, setHijriNextMeeting] = useState(hijri_next_meeting);

  // Attendees
  const [edit_attendees, setAttendees] = useState(attendees);

  // Details
  const [edit_discussion, setDiscussion] = useState(discussion);
  const [edit_decisions, setDicisions] = useState(decisions);

  // Action Items
  const [edit_actionItems, setActionItems] = useState(action_items);

  const styles = {
    page: {
      maxWidth: "1100px",
      margin: "0 auto",
      padding: "32px",
      background: "#f7f7f8",
      minHeight: "100vh",
      fontFamily: "Inter, sans-serif",
      color: "#111827",
    },

    title: {
      fontSize: "32px",
      fontWeight: "700",
      marginBottom: "24px",
    },

    section: {
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "16px",
      padding: "24px",
      marginBottom: "24px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    },

    sectionTitle: {
      fontSize: "18px",
      fontWeight: "600",
      marginBottom: "20px",
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "16px",
    },

    field: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },

    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
    },

    textareaWrapper: {
      position: "relative",
    },

    textarea: {
      width: "100%",
      minHeight: "90px",
      padding: "14px",
      borderRadius: "12px",
      border: "1px solid #d1d5db",
      background: "#ffffff",
      fontSize: "14px",
      resize: "vertical",
      outline: "none",
      boxSizing: "border-box",
      transition: "border 0.2s ease",
    },

    smallTextarea: {
      minHeight: "70px",
    },

    copyButton: {
      position: "absolute",
      top: "10px",
      right: "10px",
      border: "1px solid #e5e7eb",
      background: "#f9fafb",
      borderRadius: "8px",
      cursor: "pointer",
      padding: "6px 10px",
      fontSize: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
    },

    attendeeCard: {
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "16px",
      background: "#fafafa",
    },

    exportButton: {
      background: "#111827",
      color: "white",
      border: "none",
      borderRadius: "12px",
      padding: "14px 20px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "12px",
      transition: "opacity 0.2s ease",
    },
  };

  const CopyButton = ({ value }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(value || "");

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    };

    return (
      <button
        onClick={handleCopy}
        style={{
          ...styles.copyButton,
          background: copied ? "#dcfce7" : "#f9fafb",
          color: copied ? "#166534" : "#374151",
        }}
      >
        {copied ? "✓ Copied" : "📋"}
      </button>
    );
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

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/export`,
      {
        method: "POST",
        body: formData,
      }
    );

    const currentDateTime = new Date().toISOString();

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `mahdar_report_${currentDateTime}.docx`;
    a.click();
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Mahdar Report 📝</h1>

      {/* Metadata */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Metadata</div>

        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>Date</label>

            <div style={styles.textareaWrapper}>
              <CopyButton value={edit_date} />

              <textarea
                style={{ ...styles.textarea, ...styles.smallTextarea }}
                value={edit_date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Hijri Date</label>

            <div style={styles.textareaWrapper}>
              <CopyButton value={edit_hijri_date} />

              <textarea
                style={{ ...styles.textarea, ...styles.smallTextarea }}
                value={edit_hijri_date}
                onChange={(e) => setHijriDate(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Title</label>

            <div style={styles.textareaWrapper}>
              <CopyButton value={edit_title} />

              <textarea
                style={{ ...styles.textarea, ...styles.smallTextarea }}
                value={edit_title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Location</label>

            <div style={styles.textareaWrapper}>
              <CopyButton value={edit_location} />

              <textarea
                style={{ ...styles.textarea, ...styles.smallTextarea }}
                value={edit_location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Next Meeting</label>

            <div style={styles.textareaWrapper}>
              <CopyButton value={edit_next_meeting} />

              <textarea
                style={{ ...styles.textarea, ...styles.smallTextarea }}
                value={edit_next_meeting}
                onChange={(e) => setNextMeeting(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Hijri Next Meeting</label>

            <div style={styles.textareaWrapper}>
              <CopyButton value={edit_hijri_next_meeting} />

              <textarea
                style={{ ...styles.textarea, ...styles.smallTextarea }}
                value={edit_hijri_next_meeting}
                onChange={(e) => setHijriNextMeeting(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attendees */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Attendees</div>

        {edit_attendees.map((attendee, index) => (
          <div key={index} style={styles.attendeeCard}>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Name</label>

                <div style={styles.textareaWrapper}>
                  <CopyButton value={attendee.name} />

                  <textarea
                    style={{ ...styles.textarea, ...styles.smallTextarea }}
                    value={attendee.name}
                    onChange={(e) => {
                      const updated = [...edit_attendees];
                      updated[index] = {
                        ...updated[index],
                        name: e.target.value,
                      };
                      setAttendees(updated);
                    }}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email</label>

                <div style={styles.textareaWrapper}>
                  <CopyButton value={attendee.email} />

                  <textarea
                    style={{ ...styles.textarea, ...styles.smallTextarea }}
                    value={attendee.email}
                    onChange={(e) => {
                      const updated = [...edit_attendees];
                      updated[index] = {
                        ...updated[index],
                        email: e.target.value,
                      };
                      setAttendees(updated);
                    }}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Role</label>

                <div style={styles.textareaWrapper}>
                  <CopyButton value={attendee.role} />

                  <textarea
                    style={{ ...styles.textarea, ...styles.smallTextarea }}
                    value={attendee.role}
                    onChange={(e) => {
                      const updated = [...edit_attendees];
                      updated[index] = {
                        ...updated[index],
                        role: e.target.value,
                      };
                      setAttendees(updated);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Meeting Details */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Meeting Details</div>

        <div style={styles.field}>
          <label style={styles.label}>Purpose</label>

          <div style={styles.textareaWrapper}>
            <CopyButton value={edit_purpose} />

            <textarea
              style={styles.textarea}
              value={edit_purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
        </div>

        <br />

        <div style={styles.field}>
          <label style={styles.label}>Discussion</label>

          <div style={styles.textareaWrapper}>
            <CopyButton value={edit_discussion} />

            <textarea
              style={styles.textarea}
              value={edit_discussion}
              onChange={(e) => setDiscussion(e.target.value)}
            />
          </div>
        </div>

        <br />

        <div style={styles.field}>
          <label style={styles.label}>Decisions</label>

          <div style={styles.textareaWrapper}>
            <CopyButton value={edit_decisions} />

            <textarea
              style={styles.textarea}
              value={edit_decisions}
              onChange={(e) => setDicisions(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Action Items</div>

        {edit_actionItems.map((action_item, index) => (
          <div key={index} style={styles.attendeeCard}>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Task</label>

                <div style={styles.textareaWrapper}>
                  <CopyButton value={action_item.task} />

                  <textarea
                    style={styles.textarea}
                    value={action_item.task}
                    onChange={(e) => {
                      const updated = [...edit_actionItems];
                      updated[index] = {
                        ...updated[index],
                        task: e.target.value,
                      };
                      setActionItems(updated);
                    }}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Owner</label>

                <div style={styles.textareaWrapper}>
                  <CopyButton value={action_item.owner} />

                  <textarea
                    style={styles.textarea}
                    value={action_item.owner}
                    onChange={(e) => {
                      const updated = [...edit_actionItems];
                      updated[index] = {
                        ...updated[index],
                        owner: e.target.value,
                      };
                      setActionItems(updated);
                    }}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Deadline</label>

                <div style={styles.textareaWrapper}>
                  <CopyButton value={action_item.deadline} />

                  <textarea
                    style={styles.textarea}
                    value={action_item.deadline}
                    onChange={(e) => {
                      const updated = [...edit_actionItems];
                      updated[index] = {
                        ...updated[index],
                        deadline: e.target.value,
                      };
                      setActionItems(updated);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button style={styles.exportButton} onClick={handleExport}>
        📄 Export to Word
      </button>
    </div>
  );
}

export default MahdarScreen;