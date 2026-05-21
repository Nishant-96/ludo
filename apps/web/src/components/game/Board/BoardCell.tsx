import { type FC } from "react";
import { CELL, SAFE_ABSOLUTE, MAIN_TRACK } from "./boardLayout";
import type { PlayerColor } from "@ludo/shared";

interface BoardCellProps {
  col: number;
  row: number;
}

const LUDO_COLOR: Record<PlayerColor, string> = {
  red: "#E53E3E",
  blue: "#3182CE",
  green: "#38A169",
  yellow: "#D69E2E",
};

const START_IDX_COLOR: Record<number, string> = {
  1: LUDO_COLOR.red,
  15: LUDO_COLOR.blue,
  29: LUDO_COLOR.green,
  43: LUDO_COLOR.yellow,
};

const TRACK_FILL = "#F8F6F0";
const TRACK_STROKE = "#D5D0C8";

interface BaseQuadrant {
  color: PlayerColor;
  originCol: number;
  originRow: number;
  pawnSpots: Set<string>;
  pawnCenterX: number;
  pawnCenterY: number;
}

const BASE_QUADRANTS: BaseQuadrant[] = [
  {
    color: "blue",
    originCol: 0,
    originRow: 0,
    pawnSpots: new Set(["2-2", "4-2", "2-4", "4-4"]),
    pawnCenterX: 105,
    pawnCenterY: 105,
  },
  {
    color: "green",
    originCol: 9,
    originRow: 0,
    pawnSpots: new Set(["10-2", "12-2", "10-4", "12-4"]),
    pawnCenterX: 345,
    pawnCenterY: 105,
  },
  {
    color: "red",
    originCol: 0,
    originRow: 9,
    pawnSpots: new Set(["2-11", "4-11", "2-13", "4-13"]),
    pawnCenterX: 105,
    pawnCenterY: 375,
  },
  {
    color: "yellow",
    originCol: 9,
    originRow: 9,
    pawnSpots: new Set(["10-11", "12-11", "10-13", "12-13"]),
    pawnCenterX: 345,
    pawnCenterY: 375,
  },
];

const findQuadrant = (col: number, row: number): BaseQuadrant | null => {
  for (const q of BASE_QUADRANTS) {
    if (
      col >= q.originCol &&
      col <= q.originCol + 5 &&
      row >= q.originRow &&
      row <= q.originRow + 5
    ) {
      return q;
    }
  }
  return null;
};

type CellType =
  | { kind: "home-center" }
  | {
      kind: "base-origin";
      color: PlayerColor;
      originCol: number;
      originRow: number;
      pawnCenterX: number;
      pawnCenterY: number;
    }
  | { kind: "base-pawn"; color: PlayerColor }
  | { kind: "base-fill"; color: PlayerColor }
  | { kind: "home-column"; color: PlayerColor }
  | { kind: "safe"; startColor: string | null }
  | { kind: "normal" };

const getCell = (col: number, row: number): CellType => {
  if (col === 7 && row === 7) return { kind: "home-center" };

  const key = `${col}-${row}`;
  const q = findQuadrant(col, row);
  if (q) {
    if (col === q.originCol && row === q.originRow) {
      return {
        kind: "base-origin",
        color: q.color,
        originCol: q.originCol,
        originRow: q.originRow,
        pawnCenterX: q.pawnCenterX,
        pawnCenterY: q.pawnCenterY,
      };
    }
    if (q.pawnSpots.has(key)) return { kind: "base-pawn", color: q.color };
    return { kind: "base-fill", color: q.color };
  }

  if (col === 7 && row >= 8 && row <= 13)
    return { kind: "home-column", color: "red" };
  if (row === 7 && col >= 1 && col <= 6)
    return { kind: "home-column", color: "blue" };
  if (col === 7 && row >= 1 && row <= 6)
    return { kind: "home-column", color: "green" };
  if (row === 7 && col >= 8 && col <= 13)
    return { kind: "home-column", color: "yellow" };

  const trackIdx = MAIN_TRACK.findIndex(([c, r]) => c === col && r === row);
  if (trackIdx >= 0) {
    if (SAFE_ABSOLUTE.has(trackIdx)) {
      return { kind: "safe", startColor: START_IDX_COLOR[trackIdx] ?? null };
    }
    return { kind: "normal" };
  }

  return { kind: "normal" };
};

