import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../supabase";
import MahdarScreen from "./MahdarScreen";

function ViewMahdarScreen() {
  const { id } = useParams();
  const [token, setToken] = useState(null);
  const [mahdar, setMahdar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateUrl, setSelectedTemplateUrl] = useState(null);
  const [template, setTemplate] = useState(null);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token);
    });
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchMahdar = async () => {
      const response = await fetch(`${API}/get-mahdar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, mahdar_id: parseInt(id) }),
      });
      const data = await response.json();
      setMahdar(data.mahdar);
      setLoading(false);
    };

    const fetchTemplates = async () => {
      const response = await fetch(`${API}/get-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      setSavedTemplates(data.templates || []);
    };

    fetchMahdar();
    fetchTemplates();
  }, [token]);

  const getTemplateFile = async () => {
    if (!selectedTemplateUrl) return null;
    const response = await fetch(selectedTemplateUrl);
    const blob = await response.blob();
    return new File([blob], "template.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  };

  useEffect(() => {
    if (!selectedTemplateUrl) return;
    getTemplateFile().then(setTemplate);
  }, [selectedTemplateUrl]);

  if (loading)
    return (
      <div style={styles.statusWrapper}>
        <p style={styles.statusText}>Loading...</p>
      </div>
    );

  if (!mahdar)
    return (
      <div style={styles.statusWrapper}>
        <p style={styles.statusText}>Mahdar not found.</p>
      </div>
    );

  const content = mahdar.content;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>{content.title || "View Mahdar"}</h1>
          {content.date && (
            <span style={styles.dateBadge}>{content.date}</span>
          )}
        </div>

        {/* Template Selector */}
        {savedTemplates.length > 0 && (
          <div style={styles.templateBar}>
            <label style={styles.templateLabel} htmlFor="template-select">
              Template
            </label>
            <select
              id="template-select"
              style={styles.select}
              value={selectedTemplateUrl || ""}
              onChange={(e) => setSelectedTemplateUrl(e.target.value || null)}
            >
              <option value="">No template (default)</option>
              {savedTemplates.map((t) => (
                <option key={t.id} value={t.download_url}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Mahdar Content */}
        <div style={styles.mahdarWrapper}>
          <MahdarScreen
            date={content.date}
            title={content.title}
            purpose={content.purpose}
            location={content.location}
            attendees={content.attendees}
            discussion={content.discussion}
            decisions={content.decisions}
            action_items={content.action_items}
            next_meeting={content.next_meeting}
            hijri_date={content.hijri_date}
            hijri_next_meeting={content.hijri_next_meeting}
            template={template}
            token={token}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f0",
    padding: "32px 16px",
    boxSizing: "border-box",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  container: {
    maxWidth: "860px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    borderBottom: "2px solid #e0ddd6",
    paddingBottom: "16px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: 0,
  },
  dateBadge: {
    fontSize: "13px",
    color: "#666",
    backgroundColor: "#e8e6df",
    padding: "4px 10px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  },
  templateBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#ffffff",
    border: "1px solid #e0ddd6",
    borderRadius: "10px",
    padding: "12px 16px",
  },
  templateLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#444",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  select: {
    flex: 1,
    fontSize: "14px",
    color: "#1a1a1a",
    backgroundColor: "#f9f8f5",
    border: "1px solid #d4d1c8",
    borderRadius: "6px",
    padding: "7px 10px",
    cursor: "pointer",
    outline: "none",
    minWidth: 0,
  },
  mahdarWrapper: {
    backgroundColor: "#ffffff",
    border: "1px solid #e0ddd6",
    borderRadius: "12px",
    overflow: "hidden",
  },
  statusWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
  },
  statusText: {
    fontSize: "15px",
    color: "#888",
  },
};

export default ViewMahdarScreen;