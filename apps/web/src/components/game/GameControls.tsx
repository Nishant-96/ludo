import { type FC } from 'react';
import { Dice } from './Dice';
import { Timer } from './Timer';
import { Avatar } from '@/components/ui/Avatar';
import type { GameState, PawnIndex } from '@ludo/shared';

interface GameControlsProps {
  gameState: GameState;
  currentUserId: string;
  roomCode: string;
  onPawnSelected: (pawnIndex: PawnIndex) => void;
  moveError: string | null;
}

export const GameControls: FC<GameControlsProps> = ({
  gameState,
  currentUserId,
  roomCode,
  onPawnSelected,
  moveError,
}) => {
  const isMyTurn = gameState.currentTurnUserId === currentUserId;
  const hasRolled = gameState.lastDiceValue !== null;
  const activePlayer = gameState.players.find(
    (p) => p.userId === gameState.currentTurnUserId
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-slate-800 p-4">
      {/* Current turn indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activePlayer && (
            <Avatar
              src={null}
              displayName={activePlayer.displayName}
              size="sm"
            />
          )}
          <div>
            <p className="text-xs text-slate-400">Current turn</p>
            <p className="text-sm font-semibold text-white">
              {isMyTurn ? 'Your turn' : `${activePlayer?.displayName ?? '…'}'s turn`}
            </p>
          </div>
        </div>
        <Timer timeRemaining={gameState.timeRemaining} />
      </div>

      {/* Dice */}
      <div className="flex items-center justify-between">
        <Dice
          roomCode={roomCode}
          diceValue={gameState.lastDiceValue}
          isMyTurn={isMyTurn}
          hasRolled={hasRolled}
        />

        {/* Valid pawn selection prompt */}
        {isMyTurn && hasRolled && gameState.validMoves.length > 0 && (
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-slate-400">Select a pawn to move</p>
            <div className="flex gap-1">
              {gameState.validMoves.map((pawnIdx) => (
                <button
                  key={pawnIdx}
                  onClick={() => onPawnSelected(pawnIdx)}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  Pawn {pawnIdx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {isMyTurn && hasRolled && gameState.validMoves.length === 0 && (
          <p className="text-xs text-slate-400">No valid moves — skipping…</p>
        )}
      </div>

      {moveError !== null && <p className="text-xs text-red-400">{moveError}</p>}
    </div>
  );
};
