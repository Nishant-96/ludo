import type { PlayerColor } from "@ludo/shared";

export const GRID = 15;
export const CELL = 30;
export const BOARD_SIZE = GRID * CELL;

export const COLOR_HEX: Record<PlayerColor, string> = {
  red: "#E53E3E",
  blue: "#3182CE",
  green: "#38A169",
  yellow: "#D69E2E",
};

export const COLOR_LIGHT: Record<PlayerColor, string> = {
  red: "#FED7D7",
  blue: "#BEE3F8",
  green: "#C6F6D5",
  yellow: "#FEFCBF",
};

// 56-cell clockwise track [col, row]. Starts: red=0, blue=14, green=28, yellow=42
export const MAIN_TRACK: [number, number][] = [
  [6, 14],
  [6, 13],
  [6, 12],
  [6, 11],
  [6, 10],
  [6, 9],
  [6, 8],
  [5, 8],
  [4, 8],
  [3, 8],
  [2, 8],
  [1, 8],
  [0, 8],
  [0, 7],
  [0, 6],
  [1, 6],
  [2, 6],
  [3, 6],
  [4, 6],
  [5, 6],
  [6, 6],
  [6, 5],
  [6, 4],
  [6, 3],
  [6, 2],
  [6, 1],
  [6, 0],
  [7, 0],
  [8, 0],
  [8, 1],
  [8, 2],
  [8, 3],
  [8, 4],
  [8, 5],
  [8, 6],
  [9, 6],
  [10, 6],
  [11, 6],
  [12, 6],
  [13, 6],
  [14, 6],
  [14, 7],
  [14, 8],
  [13, 8],
  [12, 8],
  [11, 8],
  [10, 8],
  [9, 8],
  [8, 8],
  [8, 9],
  [8, 10],
  [8, 11],
  [8, 12],
  [8, 13],
  [8, 14],
  [7, 14],
];

export const HOME_COLUMNS: Record<PlayerColor, [number, number][]> = {
  red: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
    [7, 8],
  ],
  blue: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
    [6, 7],
  ],
  green: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6],
  ],
  yellow: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
    [8, 7],
  ],
};

export const HOME_CENTER: [number, number] = [7, 7];

export const BASE_POSITIONS: Record<PlayerColor, [number, number][]> = {
  red: [
    [2, 11],
    [4, 11],
    [2, 13],
    [4, 13],
  ],
  blue: [
    [2, 2],
    [4, 2],
    [2, 4],
    [4, 4],
  ],
  green: [
    [10, 2],
    [12, 2],
    [10, 4],
    [12, 4],
  ],
  yellow: [
    [10, 11],
    [12, 11],
    [10, 13],
    [12, 13],
  ],
};

export const SAFE_ABSOLUTE = new Set([1, 9, 15, 23, 29, 37, 43, 51]);

export const positionToSVG = (
  color: PlayerColor,
  relativePos: number,
  pawnIndex: number,
): { x: number; y: number } => {
  const PLAYER_STARTS: Record<PlayerColor, number> = {
    red: 0,
    blue: 14,
    green: 28,
    yellow: 42,
  };

  if (relativePos === -1) {
    const [col, row] = BASE_POSITIONS[color][pawnIndex];
    return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
  }

  if (relativePos === 62) {
    const [col, row] = HOME_CENTER;
    const offsets = [
      [-4, -4],
      [4, -4],
      [-4, 4],
      [4, 4],
    ];
    return {
      x: col * CELL + CELL / 2 + offsets[pawnIndex][0],
      y: row * CELL + CELL / 2 + offsets[pawnIndex][1],
    };
  }

  if (relativePos >= 56 && relativePos <= 61) {
    const [col, row] = HOME_COLUMNS[color][relativePos - 56];
    return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
  }

  const absolutePos = (PLAYER_STARTS[color] + relativePos) % 56;
  const trackEntry = MAIN_TRACK[absolutePos];
  if (!trackEntry) return { x: 0, y: 0 };
  const [col, row] = trackEntry;
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
};
