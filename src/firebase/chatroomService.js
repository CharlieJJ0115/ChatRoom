import {
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "./firebase";

export async function createChatroom(name, uid) {

  await addDoc(collection(db, "chatrooms"), {

    name,

    type: "group",

    members: [uid],

    createdBy: uid,

    createdAt: serverTimestamp(),

    updatedAt: serverTimestamp(),

    lastMessage: ""

  });
}