import { type FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RoomLobby } from '@/components/room/RoomLobby';
import { GameView } from '@/components/game/GameView';
import { useUserStore } from '@/store/userStore';
import { useRoomStore } from '@/store/roomStore';
import { useGameStore } from '@/store/gameStore';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/Button';

export const RoomPage: FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { room, setRoom, clearRoom } = useRoomStore();
  const { gameState, clearGame } = useGameStore();
  const [isJoining, setIsJoining] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !user) return;

    const socket = getSocket();

    const joinRoom = (): void => {
      socket.emit('room:join', { roomCode: code }, (res) => {
        if (res.ok && res.data) {
          setRoom(res.data.room);
        } else {
          setJoinError(res.error ?? 'Failed to join room');
        }
        setIsJoining(false);
      });
    };

    if (socket.connected) joinRoom();
    // Also handles reconnects — server cancels the forfeit timer on reconnect
    socket.on('connect', joinRoom);

    return () => {
      socket.off('connect', joinRoom);
      clearRoom();
      clearGame();
    };
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isJoining) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-900">
        <div role="status" aria-label="Joining room" className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
      </div>
    );
  }

  if (joinError || !room || !user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-900 px-4 text-center">
        <p className="text-red-400">{joinError ?? 'Room not found'}</p>
        <Button onClick={() => navigate('/lobby')}>Back to Lobby</Button>
      </div>
    );
  }

  const isGameActive = gameState !== null && gameState.status !== 'waiting';

  return (
    <div className="flex min-h-dvh flex-col bg-slate-900">
      {!isGameActive && (
        <header className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>← Lobby</Button>
          <span className="text-sm font-medium text-slate-400">Room · {room.code}</span>
        </header>
      )}
      {isGameActive ? (
        <GameView room={room} gameState={gameState} currentUserId={user.id} />
      ) : (
        <RoomLobby room={room} currentUserId={user.id} onGameStart={() => {}} />
      )}
    </div>
  );
};
