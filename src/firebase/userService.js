import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "./firebase";

export async function createUserDocument(user) {

  await setDoc(doc(db, "users", user.uid), {

    uid: user.uid,

    email: user.email,

    username: user.email.split("@")[0],

    photoURL: "",

    blockedUsers: [],

    createdAt: serverTimestamp()

  });
}