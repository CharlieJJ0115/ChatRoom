import { useRef, useState } from "react";

import useAuth from "../hooks/useAuth";

import { createUserDocument } from "../firebase/userService";

export default function RegisterPage() {

  const emailRef = useRef();
  const passwordRef = useRef();

  const { signup } = useAuth();

  const [error, setError] = useState("");

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      setError("");

      const userCredential = await signup(
        emailRef.current.value,
        passwordRef.current.value
      );

      await createUserDocument(userCredential.user);

      alert("Register Success!");

    } catch (err) {

      setError(err.message);

    }
  }

  return (
    <div className="auth-form">
      <div className="auth-form-header">
        <p className="eyebrow">Get started</p>
        <h2>Create account</h2>
        <p>Register with email and password to join the chatroom app.</p>
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
              placeholder="Create a password"
              ref={passwordRef}
              required
            />
          </div>
        </label>

        <button className="auth-submit" type="submit">
          Create account
        </button>
      </form>
    </div>
  );
}
