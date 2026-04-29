import { useState } from "react";

import useAuth from "./hooks/useAuth";

import LoginPage from "./pages/LoginPage";

import RegisterPage from "./pages/RegisterPage";

import ChatPage from "./pages/ChatPage";

function App() {

  const { currentUser } = useAuth();

  const [isLogin, setIsLogin] = useState(true);

  if (currentUser) {

    return <ChatPage />;

  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="auth-brand">
          <span className="brand-mark">C</span>
          <span>Midterm Chatroom</span>
        </div>

        <div className="auth-copy">
          <p className="eyebrow">Firebase Chat App</p>
          <h1>Chat with your classmates in private rooms.</h1>
          <p>
            Create chatrooms, invite members, and keep the full message history
            available for everyone in the room.
          </p>
        </div>
      </section>

      <section className="auth-card">
        {isLogin ? <LoginPage /> : <RegisterPage />}

        <div className="auth-switch">
          <span>
            {isLogin ? "New to this chatroom?" : "Already have an account?"}
          </span>

          <button type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Create account" : "Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;
