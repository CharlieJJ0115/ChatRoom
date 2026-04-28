import { useEffect, useRef, useState } from "react";

import { useAuth } from "../contexts/AuthContext";

import {
  createChatroom,
  sendMessage,
  subscribeMessages
} from "../firebase/chatroomService";

import { subscribeUsers } from "../firebase/userService";

import useChatrooms from "../hooks/useChatrooms";

export default function ChatPage() {

  const { currentUser, logout } = useAuth();

  const chatrooms = useChatrooms(currentUser?.uid);

  const [users, setUsers] = useState([]);

  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const [selectedRoom, setSelectedRoom] = useState(null);

  const [messages, setMessages] = useState([]);

  const [messageText, setMessageText] = useState("");

  const roomNameRef = useRef();

  useEffect(() => {

    if (!currentUser) return;

    const unsubscribe = subscribeUsers((userList) => {

      setUsers(
        userList.filter((user) => user.uid !== currentUser.uid)
      );

    });

    return unsubscribe;

  }, [currentUser]);

  useEffect(() => {

    if (!selectedRoom) return;

    const unsubscribe = subscribeMessages(selectedRoom.id, setMessages);

    return unsubscribe;

  }, [selectedRoom]);

  if (!currentUser) {

    return <p>Please login first.</p>;

  }

  async function handleLogout() {

    await logout();

  }

  async function handleCreateRoom() {

    if (!roomNameRef.current.value) return;

    await createChatroom(
      roomNameRef.current.value,
      currentUser.uid,
      selectedUserIds
    );

    roomNameRef.current.value = "";

    setSelectedUserIds([]);

    alert("Chatroom Created!");

  }

  function handleSelectUser(uid) {

    setSelectedUserIds((prev) => {

      if (prev.includes(uid)) {
        return prev.filter((selectedUid) => selectedUid !== uid);
      }

      return [...prev, uid];

    });
  }

  function handleSelectRoom(room) {

    setMessages([]);

    setSelectedRoom(room);

  }

  async function handleSendMessage(e) {

    e.preventDefault();

    if (!selectedRoom || !messageText.trim()) return;

    await sendMessage(selectedRoom.id, currentUser, messageText);

    setMessageText("");

  }

  return (
    <div>

      <h1>Welcome</h1>

      <p>{currentUser.email}</p>

      <button onClick={handleLogout}>
        Logout
      </button>

      <hr />

      <h2>Create Chatroom</h2>

      <input
        type="text"
        placeholder="Room Name"
        ref={roomNameRef}
      />

      <h3>Add Members</h3>

      {
        users.length === 0 && (
          <p>No other registered users found.</p>
        )
      }

      {
        users.map((user) => (

          <label key={user.uid} style={{ display: "block" }}>

            <input
              type="checkbox"
              checked={selectedUserIds.includes(user.uid)}
              onChange={() => handleSelectUser(user.uid)}
            />

            {user.username} ({user.email})

          </label>

        ))
      }

      <button onClick={handleCreateRoom}>
        Create
      </button>
       <hr />

        <h2>My Chatrooms</h2>

        {
        chatrooms.map((room) => (

            <div key={room.id}>

            <button onClick={() => handleSelectRoom(room)}>
              {room.name}
            </button>

            </div>

        ))
        }

      <hr />

      <h2>Current Chatroom</h2>

      {
        selectedRoom ? (
          <div>

            <p>Current Chatroom: {selectedRoom.name}</p>

            <div>

              {
                messages.length === 0 && (
                  <p>No messages yet.</p>
                )
              }

              {
                messages.map((message) => (

                  <p key={message.id}>
                    <strong>
                      {message.senderId === currentUser.uid
                        ? "You"
                        : message.senderEmail
                      }
                      :
                    </strong>{" "}
                    {message.text}
                  </p>

                ))
              }

            </div>

            <form onSubmit={handleSendMessage}>

              <input
                type="text"
                placeholder="Type a message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />

              <button type="submit">
                Send
              </button>

            </form>

          </div>
        ) : (
          <p>Select a chatroom to start chatting.</p>
        )
      }
    </div>
  );
}
