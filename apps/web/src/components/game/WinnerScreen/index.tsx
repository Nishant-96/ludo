import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Confetti } from "./Confetti";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/gameStore";
import type { GameState } from "@ludo/shared";
import { ENTRY_FEE } from "@/lib/constants";

interface WinnerScreenProps {
  gameState: GameState;
  currentUserId: string;
  roomCode: string;
}

export const WinnerScreen: FC<WinnerScreenProps> = ({
  gameState,
  currentUserId,
  roomCode,
}) => {
  const navigate = useNavigate();
  const { matchPayouts, replayVoteState, replayCancelledReason } =
    useGameStore();
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const winner = gameState.players.find((p) => p.userId === gameState.winnerId);
  const isWinner = gameState.winnerId === currentUserId;
  const myPayout = matchPayouts?.[currentUserId] ?? null;
  const isMultiplayer =
    gameState.players.filter((p) => !p.isForfeited).length > 1;
  const activePlayers = gameState.players.filter((p) => !p.isForfeited).length;

  const sendVote = (vote: "yes" | "no"): void => {
    if (isVoting) return;
    setIsVoting(true);
    setVoteError(null);

    try {
      const socket = getSocket();
      socket.emit("game:replay:vote", { roomCode, vote }, (res) => {
        setIsVoting(false);
        if (res.ok) {
          if (vote === "yes") setHasVoted(true);
          else navigate("/lobby");
        } else {
          setVoteError(res.error ?? "Failed to submit vote");
        }
      });
    } catch {
      setIsVoting(false);
      setVoteError("Not connected");
    }
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-bg px-4 py-8">
      {isWinner && <Confetti />}

      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        className="relative z-10 mb-4 flex flex-col items-center"
      >
        {isWinner ? (
          <div className="relative">
            <span className="text-7xl drop-shadow-lg">🏆</span>
            <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-amber-900 shadow-lg">
              1
            </span>
          </div>
        ) : (
          <span className="text-6xl">🎮</span>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="relative z-10 text-center mb-2"
      >
        {isWinner ? (
          <>
            <h1 className="text-3xl font-black text-white">You Won!</h1>
            <p className="text-slate-400 text-sm mt-1">
              Congratulations! 🎉 You are the winner
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-white">
              {winner?.displayName ?? "Someone"} won!
            </h1>
            <p className="text-slate-400 text-sm mt-1">Better luck next time</p>
          </>
        )}
      </motion.div>

      {isWinner && myPayout !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          className="relative z-10 mb-4 flex flex-col items-center gap-1"
        >
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            You Received
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <span className="text-4xl font-black text-coin">+{myPayout}</span>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 w-full max-w-xs card p-4 mb-5"
      >
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Match Summary
        </p>
        <div className="flex flex-col gap-2.5">
          <SummaryRow
            label="Entry Fee"
            value={
              <span className="flex items-center gap-1">
                <span>🪙</span>
                {ENTRY_FEE}
              </span>
            }
          />
          <SummaryRow label="Players" value={activePlayers} />
          <SummaryRow label="Your Rank" value={isWinner ? "🥇 1st" : "—"} />
          {isWinner && myPayout !== null && (
            <div className="border-t border-border pt-2.5">
              <SummaryRow
                label="Net"
                value={
                  <span
                    className={
                      myPayout - ENTRY_FEE >= 0
                        ? "text-emerald-400 font-black"
                        : "text-red-400 font-black"
                    }
                  >
                    {myPayout - ENTRY_FEE >= 0 ? "+" : ""}
                    {myPayout - ENTRY_FEE}
                  </span>
                }
              />
            </div>
          )}
        </div>
      </motion.div>

      {replayVoteState !== null && (
        <div className="relative z-10 mb-3 w-full max-w-xs rounded-xl bg-surface-2 border border-border px-4 py-3 text-center">
          <p className="text-sm font-semibold text-white">
            {replayVoteState.requestedByName} wants to play again
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {replayVoteState.votes}/{replayVoteState.required} players agreed
          </p>
        </div>
      )}

      {replayCancelledReason !== null && (
        <p className="relative z-10 mb-3 text-sm text-amber-400">
          {replayCancelledReason}
        </p>
      )}

      {voteError !== null && (
        <p className="relative z-10 mb-2 text-xs text-red-400">{voteError}</p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 w-full max-w-xs"
      >
        {isMultiplayer ? (
          hasVoted ? (
            <p className="text-center text-sm text-slate-400">
              Waiting for other players…
            </p>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => sendVote("no")}
                isLoading={isVoting}
              >
                Back to Lobby
              </Button>
              <Button
                className="flex-1"
                isLoading={isVoting}
                disabled={replayCancelledReason !== null}
                onClick={() => sendVote("yes")}
              >
                Play Again ({ENTRY_FEE})
              </Button>
            </div>
          )
        ) : (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => navigate("/lobby")}
            >
              Back to Lobby
            </Button>
            <Button
              className="flex-1"
              onClick={() => sendVote("yes")}
              isLoading={isVoting}
            >
              Play Again ({ENTRY_FEE})
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

interface SummaryRowProps {
  label: string;
  value: React.ReactNode;
}

const SummaryRow: FC<SummaryRowProps> = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-400">{label}</span>
    <span className="font-semibold text-white">{value}</span>
  </div>
);
