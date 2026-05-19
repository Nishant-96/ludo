import { type FC } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import type { RoomPlayer } from '@ludo/shared';

interface PlayerSlotProps {
  player: RoomPlayer | null; // null = empty slot
  slotNumber: number;
}

const COLOR_CLASSES: Record<string, string> = {
  red:    'border-ludo-red bg-ludo-red/10',
  blue:   'border-ludo-blue bg-ludo-blue/10',
  green:  'border-ludo-green bg-ludo-green/10',
  yellow: 'border-ludo-yellow bg-ludo-yellow/10',
};

const COLOR_DOT: Record<string, string> = {
  red:    'bg-ludo-red',
  blue:   'bg-ludo-blue',
  green:  'bg-ludo-green',
  yellow: 'bg-ludo-yellow',
};

export const PlayerSlot: FC<PlayerSlotProps> = ({ player, slotNumber }) => {
  if (!player) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-700 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-600 text-sm">
          {slotNumber}
        </div>
        <span className="text-sm text-slate-600">Waiting for player…</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${COLOR_CLASSES[player.color] ?? 'border-slate-700'}`}>
      <Avatar src={player.avatarUrl} displayName={player.displayName} size="md" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white">{player.displayName}</span>
          {!player.isConnected && (
            <span className="shrink-0 text-xs text-amber-400">Reconnecting…</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${COLOR_DOT[player.color] ?? 'bg-slate-600'}`} />
          <span className="text-xs capitalize text-slate-400">{player.color}</span>
        </div>
      </div>
    </div>
  );
};
