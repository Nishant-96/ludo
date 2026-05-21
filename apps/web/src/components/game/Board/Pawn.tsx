import { type FC } from "react";
import { motion } from "framer-motion";
import { COLOR_HEX } from "./boardLayout";
import type { PlayerColor } from "@ludo/shared";

interface PawnProps {
  color: PlayerColor;
  x: number;
  y: number;
  isSelectable: boolean;
  isCurrentPlayer: boolean;
  isJustKilled: boolean;
  onClick: () => void;
}

const PAWN_RADIUS = 10;
const PAWN_INNER_RADIUS = 6;
const PAWN_STEM_RADIUS = 4;

export const Pawn: FC<PawnProps> = ({
  color,
  x,
  y,
  isSelectable,
  isCurrentPlayer,
  isJustKilled,
  onClick,
}) => {
  const fill = COLOR_HEX[color];

  return (
    <motion.g
      animate={{ x, y }}
      transition={{ type: "tween", duration: 0.18, ease: "easeInOut" }}
      initial={false}
      style={{ cursor: isSelectable ? "pointer" : "default" }}
      onClick={isSelectable ? onClick : undefined}
    >
      {isJustKilled && (
        <motion.circle
          cx={0}
          cy={0}
          r={PAWN_RADIUS + 7}
          fill="none"
          stroke="#EF4444"
          strokeWidth={3}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 2.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      )}

      {isSelectable && (
        <>
          <motion.circle
            cx={0}
            cy={0}
            r={PAWN_RADIUS + 7}
            fill={fill}
            opacity={0}
            animate={{ opacity: [0, 0.25, 0], scale: [0.9, 1.3, 0.9] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          />
          <motion.circle
            cx={0}
            cy={0}
            r={PAWN_RADIUS + 3}
            fill="none"
            stroke={fill}
            strokeWidth={2}
            animate={{
              opacity: [1, 0.3, 1],
              r: [PAWN_RADIUS + 3, PAWN_RADIUS + 6, PAWN_RADIUS + 3],
            }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        </>
      )}

      <circle cx={1} cy={2} r={PAWN_RADIUS} fill="black" opacity={0.25} />

      <motion.circle
        cx={0}
        cy={0}
        r={PAWN_RADIUS}
        fill={isJustKilled ? "#EF4444" : fill}
        stroke="white"
        strokeWidth={2}
        animate={{ fill: isJustKilled ? ["#EF4444", fill] : fill }}
        transition={{ duration: 0.5 }}
      />

      <circle cx={0} cy={0} r={PAWN_INNER_RADIUS} fill="white" opacity={0.3} />

      <circle
        cx={0}
        cy={0}
        r={PAWN_STEM_RADIUS}
        fill="white"
        opacity={isCurrentPlayer ? 0.9 : 0.15}
      />

      {isCurrentPlayer && (
        <motion.circle
          cx={0}
          cy={0}
          r={2.5}
          fill="white"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </motion.g>
  );
};
