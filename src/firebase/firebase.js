import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCk9BvY_rruLXbjX17qceKCTyeWJKa5I98",
  authDomain: "midterm-chatroom-20018.firebaseapp.com",
  projectId: "midterm-chatroom-20018",
  storageBucket: "midterm-chatroom-20018.firebasestorage.app",
  messagingSenderId: "562172938985",
  appId: "1:562172938985:web:86fd4fd10273addd6f3e78"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);