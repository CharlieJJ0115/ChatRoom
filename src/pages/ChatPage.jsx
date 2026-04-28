import { useRef } from "react";

import { useAuth } from "../contexts/AuthContext";

import { createChatroom } from "../firebase/chatroomService";

import useChatrooms from "../hooks/useChatrooms";

export default function ChatPage() {

  const { currentUser, logout } = useAuth();

  const chatrooms = useChatrooms(currentUser.uid);

  const roomNameRef = useRef();

  async function handleLogout() {

    await logout();

  }

  async function handleCreateRoom() {

    if (!roomNameRef.current.value) return;

    await createChatroom(
      roomNameRef.current.value,
      currentUser.uid
    );

    roomNameRef.current.value = "";

    alert("Chatroom Created!");

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

      <button onClick={handleCreateRoom}>
        Create
      </button>
       <hr />

        <h2>My Chatrooms</h2>

        {
        chatrooms.map((room) => (

            <div key={room.id}>

            {room.name}

            </div>

        ))
        }
    </div>
  );
}