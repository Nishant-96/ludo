import { type FC } from 'react';
import { BoardCell } from './BoardCell';
import { Pawn } from './Pawn';
import { GRID, BOARD_SIZE, positionToSVG } from './boardLayout';
import { useGameStore } from '@/store/gameStore';
import type { GameState, PawnIndex } from '@ludo/shared';

interface BoardProps {
  gameState: GameState;
  currentUserId: string;
  selectablePawnIndices: PawnIndex[];
  onPawnClick: (pawnIndex: PawnIndex) => void;
}

export const Board: FC<BoardProps> = ({
  gameState,
  currentUserId,
  selectablePawnIndices,
  onPawnClick,
}) => {
  const { killedPawnId } = useGameStore();
  const isMyTurn = gameState.currentTurnUserId === currentUserId;

  return (
    <svg
      viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
      className="w-full max-w-[min(100vw,60vh)] touch-none select-none"
      aria-label="Ludo board"
    >
      {/* Board cells */}
      {Array.from({ length: GRID }, (_, row) =>
        Array.from({ length: GRID }, (_, col) => (
          <BoardCell key={`${col}-${row}`} col={col} row={row} />
        ))
      )}

      {/* Pawns — rendered on top of cells */}
      {gameState.players.flatMap((player) =>
        player.pawns.map((pawn) => {
          const { x, y } = positionToSVG(player.color, pawn.position, pawn.index);
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
        })
      )}
    </svg>
  );
};
