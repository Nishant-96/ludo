import type { PlayerColor } from '@ludo/shared';

// ─── Board Geometry ───────────────────────────────────────────────────────────
// The Ludo board is a 15×15 grid. Each cell is CELL_SIZE px.
// Total SVG viewport: 15 * CELL_SIZE = 450px (scales via viewBox).

export const GRID = 15;
export const CELL = 30; // logical cell size in SVG units
export const BOARD_SIZE = GRID * CELL; // 450

// ─── Color Config ─────────────────────────────────────────────────────────────
export const COLOR_HEX: Record<PlayerColor, string> = {
  red:    '#E53E3E',
  blue:   '#3182CE',
  green:  '#38A169',
  yellow: '#D69E2E',
};

export const COLOR_LIGHT: Record<PlayerColor, string> = {
  red:    '#FED7D7',
  blue:   '#BEE3F8',
  green:  '#C6F6D5',
  yellow: '#FEFCBF',
};

// ─── Main Track Cells (absolute positions 0–51) ───────────────────────────────
// Reading order: starting at Red's entry (col 6, row 13), going clockwise.
// Each entry is [col, row] in the 15×15 grid.

export const MAIN_TRACK: [number, number][] = [
  // Red's side — bottom-left vertical (going up)
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],  // 0–4
  // Top-left horizontal (going right)
  [6, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], // 5–10
  // Blue's entry going down
  [0, 8], [0, 7], [0, 6],                          // 11–13 (13 = blue start)
  // Left side going right
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],          // 14–18
  // Top horizontal going up
  [6, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1],  // 19–24
  // Top-right corner
  [6, 0], [7, 0], [8, 0],                           // 25–27 (26 = green start)
  // Right side going right
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],           // 28–32
  // Right side going down
  [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], // 33–38
  // Yellow's entry
  [14, 6], [14, 7], [14, 8],                         // 39–41 (39 = yellow start)
  // Right side going left
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],        // 42–46
  // Bottom going down (47–51)
  [8, 8], [8, 9], [8, 10], [8, 11], [8, 12],
];

// ─── Home Columns (relative positions 52–56, then 57 = home) ─────────────────
// 5 squares leading into the center home triangle, per color.

export const HOME_COLUMNS: Record<PlayerColor, [number, number][]> = {
  red:    [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue:   [[1, 7],  [2, 7],  [3, 7],  [4, 7],  [5, 7]],
  green:  [[7, 1],  [7, 2],  [7, 3],  [7, 4],  [7, 5]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
};

// Home center (position 57 for all colors)
export const HOME_CENTER: [number, number] = [7, 7];

// ─── Base Positions (the 4 starting circles per color) ────────────────────────
export const BASE_POSITIONS: Record<PlayerColor, [number, number][]> = {
  red:    [[2, 11], [4, 11], [2, 13], [4, 13]],
  blue:   [[2, 2],  [4, 2],  [2, 4],  [4, 4]],
  green:  [[10, 2], [12, 2], [10, 4], [12, 4]],
  yellow: [[10, 11],[12, 11],[10, 13],[12, 13]],
};

// ─── Safe Tile Absolute Positions ─────────────────────────────────────────────
export const SAFE_ABSOLUTE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// ─── Position → SVG Coordinate ───────────────────────────────────────────────
// Converts a pawn's relative board position to an SVG center coordinate.
// Used by the Pawn component to animate between positions.

export const positionToSVG = (
  color: PlayerColor,
  relativePos: number,
  pawnIndex: number
): { x: number; y: number } => {
  const PLAYER_STARTS: Record<PlayerColor, number> = {
    red: 0, blue: 13, green: 26, yellow: 39,
  };

  // In base
  if (relativePos === -1) {
    const [col, row] = BASE_POSITIONS[color][pawnIndex];
    return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
  }

  // Home
  if (relativePos === 57) {
    const [col, row] = HOME_CENTER;
    // Slightly offset per pawn to avoid overlap
    const offsets = [[-4, -4], [4, -4], [-4, 4], [4, 4]];
    return {
      x: col * CELL + CELL / 2 + offsets[pawnIndex][0],
      y: row * CELL + CELL / 2 + offsets[pawnIndex][1],
    };
  }

  // Home column (52–56)
  if (relativePos >= 52 && relativePos <= 56) {
    const colIdx = relativePos - 52;
    const [col, row] = HOME_COLUMNS[color][colIdx];
    return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
  }

  // Main track (0–51)
  const absolutePos = (PLAYER_STARTS[color] + relativePos) % 52;
  const trackEntry = MAIN_TRACK[absolutePos];
  if (!trackEntry) return { x: 0, y: 0 };
  const [col, row] = trackEntry;
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
};
