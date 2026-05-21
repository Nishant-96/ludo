import { type FC, useEffect, useState, useCallback } from "react";
import { RoomList } from "@/components/lobby/RoomList";
import { Leaderboard } from "@/components/lobby/Leaderboard";
import { CreateRoomModal } from "@/components/lobby/CreateRoomModal";
import { LeaderboardModal } from "@/components/lobby/LeaderboardModal";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/store/userStore";
import {
  fetchRooms,
  fetchLeaderboard,
  fetchBalance,
  fetchActivePlayerCount,
} from "@/services/lobby";
import { signOut } from "@/services/auth";
import { getSocket } from "@/lib/socket";
import type { RoomSummary, LeaderboardEntry } from "@ludo/shared";

export const LobbyPage: FC = () => {
  const { user, balance, updateBalance } = useUserStore();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activePlayerCount, setActivePlayerCount] = useState<number | null>(
    null,
  );

  const loadRooms = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchRooms();
      setRooms(data);
    } catch (err) {
      console.error("Failed to load rooms", err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  const loadLeaderboard = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      console.error("Failed to load leaderboard", err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
    void loadLeaderboard();
    fetchBalance()
      .then(updateBalance)
      .catch(() => null);
    fetchActivePlayerCount()
      .then(setActivePlayerCount)
      .catch(() => null);

    const interval = setInterval(() => void loadRooms(), 10_000);
    return () => clearInterval(interval);
  }, [loadRooms, loadLeaderboard, updateBalance]);

  useEffect(() => {
    const socket = getSocket();
    const handleLeaderboardUpdate = ({
      entries,
    }: {
      entries: LeaderboardEntry[];
    }): void => {
      setLeaderboard(entries);
      setIsLoadingLeaderboard(false);
    };
    socket.on("leaderboard:update", handleLeaderboardUpdate);
    return () => {
      socket.off("leaderboard:update", handleLeaderboardUpdate);
    };
  }, []);

  const handleSignOut = async (): Promise<void> => {
    setIsSigningOut(true);
    await signOut();
  };

  if (!user) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface">
        <div className="flex items-center gap-3">
          <Avatar
            src={user.avatarUrl}
            displayName={user.displayName}
            size="md"
            showOnline
          />
          <div>
            <p className="text-sm font-bold text-white">{user.displayName}</p>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-online" />
              <span className="text-xs text-online font-medium">Online</span>
              {activePlayerCount !== null && (
                <span className="text-xs text-slate-500">
                  · {activePlayerCount} active
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-surface-2 border border-border px-3 py-1.5">
            <span className="text-sm">🪙</span>
            <span className="text-sm font-bold text-coin">
              {balance.toLocaleString()}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            isLoading={isSigningOut}
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Wallet Balance
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <span className="text-3xl font-black text-white">
                {balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Leaderboard</h2>
              <button
                onClick={() => setIsLeaderboardOpen(true)}
                className="text-xs font-semibold text-primary hover:text-primary-light transition-colors"
              >
                View All
              </button>
            </div>
            <Leaderboard
              entries={leaderboard}
              isLoading={isLoadingLeaderboard}
              currentUserId={user.id}
              previewCount={5}
            />
          </div>

          <div className="card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Active Rooms</h2>
              <button
                onClick={() => void loadRooms()}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-slate-400 hover:text-white transition-colors text-xs"
                title="Refresh"
                aria-label="Refresh rooms"
              >
                ↻
              </button>
            </div>
            <RoomList rooms={rooms} isLoading={isLoadingRooms} />
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Create Room
        </Button>
      </main>

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        entries={leaderboard}
        isLoading={isLoadingLeaderboard}
        currentUserId={user.id}
      />
    </div>
  );
};
