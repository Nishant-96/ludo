import { type FC } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import type { GameState, PlayerColor } from "@ludo/shared";

interface PlayerBarProps {
  gameState: GameState;
  currentUserId: string;
}

const COLOR_RING_CLASS: Record<PlayerColor, string> = {
  red: "ring-ludo-red shadow-[0_0_10px_rgba(229,62,62,0.6)]",
  blue: "ring-ludo-blue shadow-[0_0_10px_rgba(49,130,206,0.6)]",
  green: "ring-ludo-green shadow-[0_0_10px_rgba(56,161,105,0.6)]",
  yellow: "ring-ludo-yellow shadow-[0_0_10px_rgba(214,158,46,0.6)]",
};

const COLOR_DOT: Record<PlayerColor, string> = {
  red: "bg-ludo-red",
  blue: "bg-ludo-blue",
  green: "bg-ludo-green",
  yellow: "bg-ludo-yellow",
};

export const PlayerBar: FC<PlayerBarProps> = ({ gameState, currentUserId }) => (
  <div className="flex items-center justify-center gap-4 px-4 py-3">
    {gameState.players.map((player) => {
      const isActive = player.userId === gameState.currentTurnUserId;
      const isMe = player.userId === currentUserId;
      const isForfeited = player.isForfeited;

      return (
        <div key={player.userId} className="flex flex-col items-center gap-1.5">
          <div className="relative">
            {isActive && (
              <motion.div
                className={`absolute -inset-1 rounded-full ${COLOR_RING_CLASS[player.color]}`}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
            <div
              className={`relative rounded-full ring-2 ${isActive ? `ring-2 ${COLOR_RING_CLASS[player.color]}` : "ring-transparent"} ${isForfeited ? "opacity-40" : ""}`}
            >
              <Avatar src={null} displayName={player.displayName} size="md" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg ${COLOR_DOT[player.color]}`}
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-0">
            <span
              className={`text-xs font-semibold truncate max-w-[52px] ${isMe ? "text-primary" : "text-slate-300"} ${isForfeited ? "line-through opacity-50" : ""}`}
            >
              {isMe ? "You" : player.displayName.split(" ")[0]}
            </span>
            {isForfeited && (
              <span className="text-[10px] text-slate-600">Out</span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);
