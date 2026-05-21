import type { PlayerColor } from "@ludo/shared";

// -1 = base, 0–55 = main track (relative), 56–61 = home column, 62 = scored
export const MAIN_TRACK_LENGTH = 56;
export const HOME_COLUMN_START = 56;
export const HOME_POSITION = 62;

export const PLAYER_START_ABSOLUTE: Record<PlayerColor, number> = {
  red: 0,
  blue: 14,
  green: 28,
  yellow: 42,
};

// 4 start cells + 4 midway stars
export const SAFE_TILES = new Set<number>([1, 9, 15, 23, 29, 37, 43, 51]);

export const relativeToAbsolute = (
  color: PlayerColor,
  relativePos: number,
): number => {
  if (relativePos < 0 || relativePos > MAIN_TRACK_LENGTH - 1) {
    throw new Error(`Position ${relativePos} is not on the main track`);
  }
  return (PLAYER_START_ABSOLUTE[color] + relativePos) % MAIN_TRACK_LENGTH;
};

export const isOnMainTrack = (pos: number): boolean =>
  pos >= 0 && pos <= MAIN_TRACK_LENGTH - 1;
export const isInHomeColumn = (pos: number): boolean =>
  pos >= HOME_COLUMN_START && pos < HOME_POSITION;
export const isHome = (pos: number): boolean => pos === HOME_POSITION;
export const isInBase = (pos: number): boolean => pos === -1;
