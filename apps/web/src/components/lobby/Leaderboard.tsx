import { type FC } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import type { LeaderboardEntry } from '@ludo/shared';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  currentUserId: string;
  previewCount?: number;
}

const RANK_ICON: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export const Leaderboard: FC<LeaderboardProps> = ({
  entries,
  isLoading,
  currentUserId,
  previewCount,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-2" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-500">No players yet</p>;
  }

  const displayEntries = previewCount ? entries.slice(0, previewCount) : entries;

  return (
    <ol className="flex flex-col gap-0.5">
      {displayEntries.map((entry) => {
        const isMe = entry.userId === currentUserId;
        return (
          <li
            key={entry.userId}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isMe ? 'bg-primary/15 border border-primary/20' : 'hover:bg-surface-2'
            }`}
          >
            <span className="w-6 text-center text-sm">
              {RANK_ICON[entry.rank] ?? (
                <span className="text-slate-500 font-medium">{entry.rank}</span>
              )}
            </span>
            <Avatar src={entry.avatarUrl} displayName={entry.displayName} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
              {entry.displayName}
              {isMe && <span className="ml-1 text-xs text-primary">(You)</span>}
            </span>
            <span className="shrink-0 flex items-center gap-1 text-sm font-semibold text-coin">
              <span className="text-xs">🪙</span>
              {entry.balance.toLocaleString()}
            </span>
          </li>
        );
      })}
    </ol>
  );
};
