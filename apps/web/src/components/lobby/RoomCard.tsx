import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/store/userStore';
import type { RoomSummary } from '@ludo/shared';
import { ENTRY_FEE } from '@/lib/constants';

interface RoomCardProps {
  room: RoomSummary;
}

export const RoomCard: FC<RoomCardProps> = ({ room }) => {
  const navigate = useNavigate();
  const { balance } = useUserStore();
  const isFull = room.playerCount >= room.capacity;
  const canAfford = balance >= ENTRY_FEE;
  const isDisabled = isFull || !canAfford;

  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-white">{room.code}</span>
          {isFull && <Badge variant="warning">Full</Badge>}
          {!isFull && !canAfford && (
            <Badge variant="danger">Insufficient coins</Badge>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {room.playerCount}/{room.capacity} players · {ENTRY_FEE} coins entry
        </span>
      </div>

      <Button
        size="sm"
        disabled={isDisabled}
        onClick={() => navigate(`/room/${room.code}`)}
      >
        Join
      </Button>
    </div>
  );
};
