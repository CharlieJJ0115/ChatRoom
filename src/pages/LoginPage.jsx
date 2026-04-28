import { useRef, useState } from "react";

import { useAuth } from "../contexts/AuthContext";

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
    <div>

      <h1>Login</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>

        <input
          type="email"
          placeholder="email"
          ref={emailRef}
          required
        />

        <input
          type="password"
          placeholder="password"
          ref={passwordRef}
          required
        />

        <button type="submit">
          Login
        </button>

      </form>

    </div>
  );
}