const PAWN_RADIUS = CELL * 0.58;
const PAWN_STROKE = 3;

export const BoardCell: FC<BoardCellProps> = ({ col, row }) => {
  const x = col * CELL;
  const y = row * CELL;
  const cell = getCell(col, row);

  switch (cell.kind) {
    case "home-center": {
      const cx = x + CELL / 2;
      const cy = y + CELL / 2;
      return (
        <g>
          <rect x={x} y={y} width={CELL} height={CELL} fill="#111827" />
          <polygon
            points={`${x},${y} ${x + CELL},${y} ${cx},${cy}`}
            fill={LUDO_COLOR.green}
          />
          <polygon
            points={`${x + CELL},${y} ${x + CELL},${y + CELL} ${cx},${cy}`}
            fill={LUDO_COLOR.yellow}
          />
          <polygon
            points={`${x + CELL},${y + CELL} ${x},${y + CELL} ${cx},${cy}`}
            fill={LUDO_COLOR.red}
          />
          <polygon
            points={`${x},${y + CELL} ${x},${y} ${cx},${cy}`}
            fill={LUDO_COLOR.blue}
          />
          <line
            x1={x}
            y1={y}
            x2={cx}
            y2={cy}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={0.5}
          />
          <line
            x1={x + CELL}
            y1={y}
            x2={cx}
            y2={cy}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={0.5}
          />
          <line
            x1={x + CELL}
            y1={y + CELL}
            x2={cx}
            y2={cy}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={0.5}
          />
          <line
            x1={x}
            y1={y + CELL}
            x2={cx}
            y2={cy}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={0.5}
          />
        </g>
      );
    }

    case "base-origin": {
      const qx = cell.originCol * CELL;
      const qy = cell.originRow * CELL;
      const qSize = 6 * CELL;
      const fill = LUDO_COLOR[cell.color];

      const innerSize = 4 * CELL;
      const innerX = cell.pawnCenterX - innerSize / 2;
      const innerY = cell.pawnCenterY - innerSize / 2;

      return (
        <g>
          <rect x={qx} y={qy} width={qSize} height={qSize} fill={fill} />
          <rect
            x={innerX}
            y={innerY}
            width={innerSize}
            height={innerSize}
            fill="rgba(255,255,255,0.82)"
            stroke="white"
            strokeWidth={3}
            rx={6}
          />
        </g>
      );
    }

    case "base-pawn": {
      const cx = x + CELL / 2;
      const cy = y + CELL / 2;
      const fill = LUDO_COLOR[cell.color];
      return (
        <circle
          cx={cx}
          cy={cy}
          r={PAWN_RADIUS}
          fill={fill}
          stroke="white"
          strokeWidth={PAWN_STROKE}
        />
      );
    }

    case "base-fill":
      return (
        <rect
          x={x}
          y={y}
          width={CELL}
          height={CELL}
          fill={LUDO_COLOR[cell.color]}
          opacity={0}
        />
      );

    case "home-column": {
      const fill = LUDO_COLOR[cell.color];
      return (
        <g>
          <rect x={x} y={y} width={CELL} height={CELL} fill={fill} />
          <rect
            x={x}
            y={y}
            width={CELL}
            height={CELL}
            fill="none"
            stroke="rgba(0,0,0,0.12)"
            strokeWidth={0.4}
          />
        </g>
      );
    }

    case "safe": {
      const { startColor } = cell;
      const bg = startColor ?? TRACK_FILL;
      const starColor = startColor ? "white" : "#9CA3AF";
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={CELL}
            height={CELL}
            fill={bg}
            stroke={TRACK_STROKE}
            strokeWidth={0.5}
          />
          <text
            x={x + CELL / 2}
            y={y + CELL / 2 + 5}
            textAnchor="middle"
            fontSize={14}
            fill={starColor}
            fontWeight="bold"
          >
            ★
          </text>
        </g>
      );
    }

    case "normal":
      return (
        <rect
          x={x}
          y={y}
          width={CELL}
          height={CELL}
          fill={TRACK_FILL}
          stroke={TRACK_STROKE}
          strokeWidth={0.4}
        />
      );
  }
};
