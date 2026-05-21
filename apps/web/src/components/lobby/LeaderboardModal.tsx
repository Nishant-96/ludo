import { type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import type { LeaderboardEntry } from "@ludo/shared";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
  isLoading: boolean;
  currentUserId: string;
}

const RANK_ICON: Record<number, string> = { 1: "👑", 2: "🥈", 3: "🥉" };

const RANK_STYLE: Record<number, string> = {
  1: "text-amber-400 font-black",
  2: "text-slate-300 font-bold",
  3: "text-amber-700 font-bold",
};

export const LeaderboardModal: FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  entries,
  isLoading,
  currentUserId,
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-bg"
        role="dialog"
        aria-modal="true"
        aria-label="Leaderboard"
      >
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-4">
          <h2 className="text-lg font-black text-white">Leaderboard</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-surface/50">
          <span className="w-8 text-center text-xs font-semibold text-slate-500 uppercase">
            Rank
          </span>
          <span className="flex-1 text-xs font-semibold text-slate-500 uppercase">
            Player
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Coins
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-surface-2"
                />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No players yet
            </p>
          ) : (
            <ol className="flex flex-col gap-0.5 p-3">
              {entries.map((entry) => {
                const isMe = entry.userId === currentUserId;
                return (
                  <motion.li
                    key={entry.userId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(entry.rank * 0.03, 0.4) }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                      isMe
                        ? "bg-primary/15 border border-primary/25"
                        : "hover:bg-surface-2"
                    }`}
                  >
                    <div className="w-8 flex items-center justify-center">
                      {RANK_ICON[entry.rank] ? (
                        <span className="text-lg">{RANK_ICON[entry.rank]}</span>
                      ) : (
                        <span
                          className={`text-sm ${RANK_STYLE[entry.rank] ?? "text-slate-500"}`}
                        >
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    <Avatar
                      src={entry.avatarUrl}
                      displayName={entry.displayName}
                      size="md"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                      {entry.displayName}
                      {isMe && (
                        <span className="ml-1.5 text-xs font-semibold text-primary">
                          (You)
                        </span>
                      )}
                    </span>

                    <span className="shrink-0 flex items-center gap-1 text-sm font-bold text-coin">
                      <span className="text-xs">🪙</span>
                      {entry.balance.toLocaleString()}
                    </span>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="border-t border-border bg-surface px-4 py-3 text-center">
          <p className="text-xs text-slate-500">
            Leaderboards update in real-time
          </p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
