import { type FC } from 'react';
import { motion } from 'framer-motion';
import { COLOR_HEX } from './boardLayout';
import type { PlayerColor } from '@ludo/shared';

interface PawnProps {
  color: PlayerColor;
  x: number;
  y: number;
  isSelectable: boolean;
  isCurrentPlayer: boolean;
  isJustKilled: boolean;
  onClick: () => void;
}

const PAWN_RADIUS = 9;
const PAWN_INNER_RADIUS = 5;

export const Pawn: FC<PawnProps> = ({ color, x, y, isSelectable, isCurrentPlayer, isJustKilled, onClick }) => {
  const fill = COLOR_HEX[color];

  return (
    <motion.g
      animate={{ x, y }}
      transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
      initial={false}
      style={{ cursor: isSelectable ? 'pointer' : 'default' }}
      onClick={isSelectable ? onClick : undefined}
    >
      {/* Kill flash ring — briefly visible when this pawn was just killed */}
      {isJustKilled && (
        <motion.circle
          cx={0}
          cy={0}
          r={PAWN_RADIUS + 6}
          fill="none"
          stroke="#EF4444"
          strokeWidth={3}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}

      {/* Selectable pulse ring */}
      {isSelectable && (
        <motion.circle
          cx={0}
          cy={0}
          r={PAWN_RADIUS + 4}
          fill="none"
          stroke={fill}
          strokeWidth={2}
          animate={{ opacity: [1, 0.2, 1], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}

      {/* Outer circle — flash white on kill */}
      <motion.circle
        cx={0}
        cy={0}
        r={PAWN_RADIUS}
        fill={isJustKilled ? '#EF4444' : fill}
        stroke="white"
        strokeWidth={1.5}
        animate={{ fill: isJustKilled ? ['#EF4444', fill] : fill }}
        transition={{ duration: 0.5 }}
      />

      {/* Inner circle */}
      <circle cx={0} cy={0} r={PAWN_INNER_RADIUS} fill="white" opacity={0.4} />

      {/* Current player dot */}
      {isCurrentPlayer && (
        <circle cx={0} cy={0} r={2.5} fill="white" />
      )}
    </motion.g>
  );
};
