# Ludo — Real-Time Multiplayer Game

A production-quality real-time multiplayer Ludo game with server-authoritative state, real-time synchronization, and a coin economy.

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | _(deploy to Netlify — see below)_ |
| Backend | _(deploy to Render — see below)_ |

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

### Database Setup

Run migrations against your Supabase project in order:

```bash
# In Supabase SQL editor or psql
apps/server/src/db/migrations/001_initial_schema.sql
apps/server/src/db/migrations/002_wallet_rpc.sql
```

Enable Google OAuth in your Supabase project under Authentication → Providers.

---

## Architecture

```
monorepo (pnpm workspaces)
├── apps/web        — Vite + React 18 + TypeScript SPA (Netlify)
├── apps/server     — Node.js + Express + Socket.IO (Render)
└── packages/shared — Shared TypeScript types (Socket.IO contracts, game state)
```

### Key Design Decisions

**Server-authoritative game state.**
All dice rolls, move validation, win detection, and wallet updates happen on the server. The client renders what it's told. This prevents cheating and keeps all clients consistent.

**In-memory game rooms.**
Active game state lives in a `Map<roomCode, GameRoom>` on the Express server for sub-millisecond validation latency. The tradeoff is that state is lost on server restart and the server can't scale horizontally. In production, this would be replaced with Redis.

**Socket.IO over raw WebSockets.**
Auto-reconnection, named event routing, and room broadcasting are built-in. The tradeoff is a slightly larger bundle size — acceptable for this scope.

**Supabase JS client directly (no ORM).**
The same `.from().select()` API works on both frontend and backend (with a service role key). Atomic wallet operations use Postgres RPC functions with `SELECT FOR UPDATE` row locking to prevent double-spend.

**SVG board with Framer Motion pawns.**
The Ludo board is a 15×15 SVG grid. Each pawn is a `motion.g` element that animates to its new position on every move event. Declarative, mobile-scalable, no canvas imperative code.

---

## Coin Economy

| Event | Amount |
|-------|--------|
| New user starting balance | +10,000 coins |
| Entry fee per match | -100 coins |
| Winner payout (2-player) | +160 coins (80% of 200 pool) |
| Winner payout (3-player) | +240 coins (80% of 300 pool) |
| Winner payout (4-player) | +320 coins (80% of 400 pool) |
| Platform fee | 20% of pool |

Entry fees are deducted atomically via a Postgres stored function. If any player has insufficient balance, the entire deduction rolls back.

---

## Game Rules Implemented

- Pawn exits base only on a roll of 6
- Rolling 6 grants an extra turn (except on a winning move)
- 8 safe tiles on the main track (no kills there)
- Kill sends opponent pawn back to base with animation + sound
- All 4 pawns home = win
- 30-second server-side turn timer; auto-skip on expiry
- If a player disconnects, 60-second grace period before auto-forfeit
- Remaining player(s) win automatically on forfeit

---

## Play Again Flow

After a game completes, each player must vote "Play Again". All active (non-forfeited) players must agree. Any "Decline" vote cancels the replay — that player exits the room. Entry fees are deducted again from all participants.

---

## Deployment

### Frontend — Netlify

1. Connect the repo in Netlify (Site settings → Build & deploy → Link repository)
2. Netlify auto-detects `netlify.toml` at the repo root — no manual build config needed
3. Add environment variables from `apps/web/.env.example` under Site settings → Environment variables
4. Set `VITE_SERVER_URL` to your Render backend URL

The `netlify.toml` sets the build base, command, publish dir, and SPA redirect rule.

### Backend — Render

1. Create a new Web Service on [render.com](https://render.com), connect the repo
2. Set root directory to `apps/server`
3. Build command: `npm install -g pnpm && pnpm install && pnpm --filter shared build && pnpm --filter server build`
4. Start command: `node apps/server/dist/index.js`
5. Add environment variables from `apps/server/.env.example`
6. Set `CLIENT_URL` to your Netlify frontend URL

---

## Sound Files

Sound files are loaded from `VITE_SOUNDS_URL` (defaults to `/sounds`). Upload the following files to Supabase Storage under a `sounds` bucket, or place them in `apps/web/public/sounds/`:

| File | Trigger |
|------|---------|
| `dice.mp3` | Dice roll result received |
| `move.mp3` | Pawn moves |
| `kill.mp3` | Opponent pawn sent to base |
| `home.mp3` | Pawn reaches home |
| `winner.mp3` | Game over |
| `timer-warning.mp3` | Timer reaches 10 seconds |
| `disconnect.mp3` | A player disconnects |
| `chat.mp3` | Chat message received |

---

## Known Limitations & Tradeoffs

| Limitation | Production Path |
|------------|----------------|
| Single server instance — game state in memory | Replace `Map<roomCode, GameRoom>` with Redis |
| No horizontal scaling | Redis pub/sub for Socket.IO adapter |
| `Math.random()` for dice | Cryptographically secure RNG (`crypto.randomInt`) |
| Free-tier backend sleeps after 15min idle | First request wakes it (~30s), then normal speed |
| Sound files must be manually provided | Bundle in `public/sounds/` or upload to Supabase Storage |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React 18 + TypeScript (strict) |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Sound | Howler.js |
| Client state | Zustand |
| WebSocket client | Socket.IO client |
| Backend | Node.js + Express + Socket.IO |
| Database | Supabase (Postgres + Auth + Storage) |
| DB access | Supabase JS client (service role) |
| Deployment | Netlify (frontend) + Render (backend) |
