import { useRef, useState } from "react";

import useAuth from "../hooks/useAuth";

export default function LoginPage() {

  const emailRef = useRef();

  const passwordRef = useRef();

  const { login } = useAuth();

  const [error, setError] = useState("");

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
          <input
            type="email"
            placeholder="you@example.com"
            ref={emailRef}
            required
          />
        </label>

        <label className="field-group">
          <span>Password</span>
          <input
            type="password"
            placeholder="Enter your password"
            ref={passwordRef}
            required
          />
        </label>

        <button className="auth-submit" type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
