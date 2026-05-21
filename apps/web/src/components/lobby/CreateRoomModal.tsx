import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getSocket } from "@/lib/socket";
import { ENTRY_FEE } from "@/lib/constants";
import type { RoomCapacity } from "@ludo/shared";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAPACITY_OPTIONS: {
  value: RoomCapacity;
  icon: string;
  description: string;
}[] = [
  { value: 2, icon: "👥", description: "Head to head" },
  { value: 3, icon: "👥", description: "Three-way" },
  { value: 4, icon: "👥", description: "Full board" },
];

export const CreateRoomModal: FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [capacity, setCapacity] = useState<RoomCapacity>(4);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreate = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const socket = getSocket();
      socket.emit("room:create", { capacity }, (res) => {
        if (res.ok && res.data) {
          navigate(`/room/${res.data.room.code}`);
        } else {
          setError(res.error ?? "Failed to create room");
          setIsLoading(false);
        }
      });
    } catch {
      setError("Not connected. Please refresh.");
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Room">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Number of Players
          </p>
          <div className="flex gap-2">
            {CAPACITY_OPTIONS.map(({ value }) => (
              <button
                key={value}
                onClick={() => setCapacity(value)}
                className={`
                  flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 transition-all duration-150
                  ${
                    capacity === value
                      ? "border-primary bg-primary/20 text-white shadow-glow-sm"
                      : "border-border bg-surface-2 text-slate-400 hover:border-primary/50 hover:text-slate-200"
                  }
                `}
              >
                <span className="text-lg font-bold">{value}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: value }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70"
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface-2 border border-border px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-slate-400 font-medium">
              Entry Fee (Coins)
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-base">🪙</span>
              <span className="text-xl font-black text-coin">{ENTRY_FEE}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Winner receives</p>
            <p className="text-sm font-bold text-emerald-400">
              🪙 {Math.floor(capacity * ENTRY_FEE * 0.8)}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          You will pay{" "}
          <span className="font-bold text-coin">{ENTRY_FEE} coins</span> when
          match starts
        </p>

        {error !== null && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}

        <Button
          onClick={handleCreate}
          isLoading={isLoading}
          size="lg"
          className="w-full"
        >
          Create Room
        </Button>
      </div>
    </Modal>
  );
};
