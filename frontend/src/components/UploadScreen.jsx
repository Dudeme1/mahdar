import { useState, useEffect } from "react"
import supabase from "../supabase";
import MahdarScreen from "./MahdarScreen";

function UploadScreen() {
  const [token, setToken] = useState(null);  
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState(null);

  const [transcript, setTranscript] = useState("");
  const [mom, setMom] = useState(null);
  const [language, setLanguage] = useState("english");

  const handleSignout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    supabase.auth.getSession().then(( { data: { session } } ) => {
        setToken(session?.access_token)
    });
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File([blob], "recording.webm", { type: "audio/webm" });
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
    if (!file && !text) return alert("Please provide audio or text!");
    
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    console.log("Processing...");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/transcribe`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error(response.status);
      } else {
        const data = await response.json();
        const transcript = data.transcript;
        console.log(data);
        console.log(data.transcript);
        
        if (data.transcript) {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/generate`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json",},
                    body: JSON.stringify({ transcript: transcript, language: language, token: token })
                });
                if (!response.ok) {
                    throw new Error(response.status);
                } else {
                    const gen_data = await response.json();
                    console.log(gen_data);
                    setText(JSON.stringify(gen_data));
                    setMom(gen_data);
                }

            } catch (err) {
                console.log(err);
            }
        }
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  }

  return (
    <div sytle={{ position: "relative" }}>
      <button 
      onClick={handleSignout}
      style={{ position: "absolute", top: "10px", right: "10px" }}
      >
        Sign Out
      </button>
      <h1>Mahdar 🎙️</h1>
      <h2>Tell us about your meeting</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Or type about your meeting here..."
        rows={4}
      />
      <div>
        <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={recording ? stopRecording : startRecording}>
            {recording ? "⏹️ Stop" : "🎙️ Record"}
        </button>   
        <button onClick={processAudio}>{loading ? "Processing..." : "Generate Mahdar"}</button>
      </div>
      <div>
        <input 
        type="file" 
        accept=".docx"
        onChange={(e) => setTemplate(e.target.files[0])}
        />
      </div>
      <div>
        { text ? 
        <div>
        <p>{text}</p>
        <MahdarScreen
         date={mom.date}
         title={mom.title}
         purpose={mom.purpose}
         location={mom.location}
         attendees={mom.attendees}
         discussion={mom.discussion}
         decisions={mom.decisions}
         action_items={mom.action_items}
         next_meeting={mom.next_meeting}
         template={template}
         />
         </div>
        : <></> }
      </div>
    </div>
  )
}

export default UploadScreen