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
