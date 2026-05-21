# Ludo — Real-Time Multiplayer Game

A production-quality real-time multiplayer Ludo game with server-authoritative state, real-time synchronization, and a coin economy.

## Live Demo

| Service  | URL                                                                      |
| -------- | ------------------------------------------------------------------------ |
| Frontend | [https://ludo-web-dice.netlify.app/](https://ludo-web-dice.netlify.app/) |
| Backend  | Render (Express + Socket.IO)                                             |

---

## Tech Stack

| Layer        | Choice                                |
| ------------ | ------------------------------------- |
| Frontend     | Vite + React 18 + TypeScript (strict) |
| Routing      | React Router v6                       |
| Styling      | Tailwind CSS                          |
| Animation    | Framer Motion                         |
| Sound        | Howler.js                             |
| Client State | Zustand                               |
| WebSocket    | Socket.IO (client + server)           |
| Backend      | Node.js + Express + Socket.IO         |
| Database     | Supabase (Postgres + Auth + Storage)  |
| DB Access    | Supabase JS client (service role)     |
| Deployment   | Netlify (frontend) + Render (backend) |

---

## Features

### Authentication

- Google OAuth sign-in via Supabase Auth
- Random display name generated for new users (e.g. "SilentTiger")
- 10,000 starting coins on first sign-up
- Protected routes redirect unauthenticated users to login

### Lobby

- User profile with avatar, display name, and wallet balance
- Active player count (live connected users)
- Room list with join buttons and capacity indicators
- Leaderboard (top 20 by coin balance, real-time updates via WebSocket)

### Rooms

- Create 2, 3, or 4-player rooms
- Shareable invite link (e.g. `/room/8fd92a`) — visiting auto-joins
- Random color and board corner assigned on join
- Entry fee (100 coins) deducted only when the match starts, not on lobby join
- Room waits in "waiting" state until host starts the game

### Gameplay — Standard Ludo Rules

- Pawn exits base only on a roll of 6
- Rolling 6 grants an extra turn
- Killing an opponent pawn grants an extra turn
- Reaching home grants an extra turn
- Player selects which pawn to move when multiple valid moves exist
- If no valid moves exist, turn auto-skips after a brief delay
- 8 safe tiles on the main track (kills blocked)
- Kill sends opponent pawn back to base
- All 4 pawns home = win
- 30-second server-side turn timer with auto-skip on expiry
- Server validates all dice rolls, moves, and win conditions — client cannot self-report

### Animations and Sound

- Dice roll with Framer Motion animation + sound
- Pawn step-by-step movement animation along the board path + sound
- Kill flash animation + sound
- Home-reach sound effect
- Timer warning sound at 10 seconds remaining
- Winner celebration screen with confetti + sound
- Chat message notification sound (for messages from other players)
- Disconnect alert sound

### Coin Economy

- New users start with 10,000 coins
- 100 coins deducted per player when a match starts
- Winner receives 80% of the pool (20% platform fee)
- Play Again flow re-deducts entry fees from all participants
- Atomic wallet transactions via Postgres RPC with row-level locking (`SELECT FOR UPDATE`)

| Players | Pool | Winner Payout | Platform Fee |
| ------- | ---- | ------------- | ------------ |
| 2       | 200  | 160           | 40           |
| 3       | 300  | 240           | 60           |
| 4       | 400  | 320           | 80           |

### Chat

- Room-level real-time chat during waiting and active game states
- Messages display sender name, content, and timestamp
- Auto-scroll to latest message
- Mobile-friendly slide-up overlay

### Disconnect Handling

- Disconnected player triggers a visual banner for remaining players
- Game pauses while any player is disconnected
- 60-second grace period with countdown indicator
- Automatic forfeit after grace period expires
- Reconnecting player resumes correct game state (full state snapshot replayed)
- If only 1 active player remains after forfeit(s), they win automatically

### Play Again

- After game completes, each active player votes "Play Again" or "Decline"
- All active (non-forfeited) players must agree for replay to proceed
- Any "Decline" vote cancels the replay — that player exits the room
- Entry fees are deducted again from all participating players

---

## Architecture

```
monorepo (pnpm workspaces)
├── apps/web        — Vite + React 18 + TypeScript SPA
├── apps/server     — Node.js + Express + Socket.IO
└── packages/shared — Shared TypeScript types (Socket.IO event contracts, game state)
```

### Key Design Decisions

**Server-authoritative game state.**
All dice rolls, move validation, win detection, and wallet updates happen on the server. The client renders what it's told. This prevents cheating and keeps all clients consistent.

**In-memory game rooms.**
Active game state lives in a `Map<roomCode, GameRoom>` on the Express server for sub-millisecond validation latency. The tradeoff is single-instance only — state is lost on server restart. Production path: replace with Redis for persistence and horizontal scaling.

**Socket.IO over raw WebSockets.**
Auto-reconnection, named event routing, and room broadcasting are built-in. Tradeoff: slightly larger bundle — acceptable for this scope.

**Supabase JS client directly (no ORM).**
Same `.from().select()` API on both frontend and backend (backend uses service role key to bypass RLS). Atomic wallet operations use Postgres RPC functions with `SELECT FOR UPDATE` row locking to prevent double-spend.

**SVG board with Framer Motion.**
The Ludo board is a 15x15 SVG grid (56-cell main track with 14-cell equal spacing per player). Each pawn animates step-by-step along its path. Declarative, mobile-scalable, no canvas imperative code.

**Fully typed Socket.IO events.**
All client-to-server and server-to-client events are defined in `packages/shared/src/types/events.ts` with strict payload types. Both apps import and consume these types, giving compile-time safety on every event handler.

### Board Geometry

- 56-cell clockwise main track with 14-cell equal spacing per player
- Position encoding: `-1` = base, `0–55` = main track (relative per player), `56–61` = home column (6 cells), `62` = scored/home
- Player start positions: Red=0, Blue=14, Green=28, Yellow=42
- 8 safe tiles (4 start cells + 4 star cells)
- All consecutive cells are edge-adjacent on the 15x15 grid — no diagonal jumps or teleportation

---

## Local Setup

**Prerequisites:** Node.js 20+, pnpm 9+

```bash
# Install dependencies
pnpm install

# Build shared types package first
pnpm --filter shared build

# Copy env files
cp apps/web/.env.example apps/web/.env.local
cp apps/server/.env.example apps/server/.env

# Fill in Supabase credentials in both .env files, then:
pnpm dev
```

Frontend runs at `http://localhost:5173`, server at `http://localhost:4000`.

### Environment Variables

**`apps/web/.env.local`**

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_SERVER_URL=http://localhost:4000
```

**`apps/server/.env`**

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
CLIENT_URL=http://localhost:5173
PORT=4000
```

### Database Setup

Run migrations against your Supabase project in order:

```bash
# In Supabase SQL editor or psql
apps/server/src/db/migrations/001_initial_schema.sql
apps/server/src/db/migrations/002_wallet_rpc.sql
```

Enable Google OAuth in your Supabase project under Authentication > Providers.

---

## Deployment

### Frontend — Netlify

1. Connect the repo in Netlify
2. Netlify auto-detects `netlify.toml` at the repo root — no manual build config needed
3. Add environment variables from `apps/web/.env.example` under Site settings > Environment variables
4. Set `VITE_SERVER_URL` to your Render backend URL

### Backend — Render

1. Create a new Web Service on [render.com](https://render.com), connect the repo
2. Set root directory to `apps/server`
3. Build command: `npm install -g pnpm && pnpm install && pnpm --filter shared build && pnpm --filter server build`
4. Start command: `node apps/server/dist/index.js`
5. Add environment variables from `apps/server/.env.example`
6. Set `CLIENT_URL` to your Netlify frontend URL

---

## Sound Files

Sound files are loaded from `VITE_SOUNDS_URL` (defaults to `/sounds`). Upload to Supabase Storage or place in `apps/web/public/sounds/`:

| File                | Trigger               |
| ------------------- | --------------------- |
| `dice.mp3`          | Dice roll             |
| `move.mp3`          | Pawn moves            |
| `kill.mp3`          | Opponent pawn killed  |
| `home.mp3`          | Pawn reaches home     |
| `winner.mp3`        | Game over             |
| `timer-warning.mp3` | Timer at 10 seconds   |
| `disconnect.mp3`    | Player disconnects    |
| `chat.mp3`          | Chat message received |

---

## Known Limitations and Tradeoffs

| Limitation                                    | Production Path                                     |
| --------------------------------------------- | --------------------------------------------------- |
| Single server instance — game state in memory | Replace in-memory Map with Redis                    |
| No horizontal scaling                         | Redis pub/sub for Socket.IO adapter                 |
| `Math.random()` for dice                      | Use `crypto.randomInt` for cryptographic randomness |
| Free-tier backend sleeps after 15min idle     | First request wakes it (~30s cold start)            |
| No game sound effect                          | its configued but need to add Add game sound assets |

---

## Assumptions

1. Google profile picture used as avatar (with fallback on broken images)
2. Chat messages persisted in DB — reconnecting players see full chat history
3. Payout formula: winner receives 80% of pool, 20% platform fee
4. Play Again requires unanimous consent from all active (non-forfeited) players
5. "Active players" in lobby = currently connected WebSocket users
6. Leaderboard = global top 20 by coin balance, updated in real-time
7. Disconnect auto-forfeit timeout = 60 seconds
8. Minimum 100 coins required to join a room (checked on join, deducted on game start)
