import { type FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Link2 } from 'lucide-react';
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
    socket.on('connect', joinRoom);

    return () => {
      socket.off('connect', joinRoom);
      clearRoom();
      clearGame();
    };
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isJoining) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div
            role="status"
            aria-label="Joining room"
            className="h-10 w-10 animate-spin rounded-full border-2 border-surface-3 border-t-primary"
          />
          <p className="text-sm text-slate-400">Joining room…</p>
        </div>
      </div>
    );
  }

  if (joinError || !room || !user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
        <div className="card p-8 flex flex-col items-center gap-4 max-w-xs w-full">
          <span className="text-4xl">😕</span>
          <p className="text-red-400 font-medium">{joinError ?? 'Room not found'}</p>
          <Button onClick={() => navigate('/lobby')} className="w-full">Back to Lobby</Button>
        </div>
      </div>
    );
  }

  const isGameActive = gameState !== null && gameState.status !== 'waiting';

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      {!isGameActive && (
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <button
            onClick={() => {
              if (!gameState && room) {
                getSocket().emit('room:leave', { roomCode: room.code });
              }
              navigate('/lobby');
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Back to lobby"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-bold text-white">Room: {room.code}</span>
          <button
            onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/room/${room.code}`); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Copy room link"
            title="Copy invite link"
          >
            <Link2 size={15} />
          </button>
        </header>
      )}
      {isGameActive ? (
        <GameView room={room} gameState={gameState} currentUserId={user.id} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <RoomLobby room={room} currentUserId={user.id} onGameStart={() => {}} />
        </div>
      )}
    </div>
  );
};
