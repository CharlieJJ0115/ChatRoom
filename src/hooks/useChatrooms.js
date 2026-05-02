import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export default function useChatrooms(uid) {

  const [chatrooms, setChatrooms] = useState([]);

  function getTimestampMillis(timestamp) {

    if (!timestamp) return 0;

    if (typeof timestamp.toMillis === "function") {
      return timestamp.toMillis();
    }

    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }

    return 0;

  }

  useEffect(() => {

    if (!uid) return;

    const q = query(
      collection(db, "chatrooms"),
      where("members", "array-contains", uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const roomList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setChatrooms(roomList.sort((a, b) => {
        const bTime = getTimestampMillis(b.updatedAt || b.lastMessageAt);
        const aTime = getTimestampMillis(a.updatedAt || a.lastMessageAt);

        return bTime - aTime;
      }));

    }, (error) => {
      console.error("Failed to subscribe chatrooms", error);
    });

    return unsubscribe;

  }, [uid]);

  return chatrooms;
}
