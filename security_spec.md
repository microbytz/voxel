# Security Specification & Test Runner for Roblox Web Studio

## 1. Data Invariants

- **Users Info**: Users can read any user profile but only modify their own. They cannot modify system fields like `robux` arbitrarily, or we enforce validation that updates are permitted only by authenticated users for their own document.
- **Chat Channels**: Users must be part of `participants` to read or post messages in a channel.
- **Trades**: Users can create a trade if they are the `senderId`. Only the `receiverId` can accept or decline (update status) of a trade.
- **Published Games**: Anyone can read public published games, but editing, deleting, or publishing a game is restricted to the game's original `creatorId` (who must match the authenticated `uid`).

---

## 2. The "Dirty Dozen" Payloads (Aesthetic Penetration Testing)

1. **Self-Robux Injection**: Attempt to set `robux: 9999999` on another user's profile.
2. **Profile Hijacking**: Attempt to update another user's `skinColor` without being logged in of that profile.
3. **Chat Snooping**: Attempt to read `/chats/confidential_chat/messages/msg_1` when the user `uid` is not in `/chats/confidential_chat` participants list.
4. **Impersonated Chat Sender**: Post a message with `senderId: "adversary"` inside a chat where `/chats/chat1` participants are `["victim", "other"]`.
5. **Unauthorized Message Post**: Add a message to `/chats/private_chat/messages/new_msg` without being an authorized participant.
6. **Self-Approve Trade**: Attempt to transition a trade status from `Pending` to `Accepted` where the current user is the `senderId` (only the receiver can accept).
7. **Steal Shared Game**: Attempt to overwrite a game's `creatorId` (or update/delete it) when the authenticated user is not the creator of the game.
8. **Malicious Giant Map Payload**: Write a game `mapData` string exceeding 200,000 characters to trigger memory bloat before checking boundaries.
9. **Spoof Original Owner ID**: Creating a trade with `senderId: "victim_id"` from an attacker's account.
10. **Shadow Field Injection**: Write a user profile containing extra unallowed keys like `{ "isAdmin": true, "goldAccount": true }`.
11. **Malicious Character String ID**: Injecting database document ID containing invalid characters like `../../../hack_system` to navigate paths.
12. **Status Skipping**: Attempting to set trade status as `Completed` directly upon initialization without passing `Pending` or having partner's consensus.

---

## 3. Test Runner Design (`firestore.rules.test.ts`)

We will enforce that these rules are coded securely in `firestore.rules` and tested directly in our validation setup.
