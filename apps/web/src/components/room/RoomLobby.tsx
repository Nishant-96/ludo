import { type FC, useState } from 'react';
import { PlayerSlot } from './PlayerSlot';
import { Button } from '@/components/ui/Button';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { getSocket } from '@/lib/socket';
import type { Room } from '@ludo/shared';
import { ENTRY_FEE, PAYOUT_PERCENTAGE } from '@/lib/constants';

interface RoomLobbyProps {
  room: Room;
  currentUserId: string;
  onGameStart: () => void;
}

export const RoomLobby: FC<RoomLobbyProps> = ({ room, currentUserId, onGameStart }) => {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isHost = room.createdBy === currentUserId;
  const hasMinPlayers = room.players.length >= 2;
  const canStart = isHost && hasMinPlayers;

  const shareUrl = `${window.location.origin}/room/${room.code}`;

  const handleCopyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = (): void => {
    setIsStarting(true);
    setError(null);

    try {
      const socket = getSocket();
      socket.emit('game:start', { roomCode: room.code }, (res) => {
        if (res.ok) {
          onGameStart();
          setIsStarting(false);
        } else {
          setError(res.error ?? 'Failed to start game');
          setIsStarting(false);
        }
      });
    } catch {
      setError('Not connected. Please refresh.');
      setIsStarting(false);
    }
  };

  const slots = Array.from({ length: room.capacity }, (_, i) => room.players[i] ?? null);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2 rounded-xl bg-slate-800 p-4">
        <p className="text-xs text-slate-400">Invite link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate text-sm text-white">{shareUrl}</code>
          <Button variant="secondary" size="sm" onClick={() => void handleCopyLink()}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-400">
          Players ({room.players.length}/{room.capacity})
        </p>
        {slots.map((player, i) => (
          <PlayerSlot key={player?.userId ?? `empty-${i}`} player={player} slotNumber={i + 1} />
        ))}
      </div>

      <ChatPanel roomCode={room.code} />

      <div className="rounded-xl bg-slate-800/50 px-4 py-3 text-sm text-slate-400">
        Entry fee: <span className="font-semibold text-amber-400">{ENTRY_FEE} coins</span> per player ·
        Winner gets{' '}
        <span className="font-semibold text-emerald-400">
          {Math.floor(room.players.length * ENTRY_FEE * PAYOUT_PERCENTAGE)} coins
        </span>
      </div>

      {error !== null && <p className="text-sm text-red-400">{error}</p>}

      {isHost ? (
        <Button
          onClick={handleStart}
          isLoading={isStarting}
          disabled={!canStart}
          size="lg"
          className="w-full"
        >
          {hasMinPlayers ? `Start Game (${room.players.length}/${room.capacity})` : `Waiting for players… (${room.players.length}/${room.capacity})`}
        </Button>
      ) : (
        <div className="rounded-xl bg-slate-800/50 py-3 text-center text-sm text-slate-400">
          Waiting for host to start the game…
        </div>
      )}
    </div>
  );
};
