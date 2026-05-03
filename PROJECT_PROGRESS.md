# Project Progress Notes

This file is a handoff summary for future Codex chats or developers. It is not the final assignment README.

## Project Overview

- Stack: React + Vite, Firebase Auth, Firestore, Firebase Hosting.
- App goal: midterm chatroom app with authenticated users, group chatrooms, profile editing, message operations, and responsive UI.
- Firebase Hosting serves `dist/`, so changes in `src/` require a build before deploy.

## Main Files

- `src/pages/ChatPage.jsx`: Main chatroom UI, room list, message list, modals, mobile view state, image preview, profile editing, room settings, Chrome notifications, emoji reactions, reply UI, and compact message action buttons.
- `src/firebase/chatroomService.js`: Chatroom creation, member invite, message send/edit/unsend, read status, room profile update, message subscription, message reply payloads, and emoji reaction updates.
- `src/firebase/userService.js`: User document creation, profile updates, user subscription, and safe creation/merge behavior for Google Sign-In users.
- `src/hooks/useChatrooms.js`: Subscribes to chatrooms for the current user and sorts them on the frontend.
- `src/index.css`: Main layout, component styling, responsive/mobile behavior.
- `src/contexts/AuthContext.jsx`: Email/password auth wrapper and Google popup sign-in.

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
- `replyTo`
- `reactions`
- `createdAt`
- `updatedAt`

Notes:

- `replyTo` is an optional snapshot object used by reply messages:
  - `messageId`
  - `senderId`
  - `senderEmail`
  - `senderName`
  - `text`
  - `type`
- `replyTo` is a snapshot, so it does not update if the original message is later edited or unsent.
- `reactions` stores one emoji per user:
  - example: `{ uidA: "thumbs_up", uidB: "heart" }` in documentation terms; the app stores the actual emoji string.
  - supported emojis: thumbs up, heart, laughing, surprised, crying.

## Completed Features

- Email register and login with Firebase Auth.
- Google Sign-In with Firebase Auth popup flow.
- User document creation on register and Google Sign-In.
- Google user creation preserves existing edited profile fields when the same user logs in again.
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
- Compact Messenger-style message action UI:
  - More icon opens own-message actions
  - Reply icon starts reply
  - Emoji icon opens emoji picker
  - own text messages show Edit and Unsend in the more menu
  - own image messages show Unsend only
  - other users' messages do not expose edit/unsend
- Emoji reactions:
  - each user can have only one reaction per message
  - choosing another emoji replaces the previous one
  - choosing the same emoji again removes it
  - reaction summary shows compact emoji counts, such as thumbs-up count plus heart count
  - clicking the summary opens a reactions modal with All and per-emoji tabs
  - modal rows show user avatar/name/email and selected emoji
- Reply to specific message:
  - Reply button sets a reply composer above the input
  - sent text messages can include a `replyTo` snapshot
  - replied messages show a preview above the bubble
  - clicking the preview jumps to and highlights the original message
  - replying to image messages uses `Image message` as the preview text
  - image sending does not currently carry reply payloads
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
- Chrome desktop notifications:
  - implemented with the browser `Notification` API
  - only works while the web app is open
  - no Firebase Cloud Messaging or background push
  - ignores initial historical room data
  - ignores messages sent by the current user
  - notifies for unread/new messages from other users when appropriate
  - notification title uses the chatroom name
  - notification body distinguishes text and image messages
  - clicking a notification focuses the current window and switches to that room

## Important UX Decisions

- Mobile layout uses a master-detail pattern instead of showing profile, room list, and current chat panels at once.
- Room-level actions are grouped in Room Settings to keep the header compact.
- Room settings changes do not affect activity sorting.
- Images are clickable and open in a full-screen preview modal.
- Initial room load uses instant jump instead of smooth scroll.
- Incoming messages do not auto-scroll to bottom to avoid interrupting users reading old messages.
- Chrome notifications are intentionally page-open notifications only, not background push.
- Notification permission UI reflects the browser's real `Notification.permission` state.
- Emoji reaction data is stored on the message document, not in a separate collection.
- Reply messages keep a snapshot of the original message preview for stable display.
- Message action icons are kept outside the message bubble so the bubble text layout stays clean.

## Known Limitations / Watch Points

- Images are stored as base64 data URLs in Firestore, not Firebase Storage.
- The 750KB image limit exists to reduce Firestore document size risk.
- `README.md` is still the default Vite template and must be rewritten for final submission.
- `node_modules` exists locally but must not be included in the submitted zip.
- Firebase Hosting deploys `dist/`; run build before deploy.
- Firestore rules are not stored in this repo. They must be kept in sync manually in Firebase Console.
- Current Firebase Console rules must allow:
  - message create with optional `replyTo`
  - room member updates to only their own `reactions.{uid}` field
  - owner-only edit/unsend for message content and unsend state
- If reply messages appear briefly and disappear, Firestore rules are the first thing to check.
- If emoji reactions show "Missing or insufficient permissions", Firestore rules likely still restrict message updates to only the sender.
- Chrome notifications only appear in supported browsers after the user grants permission.
- Chrome notifications will not appear after the web page is closed because Firebase Cloud Messaging was intentionally not implemented.
- `useChatrooms` sorts on the frontend to avoid Firestore composite index issues with `array-contains + orderBy`.
- Existing old chatrooms may not have all new metadata fields until a new message or settings update occurs.
- If mobile browser cache shows old UI after deploy, test in incognito or clear site data.
- `AI_reference.docx` exists in the parent folder, but final submission may require `AI_reference.pdf` in the project root.
- CSS animation beyond normal hover behavior may still need review against the midterm rubric.

## Next Suggested Work

- Rewrite `README.md` with:
  - setup steps
  - Firebase deployment link
  - feature list
  - how to use each feature
- Manually verify mobile RWD on real phone.
- Manually verify Firebase deploy and cache behavior.
- Prepare `AI_reference.pdf` in the project root if AI assistance is being reported.
- Update Firebase Console Firestore rules before manually verifying reply and reaction features.
- Manually verify Google Sign-In with an authorized localhost/domain setting in Firebase.
- Manually verify Chrome notifications in Chrome with permission enabled.
- Manually verify reply, reaction modal, and message action UI on desktop and mobile.
- Consider implementing remaining bonus features if time allows:
  - block user
  - Tenor GIF
  - chatbot
  - custom sticker/canvas
  - CSS animation that is not just button hover

## Development Preferences

- Avoid running tests/build/dev server unless explicitly requested.
- Keep changes scoped; do not rewrite unrelated UI.
- Prefer adding small helpers in existing files over introducing new architecture this late in the project.
- Preserve existing Firebase schema compatibility and fallback behavior for old documents.
- User testing is manual; Codex should not run `npm run test`, `npm run build`, `npm run lint`, or `npm run dev` unless the user explicitly changes this instruction.
