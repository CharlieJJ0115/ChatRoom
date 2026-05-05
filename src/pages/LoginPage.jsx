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
        <span aria-hidden="true">G</span>
        {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
}
