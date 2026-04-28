import { useRef, useState } from "react";

import { useAuth } from "../contexts/AuthContext";

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

      alert("Register Success!");

    } catch (err) {

      setError(err.message);

    }
  }

  return (
    <div>

      <h1>Register</h1>

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
          Register
        </button>

      </form>

    </div>
  );
}