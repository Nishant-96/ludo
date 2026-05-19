import { type FC } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import type { LeaderboardEntry } from '@ludo/shared';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  currentUserId: string;
}

const RANK_STYLES: Record<number, string> = {
  1: 'text-amber-400 font-bold',
  2: 'text-slate-300 font-semibold',
  3: 'text-amber-700 font-semibold',
};

export const Leaderboard: FC<LeaderboardProps> = ({ entries, isLoading, currentUserId }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-800" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-500">No players yet</p>;
  }

  return (
    <ol className="flex flex-col gap-1">
      {entries.map((entry) => (
        <li
          key={entry.userId}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
            entry.userId === currentUserId ? 'bg-indigo-900/40' : 'hover:bg-slate-800/60'
          }`}
        >
          <span className={`w-5 text-center text-sm ${RANK_STYLES[entry.rank] ?? 'text-slate-500'}`}>
            {entry.rank}
          </span>
          <Avatar src={entry.avatarUrl} displayName={entry.displayName} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
            {entry.displayName}
            {entry.userId === currentUserId && (
              <span className="ml-1 text-xs text-indigo-400">(you)</span>
            )}
          </span>
          <span className="shrink-0 text-sm font-medium text-amber-400">
            {entry.balance.toLocaleString()}
          </span>
        </li>
      ))}
    </ol>
  );
};
