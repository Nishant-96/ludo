import { type FC, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Board } from "./Board";
import { GameControls } from "./GameControls";
import { PlayerBar } from "./PlayerBar";
import { Timer } from "./Timer";
import { ChatOverlay } from "@/components/chat/ChatOverlay";
import { WinnerScreen } from "./WinnerScreen";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";
import { useChatStore } from "@/store/chatStore";
import type { Room, GameState, PawnIndex } from "@ludo/shared";
import { getSocket } from "@/lib/socket";

interface GameViewProps {
  room: Room;
  gameState: GameState;
  currentUserId: string;
}

export const GameView: FC<GameViewProps> = ({
  room,
  gameState,
  currentUserId,
}) => {
  const navigate = useNavigate();
  const { disconnectedUserId } = useGameStore();
  const { isSocketConnected, isSocketReconnectFailed, gracePeriodRemaining } =
    useRoomStore();
  const { unreadCount } = useChatStore();
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isMyTurn = gameState.currentTurnUserId === currentUserId;
  const selectablePawnIndices =
    isMyTurn && gameState.lastDiceValue !== null ? gameState.validMoves : [];

  const handlePawnSelect = useCallback(
    (pawnIndex: PawnIndex): void => {
      if (!selectablePawnIndices.includes(pawnIndex)) return;
      setMoveError(null);

      try {
        const socket = getSocket();
        socket.emit("move:pawn", { roomCode: room.code, pawnIndex }, (res) => {
          if (!res.ok) setMoveError(res.error ?? "Invalid move");
        });
      } catch {
        setMoveError("Not connected");
      }
    },
    [room.code, selectablePawnIndices],
  );

  if (gameState.status === "completed" && gameState.winnerId) {
    return (
      <WinnerScreen
        gameState={gameState}
        currentUserId={currentUserId}
        roomCode={room.code}
      />
    );
  }

  const disconnectedPlayer = disconnectedUserId
    ? gameState.players.find((p) => p.userId === disconnectedUserId)
    : null;

  const activePlayer = gameState.players.find(
    (p) => p.userId === gameState.currentTurnUserId,
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bg">
      <AnimatePresence>
        {!isSocketConnected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center gap-2 overflow-hidden bg-red-900/90 px-4 py-2 text-center text-sm text-red-200"
          >
            {isSocketReconnectFailed ? (
              <>
                <span>Connection lost.</span>
                <button
                  onClick={() => navigate("/lobby")}
                  className="underline hover:no-underline font-semibold"
                >
                  Return to lobby
                </button>
              </>
            ) : (
              <>
                <span
                  role="status"
                  aria-label="Reconnecting"
                  className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent"
                />
                Reconnecting…
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {disconnectedPlayer && gameState.status === "paused" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-amber-900/80 px-4 py-2 text-center text-sm text-amber-200"
          >
            <span className="font-semibold">
              {disconnectedPlayer.displayName}
            </span>{" "}
            disconnected
            {gracePeriodRemaining !== null && gracePeriodRemaining > 0
              ? ` — ${gracePeriodRemaining}s to reconnect before forfeit`
              : " — forfeiting…"}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <button
          onClick={() => navigate("/lobby")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Back to lobby"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-bold text-white">Room: {room.code}</span>
        <button
          onClick={() => setIsChatOpen(true)}
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-slate-400 hover:text-white transition-colors"
          aria-label={`Open chat${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <MessageCircle size={16} />
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      <div className="border-b border-border bg-surface/50">
        <PlayerBar gameState={gameState} currentUserId={currentUserId} />
      </div>

      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-white">
            {isMyTurn
              ? "Your Turn"
              : `${activePlayer?.displayName ?? "…"}'s Turn`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">⏱</span>
          <Timer timeRemaining={gameState.timeRemaining} />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-3">
        <Board
          gameState={gameState}
          currentUserId={currentUserId}
          selectablePawnIndices={selectablePawnIndices}
          onPawnClick={handlePawnSelect}
        />
      </div>

      <GameControls
        gameState={gameState}
        currentUserId={currentUserId}
        roomCode={room.code}
        moveError={moveError}
      />

      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        roomCode={room.code}
      />
    </div>
  );
};
