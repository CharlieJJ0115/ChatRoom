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
      <span className="auth-background-orb auth-orb-large-top" aria-hidden="true" />
      <span className="auth-background-orb auth-orb-large-bottom" aria-hidden="true" />
      <span className="auth-background-dot auth-dot-left" aria-hidden="true" />
      <span className="auth-background-dot auth-dot-right" aria-hidden="true" />
      <span className="auth-background-dot auth-dot-bottom" aria-hidden="true" />

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
