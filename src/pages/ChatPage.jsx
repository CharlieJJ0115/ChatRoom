import { useEffect, useRef, useState } from "react";

import useAuth from "../hooks/useAuth";

import {
  addMembersToChatroom,
  createChatroom,
  editMessage,
  sendImageMessage,
  sendMessage,
  subscribeMessages,
  unsendMessage
} from "../firebase/chatroomService";

import {
  subscribeUsers,
  updateUserProfile
} from "../firebase/userService";

import useChatrooms from "../hooks/useChatrooms";

const emptyProfileForm = {
  photoURL: "",
  username: "",
  email: "",
  phoneNumber: "",
  address: ""
};

const maxImageSizeBytes = 750 * 1024;

export default function ChatPage() {

  const { currentUser, logout } = useAuth();

  const chatrooms = useChatrooms(currentUser?.uid);

  const [users, setUsers] = useState([]);

  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const [newRoomName, setNewRoomName] = useState("");

  const [inviteUserIds, setInviteUserIds] = useState([]);

  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [messageText, setMessageText] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const [editingMessageId, setEditingMessageId] = useState(null);

  const [editingMessageText, setEditingMessageText] = useState("");

  const [messageActionError, setMessageActionError] = useState("");

  const [isSendingImage, setIsSendingImage] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [profileForm, setProfileForm] = useState(emptyProfileForm);

  const [profileError, setProfileError] = useState("");

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [viewingProfileUser, setViewingProfileUser] = useState(null);

  const [viewingImageMessage, setViewingImageMessage] = useState(null);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);

  const messageRefs = useRef({});

  const imageInputRef = useRef();

  const profileImageInputRef = useRef();

  const selectedRoom = chatrooms.find((room) => room.id === selectedRoomId);

  const currentUserProfile = users.find((user) => user.uid === currentUser?.uid);

  const selectableUsers = users.filter((user) => user.uid !== currentUser?.uid);

  const validRoomMembers = selectedRoom
    ? users.filter((user) => selectedRoom.members?.includes(user.uid))
    : [];

  const selectedRoomMembers = selectedRoom
    ? selectableUsers.filter((user) => selectedRoom.members?.includes(user.uid))
    : [];

  const availableInviteUsers = selectedRoom
    ? selectableUsers.filter((user) => !selectedRoom.members?.includes(user.uid))
    : [];

  useEffect(() => {

    if (!currentUser) return;

    const unsubscribe = subscribeUsers(setUsers);

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

  function getProfileFallback() {

    const email = currentUserProfile?.email || currentUser.email || "";

    return {
      photoURL: currentUserProfile?.photoURL || "",
      username: currentUserProfile?.username || email.split("@")[0] || "",
      email,
      phoneNumber: currentUserProfile?.phoneNumber || "",
      address: currentUserProfile?.address || ""
    };
  }

  function getDisplayName(user) {

    return user?.username || user?.email || currentUser.email || "User";

  }

  function getUserById(uid) {

    if (uid === currentUser.uid) {
      return {
        uid: currentUser.uid,
        email: currentUserProfile?.email || currentUser.email,
        username: currentUserProfile?.username,
        photoURL: currentUserProfile?.photoURL,
        phoneNumber: currentUserProfile?.phoneNumber,
        address: currentUserProfile?.address
      };
    }

    return users.find((user) => user.uid === uid);

  }

  function renderAvatar(user, className = "small-avatar", options = {}) {

    const displayName = getDisplayName(user);

    const avatar = user?.photoURL ? (
        <img
          className={`${className} profile-image`}
          src={user.photoURL}
          alt={displayName}
        />
      ) : (
        <span className={className}>
          {displayName.charAt(0).toUpperCase()}
        </span>
      );

    if (!options.onClick) {
      return avatar;
    }

    return (
      <button
        className="avatar-button"
        type="button"
        aria-label={`View ${displayName} profile`}
        onClick={options.onClick}
      >
        {avatar}
      </button>
    );
  }

  async function handleLogout() {

    await logout();

  }

  function handleOpenProfile() {

    setProfileForm(getProfileFallback());

    setProfileError("");

    setIsProfileOpen(true);

  }

  function handleCloseProfile() {

    if (isSavingProfile) return;

    setIsProfileOpen(false);

    setProfileError("");

  }

  function handleOpenReadonlyProfile(user) {

    if (!user || user.uid === currentUser.uid) return;

    setViewingProfileUser(user);

  }

  function handleCloseReadonlyProfile() {

    setViewingProfileUser(null);

  }

  function handleOpenImagePreview(message) {

    if (!message?.imageData) return;

    setViewingImageMessage(message);

  }

  function handleCloseImagePreview() {

    setViewingImageMessage(null);

  }

  function handleOpenMembersModal() {

    if (!selectedRoom) return;

    setIsMembersModalOpen(true);

  }

  function handleCloseMembersModal() {

    setIsMembersModalOpen(false);

  }

  function handleOpenCreateRoomModal() {

    setIsCreateRoomModalOpen(true);

  }

  function handleCloseCreateRoomModal() {

    setIsCreateRoomModalOpen(false);

  }

  function handleOpenSearchPanel() {

    if (!selectedRoom) return;

    setIsSearchPanelOpen(true);

  }

  function handleCloseSearchPanel() {

    setIsSearchPanelOpen(false);

  }

  function handleJumpToMessage(messageId) {

    const messageElement = messageRefs.current[messageId];

    setIsSearchPanelOpen(false);

    setHighlightedMessageId(messageId);

    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    window.setTimeout(() => {
      setHighlightedMessageId((currentId) => (
        currentId === messageId ? null : currentId
      ));
    }, 2000);

  }

  function handleProfileChange(e) {

    const { name, value } = e.target;

    setProfileForm((prev) => ({
      ...prev,
      [name]: value
    }));

  }

  async function handleSelectProfileImage(e) {

    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please choose an image file.");
      return;
    }

    if (file.size > maxImageSizeBytes) {
      setProfileError("Image must be 750KB or smaller.");
      return;
    }

    try {
      const imageData = await readImageFile(file);

      setProfileForm((prev) => ({
        ...prev,
        photoURL: imageData
      }));

      setProfileError("");
    } catch (err) {
      setProfileError(err.message);
    }
  }

  async function handleSaveProfile(e) {

    e.preventDefault();

    const cleanedProfile = {
      photoURL: profileForm.photoURL.trim(),
      username: profileForm.username.trim(),
      email: profileForm.email.trim(),
      phoneNumber: profileForm.phoneNumber.trim(),
      address: profileForm.address.trim()
    };

    if (!cleanedProfile.email) {
      setProfileError("Email is required.");
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileError("");

      await updateUserProfile(currentUser.uid, cleanedProfile);

      setIsProfileOpen(false);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleCreateRoom() {

    const roomName = newRoomName.trim();

    if (!roomName) return;

    await createChatroom(
      roomName,
      currentUser.uid,
      selectedUserIds
    );

    setNewRoomName("");

    setSelectedUserIds([]);

    setIsCreateRoomModalOpen(false);

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

    setSearchQuery("");

    setIsSearchPanelOpen(false);

    setHighlightedMessageId(null);

    setEditingMessageId(null);

    setEditingMessageText("");

    setMessageActionError("");

  }

  function handleBackToRooms() {

    setMessages([]);

    setSelectedRoomId(null);

    setInviteUserIds([]);

    setSearchQuery("");

    setIsSearchPanelOpen(false);

    setHighlightedMessageId(null);

    setEditingMessageId(null);

    setEditingMessageText("");

    setMessageActionError("");

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

  function readImageFile(file) {

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function handleSendImageFile(file) {

    if (!selectedRoom || !file) return;

    if (!file.type.startsWith("image/")) {
      setMessageActionError("Please choose an image file.");
      return;
    }

    if (file.size > maxImageSizeBytes) {
      setMessageActionError("Image must be 750KB or smaller.");
      return;
    }

    try {
      setIsSendingImage(true);
      setMessageActionError("");

      const imageData = await readImageFile(file);

      await sendImageMessage(selectedRoom.id, currentUser, {
        imageData,
        imageName: file.name || "Pasted image",
        imageSize: file.size
      });
    } catch (err) {
      setMessageActionError(err.message);
    } finally {
      setIsSendingImage(false);
    }
  }

  function handleSelectImage(e) {

    const file = e.target.files?.[0];

    handleSendImageFile(file);

    e.target.value = "";

  }

  function handlePasteMessage(e) {

    const imageItem = Array.from(e.clipboardData?.items || [])
      .find((item) => item.type.startsWith("image/"));

    if (!imageItem) return;

    const file = imageItem.getAsFile();

    if (!file) return;

    e.preventDefault();

    handleSendImageFile(file);

  }

  function handleStartEditMessage(message) {

    setEditingMessageId(message.id);

    setEditingMessageText(message.text || "");

    setMessageActionError("");

  }

  function handleCancelEditMessage() {

    setEditingMessageId(null);

    setEditingMessageText("");

    setMessageActionError("");

  }

  async function handleSaveEditMessage(e, messageId) {

    e.preventDefault();

    if (!selectedRoom || !editingMessageText.trim()) {
      setMessageActionError("Message cannot be empty.");
      return;
    }

    try {
      setMessageActionError("");

      await editMessage(selectedRoom.id, messageId, editingMessageText);

      setEditingMessageId(null);

      setEditingMessageText("");
    } catch (err) {
      setMessageActionError(err.message);
    }
  }

  async function handleUnsendMessage(message) {

    if (!selectedRoom || !message || message.senderId !== currentUser.uid) return;

    const confirmed = window.confirm("Unsend this message?");

    if (!confirmed) return;

    try {
      setMessageActionError("");

      await unsendMessage(selectedRoom.id, message.id);

      if (editingMessageId === message.id) {
        setEditingMessageId(null);
        setEditingMessageText("");
      }
    } catch (err) {
      setMessageActionError(err.message);
    }
  }

  const currentDisplayProfile = getUserById(currentUser.uid);

  const visibleMemberCount = selectedRoom ? validRoomMembers.length : 0;

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const searchResults = normalizedSearchQuery
    ? messages.filter((message) => {
        if (message.isUnsent) return false;

        const sender = getUserById(message.senderId) || {
          email: message.senderEmail,
          username: message.senderEmail
        };

        const searchableText = [
          message.text,
          message.type === "image" ? "Image message" : "",
          getDisplayName(sender),
          sender?.email
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearchQuery);
      })
    : [];

  return (
    <main className={`chat-app ${selectedRoom ? "mobile-room-open" : "mobile-room-list"}`}>

      <aside className="chat-sidebar">

        <section className="profile-panel">
          {renderAvatar(currentDisplayProfile, "avatar")}

          <div className="profile-text">
            <p className="profile-label">Signed in as</p>
            <h1>{getDisplayName(currentDisplayProfile)}</h1>
            <small>{currentDisplayProfile.email}</small>
          </div>

          <div className="profile-actions">
            <button className="ghost-button" type="button" onClick={handleOpenProfile}>
              Edit Profile
            </button>

            <button className="ghost-button" type="button" onClick={handleLogout}>
              Logout
            </button>

            <button
              className="create-room-trigger"
              type="button"
              onClick={handleOpenCreateRoomModal}
            >
              Create Chatroom
            </button>
          </div>
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
                  <button
                    className="mobile-back-button"
                    type="button"
                    onClick={handleBackToRooms}
                  >
                    Back to Chatrooms
                  </button>

                  <p className="eyebrow">Current Chatroom</p>
                  <h2>{selectedRoom.name}</h2>
                </div>

                <div className="chat-header-actions">
                  <button
                    className="header-action-button"
                    type="button"
                    onClick={handleOpenSearchPanel}
                  >
                    Search
                  </button>

                  <button
                    className="member-count-button"
                    type="button"
                    onClick={handleOpenMembersModal}
                  >
                    {visibleMemberCount} members
                  </button>
                </div>
              </header>

              <div className="message-list">
                {messageActionError && <p className="form-error">{messageActionError}</p>}

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
                    const sender = getUserById(message.senderId) || {
                      email: message.senderEmail,
                      username: message.senderEmail
                    };
                    const isOwnMessage = message.senderId === currentUser.uid;
                    const canEditMessage = isOwnMessage && !message.isUnsent && message.type === "text";
                    const canUnsendMessage = isOwnMessage && !message.isUnsent;

                    return (
                      <article
                        className={`message-row ${isOwnMessage ? "own" : ""} ${message.type === "image" && !message.isUnsent ? "image-message-row" : ""} ${highlightedMessageId === message.id ? "highlighted" : ""}`}
                        key={message.id}
                        ref={(element) => {
                          if (element) {
                            messageRefs.current[message.id] = element;
                          }
                        }}
                      >
                        {renderAvatar(sender, "small-avatar", {
                          onClick: isOwnMessage ? null : () => handleOpenReadonlyProfile(sender)
                        })}

                        <div className={`message-bubble ${message.type === "image" && !message.isUnsent ? "image-message-bubble" : ""}`}>
                          <span className="message-sender">
                            {getDisplayName(sender)}
                          </span>

                          {
                            message.isUnsent ? (
                              <p className="message-unsent">This message was unsent.</p>
                            ) : message.type === "image" ? (
                              <button
                                className="message-image-button"
                                type="button"
                                onClick={() => handleOpenImagePreview(message)}
                              >
                                <img
                                  className="message-image"
                                  src={message.imageData}
                                  alt={message.imageName || "Sent image"}
                                />
                              </button>
                            ) : editingMessageId === message.id ? (
                              <form
                                className="edit-message-form"
                                onSubmit={(e) => handleSaveEditMessage(e, message.id)}
                              >
                                <input
                                  type="text"
                                  value={editingMessageText}
                                  onChange={(e) => setEditingMessageText(e.target.value)}
                                  autoFocus
                                />

                                <div className="edit-message-actions">
                                  <button type="submit">Save</button>
                                  <button type="button" onClick={handleCancelEditMessage}>
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <p>{message.text}</p>
                            )
                          }

                          {
                            canUnsendMessage && editingMessageId !== message.id && (
                              <div className="message-actions">
                                {
                                  canEditMessage && (
                                    <button type="button" onClick={() => handleStartEditMessage(message)}>
                                      Edit
                                    </button>
                                  )
                                }

                                <button type="button" onClick={() => handleUnsendMessage(message)}>
                                  Unsend
                                </button>
                              </div>
                            )
                          }
                        </div>
                      </article>
                    );
                  })
                }
              </div>

              <form className="message-form" onSubmit={handleSendMessage}>
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={handleSelectImage}
                  hidden
                />

                <button
                  className="image-upload-button"
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isSendingImage}
                >
                  {isSendingImage ? "Uploading..." : "Image"}
                </button>

                <input
                  type="text"
                  placeholder="Type a message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onPaste={handlePasteMessage}
                  disabled={isSendingImage}
                />

                <button type="submit" disabled={isSendingImage}>
                  Send
                </button>
              </form>

              {
                isSearchPanelOpen && (
                  <aside className="search-panel" aria-label="Search messages">
                    <div className="search-panel-header">
                      <div>
                        <p className="eyebrow">Search</p>
                        <h3>Messages</h3>
                      </div>

                      <button className="modal-close" type="button" onClick={handleCloseSearchPanel}>
                        Close
                      </button>
                    </div>

                    <div className="search-panel-input">
                      <input
                        type="search"
                        placeholder="Search messages"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />

                      {searchQuery && (
                        <button type="button" onClick={() => setSearchQuery("")}>
                          Clear
                        </button>
                      )}
                    </div>

                    <p className="search-result-count">
                      {normalizedSearchQuery ? `${searchResults.length} results` : "Type to search this chatroom"}
                    </p>

                    <div className="search-result-list">
                      {
                        normalizedSearchQuery && searchResults.length === 0 && (
                          <p className="empty-copy">No matching messages found.</p>
                        )
                      }

                      {
                        searchResults.map((message) => {
                          const sender = getUserById(message.senderId) || {
                            email: message.senderEmail,
                            username: message.senderEmail
                          };

                          return (
                            <button
                              className="search-result-item"
                              type="button"
                              key={message.id}
                              onClick={() => handleJumpToMessage(message.id)}
                            >
                              {renderAvatar(sender)}

                              <span>
                                <strong>{getDisplayName(sender)}</strong>
                                <small>{message.type === "image" ? "Image message" : message.text}</small>
                              </span>
                            </button>
                          );
                        })
                      }
                    </div>
                  </aside>
                )
              }
            </>
          ) : (
            <div className="select-room-empty">
              <h2>Select a chatroom</h2>
              <p>Choose one of your chatrooms to load its message history.</p>
            </div>
          )
        }
      </section>

      {
        isCreateRoomModalOpen && (
          <div className="modal-backdrop" role="presentation" onMouseDown={handleCloseCreateRoomModal}>
            <section
              className="profile-modal create-room-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-room-modal-title"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <p className="eyebrow">New Chatroom</p>
                  <h2 id="create-room-modal-title">Create Chatroom</h2>
                </div>

                <button className="modal-close" type="button" onClick={handleCloseCreateRoomModal}>
                  Close
                </button>
              </div>

              <div className="create-room-modal-body">
                <input
                  className="room-name-input"
                  type="text"
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />

                <div className="member-picker create-room-member-picker">
                  <h3>Add Members</h3>

                  {
                    selectableUsers.length === 0 && (
                      <p className="empty-copy">No other registered users found.</p>
                    )
                  }

                  {
                    selectableUsers.map((user) => (
                      <label className="member-option" key={user.uid}>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.uid)}
                          onChange={() => handleSelectUser(user.uid)}
                        />

                        {renderAvatar(user)}

                        <span>
                          <strong>{getDisplayName(user)}</strong>
                          <small>{user.email}</small>
                        </span>
                      </label>
                    ))
                  }
                </div>

                <button className="primary-button" onClick={handleCreateRoom}>
                  Create Chatroom
                </button>
              </div>
            </section>
          </div>
        )
      }

      {
        isProfileOpen && (
          <div className="modal-backdrop" role="presentation" onMouseDown={handleCloseProfile}>
            <section
              className="profile-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-modal-title"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <p className="eyebrow">User Profile</p>
                  <h2 id="profile-modal-title">Edit profile</h2>
                </div>

                <button className="modal-close" type="button" onClick={handleCloseProfile}>
                  Close
                </button>
              </div>

              <div className="profile-preview">
                {renderAvatar(profileForm, "avatar profile-preview-avatar")}
                <div>
                  <strong>{profileForm.username || profileForm.email || "User"}</strong>
                  <small>{profileForm.email || "Profile email"}</small>
                </div>
              </div>

              {profileError && <p className="form-error">{profileError}</p>}

              <form className="profile-form" onSubmit={handleSaveProfile}>
                <input
                  type="file"
                  accept="image/*"
                  ref={profileImageInputRef}
                  onChange={handleSelectProfileImage}
                  hidden
                />

                <div className="profile-upload-row">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => profileImageInputRef.current?.click()}
                  >
                    Upload Image
                  </button>

                  <span>Image file, max 750KB</span>
                </div>

                <label className="field-group">
                  <span>Profile picture URL</span>
                  <input
                    type="url"
                    name="photoURL"
                    placeholder="https://example.com/avatar.png"
                    value={profileForm.photoURL}
                    onChange={handleProfileChange}
                  />
                </label>

                <label className="field-group">
                  <span>Username</span>
                  <input
                    type="text"
                    name="username"
                    placeholder="Your display name"
                    value={profileForm.username}
                    onChange={handleProfileChange}
                  />
                </label>

                <label className="field-group">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    required
                  />
                </label>

                <label className="field-group">
                  <span>Phone number</span>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Phone number"
                    value={profileForm.phoneNumber}
                    onChange={handleProfileChange}
                  />
                </label>

                <label className="field-group">
                  <span>Address</span>
                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                  />
                </label>

                <div className="modal-actions">
                  <button className="secondary-button" type="button" onClick={handleCloseProfile}>
                    Cancel
                  </button>

                  <button className="primary-button" type="submit" disabled={isSavingProfile}>
                    {isSavingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )
      }

      {
        isMembersModalOpen && selectedRoom && (
          <div className="modal-backdrop" role="presentation" onMouseDown={handleCloseMembersModal}>
            <section
              className="profile-modal members-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="members-modal-title"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <p className="eyebrow">Current Chatroom</p>
                  <h2 id="members-modal-title">Room Members</h2>
                </div>

                <button className="modal-close" type="button" onClick={handleCloseMembersModal}>
                  Close
                </button>
              </div>

              <div className="members-modal-body">
                <div className="member-list members-modal-list">
                  {
                    currentUserProfile && (
                      <div className="member-chip">
                        {renderAvatar(currentDisplayProfile)}
                        <span>
                          <strong>{getDisplayName(currentDisplayProfile)}</strong>
                          <small>{currentDisplayProfile.email}</small>
                        </span>
                      </div>
                    )
                  }

                  {
                    selectedRoomMembers.map((user) => (
                      <div className="member-chip" key={user.uid}>
                        {renderAvatar(user, "small-avatar", {
                          onClick: () => handleOpenReadonlyProfile(user)
                        })}
                        <span>
                          <strong>{getDisplayName(user)}</strong>
                          <small>{user.email}</small>
                        </span>
                      </div>
                    ))
                  }
                </div>

                <div className="invite-panel members-modal-invite">
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

                              {renderAvatar(user)}

                              <span>
                                <strong>{getDisplayName(user)}</strong>
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
              </div>
            </section>
          </div>
        )
      }

      {
        viewingProfileUser && (
          <div className="modal-backdrop" role="presentation" onMouseDown={handleCloseReadonlyProfile}>
            <section
              className="profile-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="readonly-profile-title"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <p className="eyebrow">Member Profile</p>
                  <h2 id="readonly-profile-title">View profile</h2>
                </div>

                <button className="modal-close" type="button" onClick={handleCloseReadonlyProfile}>
                  Close
                </button>
              </div>

              <div className="profile-preview readonly-profile-hero">
                {renderAvatar(viewingProfileUser, "avatar profile-preview-avatar")}
                <div>
                  <strong>{getDisplayName(viewingProfileUser)}</strong>
                  <small>{viewingProfileUser.email || "Not provided"}</small>
                </div>
              </div>

              <div className="readonly-profile-details">
                <div className="profile-detail-row">
                  <span>Username</span>
                  <strong>{viewingProfileUser.username || "Not provided"}</strong>
                </div>

                <div className="profile-detail-row">
                  <span>Email</span>
                  <strong>{viewingProfileUser.email || "Not provided"}</strong>
                </div>

                <div className="profile-detail-row">
                  <span>Phone number</span>
                  <strong>{viewingProfileUser.phoneNumber || "Not provided"}</strong>
                </div>

                <div className="profile-detail-row">
                  <span>Address</span>
                  <strong>{viewingProfileUser.address || "Not provided"}</strong>
                </div>
              </div>
            </section>
          </div>
        )
      }

      {
        viewingImageMessage && (
          <div
            className="image-preview-backdrop"
            role="presentation"
            onMouseDown={handleCloseImagePreview}
          >
            <section
              className="image-preview-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Image preview"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="image-preview-actions">
                <a
                  href={viewingImageMessage.imageData}
                  download={viewingImageMessage.imageName || "chatroom-image.png"}
                >
                  Download
                </a>

                <button type="button" onClick={handleCloseImagePreview}>
                  Close
                </button>
              </div>

              <img
                className="image-preview-image"
                src={viewingImageMessage.imageData}
                alt={viewingImageMessage.imageName || "Sent image"}
              />
            </section>
          </div>
        )
      }
    </main>
  );
}
