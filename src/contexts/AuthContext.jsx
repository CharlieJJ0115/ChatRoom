import { useEffect, useState } from "react";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import { auth } from "../firebase/firebase";

import AuthContext from "./AuthContext";

export function AuthProvider({ children }) {

  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);

  // signup
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    return signInWithPopup(auth, provider);
  }

  // logout
  function logout() {
    return signOut(auth);
  }

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;

  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
