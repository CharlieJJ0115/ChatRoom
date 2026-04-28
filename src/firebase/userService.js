import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
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

export function subscribeUsers(callback) {

  const q = query(
    collection(db, "users"),
    orderBy("email")
  );

  return onSnapshot(q, (snapshot) => {

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    callback(users);

  });
}
