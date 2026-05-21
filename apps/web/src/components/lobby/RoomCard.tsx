import { type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/store/userStore";
import type { RoomSummary } from "@ludo/shared";
import { ENTRY_FEE } from "@/lib/constants";

interface RoomCardProps {
  room: RoomSummary;
}

export const RoomCard: FC<RoomCardProps> = ({ room }) => {
  const navigate = useNavigate();
  const { user, balance } = useUserStore();
  const isAlreadyIn = user ? room.participantIds.includes(user.id) : false;
  const isFull = room.playerCount >= room.capacity;
  const canAfford = balance >= ENTRY_FEE;
  const isDisabled = !isAlreadyIn && (isFull || !canAfford);

  const filledSlots = Array.from(
    { length: room.capacity },
    (_, i) => i < room.playerCount,
  );

  return (
    <div className="flex items-center justify-between rounded-xl bg-surface-2 border border-border px-4 py-3 hover:border-border/80 transition-colors">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-white tracking-wider">
            {room.code}
          </span>
          {isAlreadyIn && <Badge variant="info">Your room</Badge>}
          {!isAlreadyIn && isFull && <Badge variant="warning">Full</Badge>}
          {!isAlreadyIn && !isFull && !canAfford && (
            <Badge variant="danger">Insufficient coins</Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {filledSlots.map((filled, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${filled ? "bg-primary" : "bg-surface-3 border border-border"}`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">
            {room.playerCount}/{room.capacity} Players · {ENTRY_FEE} coins entry
          </span>
        </div>
      </div>

      <Button
        size="sm"
        variant={isAlreadyIn ? "secondary" : "primary"}
        disabled={isDisabled}
        onClick={() => navigate(`/room/${room.code}`)}
      >
        {isAlreadyIn
          ? "Rejoin"
          : isFull
            ? "Full"
            : !canAfford
              ? "No coins"
              : "Join"}
      </Button>
    </div>
  );
};
