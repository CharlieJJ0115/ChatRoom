import {
  collection,
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "./firebase";

export async function createUserDocument(user) {

  const userRef = doc(db, "users", user.uid);

  const userSnapshot = await getDoc(userRef);

  const email = user.email || "";

  const defaultUserData = {

    uid: user.uid,

    email,

    username: user.displayName || email.split("@")[0] || "User",

    photoURL: user.photoURL || "",

    phoneNumber: "",

    address: "",

    blockedUsers: []

  };

  if (!userSnapshot.exists()) {

    await setDoc(userRef, {

      ...defaultUserData,

      createdAt: serverTimestamp()

    });

    return;

  }

  const existingUserData = userSnapshot.data();

  const missingUserData = Object.entries(defaultUserData).reduce(
    (nextData, [key, value]) => {
      if (existingUserData[key] === undefined) {
        nextData[key] = value;
      }

      return nextData;
    },
    {}
  );

  if (Object.keys(missingUserData).length > 0) {

    await setDoc(userRef, missingUserData, { merge: true });

  }
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

export async function blockUser(currentUid, targetUid) {

  if (!currentUid || !targetUid || currentUid === targetUid) return;

  await setDoc(doc(db, "users", currentUid), {

    blockedUsers: arrayUnion(targetUid),

    updatedAt: serverTimestamp()

  }, { merge: true });
}

export async function unblockUser(currentUid, targetUid) {

  if (!currentUid || !targetUid || currentUid === targetUid) return;

  await setDoc(doc(db, "users", currentUid), {

    blockedUsers: arrayRemove(targetUid),

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
