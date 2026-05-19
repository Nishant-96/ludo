import type { PlayerColor } from '@ludo/shared';

// ─── Position Encoding ────────────────────────────────────────────────────────
// -1        = in base (not yet on board)
//  0 – 51   = main track (relative to each player's starting square)
// 52 – 56   = home column (5 squares, color-specific — no collisions here)
// 57        = home (scored)

export const MAIN_TRACK_LENGTH = 52;
export const HOME_COLUMN_START = 52; // relative position where home column begins
export const HOME_POSITION = 57;     // final scored position

// Absolute board positions where each color enters the main track
export const PLAYER_START_ABSOLUTE: Record<PlayerColor, number> = {
  red:    0,
  blue:   13,
  green:  26,
  yellow: 39,
};

// Absolute positions that are safe tiles (pawns here cannot be killed)
// Includes all 4 color starting squares + 4 midway safe squares
export const SAFE_TILES = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);

// Convert a pawn's relative position to its absolute board position.
// Only valid for main track positions (0–51).
// Home column positions (52+) are color-specific and never collide.
export const relativeToAbsolute = (color: PlayerColor, relativePos: number): number => {
  if (relativePos < 0 || relativePos > MAIN_TRACK_LENGTH - 1) {
    throw new Error(`Position ${relativePos} is not on the main track`);
  }
  return (PLAYER_START_ABSOLUTE[color] + relativePos) % MAIN_TRACK_LENGTH;
};

export const isOnMainTrack = (pos: number): boolean => pos >= 0 && pos <= MAIN_TRACK_LENGTH - 1;
export const isInHomeColumn = (pos: number): boolean => pos >= HOME_COLUMN_START && pos < HOME_POSITION;
export const isHome = (pos: number): boolean => pos === HOME_POSITION;
export const isInBase = (pos: number): boolean => pos === -1;
