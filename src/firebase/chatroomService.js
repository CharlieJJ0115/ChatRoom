import {
  collection,
  addDoc,
  deleteField,
  doc,
  arrayUnion,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "./firebase";

export async function createChatroom(name, uid, memberUids = []) {

  const members = Array.from(new Set([uid, ...memberUids]));

  await addDoc(collection(db, "chatrooms"), {

    name,

    type: "group",

    photoURL: "",

    members,

    createdBy: uid,

    createdAt: serverTimestamp(),

    updatedAt: serverTimestamp(),

    lastMessage: "",

    lastMessageText: "",

    lastMessageType: "",

    lastMessageSenderId: "",

    lastMessageSenderEmail: "",

    lastMessageAt: null,

    readBy: {
      [uid]: serverTimestamp()
    }

  });
}

export async function addMembersToChatroom(roomId, memberUids = []) {

  if (!roomId || memberUids.length === 0) return;

  await updateDoc(doc(db, "chatrooms", roomId), {

    members: arrayUnion(...memberUids),

    updatedAt: serverTimestamp()

  });
}

export async function sendMessage(roomId, user, text, replyTo = null) {

  const messageText = text.trim();

  if (!messageText) return;

  const messageData = {

    text: messageText,

    senderId: user.uid,

    senderEmail: user.email,

    type: "text",

    isUnsent: false,

    createdAt: serverTimestamp(),

    updatedAt: serverTimestamp()

  };

  if (replyTo) {
    messageData.replyTo = replyTo;
  }

  await addDoc(collection(db, "chatrooms", roomId, "messages"), messageData);

  await updateDoc(doc(db, "chatrooms", roomId), {

    lastMessage: messageText,

    lastMessageText: messageText,

    lastMessageType: "text",

    lastMessageSenderId: user.uid,

    lastMessageSenderEmail: user.email,

    lastMessageAt: serverTimestamp(),

    updatedAt: serverTimestamp(),

    [`readBy.${user.uid}`]: serverTimestamp()

  });
}

export async function sendImageMessage(roomId, user, imagePayload) {

  if (!roomId || !user || !imagePayload?.imageData) return;

  await addDoc(collection(db, "chatrooms", roomId, "messages"), {

    text: "",

    imageData: imagePayload.imageData,

    imageName: imagePayload.imageName,

    imageSize: imagePayload.imageSize,

    senderId: user.uid,

    senderEmail: user.email,

    type: "image",

    isUnsent: false,

    createdAt: serverTimestamp(),

    updatedAt: serverTimestamp()

  });

  await updateDoc(doc(db, "chatrooms", roomId), {

    lastMessage: "Sent an image",

    lastMessageText: "",

    lastMessageType: "image",

    lastMessageSenderId: user.uid,

    lastMessageSenderEmail: user.email,

    lastMessageAt: serverTimestamp(),

    updatedAt: serverTimestamp(),

    [`readBy.${user.uid}`]: serverTimestamp()

  });
}

export async function markChatroomRead(roomId, uid) {

  if (!roomId || !uid) return;

  await updateDoc(doc(db, "chatrooms", roomId), {

    [`readBy.${uid}`]: serverTimestamp()

  });
}

export async function updateChatroomProfile(roomId, profileData) {

  const roomName = profileData.name.trim();

  if (!roomId || !roomName) return;

  await updateDoc(doc(db, "chatrooms", roomId), {

    name: roomName,

    photoURL: profileData.photoURL.trim()

  });
}

export async function editMessage(roomId, messageId, text) {

  const messageText = text.trim();

  if (!roomId || !messageId || !messageText) return;

  await updateDoc(doc(db, "chatrooms", roomId, "messages", messageId), {

    text: messageText,

    updatedAt: serverTimestamp()

  });
}

export async function unsendMessage(roomId, messageId) {

  if (!roomId || !messageId) return;

  await updateDoc(doc(db, "chatrooms", roomId, "messages", messageId), {

    text: "",

    imageData: "",

    isUnsent: true,

    updatedAt: serverTimestamp()

  });
}

export async function setMessageReaction(roomId, messageId, uid, emoji) {

  if (!roomId || !messageId || !uid || !emoji) return;

  await updateDoc(doc(db, "chatrooms", roomId, "messages", messageId), {

    [`reactions.${uid}`]: emoji,

    updatedAt: serverTimestamp()

  });
}

export async function removeMessageReaction(roomId, messageId, uid) {

  if (!roomId || !messageId || !uid) return;

  await updateDoc(doc(db, "chatrooms", roomId, "messages", messageId), {

    [`reactions.${uid}`]: deleteField(),

    updatedAt: serverTimestamp()

  });
}

export function subscribeMessages(roomId, callback, errorCallback) {

  const q = query(
    collection(db, "chatrooms", roomId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    callback(messages);

  }, errorCallback);
}
