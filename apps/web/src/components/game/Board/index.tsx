import { type FC } from "react";
import { BoardCell } from "./BoardCell";
import { Pawn } from "./Pawn";
import { GRID, BOARD_SIZE, positionToSVG } from "./boardLayout";
import { useGameStore } from "@/store/gameStore";
import type { GameState, PawnIndex } from "@ludo/shared";

interface BoardProps {
  gameState: GameState;
  currentUserId: string;
  selectablePawnIndices: PawnIndex[];
  onPawnClick: (pawnIndex: PawnIndex) => void;
}

const BORDER = 4;

export const Board: FC<BoardProps> = ({
  gameState,
  currentUserId,
  selectablePawnIndices,
  onPawnClick,
}) => {
  const { killedPawnId, animatingPawnPositions } = useGameStore();
  const isMyTurn = gameState.currentTurnUserId === currentUserId;
  const totalSize = BOARD_SIZE + BORDER * 2;

  return (
    <svg
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      className="w-full max-w-[min(96vw,56vh)] touch-none select-none drop-shadow-2xl"
      aria-label="Ludo board"
    >
      <rect
        x={0}
        y={0}
        width={totalSize}
        height={totalSize}
        rx={6}
        fill="#111827"
        stroke="#374151"
        strokeWidth={1}
      />

      <g transform={`translate(${BORDER}, ${BORDER})`}>
        {Array.from({ length: GRID }, (_, row) =>
          Array.from({ length: GRID }, (_, col) => (
            <BoardCell key={`${col}-${row}`} col={col} row={row} />
          )),
        )}

        <rect
          x={0}
          y={0}
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          fill="none"
          stroke="#4B5563"
          strokeWidth={1}
        />

        {gameState.players.flatMap((player) =>
          player.pawns.map((pawn) => {
            const displayPosition =
              animatingPawnPositions[pawn.id] ?? pawn.position;
            const { x, y } = positionToSVG(
              player.color,
              displayPosition,
              pawn.index,
            );
            const isSelectable =
              isMyTurn &&
              player.userId === currentUserId &&
              selectablePawnIndices.includes(pawn.index);

            return (
              <Pawn
                key={pawn.id}
                color={player.color}
                x={x}
                y={y}
                isSelectable={isSelectable}
                isCurrentPlayer={player.userId === gameState.currentTurnUserId}
                isJustKilled={pawn.id === killedPawnId}
                onClick={() => onPawnClick(pawn.index)}
              />
            );
          }),
        )}
      </g>
    </svg>
  );
};
