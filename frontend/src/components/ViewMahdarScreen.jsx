import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../supabase";
import MahdarScreen from "./MahdarScreen";
import { useLanguage } from "../i18n/LanguageContext";

function ViewMahdarScreen() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [mahdar, setMahdar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateUrl, setSelectedTemplateUrl] = useState(null);
  const [template, setTemplate] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
    });
  }, []);

  const fetchMahdar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API}/get-mahdar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, mahdar_id: parseInt(id, 10) }),
      });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json();
      setMahdar(data.mahdar ?? null);
    } catch {
      setError(t("viewMahdar.loadError"));
    } finally {
      setLoading(false);
    }
  }, [API, token, id]);

  useEffect(() => {
    if (!token) return;

    fetchMahdar();

    // Templates are optional — a failure here shouldn't block the page.
    (async () => {
      try {
        const response = await fetch(`${API}/get-templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) return;
        const data = await response.json();
        setSavedTemplates(data.templates || []);
      } catch {
        /* non-fatal */
      }
    })();
  }, [token, fetchMahdar, API]);

  // Download the selected template. Fixes two bugs from the original:
  // 1. Choosing "No template" now actually clears the loaded template.
  // 2. A cancellation flag prevents a slow, stale download from
  //    overwriting a newer selection (race condition).
  useEffect(() => {
    if (!selectedTemplateUrl) {
      setTemplate(null);
      return;
    }
    let cancelled = false;
    setTemplateLoading(true);
    (async () => {
      try {
        const response = await fetch(selectedTemplateUrl);
        if (!response.ok) throw new Error("Template download failed");
        const blob = await response.blob();
        if (cancelled) return;
        setTemplate(
          new File([blob], "template.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          })
        );
      } catch {
        if (!cancelled) setTemplate(null);
      } finally {
        if (!cancelled) setTemplateLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedTemplateUrl]);

  if (loading)
    return (
      <div style={styles.statusWrapper}>
        <div style={styles.spinner} />
        <p style={styles.statusText}>{t("viewMahdar.loading")}</p>
        <style>{spinKeyframes}</style>
      </div>
    );

  if (error)
    return (
      <div style={styles.statusWrapper}>
        <p style={styles.statusText}>{error}</p>
        <button style={styles.retryBtn} onClick={fetchMahdar}>
          {t("common.retry")}
        </button>
      </div>
    );

  if (!mahdar)
    return (
      <div style={styles.statusWrapper}>
        <p style={styles.statusText}>{t("viewMahdar.notFound")}</p>
        <button style={styles.retryBtn} onClick={() => navigate("/history")}>
          {t("viewMahdar.backToHistory")}
        </button>
      </div>
    );

  const content = mahdar.content;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Back link */}
        <button style={styles.backLink} onClick={() => navigate(-1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t("viewMahdar.back")}
        </button>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title} dir="auto">
            {content.title || "View Mahdar"}
          </h1>
          <div style={styles.badges}>
            {content.date && <span style={styles.dateBadge}>{content.date}</span>}
            {content.hijri_date && (
              <span style={styles.hijriBadge} dir="auto">
                {content.hijri_date}
              </span>
            )}
          </div>
        </div>

        {/* Template Selector */}
        {savedTemplates.length > 0 && (
          <div style={styles.templateBar}>
            <label style={styles.templateLabel} htmlFor="template-select">
              {t("viewMahdar.templateLabel")}
            </label>
            <select
              id="template-select"
              style={styles.select}
              value={selectedTemplateUrl || ""}
              onChange={(e) => setSelectedTemplateUrl(e.target.value || null)}
            >
              <option value="">{t("viewMahdar.noTemplate")}</option>
              {savedTemplates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.download_url}>
                  {tmpl.name}
                </option>
              ))}
            </select>
            {templateLoading && <span style={styles.templateStatus}>{t("viewMahdar.downloading")}</span>}
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

const spinKeyframes = `
@keyframes mh-spin { to { transform: rotate(360deg); } }
`;

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#faf9f7",
    padding: "2rem 1.5rem",
    boxSizing: "border-box",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  container: {
    maxWidth: "860px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  backLink: {
    alignSelf: "flex-start",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#888",
    background: "none",
    border: "none",
    padding: "4px 0",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    borderBottom: "2px solid #e8e7ea",
    paddingBottom: "16px",
  },
  title: {
    fontSize: "22px",
    fontWeight: 600,
    color: "#1a2e22",
    margin: 0,
  },
  badges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  dateBadge: {
    fontSize: "13px",
    color: "#5a5668",
    backgroundColor: "#f4f3f6",
    padding: "4px 10px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  },
  hijriBadge: {
    fontSize: "13px",
    color: "#1D9E75",
    backgroundColor: "rgba(29,158,117,0.08)",
    padding: "4px 10px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  },
  templateBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#ffffff",
    border: "1px solid #e8e7ea",
    borderRadius: "14px",
    padding: "12px 16px",
    boxShadow: "0 2px 8px rgba(26,46,34,0.05)",
  },
  templateLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#5a5668",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  select: {
    flex: 1,
    fontSize: "14px",
    color: "#1a2e22",
    backgroundColor: "#faf9f7",
    border: "1px solid #e8e7ea",
    borderRadius: "8px",
    padding: "7px 10px",
    cursor: "pointer",
    outline: "none",
    minWidth: 0,
    fontFamily: "inherit",
  },
  templateStatus: {
    fontSize: "12px",
    color: "#b0adb5",
    whiteSpace: "nowrap",
  },
  mahdarWrapper: {
    backgroundColor: "#ffffff",
    border: "1px solid #e8e7ea",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(26,46,34,0.05)",
  },
  statusWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  statusText: {
    fontSize: "14px",
    color: "#888",
    margin: 0,
  },
  spinner: {
    width: "22px",
    height: "22px",
    border: "2.5px solid #e8e7ea",
    borderTopColor: "#1D9E75",
    borderRadius: "50%",
    animation: "mh-spin 0.7s linear infinite",
  },
  retryBtn: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#1a2e22",
    background: "#fff",
    border: "1px solid #e8e7ea",
    borderRadius: "8px",
    padding: "7px 16px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

export default ViewMahdarScreen;