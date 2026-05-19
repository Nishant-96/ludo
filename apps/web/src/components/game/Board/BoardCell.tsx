import { type FC } from 'react';
import { CELL, COLOR_LIGHT, SAFE_ABSOLUTE, MAIN_TRACK } from './boardLayout';
import type { PlayerColor } from '@ludo/shared';

interface BoardCellProps {
  col: number;
  row: number;
}

// Derive cell type from position in the 15×15 grid
const getCellType = (col: number, row: number): {
  type: 'base' | 'home-column' | 'home-center' | 'safe' | 'normal' | 'empty';
  color?: PlayerColor;
} => {
  // Home center
  if (col === 7 && row === 7) return { type: 'home-center' };

  // Base areas (the 6×6 colored squares in each corner, minus playable cells)
  if (col <= 5 && row <= 5) return { type: 'base', color: 'blue' };
  if (col >= 9 && row <= 5) return { type: 'base', color: 'green' };
  if (col <= 5 && row >= 9) return { type: 'base', color: 'red' };
  if (col >= 9 && row >= 9) return { type: 'base', color: 'yellow' };

  // Home columns
  if (col === 7 && row >= 9 && row <= 13) return { type: 'home-column', color: 'red' };
  if (row === 7 && col >= 1 && col <= 5)  return { type: 'home-column', color: 'blue' };
  if (col === 7 && row >= 1 && row <= 5)  return { type: 'home-column', color: 'green' };
  if (row === 7 && col >= 9 && col <= 13) return { type: 'home-column', color: 'yellow' };

  // Check if this cell is a safe tile on the main track
  const trackIdx = MAIN_TRACK.findIndex(([c, r]) => c === col && r === row);
  if (trackIdx >= 0 && SAFE_ABSOLUTE.has(trackIdx)) return { type: 'safe' };

  // Main track
  if (trackIdx >= 0) return { type: 'normal' };

  return { type: 'empty' };
};

export const BoardCell: FC<BoardCellProps> = ({ col, row }) => {
  const x = col * CELL;
  const y = row * CELL;
  const { type, color } = getCellType(col, row);

  if (type === 'empty') {
    return <rect x={x} y={y} width={CELL} height={CELL} fill="#1e293b" />;
  }

  if (type === 'home-center') {
    return (
      <rect x={x} y={y} width={CELL} height={CELL} fill="#334155" stroke="#475569" strokeWidth={0.5} />
    );
  }

  if (type === 'base' && color) {
    return (
      <rect x={x} y={y} width={CELL} height={CELL} fill={COLOR_LIGHT[color]} opacity={0.3} />
    );
  }

  if (type === 'home-column' && color) {
    return (
      <rect x={x} y={y} width={CELL} height={CELL} fill={COLOR_LIGHT[color]} opacity={0.5} stroke="#475569" strokeWidth={0.5} />
    );
  }

  if (type === 'safe') {
    return (
      <g>
        <rect x={x} y={y} width={CELL} height={CELL} fill="#1e293b" stroke="#475569" strokeWidth={0.5} />
        {/* Star marker for safe tiles */}
        <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle" fontSize={12} fill="#94a3b8">★</text>
      </g>
    );
  }

  // Normal track cell
  return (
    <rect x={x} y={y} width={CELL} height={CELL} fill="#1e293b" stroke="#334155" strokeWidth={0.5} />
  );
};
