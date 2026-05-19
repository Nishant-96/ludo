-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id    TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Wallets (1:1 with users) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wallets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance    BIGINT NOT NULL DEFAULT 10000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Transactions (audit trail) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id  UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount     BIGINT NOT NULL, -- negative = deduction, positive = payout
  type       TEXT NOT NULL CHECK (type IN ('entry_fee', 'payout', 'refund')),
  match_id   UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Rooms ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rooms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT UNIQUE NOT NULL,
  capacity   INT NOT NULL CHECK (capacity IN (2, 3, 4)),
  status     TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'paused', 'completed')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- ─── Room Players ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS room_players (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  color     TEXT NOT NULL CHECK (color IN ('red', 'blue', 'green', 'yellow')),
  corner    INT NOT NULL CHECK (corner IN (0, 1, 2, 3)),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, color),
  UNIQUE(room_id, corner)
);

-- ─── Matches ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS matches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        UUID NOT NULL REFERENCES rooms(id),
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at       TIMESTAMPTZ,
  winner_user_id UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_matches_room_id ON matches(room_id);

-- ─── Match Participants ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS match_participants (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id),
  color    TEXT NOT NULL,
  payout   BIGINT NOT NULL DEFAULT 0,
  UNIQUE(match_id, user_id)
);

-- ─── Moves (game history) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS moves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  dice_value  INT NOT NULL CHECK (dice_value BETWEEN 1 AND 6),
  pawn_index  INT NOT NULL CHECK (pawn_index BETWEEN 0 AND 3),
  from_pos    INT NOT NULL,
  to_pos      INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moves_match_id ON moves(match_id);

-- ─── Chat ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id),
  message    TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chats_room_id ON chats(room_id);
