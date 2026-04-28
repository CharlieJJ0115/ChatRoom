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

      setChatrooms(roomList);

    });

    return unsubscribe;

  }, [uid]);

  return chatrooms;
}