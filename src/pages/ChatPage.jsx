import { useEffect, useRef, useState } from "react";

import useAuth from "../hooks/useAuth";

import {
  addMembersToChatroom,
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

  const [inviteUserIds, setInviteUserIds] = useState([]);

  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [messageText, setMessageText] = useState("");

  const roomNameRef = useRef();

  const selectedRoom = chatrooms.find((room) => room.id === selectedRoomId);

  const selectedRoomMembers = selectedRoom
    ? users.filter((user) => selectedRoom.members?.includes(user.uid))
    : [];

  const availableInviteUsers = selectedRoom
    ? users.filter((user) => !selectedRoom.members?.includes(user.uid))
    : [];

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

    if (!selectedRoomId) return;

    const unsubscribe = subscribeMessages(selectedRoomId, setMessages);

    return unsubscribe;

  }, [selectedRoomId]);

  if (!currentUser) {

    return <p>Please login first.</p>;

  }

  async function handleLogout() {

    await logout();

  }

  async function handleCreateRoom() {

    const roomName = roomNameRef.current.value.trim();

    if (!roomName) return;

    await createChatroom(
      roomName,
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

    setSelectedRoomId(room.id);

    setInviteUserIds([]);

  }

  function handleSelectInviteUser(uid) {

    setInviteUserIds((prev) => {

      if (prev.includes(uid)) {
        return prev.filter((selectedUid) => selectedUid !== uid);
      }

      return [...prev, uid];

    });
  }

  async function handleAddMembers() {

    if (!selectedRoom || inviteUserIds.length === 0) return;

    await addMembersToChatroom(selectedRoom.id, inviteUserIds);

    setInviteUserIds([]);

    alert("Members Added!");

  }

  async function handleSendMessage(e) {

    e.preventDefault();

    if (!selectedRoom || !messageText.trim()) return;

    await sendMessage(selectedRoom.id, currentUser, messageText);

    setMessageText("");

  }

  return (
    <main className="chat-app">

      <aside className="chat-sidebar">

        <section className="profile-panel">
          <div className="avatar">
            {currentUser.email?.charAt(0).toUpperCase()}
          </div>

          <div className="profile-text">
            <p className="profile-label">Signed in as</p>
            <h1>{currentUser.email}</h1>
          </div>

          <button className="ghost-button" onClick={handleLogout}>
            Logout
          </button>
        </section>

        <section className="room-list-panel">
          <div className="section-heading">
            <h2>My Chatrooms</h2>
            <span>{chatrooms.length}</span>
          </div>

          {
            chatrooms.length === 0 ? (
              <p className="empty-copy">
                No chatrooms yet. Create one and invite members to start.
              </p>
            ) : (
              <div className="room-list">
                {
                  chatrooms.map((room) => (
                    <button
                      className={`room-item ${selectedRoom?.id === room.id ? "active" : ""}`}
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                    >
                      <span className="room-avatar">
                        {room.name?.charAt(0).toUpperCase()}
                      </span>

                      <span className="room-meta">
                        <strong>{room.name}</strong>
                        <small>{room.lastMessage || "No messages yet"}</small>
                      </span>
                    </button>
                  ))
                }
              </div>
            )
          }
        </section>
      </aside>

      <section className="chat-main">
        {
          selectedRoom ? (
            <>
              <header className="chat-header">
                <div>
                  <p className="eyebrow">Current Chatroom</p>
                  <h2>{selectedRoom.name}</h2>
                </div>

                <span className="member-count">
                  {selectedRoom.members?.length || 0} members
                </span>
              </header>

              <div className="message-list">
                {
                  messages.length === 0 && (
                    <div className="center-empty">
                      <h3>No messages yet</h3>
                      <p>Send the first message to this chatroom.</p>
                    </div>
                  )
                }

                {
                  messages.map((message) => {
                    const isOwnMessage = message.senderId === currentUser.uid;

                    return (
                      <article
                        className={`message-row ${isOwnMessage ? "own" : ""}`}
                        key={message.id}
                      >
                        <div className="message-bubble">
                          <span className="message-sender">
                            {isOwnMessage ? "You" : message.senderEmail}
                          </span>
                          <p>{message.text}</p>
                        </div>
                      </article>
                    );
                  })
                }
              </div>

              <form className="message-form" onSubmit={handleSendMessage}>
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
            </>
          ) : (
            <div className="select-room-empty">
              <h2>Select a chatroom</h2>
              <p>Choose one of your chatrooms to load its message history.</p>
            </div>
          )
        }
      </section>

      <aside className="chat-tools">
        <section className="tool-panel">
          <div className="section-heading">
            <h2>Create Chatroom</h2>
          </div>

          <input
            className="room-name-input"
            type="text"
            placeholder="Room name"
            ref={roomNameRef}
          />

          <div className="member-picker">
            <h3>Add Members</h3>

            {
              users.length === 0 && (
                <p className="empty-copy">No other registered users found.</p>
              )
            }

            {
              users.map((user) => (
                <label className="member-option" key={user.uid}>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.uid)}
                    onChange={() => handleSelectUser(user.uid)}
                  />

                  <span>
                    <strong>{user.username}</strong>
                    <small>{user.email}</small>
                  </span>
                </label>
              ))
            }
          </div>

          <button className="primary-button" onClick={handleCreateRoom}>
            Create Chatroom
          </button>
        </section>

        <section className="tool-panel">
          <div className="section-heading">
            <h2>Room Members</h2>
          </div>

          {
            selectedRoom ? (
              <>
                <div className="member-list">
                  <div className="member-chip">
                    <span className="small-avatar">
                      {currentUser.email?.charAt(0).toUpperCase()}
                    </span>
                    <span>
                      <strong>You</strong>
                      <small>{currentUser.email}</small>
                    </span>
                  </div>

                  {
                    selectedRoomMembers.map((user) => (
                      <div className="member-chip" key={user.uid}>
                        <span className="small-avatar">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <strong>{user.username}</strong>
                          <small>{user.email}</small>
                        </span>
                      </div>
                    ))
                  }
                </div>

                <div className="invite-panel">
                  <h3>Add More Members</h3>

                  {
                    availableInviteUsers.length === 0 ? (
                      <p className="empty-copy">
                        All registered users are already in this room.
                      </p>
                    ) : (
                      <>
                        {
                          availableInviteUsers.map((user) => (
                            <label className="member-option" key={user.uid}>
                              <input
                                type="checkbox"
                                checked={inviteUserIds.includes(user.uid)}
                                onChange={() => handleSelectInviteUser(user.uid)}
                              />

                              <span>
                                <strong>{user.username}</strong>
                                <small>{user.email}</small>
                              </span>
                            </label>
                          ))
                        }

                        <button
                          className="secondary-button"
                          type="button"
                          onClick={handleAddMembers}
                          disabled={inviteUserIds.length === 0}
                        >
                          Add Members
                        </button>
                      </>
                    )
                  }
                </div>
              </>
            ) : (
              <p className="empty-copy">Select a chatroom to see members.</p>
            )
          }
        </section>
      </aside>
    </main>
  );
}
