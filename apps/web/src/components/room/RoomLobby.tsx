import { type FC, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { PlayerSlot } from "./PlayerSlot";
import { Button } from "@/components/ui/Button";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { getSocket } from "@/lib/socket";
import type { Room } from "@ludo/shared";
import { ENTRY_FEE, PAYOUT_PERCENTAGE } from "@/lib/constants";

interface RoomLobbyProps {
  room: Room;
  currentUserId: string;
  onGameStart: () => void;
}

export const RoomLobby: FC<RoomLobbyProps> = ({
  room,
  currentUserId,
  onGameStart,
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isHost = room.createdBy === currentUserId;
  const connectedPlayers = room.players.filter((p) => p.isConnected !== false);
  const hasMinPlayers = connectedPlayers.length >= 2;
  const isFull = room.players.length >= room.capacity;
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
      socket.emit("game:start", { roomCode: room.code }, (res) => {
        if (res.ok) {
          onGameStart();
          setIsStarting(false);
        } else {
          setError(res.error ?? "Failed to start game");
          setIsStarting(false);
        }
      });
    } catch {
      setError("Not connected. Please refresh.");
      setIsStarting(false);
    }
  };

  const slots = Array.from(
    { length: room.capacity },
    (_, i) => room.players[i] ?? null,
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-center">
        {hasMinPlayers ? (
          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 ${
              isFull
                ? "border-emerald-600/40 bg-emerald-500/10"
                : "border-emerald-600/40 bg-emerald-500/10"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">
              {isFull
                ? "Room full — ready to start!"
                : `${connectedPlayers.length} players joined — ready!`}
            </span>
          </div>
        ) : (
          <motion.div
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center gap-2 rounded-full border border-amber-600/40 bg-amber-500/10 px-4 py-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-amber-400">
              Waiting for players… ({connectedPlayers.length}/{room.capacity})
            </span>
          </motion.div>
        )}
      </div>

      <div className="card p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Players ({room.players.length}/{room.capacity})
        </p>
        <div className="flex flex-col gap-2">
          {slots.map((player, i) => (
            <PlayerSlot
              key={player?.userId ?? `empty-${i}`}
              player={player}
              slotNumber={i + 1}
              isHost={player?.userId === room.createdBy}
            />
          ))}
        </div>
      </div>

      <div className="card p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Room Info
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-500">Entry Fee</span>
            <span className="flex items-center gap-1 font-bold text-coin">
              <span>🪙</span>
              {ENTRY_FEE}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-500">Players</span>
            <span className="font-bold text-white">
              {room.players.length} / {room.capacity}
            </span>
          </div>
          <div className="col-span-2 flex flex-col gap-0.5">
            <span className="text-xs text-slate-500">Winner receives</span>
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <span>🪙</span>
              {Math.floor(
                room.players.length * ENTRY_FEE * PAYOUT_PERCENTAGE,
              )}{" "}
              coins
            </span>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <span className="text-xs text-slate-500">Invite Link</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-slate-300 border border-border">
                {shareUrl}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleCopyLink()}
                className="flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check size={13} /> Copied
                  </>
                ) : (
                  <>
                    <Link2 size={13} /> Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden" style={{ height: "220px" }}>
        <ChatPanel roomCode={room.code} />
      </div>

      {error !== null && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}

      {isHost ? (
        <div className="flex flex-col gap-1.5">
          <Button
            onClick={handleStart}
            isLoading={isStarting}
            disabled={!canStart}
            size="lg"
            variant="success"
            className="w-full"
          >
            {hasMinPlayers
              ? `Start Game (${room.players.length}/${room.capacity})`
              : `Waiting for players… (${room.players.length}/${room.capacity})`}
          </Button>
          {!hasMinPlayers && (
            <p className="text-center text-xs text-slate-500">
              Game will start when minimum 2 players join
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-surface-2 border border-border py-3 text-center text-sm text-slate-400">
          Waiting for host to start the game…
        </div>
      )}
    </div>
  );
};
