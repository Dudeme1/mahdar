import { useState } from "react"
import supabase from "../supabase"

function LoginScreen({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    setUser(data.user);
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert("Check your email to verify!");
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: import.meta.env.VITE_APP_URL }
    });
  };

  return (
    <div>
      <h1>Mahdari 🎙️</h1>
      <h2>Sign in to continue</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>{loading ? "Loading..." : "Login"}</button>
      <button onClick={handleSignup}>Sign Up</button>
      <hr />
      <button onClick={handleGoogle}>Sign in with Google 🔵</button>
    </div>
  )
}

export default LoginScreen