import { type FC, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board } from './Board';
import { GameControls } from './GameControls';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { WinnerScreen } from './WinnerScreen';
import { useGameStore } from '@/store/gameStore';
import { useRoomStore } from '@/store/roomStore';
import { getSocket } from '@/lib/socket';
import type { Room, GameState, PawnIndex } from '@ludo/shared';

interface GameViewProps {
  room: Room;
  gameState: GameState;
  currentUserId: string;
}

export const GameView: FC<GameViewProps> = ({ room, gameState, currentUserId }) => {
  const navigate = useNavigate();
  const { disconnectedUserId } = useGameStore();
  const { isSocketConnected, isSocketReconnectFailed, gracePeriodRemaining } = useRoomStore();
  const [moveError, setMoveError] = useState<string | null>(null);

  const isMyTurn = gameState.currentTurnUserId === currentUserId;
  const selectablePawnIndices =
    isMyTurn && gameState.lastDiceValue !== null ? gameState.validMoves : [];

  // Single move handler — both Board click and GameControls button use this
  const handlePawnSelect = useCallback(
    (pawnIndex: PawnIndex): void => {
      if (!selectablePawnIndices.includes(pawnIndex)) return;
      setMoveError(null);

      try {
        const socket = getSocket();
        socket.emit('move:pawn', { roomCode: room.code, pawnIndex }, (res) => {
          if (!res.ok) setMoveError(res.error ?? 'Invalid move');
        });
      } catch {
        setMoveError('Not connected');
      }
    },
    [room.code, selectablePawnIndices]
  );

  if (gameState.status === 'completed' && gameState.winnerId) {
    return (
      <WinnerScreen
        gameState={gameState}
        currentUserId={currentUserId}
        roomCode={room.code}
      />
    );
  }

  const disconnectedPlayer = disconnectedUserId
    ? gameState.players.find((p) => p.userId === disconnectedUserId)
    : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Own socket reconnecting overlay */}
      {!isSocketConnected && (
        <div className="flex items-center justify-center gap-2 bg-red-900/90 px-4 py-2 text-center text-sm text-red-200">
          {isSocketReconnectFailed ? (
            <>
              <span>Connection lost.</span>
              <button
                onClick={() => navigate('/lobby')}
                className="underline hover:no-underline"
              >
                Return to lobby
              </button>
            </>
          ) : (
            <>
              <span role="status" aria-label="Reconnecting" className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
              Reconnecting…
            </>
          )}
        </div>
      )}

      {/* Opponent disconnection banner with countdown */}
      {disconnectedPlayer && gameState.status === 'paused' && (
        <div className="bg-amber-900/80 px-4 py-2 text-center text-sm text-amber-200">
          <span className="font-semibold">{disconnectedPlayer.displayName}</span> disconnected
          {gracePeriodRemaining !== null && gracePeriodRemaining > 0
            ? ` — ${gracePeriodRemaining}s to reconnect before forfeit`
            : ' — forfeiting…'}
        </div>
      )}

      {/* Board */}
      <div className="flex flex-1 items-center justify-center p-4">
        <Board
          gameState={gameState}
          currentUserId={currentUserId}
          selectablePawnIndices={selectablePawnIndices}
          onPawnClick={handlePawnSelect}
        />
      </div>

      {/* Controls + Chat */}
      <div className="flex flex-col gap-2 border-t border-slate-800 p-4">
        <GameControls
          gameState={gameState}
          currentUserId={currentUserId}
          roomCode={room.code}
          onPawnSelected={handlePawnSelect}
          moveError={moveError}
        />

        <details className="group">
          <summary className="cursor-pointer list-none rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-400 hover:text-white">
            💬 Chat
          </summary>
          <div className="mt-2 h-48">
            <ChatPanel roomCode={room.code} />
          </div>
        </details>
      </div>
    </div>
  );
};
