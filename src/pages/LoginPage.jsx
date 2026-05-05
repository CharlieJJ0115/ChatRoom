import { useRef, useState } from "react";

import useAuth from "../hooks/useAuth";

import { createUserDocument } from "../firebase/userService";

export default function LoginPage() {

  const emailRef = useRef();

  const passwordRef = useRef();

  const { login, loginWithGoogle } = useAuth();

  const [error, setError] = useState("");

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      setError("");

      await login(
        emailRef.current.value,
        passwordRef.current.value
      );

      alert("Login Success!");

    } catch (err) {

      setError(err.message);

    }
  }

  async function handleGoogleSignIn() {

    try {

      setError("");

      setIsGoogleLoading(true);

      const result = await loginWithGoogle();

      await createUserDocument(result.user);

    } catch (err) {

      setError(err.message);

    } finally {

      setIsGoogleLoading(false);

    }
  }

  return (
    <div className="auth-form">
      <div className="auth-form-header">
        <p className="eyebrow">Welcome back</p>
        <h2>Sign in</h2>
        <p>Use your email and password to continue to your chatrooms.</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label className="field-group">
          <span>Email</span>
          <div className="auth-input-shell">
            <span className="auth-input-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16v12H4z" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              ref={emailRef}
              required
            />
          </div>
        </label>

        <label className="field-group">
          <span>Password</span>
          <div className="auth-input-shell">
            <span className="auth-input-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            <input
              type="password"
              placeholder="Enter your password"
              ref={passwordRef}
              required
            />
          </div>
        </label>

        <button className="auth-submit" type="submit">
          Sign in
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button
        className="google-submit"
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        <span className="google-icon" aria-hidden="true">
          <svg viewBox="0 0 18 18" fill="none">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.35 0-4.34-1.58-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.95 10.7A5.41 5.41 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.34 2.82.94 4.03l3.01-2.33Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .94 4.97L3.95 7.3C4.66 5.16 6.65 3.58 9 3.58Z"
            />
          </svg>
        </span>
        {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
}
