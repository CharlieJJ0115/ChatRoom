# Project Progress Notes

This file is a handoff summary for future Codex chats or developers. It is not the final assignment README.

## Project Overview

- Stack: React + Vite, Firebase Auth, Firestore, Firebase Hosting.
- App goal: midterm chatroom app with authenticated users, group chatrooms, profile editing, message operations, and responsive UI.
- Firebase Hosting serves `dist/`, so changes in `src/` require a build before deploy.

## Main Files

- `src/pages/ChatPage.jsx`: Main chatroom UI, room list, message list, modals, mobile view state, image preview, profile editing, room settings.
- `src/firebase/chatroomService.js`: Chatroom creation, member invite, message send/edit/unsend, read status, room profile update, message subscription.
- `src/firebase/userService.js`: User document creation, profile updates, user subscription.
- `src/hooks/useChatrooms.js`: Subscribes to chatrooms for the current user and sorts them on the frontend.
- `src/index.css`: Main layout, component styling, responsive/mobile behavior.
- `src/contexts/AuthContext.jsx`: Email/password auth wrapper.

## Firestore Shape

### `users/{uid}`

Important fields:

- `uid`
- `email`
- `username`
- `photoURL`
- `phoneNumber`
- `address`
- `blockedUsers`
- `createdAt`
- `updatedAt`

### `chatrooms/{roomId}`

Important fields:

- `name`
- `photoURL`
- `type`
- `members`
- `createdBy`
- `createdAt`
- `updatedAt`
- `lastMessage`
- `lastMessageText`
- `lastMessageType`
- `lastMessageSenderId`
- `lastMessageSenderEmail`
- `lastMessageAt`
- `readBy`

Notes:

- `updatedAt` is used for message activity sorting.
- Editing room name or room picture should not update `updatedAt`, so room settings changes do not move the room to the top.
- `readBy.{uid}` stores when a user opened/read a room.

### `chatrooms/{roomId}/messages/{messageId}`

Important fields:

- `text`
- `imageData`
- `imageName`
- `imageSize`
- `senderId`
- `senderEmail`
- `type`
- `isUnsent`
- `createdAt`
- `updatedAt`

## Completed Features

- Email register and login with Firebase Auth.
- User document creation on register.
- User profile modal:
  - profile picture URL
  - upload profile image as base64 data URL
  - username
  - email
  - phone number
  - address
- Create chatrooms and invite members.
- Add more members to existing chatrooms.
- Realtime message subscription per selected chatroom.
- Text messages.
- Image messages:
  - file picker
  - paste image
  - stored as base64 data URL in Firestore
  - size limit: 750KB
  - no chat bubble background
  - light image border
  - image preview modal
  - download from preview modal
- Message operations:
  - edit own text message
  - unsend own text/image message
- Search messages in current room.
- Jump/highlight search result.
- My Chatrooms list:
  - latest message preview
  - sender-aware preview, such as `You: hello`, `Auser: hello`, `You sent an image`
  - unread bold state for messages sent by others
  - frontend sorting by latest activity
- Room Settings modal:
  - opened from gear/settings button
  - edit room name
  - edit room picture URL
  - upload room picture as base64 data URL
  - open Search Messages
  - open Manage Members
- Mobile responsive behavior:
  - mobile uses master-detail flow
  - room list page shows profile panel + My Chatrooms
  - selected room opens a separate chat page
  - Back button returns to room list
  - bottom browser bar safe padding added
- Chat scroll behavior:
  - entering a room instant-jumps to latest messages
  - retries jump during initial settling to handle slow image/DOM loading
  - sending own message instant-jumps to latest message
  - receiving messages from others does not force-scroll, so users can read old messages
- Basic HTML/script safety:
  - message text is rendered by React, not injected as HTML.

## Important UX Decisions

- Mobile layout uses a master-detail pattern instead of showing profile, room list, and current chat panels at once.
- Room-level actions are grouped in Room Settings to keep the header compact.
- Room settings changes do not affect activity sorting.
- Images are clickable and open in a full-screen preview modal.
- Initial room load uses instant jump instead of smooth scroll.
- Incoming messages do not auto-scroll to bottom to avoid interrupting users reading old messages.

## Known Limitations / Watch Points

- Images are stored as base64 data URLs in Firestore, not Firebase Storage.
- The 750KB image limit exists to reduce Firestore document size risk.
- `README.md` is still the default Vite template and must be rewritten for final submission.
- `node_modules` exists locally but must not be included in the submitted zip.
- Firebase Hosting deploys `dist/`; run build before deploy.
- `useChatrooms` sorts on the frontend to avoid Firestore composite index issues with `array-contains + orderBy`.
- Existing old chatrooms may not have all new metadata fields until a new message or settings update occurs.
- If mobile browser cache shows old UI after deploy, test in incognito or clear site data.

## Next Suggested Work

- Rewrite `README.md` with:
  - setup steps
  - Firebase deployment link
  - feature list
  - how to use each feature
- Manually verify mobile RWD on real phone.
- Manually verify Firebase deploy and cache behavior.
- Prepare `AI_reference.pdf` in the project root if AI assistance is being reported.
- Consider implementing remaining bonus features if time allows:
  - Google login
  - Chrome notifications
  - emoji reactions
  - reply to message
  - block user
  - custom sticker/canvas
  - Tenor GIF
  - chatbot

## Development Preferences

- Avoid running tests/build/dev server unless explicitly requested.
- Keep changes scoped; do not rewrite unrelated UI.
- Prefer adding small helpers in existing files over introducing new architecture this late in the project.
- Preserve existing Firebase schema compatibility and fallback behavior for old documents.
