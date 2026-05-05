import { useEffect, useState } from "react";
import supabase from "./supabase";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UploadScreen from "./components/UploadScreen";
import LoginScreen from "./components/LoginScreen";
import logo from "./assets/mahdar_logo_1.png";

function App() {
  const [ user, setUser ] = useState(null);
  const [ loading, setLoading ] = useState(true);

  // This will run only once when the app starts
  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) createUserIfNotExists(session.user);
      setLoading(false);
    })

    // Listen for auth changes (login, logout, Google redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserIfNotExists = async (user) => {
    const { data } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

    if (!data) {
      await supabase.from("users").insert({
        user_id: user.id,
        email: user.email,
        subscribed: false
      });
    }
  }

  if (loading) return <h2>Loading...</h2>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <LoginScreen setUser={setUser} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <UploadScreen user={user} /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App