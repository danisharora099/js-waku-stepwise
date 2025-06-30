# Waku + React Workshop

> Build a fully-featured, end-to-end-encrypted chat application on top of the [Waku](https://waku.org) network – one step at a time.

---

## 0 · Overview

This repository contains **nine incremental steps** that turn the default *Vite + React* template into a production-ready Waku chat client.  Every folder inside `steps/` is a *checkpoint* – you can start from any folder or follow them consecutively during a workshop/live-coding session.

| Step | Folder | What we add |
|------|--------|-------------|
| 1 | `1_setup` | React + Vite boilerplate |
| 2 | `2_waku_node` | Run a Waku *Light Node* in the browser |
| 2.5 | `2.5_fixed_peer_id` | Deterministic peer IDs via seeded key-pair |
| 3 | `3_message_encoding` | Protobuf schema & helper utilities for chat messages |
| 4 | `4_basic_ui` | Tailwind powered UI: node init, message list & composer |
| 5 | `5_lightpush` | Sending messages with the **LightPush** protocol |
| 6 | `6_filter` | Live subscription with the **Filter** protocol |
| 7 | `7_store` | Chat history retrieval through **Store** queries |
| 8 | `8_encryption` | End-to-end encryption (ECIES + symmetric) & UI toggle |
| 9 | `9_debugging` | Debug panel & fine-grained connectivity metrics |

Navigate into a step‐folder, install deps and start Vite:

```bash
cd steps/5_lightpush   # for example
npm install            # or pnpm / yarn
npm run dev
```

> Each subsequent step only modifies/extends files that were introduced earlier – perfect for diff-driven learning.

---

## 1 · Project prerequisites

* Node ≥ 18
* Modern browser that supports WebTransport/WebSocket
* (Optional) An understanding of libp2p/Waku will help but is **not required** – the code is heavily commented.

---

## 2 · Step-by-step deep dive

Below you will find a concise description of what changes in every step together with the key files to inspect.

### Step 1 – React project scaffolding (`1_setup/`)

Nothing Waku-specific yet – we simply bootstrap **Vite + React + TypeScript**.

Key files:
* `src/App.tsx` – default counter component from the Vite template.

---

### Step 2 – Spinning up a Waku Light Node (`2_waku_node/`)

1. **`src/lib/waku/node.ts`**
   * Wraps `@waku/sdk`'s `createLightNode` in a `WakuNodeManager` class.
   * Custom bootstrap peers are provided via `src/constants.ts`.
2. **`src/lib/waku/context.tsx`**
   * React context that exposes the node, its loading state, peer count, etc.
   * Starts the node on mount and periodically refreshes connection stats.

With this in place, the browser now participates in the Waku network 🎉

---

### Step 2.5 – Deterministic peer IDs (`2.5_fixed_peer_id/`)

Occasionally you need a stable identity across page reloads (useful for
friend-finding in dev nets).

* **`src/lib/waku/identity.ts`** generates an Ed25519 key-pair from a user-supplied seed (or a value remembered in `localStorage`).
* The manager is plugged into the node factory so that the same seed ⇒ same libp2p/Waku peer ID.

---

### Step 3 – Message encoding (`3_message_encoding/`)

We formalise the chat payload:

* **`src/lib/waku/proto/index.ts`** – a protobuf schema (`ChatMessage` = timestamp + sender + message).
* **`src/lib/waku/messaging.ts`** – helpers to encode/decode, create content-topic encoder/decoder and build typed chat messages.

Benefit: binary payloads are small & future-proof (versioning, extra fields, etc.).

---

### Step 4 – Basic UI (`4_basic_ui/`)

Tailwind CSS is introduced and the application is split into reusable components:

* **`components/NodeInitializer.tsx`** – Fancy wizard to start the node (random vs. custom seed).
* **`components/MessageList.tsx / MessageForm.tsx`** – List & form controlled via context.
* **`components/EncryptionToggle.tsx`** – placeholder switch (implemented in step 8).

---

### Step 5 – Sending messages with LightPush (`5_lightpush/`)

* **`src/lib/waku/messaging.ts`** gained `sendMessage()` which encodes the protobuf and pushes it with `node.lightPush.send()`.
* **`src/lib/waku/hooks.ts`** offers a `useSendMessage` React hook with validation & loading/error state.

> At this stage you can chat with **any** Waku client that listens on the same content-topic!

---

### Step 6 – Receiving messages with Filter (`6_filter/`)

* `messageManager.subscribeToMessages()` utilises `node.filter.subscribe()` to receive live messages.
* `useMessages()` hook manages subscription lifecycles and exposes an append-only list of `MessageWithMetadata`.

The UI now displays incoming messages in real-time.

---

### Step 7 – Chat history via Store (`7_store/`)

Offline?  No problem.

* `messageManager.queryHistory()` streams past messages using `node.store.queryWithOrderedCallback()` – decodes each payload and tags it with a `source = 'store'` flag.
* UI merges history with live messages, sorted by timestamp.

---

### Step 8 – End-to-end encryption (`8_encryption/`)

A *big* milestone: pluggable encryption with two flavours.

* **`src/lib/waku/encryption.ts`** – 380 LOC powerhouse that toggles between:
  * **ECIES**: asymmetric encryption; exchange public keys and you're good.
  * **Symmetric**: shared secret – convenient for small private groups.
* Components get a polished **EncryptionToggle** allowing users to generate/import/export keys and switch schemes.
* Encoder/decoder factories transparently wrap Waku's `@waku/message-encryption` helpers.

---

### Step 9 – Debugging & UX polish (`9_debugging/`)

* **`components/DebugToggle.tsx`** – one-click enable for `localStorage.debug = 'waku*'` (activates verbose logs inside `@waku` packages).
* Context upgraded with peer ID exposure, tighter interval updates and richer typing.
* Minor tweaks across the board (error boundaries, spinners, etc.).

---

## 3 · Next steps / exercises

1. **Group chats** – extend the protobuf with a `room` field and spin up multiple content-topics.
2. **Message reactions** – try the new JSON payload approach (hint: you can mix codecs).
3. **Mobile PWA** – make it installable & leverage service-workers for background sync.

---

Happy hacking!  If you build something cool with this repo, let us know on the Waku Discord 💬 