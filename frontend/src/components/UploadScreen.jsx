import { useState, useEffect } from "react";
import supabase from "../supabase";
import MahdarScreen from "./MahdarScreen";

function UploadScreen() {
  const [token, setToken] = useState(null);
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [textInput, setTextInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState(null);

  const [transcript, setTranscript] = useState("");
  const [mom, setMom] = useState(null);
  const [language, setLanguage] = useState("english");

  const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f7f8",
    padding: "16px 20px",
    fontFamily: "Inter, sans-serif",
    color: "#111827",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "820px",
    margin: "0 auto",
  },

  topBar: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "12px",
  },

  signOutButton: {
    border: "1px solid #e5e7eb",
    background: "white",
    padding: "8px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "13px",
  },

  hero: {
    marginBottom: "18px",
  },

  title: {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "6px",
    letterSpacing: "-0.8px",
  },

  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "0",
    lineHeight: "1.5",
  },

  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    marginBottom: "16px",
  },

  sectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "12px",
  },

  textareaWrapper: {
    position: "relative",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontSize: "14px",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: "1.5",
  },

  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "14px",
    alignItems: "center",
  },

  button: {
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  primaryButton: {
    background: "#111827",
    color: "white",
  },

  secondaryButton: {
    background: "white",
    color: "#111827",
    border: "1px solid #e5e7eb",
  },

  dangerButton: {
    background: "#dc2626",
    color: "white",
  },

  uploadBox: {
    border: "1px dashed #d1d5db",
    borderRadius: "14px",
    padding: "14px",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  fileLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },

  select: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "white",
    fontSize: "13px",
    outline: "none",
  },

  statusText: {
    fontSize: "13px",
    color: "#6b7280",
  },

  divider: {
    height: "1px",
    background: "#e5e7eb",
    margin: "16px 0",
  },
};

  const handleSignout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token);
    });
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);

    recorder.onstop = () => {
      const blob = new Blob(chunks, {
        type: "audio/webm",
      });

      const audioFile = new File(
        [blob],
        "recording.webm",
        {
          type: "audio/webm",
        }
      );

      setFile(audioFile);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setRecording(false);
  };

  const processAudio = async () => {
    if (!file && !textInput)
      return alert("Please provide audio or text!");

    setLoading(true);

    let transcript = "";

    try {
      if (file && !textInput) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/transcribe`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        transcript = data.transcript;

        console.log("Transcript:", transcript);
      } else {
        transcript = textInput;
      }

      if (transcript) {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/generate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transcript: transcript,
              language: language,
              token: token,
            }),
          }
        );

        const gen_data = await response.json();

        console.log(gen_data);

        setTranscript(transcript);
        setText(JSON.stringify(gen_data));
        setMom(gen_data);
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <button
            onClick={handleSignout}
            style={{
              ...styles.button,
              ...styles.secondaryButton,
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Hero */}
        <div style={styles.hero}>
          <h1 style={styles.title}>Mahdar 🎙️</h1>

          <p style={styles.subtitle}>
            Upload, record, or type your meeting notes and instantly generate a clean MoM report.
          </p>
        </div>

        {/* Main Input Card */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>
            Meeting Transcript
          </div>

          <div style={styles.textareaWrapper}>
            <textarea
              style={styles.textarea}
              value={textInput}
              onChange={(e) =>
                setTextInput(e.target.value)
              }
              placeholder="Type your meeting notes here..."
            />
          </div>

          <div style={styles.controls}>
            <button
              onClick={
                recording
                  ? stopRecording
                  : startRecording
              }
              style={{
                ...styles.button,
                ...(recording
                  ? styles.dangerButton
                  : styles.secondaryButton),
              }}
            >
              {recording
                ? "⏹️ Stop Recording"
                : "🎙️ Start Recording"}
            </button>

            <button
              onClick={processAudio}
              disabled={loading}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Generating..."
                : "✨ Generate Mahdar"}
            </button>

            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
              style={styles.select}
            >
              <option value="english">
                English
              </option>

              <option value="arabic">
                Arabic
              </option>
            </select>
          </div>
        </div>

        {/* Uploads */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>
            Upload Files
          </div>

          <div style={styles.uploadBox}>
            <label style={styles.fileLabel}>
              Upload Audio File
            </label>

            <input
              type="file"
              accept="audio/*"
              onChange={(e) =>
                setFile(e.target.files[0])
              }
            />

            {file && (
              <div style={styles.statusText}>
                Selected: {file.name}
              </div>
            )}
          </div>

          <div style={styles.divider} />

          <div style={styles.uploadBox}>
            <label style={styles.fileLabel}>
              Upload Word Template (.docx)
            </label>

            <input
              type="file"
              accept=".docx"
              onChange={(e) =>
                setTemplate(e.target.files[0])
              }
            />

            {template && (
              <div style={styles.statusText}>
                Selected: {template.name}
              </div>
            )}
          </div>
        </div>
        <div>
          <h4>{text}</h4>
        </div>
        {/* Generated MoM */}
        {text && mom && (
          <MahdarScreen
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
  );
}

export default UploadScreen;