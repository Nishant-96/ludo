import { type FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getSocket } from '@/lib/socket';
import type { RoomCapacity } from '@ludo/shared';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAPACITY_OPTIONS: { value: RoomCapacity; label: string; description: string }[] = [
  { value: 2, label: '2 Players', description: 'Head to head' },
  { value: 3, label: '3 Players', description: 'Three-way battle' },
  { value: 4, label: '4 Players', description: 'Full board' },
];

export const CreateRoomModal: FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
  const [capacity, setCapacity] = useState<RoomCapacity>(4);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreate = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const socket = getSocket();
      socket.emit('room:create', { capacity }, (res) => {
        if (res.ok && res.data) {
          navigate(`/room/${res.data.room.code}`);
        } else {
          setError(res.error ?? 'Failed to create room');
          setIsLoading(false);
        }
      });
    } catch {
      setError('Not connected. Please refresh.');
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Room">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {CAPACITY_OPTIONS.map(({ value, label, description }) => (
            <button
              key={value}
              onClick={() => setCapacity(value)}
              className={`
                flex items-center justify-between rounded-xl border px-4 py-3 text-left transition
                ${capacity === value
                  ? 'border-indigo-500 bg-indigo-600/20 text-white'
                  : 'border-slate-700 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                }
              `}
            >
              <span className="font-medium">{label}</span>
              <span className="text-xs text-slate-400">{description}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          Entry fee: <span className="font-semibold text-amber-400">100 coins</span> per player
        </p>

        {error !== null && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleCreate} isLoading={isLoading} className="flex-1">
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
};
