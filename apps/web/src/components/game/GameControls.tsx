import { type FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, AlertTriangle } from "lucide-react";
import { DiceFace } from "./Dice/DiceFace";
import { getSocket } from "@/lib/socket";
import type { GameState } from "@ludo/shared";

interface GameControlsProps {
  gameState: GameState;
  currentUserId: string;
  roomCode: string;
  moveError: string | null;
}

export const GameControls: FC<GameControlsProps> = ({
  gameState,
  currentUserId,
  roomCode,
  moveError,
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [rollError, setRollError] = useState<string | null>(null);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [isForfeiting, setIsForfeiting] = useState(false);

  const isMyTurn = gameState.currentTurnUserId === currentUserId;
  const hasRolled = gameState.lastDiceValue !== null;
  const canRoll = isMyTurn && !hasRolled && !isRolling;
  const currentPlayer = gameState.players.find(
    (p) => p.userId === currentUserId,
  );
  const isForfeited = currentPlayer?.isForfeited ?? false;
  const activePlayer = gameState.players.find(
    (p) => p.userId === gameState.currentTurnUserId,
  );
  const hasValidMoves = gameState.validMoves.length > 0;

  const displayValue = gameState.lastDiceValue ?? 1;

  const handleRoll = (): void => {
    if (!canRoll) return;
    setIsRolling(true);
    setRollError(null);

    const timeout = setTimeout(() => {
      setIsRolling(false);
      setRollError("Roll timed out — please try again");
    }, 8_000);

    try {
      const socket = getSocket();
      socket.emit("dice:roll", { roomCode }, (res) => {
        clearTimeout(timeout);
        setIsRolling(false);
        if (!res.ok) setRollError(res.error ?? "Failed to roll");
      });
    } catch {
      clearTimeout(timeout);
      setIsRolling(false);
      setRollError("Not connected");
    }
  };

  const handleForfeit = (): void => {
    setIsForfeiting(true);
    try {
      const socket = getSocket();
      socket.emit("game:forfeit", { roomCode }, (res) => {
        setIsForfeiting(false);
        setShowForfeitConfirm(false);
        if (!res.ok) setShowForfeitConfirm(false);
      });
    } catch {
      setIsForfeiting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 py-2 text-center min-h-[28px]">
        {isMyTurn && hasRolled && hasValidMoves && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold text-primary"
          >
            Tap a pawn on the board to move
          </motion.p>
        )}
        {isMyTurn && hasRolled && !hasValidMoves && (
          <p className="text-xs text-slate-400">No valid moves — skipping…</p>
        )}
        {isMyTurn && !hasRolled && (
          <p className="text-xs font-semibold text-white">Your Turn</p>
        )}
        {!isMyTurn && activePlayer && (
          <p className="text-xs text-slate-400">
            {activePlayer.displayName}&apos;s turn
          </p>
        )}
        {(rollError ?? moveError) && (
          <p className="text-xs text-red-400">{rollError ?? moveError}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border bg-surface px-6 py-4">
        <div className="flex flex-col items-center gap-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={gameState.lastDiceValue}
              className="h-14 w-14"
              initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              <DiceFace value={displayValue} />
            </motion.div>
          </AnimatePresence>
          {gameState.lastDiceValue !== null && (
            <span className="text-xs font-black text-white">
              {gameState.lastDiceValue}
            </span>
          )}
        </div>

        <motion.button
          onClick={handleRoll}
          disabled={!canRoll}
          whileTap={canRoll ? { scale: 0.92 } : undefined}
          whileHover={canRoll ? { scale: 1.05 } : undefined}
          className={`
            relative flex h-20 w-20 flex-col items-center justify-center rounded-full font-bold text-white transition-all duration-150
            ${
              canRoll
                ? "bg-primary shadow-glow cursor-pointer hover:bg-primary-light"
                : "bg-surface-3 border border-border cursor-not-allowed opacity-50"
            }
          `}
          aria-label="Roll dice"
        >
          {isRolling ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
              className="h-7 w-7"
            >
              <DiceFace value={displayValue} />
            </motion.div>
          ) : (
            <>
              <DiceRollIcon />
              <span className="text-xs font-semibold mt-0.5">Roll</span>
            </>
          )}
          {canRoll && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary"
              animate={{ opacity: [0, 0.15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </motion.button>

        {!isForfeited ? (
          <div className="flex flex-col items-center gap-1">
            {showForfeitConfirm ? (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-24 right-4 z-10 flex flex-col gap-2 rounded-xl bg-surface border border-border p-3 shadow-card"
                >
                  <p className="text-xs font-semibold text-white">
                    Forfeit this game?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleForfeit}
                      disabled={isForfeiting}
                      className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      {isForfeiting ? "Forfeiting…" : "Yes"}
                    </button>
                    <button
                      onClick={() => setShowForfeitConfirm(false)}
                      className="flex-1 rounded-lg bg-surface-3 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-surface-2 border border-border"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : null}
            <button
              onClick={() => setShowForfeitConfirm((v) => !v)}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-surface-2 transition-colors"
            >
              <ForfeitIcon />
              <span className="text-xs font-medium">Forfeit</span>
            </button>
          </div>
        ) : (
          <div className="w-14" />
        )}
      </div>
    </div>
  );
};

const DiceRollIcon: FC = () => <Dices size={28} />;
const ForfeitIcon: FC = () => <AlertTriangle size={20} />;
