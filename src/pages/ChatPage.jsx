import { useEffect, useRef, useState } from "react";

import useAuth from "../hooks/useAuth";

import {
  addMembersToChatroom,
  createChatroom,
  createPrivateChatroom,
  editMessage,
  markChatroomRead,
  removeMessageReaction,
  sendImageMessage,
  sendMessage,
  setMessageReaction,
  subscribeMessages,
  unsendMessage,
  updateChatroomProfile
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

const emptyRoomSettingsForm = {
  name: "",
  photoURL: ""
};

const maxImageSizeBytes = 750 * 1024;

const availableReactionEmojis = ["👍", "❤️", "😂", "😮", "😢"];

function getBrowserNotificationPermission() {

  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;

}

export default function ChatPage() {

  const { currentUser, logout } = useAuth();

  const chatrooms = useChatrooms(currentUser?.uid);

  const [users, setUsers] = useState([]);

  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const [newRoomName, setNewRoomName] = useState("");

  const [newRoomType, setNewRoomType] = useState("group");

  const [privateUserId, setPrivateUserId] = useState("");

  const [createRoomError, setCreateRoomError] = useState("");

  const [inviteUserIds, setInviteUserIds] = useState([]);

  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [messageText, setMessageText] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const [editingMessageId, setEditingMessageId] = useState(null);

  const [editingMessageText, setEditingMessageText] = useState("");

  const [messageActionError, setMessageActionError] = useState("");

  const [replyingToMessage, setReplyingToMessage] = useState(null);

  const [openEmojiMessageId, setOpenEmojiMessageId] = useState(null);

  const [openMoreMessageId, setOpenMoreMessageId] = useState(null);

  const [isSendingImage, setIsSendingImage] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [profileForm, setProfileForm] = useState(emptyProfileForm);

  const [profileError, setProfileError] = useState("");

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);

  const [roomSettingsForm, setRoomSettingsForm] = useState(emptyRoomSettingsForm);

  const [roomSettingsError, setRoomSettingsError] = useState("");

  const [isSavingRoomSettings, setIsSavingRoomSettings] = useState(false);

  const [viewingProfileUser, setViewingProfileUser] = useState(null);

  const [viewingImageMessage, setViewingImageMessage] = useState(null);

  const [viewingReactions, setViewingReactions] = useState(null);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState(
    getBrowserNotificationPermission
  );

  const messageRefs = useRef({});

  const chatHeaderRef = useRef();

  const messageListRef = useRef();

  const shouldScrollToBottomOnLoadRef = useRef(false);

  const isSettlingInitialScrollRef = useRef(false);

  const roomNotificationActivityRef = useRef({});

  const hasSeededNotificationActivityRef = useRef(false);

  const selectedRoomIdRef = useRef(null);

  const imageInputRef = useRef();

  const profileImageInputRef = useRef();

  const roomPictureInputRef = useRef();

  const selectedRoom = chatrooms.find((room) => room.id === selectedRoomId);

  const viewingReactionMessage = viewingReactions
    ? messages.find((message) => message.id === viewingReactions.messageId)
    : null;

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

    roomNotificationActivityRef.current = {};
    hasSeededNotificationActivityRef.current = false;

  }, [currentUser?.uid]);

  useEffect(() => {

    selectedRoomIdRef.current = selectedRoomId;

  }, [selectedRoomId]);

  useEffect(() => {

    function syncNotificationPermission() {

      setNotificationPermission(getBrowserNotificationPermission());

    }

    syncNotificationPermission();

    window.addEventListener("focus", syncNotificationPermission);
    document.addEventListener("visibilitychange", syncNotificationPermission);

    return () => {
      window.removeEventListener("focus", syncNotificationPermission);
      document.removeEventListener("visibilitychange", syncNotificationPermission);
    };

  }, []);

  useEffect(() => {

    if (!selectedRoomId) {
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);

    setMessages([]);

    const unsubscribe = subscribeMessages(
      selectedRoomId,
      (nextMessages) => {
        setMessages(nextMessages);
        setIsLoadingMessages(false);
      },
      (error) => {
        setMessageActionError(error.message);
        setIsLoadingMessages(false);
      }
    );

    return unsubscribe;

  }, [selectedRoomId]);

  useEffect(() => {

    if (!selectedRoomId || !shouldScrollToBottomOnLoadRef.current) return;

    isSettlingInitialScrollRef.current = true;

    jumpMessagesToBottom({
      retries: 4,
      interval: 120
    });

    window.setTimeout(() => {
      isSettlingInitialScrollRef.current = false;
    }, 800);

    shouldScrollToBottomOnLoadRef.current = false;

  }, [messages.length, selectedRoomId]);

  useEffect(() => {

    if (!currentUser) return;

    const nextActivity = {};

    chatrooms.forEach((room) => {
      nextActivity[room.id] = getTimestampMillis(room.lastMessageAt);
    });

    if (!hasSeededNotificationActivityRef.current) {
      roomNotificationActivityRef.current = nextActivity;
      hasSeededNotificationActivityRef.current = true;
      return;
    }

    chatrooms.forEach((room) => {
      const latestMessageTime = nextActivity[room.id];
      const previousMessageTime = roomNotificationActivityRef.current[room.id] || 0;

      roomNotificationActivityRef.current[room.id] = latestMessageTime;

      if (!latestMessageTime || latestMessageTime <= previousMessageTime) return;
      if (!previousMessageTime) return;
      if (room.lastMessageSenderId === currentUser.uid) return;
      if (
        room.id === selectedRoomIdRef.current &&
        document.visibilityState === "visible"
      ) return;

      showIncomingMessageNotification(room);
    });

  }, [chatrooms, currentUser]);

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

  function getSenderDisplayName(senderId, senderEmail) {

    if (senderId === currentUser.uid) {
      return "You";
    }

    const sender = getUserById(senderId);

    if (sender) {
      return getDisplayName(sender);
    }

    return senderEmail?.split("@")[0] || "Someone";

  }

  function getReplyPreviewText(message) {

    if (!message) return "";

    if (message.type === "image") {
      return "Image message";
    }

    if (message.isUnsent) {
      return "This message was unsent.";
    }

    return message.text || "Message";

  }

  function getReplySnapshot(message) {

    const sender = getUserById(message.senderId) || {
      email: message.senderEmail,
      username: message.senderEmail
    };

    return {
      messageId: message.id,
      senderId: message.senderId,
      senderEmail: message.senderEmail,
      senderName: getDisplayName(sender),
      text: getReplyPreviewText(message),
      type: message.type || "text"
    };

  }

  function getReplySenderName(replyTo) {

    if (!replyTo) return "Someone";

    const sender = getUserById(replyTo.senderId);

    if (sender) {
      return getDisplayName(sender);
    }

    return replyTo.senderName || replyTo.senderEmail?.split("@")[0] || "Someone";

  }

  function isPrivateRoom(room) {

    return room?.type === "private";

  }

  function getPrivateRoomKey(uidA, uidB) {

    if (!uidA || !uidB) return "";

    return [uidA, uidB].sort().join("_");

  }

  function findExistingPrivateRoom(targetUid) {

    const privateKey = getPrivateRoomKey(currentUser?.uid, targetUid);

    if (!privateKey) return null;

    return chatrooms.find((room) => (
      isPrivateRoom(room) && room.privateKey === privateKey
    )) || null;

  }

  function getPrivateRoomPartner(room) {

    if (!isPrivateRoom(room) || !currentUser?.uid) return null;

    const partnerUid = room.members?.find((uid) => uid !== currentUser.uid);

    if (!partnerUid) return null;

    return getUserById(partnerUid) || {
      uid: partnerUid,
      username: "Private Chat",
      email: "",
      photoURL: ""
    };

  }

  function getRoomDisplayProfile(room) {

    if (isPrivateRoom(room)) {
      return getPrivateRoomPartner(room) || {
        username: "Private Chat",
        email: "",
        photoURL: ""
      };
    }

    return {
      username: room?.name || "Chatroom",
      email: "",
      photoURL: room?.photoURL || ""
    };

  }

  function getRoomDisplayName(room) {

    const roomProfile = getRoomDisplayProfile(room);

    return getDisplayName(roomProfile);

  }

  function getRoomDisplayPhotoURL(room) {

    return getRoomDisplayProfile(room)?.photoURL || "";

  }

  function getRoomPreview(room) {

    if (!room?.lastMessageSenderId) {
      return room?.lastMessage || "No messages yet";
    }

    const senderName = getSenderDisplayName(
      room.lastMessageSenderId,
      room.lastMessageSenderEmail
    );

    if (room.lastMessageType === "image") {
      return room.lastMessageSenderId === currentUser.uid
        ? "You sent an image"
        : `${senderName} sent an image`;
    }

    const messageText = room.lastMessageText || room.lastMessage || "";

    if (!messageText) {
      return "No messages yet";
    }

    return `${senderName}: ${messageText}`;

  }

  function getNotificationButtonLabel() {

    if (notificationPermission === "unsupported") {
      return "Notifications Unsupported";
    }

    if (notificationPermission === "granted") {
      return "Notifications Enabled";
    }

    if (notificationPermission === "denied") {
      return "Notifications Blocked";
    }

    return "Enable Notifications";

  }

  async function handleRequestNotifications() {

    if (getBrowserNotificationPermission() === "unsupported") {
      setNotificationPermission("unsupported");
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      setNotificationPermission(permission);
    } catch {
      setNotificationPermission(getBrowserNotificationPermission());
    }

  }

  function showIncomingMessageNotification(room) {

    if (getBrowserNotificationPermission() !== "granted") return;

    const senderName = getSenderDisplayName(
      room.lastMessageSenderId,
      room.lastMessageSenderEmail
    );

    const body = room.lastMessageType === "image"
      ? `${senderName} sent an image`
      : `${senderName}: ${room.lastMessageText || room.lastMessage || "New message"}`;

    const notification = new Notification(getRoomDisplayName(room), {
      body,
      icon: "/favicon.svg",
      tag: `chatroom-${room.id}`
    });

    notification.onclick = () => {
      window.focus();
      handleSelectRoom(room);
      notification.close();
    };

  }

  function getMessageReactionEntries(message) {

    return Object.entries(message?.reactions || {})
      .filter(([, emoji]) => availableReactionEmojis.includes(emoji))
      .map(([uid, emoji]) => ({
        uid,
        emoji,
        user: getUserById(uid) || {
          uid,
          email: "Unknown user",
          username: "Unknown user",
          photoURL: ""
        }
      }));

  }

  function getReactionCounts(message) {

    const reactionEntries = getMessageReactionEntries(message);

    return availableReactionEmojis
      .map((emoji) => ({
        emoji,
        count: reactionEntries.filter((reaction) => reaction.emoji === emoji).length
      }))
      .filter((reactionCount) => reactionCount.count > 0);

  }

  function getFilteredReactionEntries(message, activeEmoji) {

    const reactionEntries = getMessageReactionEntries(message);

    if (!activeEmoji || activeEmoji === "all") {
      return reactionEntries;
    }

    return reactionEntries.filter((reaction) => reaction.emoji === activeEmoji);

  }

  async function handleToggleReaction(message, emoji) {

    if (!selectedRoom || !message || message.isUnsent) return;

    try {
      setMessageActionError("");

      if (message.reactions?.[currentUser.uid] === emoji) {
        await removeMessageReaction(selectedRoom.id, message.id, currentUser.uid);
        setOpenEmojiMessageId(null);
        return;
      }

      await setMessageReaction(selectedRoom.id, message.id, currentUser.uid, emoji);
      setOpenEmojiMessageId(null);
    } catch (err) {
      setMessageActionError(err.message);
    }

  }

  function handleToggleEmojiPicker(messageId) {

    setOpenMoreMessageId(null);

    setOpenEmojiMessageId((currentMessageId) => (
      currentMessageId === messageId ? null : messageId
    ));

  }

  function handleToggleMoreActions(messageId) {

    setOpenEmojiMessageId(null);

    setOpenMoreMessageId((currentMessageId) => (
      currentMessageId === messageId ? null : messageId
    ));

  }

  function handleOpenReactions(message) {

    if (getMessageReactionEntries(message).length === 0) return;

    setViewingReactions({
      messageId: message.id,
      activeEmoji: "all"
    });

  }

  function handleCloseReactions() {

    setViewingReactions(null);

  }

  function handleSelectReactionFilter(activeEmoji) {

    setViewingReactions((currentReactions) => (
      currentReactions
        ? {
            ...currentReactions,
            activeEmoji
          }
        : currentReactions
    ));

  }

  function isRoomUnread(room) {

    if (!room?.lastMessageSenderId || room.lastMessageSenderId === currentUser.uid) {
      return false;
    }

    const lastMessageTime = getTimestampMillis(room.lastMessageAt || room.updatedAt);

    if (!lastMessageTime) return false;

    const readTime = getTimestampMillis(room.readBy?.[currentUser.uid]);

    return !readTime || lastMessageTime > readTime;

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

  function renderRoomAvatar(room, className = "room-avatar") {

    const roomName = getRoomDisplayName(room);

    const roomPhotoURL = getRoomDisplayPhotoURL(room);

    return roomPhotoURL ? (
      <img
        className={`${className} profile-image`}
        src={roomPhotoURL}
        alt={roomName}
      />
    ) : (
      <span className={className}>
        {roomName.charAt(0).toUpperCase()}
      </span>
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

  function handleOpenRoomSettings() {

    if (!selectedRoom) return;

    setRoomSettingsForm({
      name: selectedRoom.name || "",
      photoURL: selectedRoom.photoURL || ""
    });

    setRoomSettingsError("");

    setIsRoomSettingsOpen(true);

  }

  function handleCloseRoomSettings() {

    if (isSavingRoomSettings) return;

    setIsRoomSettingsOpen(false);

    setRoomSettingsError("");

  }

  function handleRoomSettingsChange(e) {

    const { name, value } = e.target;

    setRoomSettingsForm((prev) => ({
      ...prev,
      [name]: value
    }));

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

  function scrollChatHeaderIntoView() {

    window.setTimeout(() => {
      chatHeaderRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 150);

  }

  function jumpMessagesToBottom(options = {}) {

    const {
      retries = 1,
      interval = 100
    } = options;

    function jump(remainingRetries) {

      const messageListElement = messageListRef.current;

      if (messageListElement) {
        messageListElement.scrollTop = messageListElement.scrollHeight;
      }

      if (remainingRetries <= 1) return;

      window.setTimeout(() => {
        jump(remainingRetries - 1);
      }, interval);

    }

    window.setTimeout(() => {
      jump(retries);
    }, interval);

  }

  function handleOpenMembersModal() {

    if (!selectedRoom) return;

    setIsMembersModalOpen(true);

  }

  function handleCloseMembersModal() {

    setIsMembersModalOpen(false);

  }

  function handleOpenCreateRoomModal() {

    setNewRoomType("group");
    setNewRoomName("");
    setSelectedUserIds([]);
    setPrivateUserId("");
    setCreateRoomError("");

    setIsCreateRoomModalOpen(true);

  }

  function handleCloseCreateRoomModal() {

    setIsCreateRoomModalOpen(false);
    setCreateRoomError("");
    setNewRoomName("");
    setNewRoomType("group");
    setPrivateUserId("");
    setSelectedUserIds([]);

  }

  function handleSelectNewRoomType(roomType) {

    setNewRoomType(roomType);
    setCreateRoomError("");

    if (roomType === "group") {
      setPrivateUserId("");
      return;
    }

    setSelectedUserIds([]);
    setNewRoomName("");

  }

  function handleOpenSearchPanel() {

    if (!selectedRoom) return;

    setIsSearchPanelOpen(true);

  }

  function handleOpenSearchFromSettings() {

    setIsRoomSettingsOpen(false);

    handleOpenSearchPanel();

  }

  function handleOpenMembersFromSettings() {

    setIsRoomSettingsOpen(false);

    handleOpenMembersModal();

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

  function handleMessageImageLoad() {

    if (!isSettlingInitialScrollRef.current || highlightedMessageId) return;

    jumpMessagesToBottom({
      retries: 1,
      interval: 0
    });

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

  async function handleSelectRoomPicture(e) {

    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setRoomSettingsError("Please choose an image file.");
      return;
    }

    if (file.size > maxImageSizeBytes) {
      setRoomSettingsError("Image must be 750KB or smaller.");
      return;
    }

    try {
      const imageData = await readImageFile(file);

      setRoomSettingsForm((prev) => ({
        ...prev,
        photoURL: imageData
      }));

      setRoomSettingsError("");
    } catch (err) {
      setRoomSettingsError(err.message);
    }
  }

  async function handleSaveRoomSettings(e) {

    e.preventDefault();

    const cleanedSettings = {
      name: roomSettingsForm.name.trim(),
      photoURL: roomSettingsForm.photoURL.trim()
    };

    if (!selectedRoom || !cleanedSettings.name) {
      setRoomSettingsError("Room name is required.");
      return;
    }

    try {
      setIsSavingRoomSettings(true);
      setRoomSettingsError("");

      await updateChatroomProfile(selectedRoom.id, cleanedSettings);

      setIsRoomSettingsOpen(false);
    } catch (err) {
      setRoomSettingsError(err.message);
    } finally {
      setIsSavingRoomSettings(false);
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

    try {
      setCreateRoomError("");

      if (newRoomType === "private") {
        if (!privateUserId) {
          setCreateRoomError("Please select one user for private chat.");
          return;
        }

        const existingPrivateRoom = findExistingPrivateRoom(privateUserId);

        if (existingPrivateRoom) {
          setSelectedRoomId(existingPrivateRoom.id);
          setPrivateUserId("");
          setSelectedUserIds([]);
          setNewRoomName("");
          setIsCreateRoomModalOpen(false);
          return;
        }

        const roomId = await createPrivateChatroom(currentUser.uid, privateUserId);

        if (roomId) {
          setSelectedRoomId(roomId);
        }

        setPrivateUserId("");
        setSelectedUserIds([]);
        setNewRoomName("");
        setIsCreateRoomModalOpen(false);
        return;
      }

      const roomName = newRoomName.trim();

      if (!roomName) {
        setCreateRoomError("Room name is required.");
        return;
      }

      const roomId = await createChatroom(
        roomName,
        currentUser.uid,
        selectedUserIds
      );

      if (roomId) {
        setSelectedRoomId(roomId);
      }

      setNewRoomName("");
      setSelectedUserIds([]);
      setPrivateUserId("");
      setIsCreateRoomModalOpen(false);
    } catch (err) {
      setCreateRoomError(err.message);
    }

  }

  function handleSelectUser(uid) {

    setSelectedUserIds((prev) => {

      if (prev.includes(uid)) {
        return prev.filter((selectedUid) => selectedUid !== uid);
      }

      return [...prev, uid];

    });
  }

  async function handleSelectRoom(room) {

    const isSameRoom = room.id === selectedRoomId;

    if (isSameRoom) {
      setInviteUserIds([]);

      setSearchQuery("");

      setIsSearchPanelOpen(false);

      setHighlightedMessageId(null);

      setEditingMessageId(null);

      setEditingMessageText("");

      setReplyingToMessage(null);

      setOpenEmojiMessageId(null);

      setOpenMoreMessageId(null);

      setMessageActionError("");

      try {
        await markChatroomRead(room.id, currentUser.uid);
      } catch (err) {
        setMessageActionError(err.message);
      }

      return;
    }

    shouldScrollToBottomOnLoadRef.current = true;

    setMessages([]);

    setSelectedRoomId(room.id);

    setInviteUserIds([]);

    setSearchQuery("");

    setIsSearchPanelOpen(false);

    setHighlightedMessageId(null);

    setEditingMessageId(null);

    setEditingMessageText("");

    setReplyingToMessage(null);

    setOpenEmojiMessageId(null);

    setOpenMoreMessageId(null);

    setMessageActionError("");

    try {
      await markChatroomRead(room.id, currentUser.uid);
    } catch (err) {
      setMessageActionError(err.message);
    }

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

    setReplyingToMessage(null);

    setOpenEmojiMessageId(null);

    setOpenMoreMessageId(null);

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

    const replyTo = replyingToMessage
      ? getReplySnapshot(replyingToMessage)
      : null;

    await sendMessage(selectedRoom.id, currentUser, messageText, replyTo);

    setMessageText("");

    setReplyingToMessage(null);

    jumpMessagesToBottom({
      retries: 2,
      interval: 80
    });

  }

  function handleStartReply(message) {

    if (!message || message.isUnsent) return;

    setReplyingToMessage(message);

    setOpenEmojiMessageId(null);

    setOpenMoreMessageId(null);

    setMessageActionError("");

  }

  function handleCancelReply() {

    setReplyingToMessage(null);

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

      setReplyingToMessage(null);
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

    setOpenEmojiMessageId(null);

    setOpenMoreMessageId(null);

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

      setOpenEmojiMessageId(null);

      setOpenMoreMessageId(null);

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

  const isSelectedRoomPrivate = isPrivateRoom(selectedRoom);

  const selectedRoomPartner = getPrivateRoomPartner(selectedRoom);

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
              className="ghost-button notification-button"
              type="button"
              onClick={handleRequestNotifications}
              disabled={notificationPermission !== "default"}
            >
              {getNotificationButtonLabel()}
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
                      className={`room-item ${selectedRoom?.id === room.id ? "active" : ""} ${isRoomUnread(room) ? "unread" : ""}`}
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                    >
                      {renderRoomAvatar(room)}

                      <span className="room-meta">
                        <strong>{getRoomDisplayName(room)}</strong>
                        <small>{getRoomPreview(room)}</small>
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
              <header className="chat-header" ref={chatHeaderRef}>
                <div className="chat-title-group">
                  <div className="mobile-chat-title-row">
                    <button
                      className="mobile-back-button"
                      type="button"
                      onClick={handleBackToRooms}
                    >
                      Back
                    </button>

                    <h2>{getRoomDisplayName(selectedRoom)}</h2>
                  </div>

                  <button
                    className="mobile-back-button"
                    type="button"
                    onClick={handleBackToRooms}
                  >
                    Back to Chatrooms
                  </button>

                  <p className="eyebrow">Current Chatroom</p>
                  <h2 className="desktop-chat-title">{getRoomDisplayName(selectedRoom)}</h2>
                </div>

                <div className="chat-header-actions">
                  <button
                    className="settings-button"
                    type="button"
                    onClick={handleOpenRoomSettings}
                    aria-label="Open room settings"
                  >
                    <span aria-hidden="true">⚙</span>
                    <span className="settings-button-text">Settings</span>
                  </button>
                </div>
              </header>

              <div className="message-list" ref={messageListRef}>
                {messageActionError && <p className="form-error">{messageActionError}</p>}

                {
                  isLoadingMessages ? (
                    <div className="center-empty">
                      <h3>Loading messages...</h3>
                    </div>
                  ) : messages.length === 0 && (
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
                    const currentUserReaction = message.reactions?.[currentUser.uid] || "";
                    const reactionCounts = getReactionCounts(message);

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

                        <div className="message-content-stack">
                          {
                            !message.isUnsent && message.replyTo && (
                              <div className="reply-context">
                                <span>↩ {isOwnMessage ? "You replied to" : `${getDisplayName(sender)} replied to`} {getReplySenderName(message.replyTo)}</span>

                                <button
                                  className="message-reply-preview"
                                  type="button"
                                  onClick={() => handleJumpToMessage(message.replyTo.messageId)}
                                >
                                  <strong>{getReplySenderName(message.replyTo)}</strong>
                                  <span>{message.replyTo.text || "Message"}</span>
                                </button>
                              </div>
                            )
                          }

                          <div className="message-body-line">
                            {
                              isOwnMessage && !message.isUnsent && editingMessageId !== message.id && (
                                <div className="message-action-shell">
                                  <div className="message-action-row" aria-label="Message actions">
                                    {
                                      canUnsendMessage && (
                                        <button
                                          className="message-icon-button"
                                          type="button"
                                          onClick={() => handleToggleMoreActions(message.id)}
                                          aria-label="More message actions"
                                        >
                                          ⋮
                                        </button>
                                      )
                                    }

                                    <button
                                      className="message-icon-button"
                                      type="button"
                                      onClick={() => handleStartReply(message)}
                                      aria-label="Reply to message"
                                    >
                                      ↩
                                    </button>

                                    <button
                                      className="message-icon-button"
                                      type="button"
                                      onClick={() => handleToggleEmojiPicker(message.id)}
                                      aria-label="React to message"
                                    >
                                      ☺
                                    </button>
                                  </div>

                                  {
                                    openEmojiMessageId === message.id && (
                                      <div className="message-action-popover emoji-popover">
                                        {
                                          availableReactionEmojis.map((emoji) => (
                                            <button
                                              className={`reaction-button ${currentUserReaction === emoji ? "active" : ""}`}
                                              type="button"
                                              key={emoji}
                                              onClick={() => handleToggleReaction(message, emoji)}
                                              aria-label={`React with ${emoji}`}
                                            >
                                              {emoji}
                                            </button>
                                          ))
                                        }
                                      </div>
                                    )
                                  }

                                  {
                                    openMoreMessageId === message.id && canUnsendMessage && (
                                      <div className="message-action-popover more-popover">
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
                              )
                            }

                            <div className="message-bubble-stack">
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
                                        onLoad={handleMessageImageLoad}
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
                              </div>

                              {
                                !message.isUnsent && reactionCounts.length > 0 && (
                                  <button
                                    className="reaction-summary"
                                    type="button"
                                    onClick={() => handleOpenReactions(message)}
                                    aria-label="View message reactions"
                                  >
                                    {
                                      reactionCounts.map((reactionCount) => (
                                        <span key={reactionCount.emoji}>
                                          {reactionCount.emoji} {reactionCount.count}
                                        </span>
                                      ))
                                    }
                                  </button>
                                )
                              }
                            </div>

                            {
                              !isOwnMessage && !message.isUnsent && editingMessageId !== message.id && (
                                <div className="message-action-shell">
                                  <div className="message-action-row" aria-label="Message actions">
                                    <button
                                      className="message-icon-button"
                                      type="button"
                                      onClick={() => handleStartReply(message)}
                                      aria-label="Reply to message"
                                    >
                                      ↩
                                    </button>

                                    <button
                                      className="message-icon-button"
                                      type="button"
                                      onClick={() => handleToggleEmojiPicker(message.id)}
                                      aria-label="React to message"
                                    >
                                      ☺
                                    </button>
                                  </div>

                                  {
                                    openEmojiMessageId === message.id && (
                                      <div className="message-action-popover emoji-popover">
                                        {
                                          availableReactionEmojis.map((emoji) => (
                                            <button
                                              className={`reaction-button ${currentUserReaction === emoji ? "active" : ""}`}
                                              type="button"
                                              key={emoji}
                                              onClick={() => handleToggleReaction(message, emoji)}
                                              aria-label={`React with ${emoji}`}
                                            >
                                              {emoji}
                                            </button>
                                          ))
                                        }
                                      </div>
                                    )
                                  }
                                </div>
                              )
                            }
                          </div>

                        </div>
                      </article>
                    );
                  })
                }
              </div>

              {
                replyingToMessage && (
                  <div className="reply-composer">
                    <div>
                      <span>Replying to {getReplySenderName(getReplySnapshot(replyingToMessage))}</span>
                      <strong>{getReplyPreviewText(replyingToMessage)}</strong>
                    </div>

                    <button type="button" onClick={handleCancelReply}>
                      Cancel
                    </button>
                  </div>
                )
              }

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
                  onBlur={scrollChatHeaderIntoView}
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
                <div className="room-type-toggle" aria-label="Chatroom type">
                  <button
                    className={newRoomType === "group" ? "active" : ""}
                    type="button"
                    onClick={() => handleSelectNewRoomType("group")}
                  >
                    Group Chat
                  </button>

                  <button
                    className={newRoomType === "private" ? "active" : ""}
                    type="button"
                    onClick={() => handleSelectNewRoomType("private")}
                  >
                    Private Chat
                  </button>
                </div>

                {createRoomError && <p className="form-error">{createRoomError}</p>}

                {
                  newRoomType === "group" && (
                    <input
                      className="room-name-input"
                      type="text"
                      placeholder="Room name"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                    />
                  )
                }

                <div className="member-picker create-room-member-picker">
                  <h3>{newRoomType === "private" ? "Select User" : "Add Members"}</h3>

                  {
                    selectableUsers.length === 0 && (
                      <p className="empty-copy">No other registered users found.</p>
                    )
                  }

                  {
                    selectableUsers.map((user) => (
                      <label
                        className={`member-option ${newRoomType === "private" && privateUserId === user.uid ? "selected" : ""}`}
                        key={user.uid}
                      >
                        <input
                          type={newRoomType === "private" ? "radio" : "checkbox"}
                          name={newRoomType === "private" ? "privateUser" : undefined}
                          checked={newRoomType === "private" ? privateUserId === user.uid : selectedUserIds.includes(user.uid)}
                          onChange={() => (
                            newRoomType === "private"
                              ? setPrivateUserId(user.uid)
                              : handleSelectUser(user.uid)
                          )}
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
                  {newRoomType === "private" ? "Start Private Chat" : "Create Chatroom"}
                </button>
              </div>
            </section>
          </div>
        )
      }

      {
        isRoomSettingsOpen && selectedRoom && (
          <div className="modal-backdrop" role="presentation" onMouseDown={handleCloseRoomSettings}>
            <section
              className="profile-modal room-settings-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="room-settings-modal-title"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <p className="eyebrow">Current Chatroom</p>
                  <h2 id="room-settings-modal-title">Room Settings</h2>
                </div>

                <button className="modal-close" type="button" onClick={handleCloseRoomSettings}>
                  Close
                </button>
              </div>

              <div className="profile-preview">
                {
                  isSelectedRoomPrivate
                    ? renderAvatar(selectedRoomPartner || getRoomDisplayProfile(selectedRoom), "avatar profile-preview-avatar")
                    : renderRoomAvatar(roomSettingsForm, "avatar profile-preview-avatar")
                }
                <div>
                  <strong>
                    {isSelectedRoomPrivate ? getRoomDisplayName(selectedRoom) : roomSettingsForm.name || "Chatroom"}
                  </strong>
                  <small>{isSelectedRoomPrivate ? "Private chat" : `${visibleMemberCount} members`}</small>
                </div>
              </div>

              {roomSettingsError && <p className="form-error">{roomSettingsError}</p>}

              {
                isSelectedRoomPrivate ? (
                  <div className="private-room-settings">
                  <button className="secondary-button" type="button" onClick={handleOpenSearchFromSettings}>
                    Search Messages
                  </button>

                  <button className="secondary-button" type="button" onClick={handleCloseRoomSettings}>
                    Close
                  </button>
                  </div>
                ) : (
                  <form className="profile-form" onSubmit={handleSaveRoomSettings}>
                    <input
                      type="file"
                      accept="image/*"
                      ref={roomPictureInputRef}
                      onChange={handleSelectRoomPicture}
                      hidden
                    />

                    <label className="field-group">
                      <span>Room name</span>
                      <input
                        type="text"
                        name="name"
                        placeholder="Room name"
                        value={roomSettingsForm.name}
                        onChange={handleRoomSettingsChange}
                        required
                      />
                    </label>

                    <label className="field-group">
                      <span>Chatroom picture URL</span>
                      <input
                        type="url"
                        name="photoURL"
                        placeholder="https://example.com/room.png"
                        value={roomSettingsForm.photoURL}
                        onChange={handleRoomSettingsChange}
                      />
                    </label>

                    <div className="profile-upload-row">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => roomPictureInputRef.current?.click()}
                      >
                        Upload Image
                      </button>

                      <span>Image file, max 750KB</span>
                    </div>

                    <div className="room-settings-actions">
                      <button className="secondary-button" type="button" onClick={handleOpenSearchFromSettings}>
                        Search Messages
                      </button>

                      <button className="secondary-button" type="button" onClick={handleOpenMembersFromSettings}>
                        Manage Members
                      </button>
                    </div>

                    <div className="modal-actions">
                      <button className="secondary-button" type="button" onClick={handleCloseRoomSettings}>
                        Cancel
                      </button>

                      <button className="primary-button" type="submit" disabled={isSavingRoomSettings}>
                        {isSavingRoomSettings ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                )
              }
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
        viewingReactions && viewingReactionMessage && !viewingReactionMessage.isUnsent && (
          <div className="modal-backdrop" role="presentation" onMouseDown={handleCloseReactions}>
            <section
              className="profile-modal reaction-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reaction-modal-title"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <p className="eyebrow">Message</p>
                  <h2 id="reaction-modal-title">Message Reactions</h2>
                </div>

                <button className="modal-close" type="button" onClick={handleCloseReactions}>
                  Close
                </button>
              </div>

              <div className="reaction-modal-tabs">
                <button
                  className={viewingReactions.activeEmoji === "all" ? "active" : ""}
                  type="button"
                  onClick={() => handleSelectReactionFilter("all")}
                >
                  All {getMessageReactionEntries(viewingReactionMessage).length}
                </button>

                {
                  getReactionCounts(viewingReactionMessage).map((reactionCount) => (
                    <button
                      className={viewingReactions.activeEmoji === reactionCount.emoji ? "active" : ""}
                      type="button"
                      key={reactionCount.emoji}
                      onClick={() => handleSelectReactionFilter(reactionCount.emoji)}
                    >
                      {reactionCount.emoji} {reactionCount.count}
                    </button>
                  ))
                }
              </div>

              <div className="reaction-user-list">
                {
                  getFilteredReactionEntries(
                    viewingReactionMessage,
                    viewingReactions.activeEmoji
                  ).length === 0 ? (
                    <p className="empty-copy">No reactions found.</p>
                  ) : (
                    getFilteredReactionEntries(
                      viewingReactionMessage,
                      viewingReactions.activeEmoji
                    ).map((reaction) => (
                      <div className="reaction-user-row" key={reaction.uid}>
                        {renderAvatar(reaction.user)}

                        <span>
                          <strong>
                            {reaction.uid === currentUser.uid ? "You" : getDisplayName(reaction.user)}
                          </strong>
                          <small>{reaction.user.email || "Not provided"}</small>
                        </span>

                        <span className="reaction-user-emoji">{reaction.emoji}</span>
                      </div>
                    ))
                  )
                }
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
