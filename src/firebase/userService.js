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

    phoneNumber: "",

    address: "",

    blockedUsers: [],

    createdAt: serverTimestamp()

  });
}

export async function updateUserProfile(uid, profileData) {

  await setDoc(doc(db, "users", uid), {

    photoURL: profileData.photoURL,

    username: profileData.username,

    email: profileData.email,

    phoneNumber: profileData.phoneNumber,

    address: profileData.address,

    updatedAt: serverTimestamp()

  }, { merge: true });
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
