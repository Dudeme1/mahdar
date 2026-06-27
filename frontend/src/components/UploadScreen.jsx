import { useState, useEffect, useRef, useCallback } from "react";
import supabase from "../supabase";
import MahdarScreen from "./MahdarScreen";
import logoUrl from "/icon-512.png";
import { useLanguage } from "../i18n/LanguageContext";
import MahdarLoader from "./MahdarLoader";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse-ring {
    0%   { transform: scale(1);    opacity: .45; }
    70%  { transform: scale(1.55); opacity: 0;   }
    100% { transform: scale(1.55); opacity: 0;   }
  }
  @keyframes ts-bounce {
    0%, 80%, 100% { transform: scale(.55); opacity: .35; }
    40%            { transform: scale(1);   opacity: 1;   }
  }
  @keyframes fadein {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  .ms-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  .ms-root {
    min-height: 100vh;
    background: #f7f6f3;
    font-family: 'Nunito', system-ui, sans-serif;
    color: #3a3530;
    display: flex;
    flex-direction: column;
  }

  .ms-header {
    border-bottom: 1px solid #e4e0d8;
    background: #f7f6f3;
    padding: 18px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ms-logo-row { display: flex; align-items: center; gap: 10px; }
  .ms-logo-img { width: 28px; height: 28px; border-radius: 6px; }
  .ms-logo-text {
    font-family: 'Fraunces', serif;
    font-size: 20px; font-weight: 500;
    color: #1c1c18; letter-spacing: -0.2px;
  }
  .ms-logo-text span { color: #b07d3a; }

  .ms-signout {
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 12px; font-weight: 600; color: #9a9387;
    background: none; border: 1px solid #ddd9d0;
    border-radius: 20px; padding: 5px 14px; cursor: pointer;
    letter-spacing: 0.01em; transition: color 0.15s, border-color 0.15s;
  }
  .ms-signout:hover { color: #3a3530; border-color: #b8b2a6; }

  .ms-body {
    max-width: 820px;
    margin: 0 auto;
    padding: 44px 28px;
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .ms-two-col {
    display: flex; align-items: flex-start; gap: 0;
    max-width: 100%; padding: 0;
    height: calc(100vh - 61px);
  }
  .ms-left-col {
    width: 520px; flex-shrink: 0;
    height: 100%; overflow-y: auto;
    padding: 36px 28px 52px;
    border-right: 1px solid #e4e0d8;
  }
  .ms-right-col {
    flex: 1; min-width: 0; height: 100%;
    display: flex; flex-direction: column;
    background: #f4f5f2; overflow: hidden;
  }
  @media (max-width: 860px) {
    .ms-two-col { flex-direction: column; height: auto; }
    .ms-left-col { width: 100%; height: auto; border-right: none; border-bottom: 1px solid #e4e0d8; }
    .ms-right-col { height: auto; min-height: 600px; }
  }

  /* Greeting */
  .ms-greeting { margin-bottom: 32px; }
  .ms-greeting-line { font-size: 15px; color: #9a9387; letter-spacing: 0.03em; margin: 0 0 5px; }
  .ms-greeting-title {
    font-family: 'Fraunces', serif;
    font-size: 36px; font-weight: 500;
    color: #1c1c18; letter-spacing: -0.3px;
    margin: 0; line-height: 1.25;
  }
  .ms-greeting-title em { font-style: normal; color: #b07d3a; }

  /* Main panel */
  .ms-panel {
    background: #fff;
    border: 1px solid #e4e0d8;
    border-radius: 20px;
    overflow: hidden;
  }

  /* ── Input row: mic (left) + textarea (right) ── */
  .ms-input-row {
    display: flex;
    align-items: stretch;
  }

  /* Mic section */
  .ms-mic-section {
    width: 130px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 40px 18px;
    background: #f7f6f3;
    border-inline-end: 1px solid #e4e0d8;
  }
  .ms-mic-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ms-mic-ring {
    position: absolute;
    width: 112px; height: 112px;
    border-radius: 24px;
    background: rgba(176,125,58,0.18);
    animation: pulse-ring 1.6s ease-out infinite;
    pointer-events: none;
  }
  .ms-mic-btn {
    width: 92px; height: 92px;
    border-radius: 20px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s, background 0.2s, box-shadow 0.2s;
    position: relative;
    z-index: 1;
    background: #1c1c18;
    box-shadow: 0 3px 10px rgba(28,28,24,0.22);
  }
  .ms-mic-btn:hover { transform: scale(1.04); box-shadow: 0 5px 16px rgba(28,28,24,0.28); }
  .ms-mic-btn svg {
    width: 34px; height: 34px;
    fill: none; stroke: #fff;
    stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
  }
  .ms-mic-btn.recording {
    background: #b07d3a;
    box-shadow: 0 3px 14px rgba(176,125,58,0.40);
  }
  .ms-mic-btn.transcribing { background: #5a524a; cursor: not-allowed; box-shadow: none; }
  .ms-mic-btn.transcribing:hover { transform: none; }

  .ms-mic-label {
    font-size: 13px; font-weight: 700;
    color: #9a9387; letter-spacing: 0.02em;
    text-align: center; line-height: 1.3;
    white-space: nowrap;
  }
  .ms-mic-label.recording { color: #b07d3a; }
  .ms-rec-timer {
    font-size: 15px; color: #b07d3a;
    font-weight: 700; letter-spacing: 0.08em;
  }
  .ms-transcribing-row {
    display: flex; align-items: center; gap: 5px;
    animation: fadein 0.2s ease;
  }
  .ms-ts-dot {
    width: 5px; height: 5px;
    border-radius: 50%; background: #b07d3a;
  }
  .ms-ts-dot:nth-child(1) { animation: ts-bounce 0.9s 0.00s ease-in-out infinite; }
  .ms-ts-dot:nth-child(2) { animation: ts-bounce 0.9s 0.15s ease-in-out infinite; }
  .ms-ts-dot:nth-child(3) { animation: ts-bounce 0.9s 0.30s ease-in-out infinite; }

  /* Textarea section */
  .ms-textarea-section {
    flex: 1;
    padding: 14px 16px;
    display: flex;
  }
  textarea.ms-input {
    width: 100%;
    min-height: 124px;
    height: 100%;
    padding: 12px 14px;
    border: 1px solid #e4e0d8;
    border-radius: 12px;
    background: #fbfaf8;
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 13.5px; font-weight: 400;
    color: #1c1c18; line-height: 1.7;
    resize: vertical;
    transition: border-color 0.15s, background 0.15s;
    outline: none;
    flex: 1;
  }
  textarea.ms-input:focus { border-color: #b07d3a; background: #fff; }
  textarea.ms-input::placeholder { color: #c4bdb4; }
  textarea.ms-input.has-content { background: #fff; border-color: #d5cfc5; }

  /* Panel footer */
  .ms-panel-foot {
    border-top: 1px solid #e4e0d8;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ms-generate-btn {
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 14px; font-weight: 700; letter-spacing: 0.04em;
    background: #1c1c18; color: #fff;
    border: none; border-radius: 20px;
    padding: 10px 22px; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: opacity 0.15s;
    margin-inline-start: auto;
  }
  .ms-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ms-generate-btn:not(:disabled):hover { opacity: 0.82; }

  .ms-upload-label {
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 12px; font-weight: 600; color: #5a524a;
    background: none; border: 1px solid #e4e0d8;
    border-radius: 20px; padding: 8px 14px;
    cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    transition: border-color 0.15s, color 0.15s; white-space: nowrap;
  }
  .ms-upload-label:hover { border-color: #b07d3a; color: #1c1c18; }

  select.ms-select {
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 13px; font-weight: 500; color: #3a3530;
    background: #fff; border: 1px solid #e4e0d8;
    border-radius: 20px; padding: 8px 28px 8px 14px;
    cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%239a9387' d='M5 7L1 3h8z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 11px center;
    outline: none; transition: border-color 0.15s;
  }
  select.ms-select:focus { border-color: #b07d3a; }

  /* File pill */
  .ms-file-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: #fdf3e0; border: 1px solid #e8d5a8;
    border-radius: 20px; padding: 4px 10px 4px 12px;
  }
  .ms-file-pill-name {
    font-size: 11px; color: #8a6525; font-weight: 600;
    max-width: 130px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
  }
  .ms-file-remove {
    background: none; border: none; cursor: pointer;
    color: #b07d3a; padding: 0; line-height: 1;
    font-size: 14px; display: flex; align-items: center;
    opacity: 0.7; transition: opacity 0.15s;
  }
  .ms-file-remove:hover { opacity: 1; }

  /* Template button in footer */
  .ms-tmpl-btn {
    font-family: 'Nunito', system-ui, sans-serif;
    font-size: 13px; font-weight: 600; color: #5a524a;
    background: none; border: 1px solid #e4e0d8;
    border-radius: 20px; padding: 9px 16px;
    cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
    transition: border-color 0.15s, color 0.15s; white-space: nowrap;
  }
  .ms-tmpl-btn:hover { border-color: #b07d3a; color: #1c1c18; }
  .ms-tmpl-btn svg { width: 15px; height: 15px; flex-shrink: 0; color: #9a9387; }

  .ms-tmpl-select-wrap {
    display: inline-flex; align-items: center; gap: 7px;
  }
  .ms-tmpl-select-wrap svg { width: 16px; height: 16px; color: #9a9387; flex-shrink: 0; }

  .ms-badge {
    font-size: 11px; color: #8a6525;
    background: #fdf3e0; border: 1px solid #e8d5a8;
    border-radius: 20px; padding: 3px 10px; font-weight: 600;
  }

  /* View-report banner */
  .ms-report-banner {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 12px; padding: 10px 16px;
    margin-top: 8px; animation: fadein 0.2s ease;
  }
  .ms-report-banner-text {
    font-size: 12.5px; font-weight: 600; color: #15803d;
    display: flex; align-items: center; gap: 6px;
  }
  .ms-report-banner-btn {
    font-family: 'Nunito', sans-serif;
    font-size: 12px; font-weight: 700; color: #16a34a;
    background: none; border: 1px solid #86efac;
    border-radius: 20px; padding: 5px 14px;
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
    transition: background 0.12s;
  }
  .ms-report-banner-btn:hover { background: #dcfce7; }

  /* Generating status */
  .ms-gen-status {
    display: flex; align-items: center; gap: 10px;
    font-size: 14px; color: #9a9387; font-style: italic;
    margin: 10px 0 0; animation: fadein 0.2s ease;
  }

  /* Limit modal */
  .ms-limit-backdrop {
    position: fixed; inset: 0;
    background: rgba(28,28,24,0.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 24px;
  }
  .ms-limit-modal {
    background: #fff; border: 1px solid #e4e0d8;
    border-radius: 24px; width: 100%; max-width: 420px;
    padding: 32px 28px 28px; text-align: center;
  }
  .ms-limit-icon {
    width: 48px; height: 48px; background: #fdf3e0;
    border: 1px solid #e8d5a8; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; font-size: 22px;
  }
  .ms-limit-title {
    font-family: 'Fraunces', serif;
    font-size: 22px; font-weight: 500;
    color: #1c1c18; letter-spacing: -0.2px; margin: 0 0 8px;
  }
  .ms-limit-title span { color: #b07d3a; }
  .ms-limit-msg { font-size: 13.5px; color: #9a9387; line-height: 1.65; margin: 0 0 24px; }
  .ms-limit-perks {
    background: #fdf8f2; border: 1px solid #ede5d4;
    border-radius: 14px; padding: 14px 16px;
    margin-bottom: 22px; text-align: left;
  }
  .ms-perk-row {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: #5a524a; font-weight: 500; padding: 4px 0;
  }
  .ms-perk-dot { width: 6px; height: 6px; background: #b07d3a; border-radius: 50%; flex-shrink: 0; }
  .ms-price-badge {
    display: inline-flex; align-items: baseline; gap: 2px;
    background: #fdf3e0; border: 1px solid #e8d5a8;
    border-radius: 20px; padding: 3px 10px;
    font-size: 12px; font-weight: 700; color: #8a6525; margin-bottom: 20px;
  }
  .ms-limit-cta {
    width: 100%; font-family: 'Nunito', sans-serif;
    font-size: 14px; font-weight: 700; letter-spacing: 0.03em;
    background: #1c1c18; color: #fff;
    border: none; border-radius: 20px; padding: 12px 22px;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; gap: 8px;
    transition: opacity 0.15s; margin-bottom: 10px;
  }
  .ms-limit-cta:hover { opacity: 0.82; }
  .ms-limit-dismiss {
    font-family: 'Nunito', sans-serif;
    font-size: 12px; font-weight: 600; color: #b0a89e;
    background: none; border: none; cursor: pointer; padding: 4px;
    transition: color 0.15s;
  }
  .ms-limit-dismiss:hover { color: #5a524a; }
`;

const BAR_COUNT = 40;
const BAR_W = 3;
const BAR_GAP = 2;

function WaveCanvas({ canvasRef }) {
  return (
    <div className="ms-wave-wrap">
      <canvas ref={canvasRef} className="ms-wave-canvas" height={56} />
    </div>
  );
}

function UploadScreen() {
  const { t } = useLanguage();
  const [token, setToken]                   = useState(null);
  const [audioFile, setAudioFile]           = useState(null);
  const [template, setTemplate]             = useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateUrl, setSelectedTemplateUrl] = useState(null);
  const [textInput, setTextInput]           = useState("");
  const [recState, setRecState]             = useState("idle"); // idle | recording | transcribing
  const [recElapsed, setRecElapsed]         = useState(0);
  const [loading, setLoading]               = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("");
  const [mom, setMom]                       = useState(null);
  const [reportVisible, setReportVisible]   = useState(false);
  const [outputLanguage, setOutputLanguage] = useState("english");
  const [limitReached, setLimitReached]     = useState(false);
  const [limitMessage, setLimitMessage]     = useState("");
  const [templateTags, setTemplateTags]     = useState([]);

  const canvasRef        = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef  = useRef(null);
  const analyserRef      = useRef(null);
  const sourceRef        = useRef(null);
  const animFrameRef     = useRef(null);
  const timerRef         = useRef(null);
  const chunksRef        = useRef([]);
  const barsRef          = useRef(
    Array.from({ length: BAR_COUNT }, () => ({ h: 4, target: 4 }))
  );
  const audioFileRef    = useRef(null);
  const templateFileRef = useRef(null);

  const API = import.meta.env.VITE_API_URL;

  // Greeting
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("upload.greetingMorning");
    if (h < 17) return t("upload.greetingAfternoon");
    return t("upload.greetingEvening");
  })();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/get-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(d => setSavedTemplates(d.templates || []));
  }, [token]);

  // ─── Waveform drawing ──────────────────────────────────────────────────────

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || 300;
  }, []);

  const drawBars = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const totalW = BAR_COUNT * (BAR_W + BAR_GAP) - BAR_GAP;
    let x = (W - totalW) / 2;
    barsRef.current.forEach(b => {
      const bh = Math.min(b.h, H * 0.88);
      const y = (H - bh) / 2;
      ctx.fillStyle = "#b07d3a";
      ctx.beginPath();
      ctx.roundRect(x, y, BAR_W, bh, 2);
      ctx.fill();
      x += BAR_W + BAR_GAP;
    });
  }, []);

  const animateFromAnalyser = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    barsRef.current.forEach((b, i) => {
      const idx = Math.floor((i / BAR_COUNT) * data.length * 0.6);
      const amp = data[idx] / 255;
      b.target = 4 + amp * 44;
      b.h += (b.target - b.h) * 0.25;
    });
    drawBars();
    animFrameRef.current = requestAnimationFrame(animateFromAnalyser);
  }, [drawBars]);

  // ─── Recording controls ────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Web Audio analyser for waveform
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      // MediaRecorder
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = handleRecordingStop;
      recorder.start();
      mediaRecorderRef.current = recorder;

      // Start UI
      setRecState("recording");
      setRecElapsed(0);
      timerRef.current = setInterval(() => setRecElapsed(s => s + 1), 1000);

      resizeCanvas();
      animFrameRef.current = requestAnimationFrame(animateFromAnalyser);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Could not access microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
    cancelAnimationFrame(animFrameRef.current);
    clearInterval(timerRef.current);
    // Freeze bars, don't clear — looks cleaner
    setRecState("transcribing");
  };

  const handleRecordingStop = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const file = new File([blob], "recording.webm", { type: "audio/webm" });

    // Close audio context
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res  = await fetch(`${API}/transcribe`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.transcript) {
        setTextInput(data.transcript);
      }
    } catch (err) {
      console.error("Transcription error:", err);
    }

    setRecState("idle");
    // Keep the audio file in case user wants to re-use it directly
    setAudioFile(file);
  };

  const handleMicClick = () => {
    if (recState === "idle")      startRecording();
    if (recState === "recording") stopRecording();
  };

  // ─── Format timer ──────────────────────────────────────────────────────────

  const formatTime = s =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ─── Generate ──────────────────────────────────────────────────────────────

  const processAudio = async () => {
    const hasText  = textInput.trim();
    const hasAudio = audioFile;
    if (!hasText && !hasAudio) return alert("Please record audio or type your meeting notes.");

    setMom(null);
    setLoading(true);
    setGeneratingStatus(t("upload.statusPreparing"));

    let t1, t2;
    try {
      let transcript = "";

      if (hasText) {
        transcript = textInput;
      } else {
        setGeneratingStatus(t("upload.statusTranscribing"));
        const formData = new FormData();
        formData.append("file", audioFile);
        const res  = await fetch(`${API}/transcribe`, { method: "POST", body: formData });
        const data = await res.json();
        transcript = data.transcript;
      }

      if (transcript) {
        setGeneratingStatus(t("upload.statusAnalyzing"));

        // Progressive status updates while waiting for Claude
        t1 = setTimeout(() => setGeneratingStatus(t("upload.statusExtracting")), 5000);
        t2 = setTimeout(() => setGeneratingStatus(t("upload.statusMatching")), 12000);

        const res = await fetch(`${API}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, language: outputLanguage, token }),
        });

        clearTimeout(t1);
        clearTimeout(t2);

        const gen_data = await res.json();

        if (gen_data.error === "limit_reached") {
          setLimitReached(true);
          setLimitMessage(gen_data.message);
          setLoading(false);
          setGeneratingStatus("");
          return;
        }

        setGeneratingStatus(t("upload.statusDone"));
        setMom(gen_data);
        setReportVisible(true);
      }
    } catch (err) {
      console.error(err);
      clearTimeout(t1);
      clearTimeout(t2);
      setGeneratingStatus(t("upload.statusError"));
    }

    setLoading(false);
    setGeneratingStatus("");
  };

  // ─── Misc helpers ──────────────────────────────────────────────────────────

  const handleSignout = () => supabase.auth.signOut();

  const handleSubscribe = async () => {
    const res  = await fetch(`${API}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const micBtnClass = `ms-mic-btn${recState === "recording" ? " recording" : recState === "transcribing" ? " transcribing" : ""}`;
  const micLabelClass = `ms-mic-label${recState === "recording" ? " recording" : ""}`;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{css}</style>
      <div className="ms-root">

        <div className={mom && reportVisible ? "ms-two-col" : "ms-body"}>

          {/* Left column wrap when report is visible */}
          <div className={mom && reportVisible ? "ms-left-col" : ""}>

          {/* Greeting */}
          <div className="ms-greeting">
            <p className="ms-greeting-line">{greeting}</p>
            <h1 className="ms-greeting-title">
              {t("upload.tagline")} <em>{t("upload.meeting")}</em>
            </h1>
          </div>

          {/* Main panel */}
          <div className="ms-panel">

            {/* Input row: mic (left) + textarea (right) */}
            <div className="ms-input-row">

              {/* Mic section */}
              <div className="ms-mic-section">
                <div className="ms-mic-wrap">
                  {recState === "recording" && <div className="ms-mic-ring" />}
                  <button
                    className={micBtnClass}
                    onClick={handleMicClick}
                    disabled={recState === "transcribing"}
                    aria-label={recState === "recording" ? "Stop recording" : "Start recording"}
                  >
                    {recState === "transcribing" ? (
                      <span className="ms-spinner" />
                    ) : recState === "recording" ? (
                      <svg viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" fill="white" stroke="none" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24">
                        <rect x="9" y="2" width="6" height="11" rx="3" />
                        <path d="M5 10a7 7 0 0014 0" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                        <line x1="9"  y1="22" x2="15" y2="22" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className={micLabelClass}>
                  {recState === "transcribing"
                    ? t("upload.transcribing")
                    : recState === "recording"
                      ? t("upload.tapToStop")
                      : textInput
                        ? t("upload.reRecord")
                        : t("upload.tapToRecord")}
                </div>

                {recState === "recording" && (
                  <div className="ms-rec-timer">{formatTime(recElapsed)}</div>
                )}

                {recState === "transcribing" && (
                  <div className="ms-transcribing-row">
                    <span className="ms-ts-dot" />
                    <span className="ms-ts-dot" />
                    <span className="ms-ts-dot" />
                  </div>
                )}
              </div>

              {/* Textarea section */}
              <div className="ms-textarea-section">
                <textarea
                  className={`ms-input${textInput ? " has-content" : ""}`}
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder={t("upload.textareaPlaceholder")}
                />
              </div>

            </div>

            {/* Footer */}
            <div className="ms-panel-foot">

              {/* Template — hidden file input always present */}
              <input
                ref={templateFileRef}
                type="file"
                accept=".docx"
                style={{ display: "none" }}
                onChange={e => setTemplate(e.target.files[0])}
              />

              {template ? (
                <span className="ms-file-pill">
                  <span className="ms-file-pill-name">✓ {template.name}</span>
                  <button
                    className="ms-file-remove"
                    onClick={() => { setTemplate(null); setSelectedTemplateUrl(null); setTemplateTags([]); }}
                    title="Remove template"
                  >✕</button>
                </span>
              ) : savedTemplates.length > 0 ? (
                <div className="ms-tmpl-select-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="8" y1="13" x2="16" y2="13"/>
                    <line x1="8" y1="17" x2="16" y2="17"/>
                  </svg>
                  <select
                    className="ms-select"
                    value={selectedTemplateUrl || ""}
                    onChange={async e => {
                      const url = e.target.value;
                      setSelectedTemplateUrl(url);
                      if (!url) { setTemplate(null); setTemplateTags([]); return; }
                      // Capture the tags from the selected template
                      const selected = savedTemplates.find(t => t.download_url === url);
                      setTemplateTags(selected?.tags || []);
                      const res  = await fetch(url);
                      const blob = await res.blob();
                      const name = url.split("/").pop()?.split("?")[0] || "template.docx";
                      setTemplate(new File([blob], name, {
                        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                      }));
                    }}
                  >
                    <option value="">{t("upload.templateChooseSaved")}</option>
                    {savedTemplates.map(tmpl => (
                      <option key={tmpl.id} value={tmpl.download_url}>{tmpl.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <button
                  className="ms-tmpl-btn"
                  onClick={() => templateFileRef.current?.click()}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="8" y1="13" x2="16" y2="13"/>
                    <line x1="8" y1="17" x2="16" y2="17"/>
                  </svg>
                  {t("upload.templateLabel")}
                </button>
              )}

              {/* Upload audio */}
              <label className="ms-upload-label">
                {audioFile && recState === "idle"
                  ? <span className="ms-file-pill">
                      <span className="ms-file-pill-name">✓ {audioFile.name}</span>
                      <button
                        className="ms-file-remove"
                        onClick={e => { e.preventDefault(); setAudioFile(null); }}
                        title="Remove"
                      >✕</button>
                    </span>
                  : <>{t("upload.uploadAudio")}</>
                }
                <input
                  ref={audioFileRef}
                  type="file"
                  accept="audio/*"
                  style={{ display: "none" }}
                  onChange={e => {
                    setAudioFile(e.target.files[0]);
                    setTextInput("");
                  }}
                />
              </label>

              {/* Output language */}
              <select
                className="ms-select"
                value={outputLanguage}
                onChange={e => setOutputLanguage(e.target.value)}
              >
                <option value="english">{t("upload.english")}</option>
                <option value="arabic">{t("upload.arabic")}</option>
              </select>

              {/* Generate — pushed to end */}
              <button
                className="ms-generate-btn"
                onClick={processAudio}
                disabled={loading || recState !== "idle"}
              >
                {t("upload.generateMahdar")}
              </button>

            </div>
          </div>

          {/* Generating status */}
          {loading && generatingStatus && (
            <p className="ms-gen-status">
              <MahdarLoader size="sm" />
              {generatingStatus}
            </p>
          )}

          {/* Banner to re-open hidden report */}
          {mom && !reportVisible && (
            <div className="ms-report-banner">
              <span className="ms-report-banner-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t("upload.reportReady")}
              </span>
              <button className="ms-report-banner-btn" onClick={() => setReportVisible(true)}>
                {t("upload.viewReport")} →
              </button>
            </div>
          )}

          </div>{/* end left col */}

          {/* Right column — MahdarScreen */}
          {mom && reportVisible && (
            <div className="ms-right-col">
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
                onHide={() => setReportVisible(false)}
                mahdarId={mom.mahdar_id}
                initialTags={templateTags.length > 0 ? templateTags : (mom.initial_tags || [])}
                onNewMahdar={() => {
                  setMom(null);
                  setTextInput("");
                  setAudioFile(null);
                  setReportVisible(false);
                  setTemplate(null);
                  setSelectedTemplateUrl(null);
                  setTemplateTags([]);
                }}
              />
            </div>
          )}
        </div>

        {/* Limit modal */}
        {limitReached && (
          <div className="ms-limit-backdrop" onClick={() => setLimitReached(false)}>
            <div className="ms-limit-modal" onClick={e => e.stopPropagation()}>
              <div className="ms-limit-icon">⭐</div>
              <h2 className="ms-limit-title">{t("limit.title")} <span>{t("limit.pro")}</span></h2>
              <p className="ms-limit-msg">{limitMessage}</p>
              <div className="ms-price-badge">{t("limit.price")}</div>
              <div className="ms-limit-perks">
                <div className="ms-perk-row"><span className="ms-perk-dot" />{t("limit.perkUnlimited")}</div>
                <div className="ms-perk-row"><span className="ms-perk-dot" />{t("limit.perkTemplates")}</div>
                <div className="ms-perk-row"><span className="ms-perk-dot" />{t("limit.perkLanguages")}</div>
                <div className="ms-perk-row"><span className="ms-perk-dot" />{t("limit.perkPriority")}</div>
              </div>
              <button className="ms-limit-cta" onClick={handleSubscribe}>{t("limit.upgradeCta")}</button>
              <button className="ms-limit-dismiss" onClick={() => setLimitReached(false)}>{t("limit.dismiss")}</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default UploadScreen;