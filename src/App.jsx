import { useRef, useState } from "react";

import useAuth from "./hooks/useAuth";

import LoginPage from "./pages/LoginPage";

import RegisterPage from "./pages/RegisterPage";

import ChatPage from "./pages/ChatPage";

function App() {

  const { currentUser } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const authPageRef = useRef(null);
  const authTrailRef = useRef([]);

  function handleAuthPointerMove(event) {
    const authPage = authPageRef.current;

    if (!authPage) {
      return;
    }

    const rect = authPage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const xPosition = `${x}%`;
    const yPosition = `${y}%`;
    const trail = [{ x: xPosition, y: yPosition }, ...authTrailRef.current].slice(0, 7);

    authTrailRef.current = trail;

    authPage.style.setProperty("--auth-mouse-x", xPosition);
    authPage.style.setProperty("--auth-mouse-y", yPosition);
    trail.forEach((point, index) => {
      authPage.style.setProperty(`--auth-trail-${index + 1}-x`, point.x);
      authPage.style.setProperty(`--auth-trail-${index + 1}-y`, point.y);
    });
    authPage.style.setProperty("--auth-mouse-opacity", "1");
  }

  function handleAuthPointerLeave() {
    authPageRef.current?.style.setProperty("--auth-mouse-opacity", "0");
  }

  if (currentUser) {

    return <ChatPage />;

  }

  return (
    <main
      className="auth-page"
      ref={authPageRef}
      onPointerMove={handleAuthPointerMove}
      onPointerLeave={handleAuthPointerLeave}
    >
      <span className="auth-background-orb auth-orb-large-top" aria-hidden="true" />
      <span className="auth-background-orb auth-orb-large-bottom" aria-hidden="true" />
      <span className="auth-background-dot auth-dot-left" aria-hidden="true" />
      <span className="auth-background-dot auth-dot-right" aria-hidden="true" />
      <span className="auth-background-dot auth-dot-bottom" aria-hidden="true" />
      <span className="auth-cursor-glow" aria-hidden="true" />

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
