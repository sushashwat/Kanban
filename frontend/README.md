# ▣ Boardroom — Real-Time Collaborative Kanban Board

A full-stack, real-time collaborative Kanban board (Trello-style) built with the MERN stack and Socket.io. Multiple users can work on the same board simultaneously — drag-and-drop, card edits, comments, and member changes sync live across every connected client, no refresh required.

**Live demo:** https://kanban-plum-rho.vercel.app
**Backend API:** https://boardroom-backend-xfzd.onrender.com

> ⚠️ The backend is hosted on Render's free tier, which spins down after periods of inactivity. The first request after idle time may take 30–50 seconds to respond while the server wakes up.

---

## Features

- **Authentication** — JWT-based register/login, protected routes, persistent sessions
- **Boards** — create, rename, delete, and search boards
- **Lists & Cards** — full CRUD, with priority levels, due dates, and assignees
- **Drag-and-drop** — reorder cards within a list or move them across lists, with position persisted in MongoDB
- **Real-time sync** — every board is its own Socket.io "room"; actions from one user (card moves, new lists, deletions) appear instantly for everyone else viewing that board
- **Card comments** — threaded comments on individual cards with author and timestamp
- **Activity log** — a running feed of recent actions on a board (cards created/moved/deleted, members added)
- **Team collaboration** — invite members by email, remove members (owner-only), or leave a board you no longer need access to
- **Access control** — only board owners can delete boards, remove members, or rename via owner-gated endpoints; only board members can view/edit board contents

---

## Tech Stack

**Frontend**
- React 18 (Vite)
- Redux Toolkit — global state, async thunks for all API calls
- React Router — client-side routing
- `@hello-pangea/dnd` — drag-and-drop (maintained fork of `react-beautiful-dnd`)
- `socket.io-client` — real-time WebSocket connection
- Axios — HTTP client with a JWT-attaching interceptor

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io — real-time bidirectional events, scoped to per-board rooms
- JWT (`jsonwebtoken`) — stateless authentication
- bcryptjs — password hashing

**Deployment**
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

---

## Architecture Highlights

### 1. Drag-and-drop order persistence

Each card stores a `list` reference and a numeric `order` field. When a card is dropped into a new position:

1. The frontend optimistically reorders the card in Redux state immediately (no waiting on the network) for a snappy UI.
2. A `PUT /api/cards/:id/move` request is sent with the destination list and index.
3. On the backend, all cards in the destination list are fetched, the moving card is spliced into its new index, and the entire list is **re-sequenced** (`0, 1, 2, ...`) via a single `bulkWrite`. If the card moved between two different lists, the source list is re-sequenced too, closing the gap it left behind.

This keeps ordering consistent no matter how many times cards are shuffled, and avoids the need for float-based or gap-based ordering schemes.

### 2. Real-time sync via Socket.io rooms

Each board is its own Socket.io room:

```js
socket.on('joinBoard', (boardId) => socket.join(boardId));
```

When a client performs an action that succeeds against the REST API, it also emits a corresponding socket event scoped to that board's room (e.g. `cardMoved`, `listCreated`). The server relays the event to every *other* client in that room:

```js
socket.on('cardMoved', ({ boardId, card }) => {
  socket.to(boardId).emit('cardMoved', card);
});
```

Using `socket.to(room)` instead of `io.to(room)` ensures the sender doesn't receive their own event back (their local state is already updated from the REST response).

### 3. Normalized schema

Boards, Lists, and Cards are stored as separate collections linked by ObjectId references rather than embedding lists/cards inside a board document. This keeps individual updates (e.g. editing one card) cheap and avoids re-writing large nested documents on every change.

---

## Project Structure

```
kanban-app/
├── backend/
│   ├── config/          # DB connection, JWT helper, activity logger
│   ├── controllers/     # Business logic per resource
│   ├── middleware/       # Auth guard, error handler
│   ├── models/           # Mongoose schemas (User, Board, List, Card, Activity)
│   ├── routes/            # Express route definitions
│   └── server.js          # Express + Socket.io entry point
└── frontend/
    └── src/
        ├── components/    # ListColumn, CardItem, modals, ActivityPanel
        ├── pages/          # Login, Register, Dashboard, BoardPage
        ├── redux/slices/   # authSlice, boardSlice
        ├── hooks/          # useSocket
        └── utils/          # Axios instance with JWT interceptor
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Authenticate and receive a JWT |
| GET | `/api/boards` | List boards the user owns or belongs to |
| POST | `/api/boards` | Create a board |
| GET | `/api/boards/:id` | Get a board with its lists and cards |
| PUT | `/api/boards/:id` | Rename a board |
| DELETE | `/api/boards/:id` | Delete a board (owner only) |
| POST | `/api/boards/:id/members` | Invite a member by email |
| DELETE | `/api/boards/:id/members/:memberId` | Remove a member (owner only) |
| POST | `/api/boards/:id/leave` | Leave a board |
| GET | `/api/boards/:id/activity` | Recent activity feed for a board |
| POST | `/api/lists` | Create a list |
| PUT / DELETE | `/api/lists/:id` | Update / delete a list |
| POST | `/api/cards` | Create a card |
| PUT | `/api/cards/:id` | Update card details |
| PUT | `/api/cards/:id/move` | Persist a drag-and-drop move |
| DELETE | `/api/cards/:id` | Delete a card |
| POST | `/api/cards/:id/comments` | Add a comment to a card |

All routes except register/login require a `Authorization: Bearer <token>` header.

---

## Running Locally

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a long random string>
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file:

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

Visit `http://localhost:5173`.

---

## Deployment Notes

- **CORS / Socket.io origin**: the backend's `CLIENT_URL` env var must exactly match the deployed frontend origin (protocol + domain, no trailing slash, no path) or both REST requests and the Socket.io handshake will be blocked.
- **SPA routing**: the frontend includes a `vercel.json` rewrite rule so that client-side routes (e.g. `/board/:id`) don't 404 on a hard refresh.
- **Same-region hosting**: for lowest latency, keep the MongoDB Atlas cluster and the backend host in the same cloud region — cross-region calls add meaningful round-trip latency to every database query.

---

## Author

Built by **Shashwat Gupta**
## GitHub:https://github.com/sushashwat