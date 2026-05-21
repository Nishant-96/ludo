import { type FC } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { RoomPlayer } from '@ludo/shared';

interface PlayerSlotProps {
  player: RoomPlayer | null;
  slotNumber: number;
  isHost?: boolean;
}

const COLOR_RING: Record<string, string> = {
  red:    'border-ludo-red/60 bg-ludo-red/5',
  blue:   'border-ludo-blue/60 bg-ludo-blue/5',
  green:  'border-ludo-green/60 bg-ludo-green/5',
  yellow: 'border-ludo-yellow/60 bg-ludo-yellow/5',
};

const COLOR_DOT: Record<string, string> = {
  red:    'bg-ludo-red',
  blue:   'bg-ludo-blue',
  green:  'bg-ludo-green',
  yellow: 'bg-ludo-yellow',
};

export const PlayerSlot: FC<PlayerSlotProps> = ({ player, slotNumber, isHost = false }) => {
  if (!player) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 border border-border text-slate-600 text-sm font-bold">
          {slotNumber}
        </div>
        <span className="text-sm text-slate-600">Waiting for player…</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${COLOR_RING[player.color] ?? 'border-border bg-surface-2'}`}>
      <Avatar src={player.avatarUrl} displayName={player.displayName} size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">{player.displayName}</span>
          {isHost && <span className="text-sm">👑</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${COLOR_DOT[player.color] ?? 'bg-slate-600'}`} />
          <span className="text-xs capitalize text-slate-500">{player.color}</span>
        </div>
      </div>
      <div className="shrink-0">
        {!player.isConnected ? (
          <Badge variant="warning">Reconnecting…</Badge>
        ) : isHost ? (
          <Badge variant="host">Host</Badge>
        ) : (
          <Badge variant="ready">Ready</Badge>
        )}
      </div>
    </div>
  );
};
