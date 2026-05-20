import { type FC, useState } from 'react';
import { Dice } from './Dice';
import { Timer } from './Timer';
import { Avatar } from '@/components/ui/Avatar';
import { getSocket } from '@/lib/socket';
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
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [isForfeiting, setIsForfeiting] = useState(false);

  const isMyTurn = gameState.currentTurnUserId === currentUserId;
  const hasRolled = gameState.lastDiceValue !== null;
  const currentPlayer = gameState.players.find((p) => p.userId === currentUserId);
  const isForfeited = currentPlayer?.isForfeited ?? false;
  const activePlayer = gameState.players.find(
    (p) => p.userId === gameState.currentTurnUserId
  );

  const handleForfeit = (): void => {
    setIsForfeiting(true);
    try {
      const socket = getSocket();
      socket.emit('game:forfeit', { roomCode }, (res) => {
        setIsForfeiting(false);
        setShowForfeitConfirm(false);
        if (!res.ok) setShowForfeitConfirm(false);
      });
    } catch {
      setIsForfeiting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-slate-800 p-4">
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

      <div className="flex items-center justify-between">
        <Dice
          roomCode={roomCode}
          diceValue={gameState.lastDiceValue}
          isMyTurn={isMyTurn}
          hasRolled={hasRolled}
        />

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

      {!isForfeited && (
        <div className="flex items-center justify-end border-t border-slate-700 pt-2">
          {showForfeitConfirm ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Forfeit this game?</span>
              <button
                onClick={handleForfeit}
                disabled={isForfeiting}
                className="rounded bg-red-600 px-2.5 py-1 font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {isForfeiting ? 'Forfeiting…' : 'Yes, forfeit'}
              </button>
              <button
                onClick={() => setShowForfeitConfirm(false)}
                className="rounded bg-slate-600 px-2.5 py-1 font-medium text-slate-300 hover:bg-slate-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowForfeitConfirm(true)}
              className="text-xs text-slate-500 hover:text-red-400"
            >
              Forfeit
            </button>
          )}
        </div>
      )}
    </div>
  );
};
