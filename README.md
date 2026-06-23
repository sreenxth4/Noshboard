<div align="center">

# 🍳 Nosh — Dish Control Panel

**Real-time dashboard for managing an AI cooking robot's active menu**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-FF6B6B?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

---

*In Nosh's context, published dishes are dishes the robot can cook. This dashboard gives operators a live control surface to enable or disable dishes from the cooking queue — no downtime, no page refreshes, no stale state.*

</div>

---

## ⚡ Quick Start

> **Prerequisites:** Node.js ≥ 18

```bash
# Terminal 1 — Backend
cd server
npm install
node index.js          # → http://localhost:3001

# Terminal 2 — Frontend
cd client
npm install
npm run dev            # → http://localhost:5173
```

Open **http://localhost:5173** — the dashboard is live.

---

## 🏗️ Architecture

```
dish-dashboard/
├── server/
│   ├── index.js          ← Express + SQLite + WebSocket server (single file)
│   └── package.json
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx      ← Entry point
│       ├── App.jsx       ← Dashboard shell, WS connection, toast system
│       ├── DishCard.jsx  ← Individual dish card component
│       └── App.css       ← Full design system (glassmorphism dark theme)
└── README.md
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Node.js + Express | Lightweight, assignment-standard |
| **Database** | SQLite (persistent file) | Zero-config, survives restarts, portable |
| **Real-time** | Native `ws` library | No Socket.IO overhead — raw WebSocket for simplicity |
| **Frontend** | React 18 (Vite) | Fast HMR, modern JSX, minimal config |
| **Styling** | Vanilla CSS | No Tailwind, no frameworks — full control |

---

## 🔄 Real-Time Data Flow

The system uses a **polling + WebSocket hybrid** architecture:

```
┌──────────────┐          WebSocket           ┌──────────────┐
│              │◄─────────────────────────────│              │
│   Dashboard  │                              │    Server    │
│   (React)    │────── PATCH /toggle ────────►│  (Express)   │
│              │────── POST /simulate ───────►│              │
└──────────────┘                              └──────┬───────┘
                                                     │
                                              Poll every 2s
                                                     │
                                              ┌──────▼───────┐
                                              │   SQLite DB   │
                                              │   (nosh.db)   │
                                              └──────────────┘
```

**Two update paths exist by design:**

| Endpoint | Broadcast | Purpose |
|----------|-----------|---------|
| `PATCH /dishes/:id/toggle` | ✅ Immediate | User clicks Enable/Disable — instant UI feedback |
| `POST /dishes/:id/simulate` | ❌ None | Writes to DB silently — poll loop picks it up within 2s |

This separation proves the real-time pipeline works **end-to-end**, not just on API-triggered events.

---

## 🎯 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dishes` | Returns all dishes as JSON |
| `PATCH` | `/dishes/:id/toggle` | Flips `isPublished` + broadcasts via WebSocket |
| `POST` | `/dishes/:id/simulate` | Flips `isPublished` silently (no broadcast) |

**Response shape** — `GET /dishes`:
```json
[
  {
    "dishId": "1",
    "dishName": "Jeera Rice",
    "imageUrl": "https://nosh-assignment.s3.ap-south-1.amazonaws.com/jeera-rice.jpg",
    "isPublished": true
  }
]
```

---

## 🧠 Design Decisions

### Why polling + WebSocket hybrid?
The server polls SQLite every 2 seconds and broadcasts to all connected clients. This **decouples the broadcast layer from the API layer** — meaning *any* process that writes to the database (a CLI tool, another microservice, a direct SQL update) will be detected and reflected on every connected dashboard within 2 seconds. Toggle actions also broadcast immediately for zero-latency UI feedback.

### Why persistent SQLite over in-memory?
The database is stored as `nosh.db` on disk rather than `:memory:`. Dish states survive server restarts — closer to how a production robot controller would behave.

### Why a Simulate button?
`POST /dishes/:id/simulate` flips `isPublished` in the database **without** triggering a manual WebSocket broadcast. The change appears on the dashboard purely through the polling loop. This proves the real-time pipeline detects external mutations — not just API-triggered ones.

### Why no Socket.IO?
The native `ws` library is ~3KB vs Socket.IO's ~300KB. For a single-event broadcast channel, raw WebSockets are sufficient and eliminate unnecessary abstraction.

### Why auto-reconnect?
The WebSocket client implements exponential retry on disconnect. The green `● Live` indicator in the navbar reflects connection status in real-time — operators always know if they're seeing stale data.

---

## ✨ Frontend Features

- **Glassmorphism dark theme** — `backdrop-filter: blur`, subtle borders, gradient accents
- **Live connection indicator** — pulsing green dot when WebSocket is active, red when disconnected
- **Auto-reconnecting WebSocket** — silently retries every 2s on connection loss
- **Toast notifications** — slide-in/fade-out toasts on toggle and simulate actions
- **Image hover zoom** — smooth `scale(1.08)` transition on dish card images
- **Card lift animation** — `translateY(-6px)` elevation on hover with deep shadows
- **Animated status badges** — pulsing dot for Active dishes, static dot for Disabled
- **Responsive grid** — `auto-fill` CSS Grid adapts from mobile to desktop
- **Inter typeface** — Premium typography loaded from Google Fonts

---

## 📋 Database Schema

```sql
CREATE TABLE dishes (
  dishId      TEXT PRIMARY KEY,
  dishName    TEXT,
  imageUrl    TEXT,
  isPublished INTEGER   -- 1 = Active, 0 = Disabled
);
```

The server auto-seeds 5 dishes on first run if the table is empty. Subsequent restarts preserve existing state.

---

## 🗂️ File Overview

| File | Lines | Responsibility |
|------|-------|----------------|
| `server/index.js` | 78 | Express server, SQLite init + seed, 3 API routes, WebSocket server, poll loop |
| `client/src/App.jsx` | 67 | Dashboard layout, WS connection + auto-reconnect, toggle/simulate handlers, toast system |
| `client/src/DishCard.jsx` | 23 | Single dish card — image, name, status badge, action buttons |
| `client/src/App.css` | 73 | Complete design system — theme, layout, cards, badges, animations, toasts |
| `client/src/main.jsx` | 7 | React entry point |
| `client/index.html` | 14 | HTML shell with emoji favicon |

**Total: ~262 lines of code.** Zero bloat. No TypeScript, no Redux, no CSS frameworks, no utility files, no `.env`.

---

<div align="center">

**Built as part of the [Euphotic Labs](https://euphotic.io) internship assignment**

</div>
