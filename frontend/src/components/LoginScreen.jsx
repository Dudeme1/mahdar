import { useState } from "react";
import supabase from "../supabase";

const css = `
  @keyframes login-fadein {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .login-card { animation: login-fadein 0.35s ease; }

  .login-input {
    width: 100%;
    padding: 11px 14px;
    border-radius: 11px;
    border: 1px solid #e5e4e7;
    background: #f7f7f8;
    font-size: 14px;
    color: #08060d;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s;
  }
  .login-input:focus {
    border-color: rgba(170,59,255,0.5);
    background: #fff;
  }
  .login-input::placeholder { color: #c4bfca; }

  .login-btn-primary {
    width: 100%;
    padding: 11px;
    border: none;
    border-radius: 11px;
    background: #111827;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .login-btn-primary:hover { opacity: 0.88; }
  .login-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

  .login-btn-secondary {
    width: 100%;
    padding: 10px;
    border: 1px solid #e5e4e7;
    border-radius: 11px;
    background: #fff;
    color: #08060d;
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }
  .login-btn-secondary:hover { background: #f7f7f8; }

  .login-btn-google {
    width: 100%;
    padding: 10px;
    border: 1px solid #e5e4e7;
    border-radius: 11px;
    background: #fff;
    color: #08060d;
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    transition: background 0.15s, border-color 0.15s;
  }
  .login-btn-google:hover { background: #f7f7f8; border-color: #d1cdd7; }

  .login-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 4px 0;
  }
  .login-divider-line { flex: 1; height: 1px; background: #e5e4e7; }
  .login-divider-text { font-size: 11px; color: #c4bfca; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }

  .login-tab-bar {
    display: flex;
    background: #f4f3f6;
    border-radius: 10px;
    padding: 3px;
    gap: 2px;
    margin-bottom: 20px;
  }
  .login-tab {
    flex: 1;
    padding: 8px 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #9ca3a8;
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
  }
  .login-tab.active {
    background: #fff;
    color: #08060d;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .login-tab:hover:not(.active) { color: #6b6375; }
`;

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.6 35.6 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2C41.1 35.3 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

function LoginScreen({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "signup"

  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return alert(error.message);
    setUser(data.user);
  };

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return alert(error.message);
    alert("Check your email to verify!");
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: import.meta.env.VITE_APP_URL },
    });
  };

  const handleSubmit = mode === "login" ? handleLogin : handleSignup;

  return (
    <>
      <style>{css}</style>
      <div style={{
        minHeight: "100vh",
        background: "#f7f7f8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, 'Segoe UI', sans-serif",
        padding: "20px",
      }}>
        <div className="login-card" style={{
          width: "100%",
          maxWidth: "380px",
          display: "flex",
          flexDirection: "column",
          gap: "0",
        }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎙️</div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#08060d", letterSpacing: "-0.5px" }}>
              Mah<span style={{ color: "#aa3bff" }}>dari</span>
            </div>
            <div style={{ fontSize: "13px", color: "#b0adb5", marginTop: "4px" }}>
              Your meeting minutes, instantly.
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e4e7",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "rgba(0,0,0,0.08) 0 8px 24px -4px, rgba(0,0,0,0.04) 0 4px 6px -2px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>

            {/* Tab switcher */}
            <div className="login-tab-bar">
              <button className={`login-tab${mode === "login" ? " active" : ""}`} onClick={() => setMode("login")}>
                Sign in
              </button>
              <button className={`login-tab${mode === "signup" ? " active" : ""}`} onClick={() => setMode("signup")}>
                Create account
              </button>
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                className="login-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
              <input
                className="login-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {/* Primary action */}
            <button
              className="login-btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>

            {/* Divider */}
            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">or</span>
              <div className="login-divider-line" />
            </div>

            {/* Google */}
            <button className="login-btn-google" onClick={handleGoogle}>
              <GoogleIcon />
              Continue with Google
            </button>

          </div>

          {/* Footer note */}
          <div style={{ textAlign: "center", fontSize: "12px", color: "#c4bfca", marginTop: "16px" }}>
            By continuing you agree to our terms of service.
          </div>

        </div>
      </div>
    </>
  );
}

export default LoginScreen;