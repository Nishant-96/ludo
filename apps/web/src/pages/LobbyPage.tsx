import { type FC, useEffect, useState, useCallback } from 'react';
import { RoomList } from '@/components/lobby/RoomList';
import { Leaderboard } from '@/components/lobby/Leaderboard';
import { CreateRoomModal } from '@/components/lobby/CreateRoomModal';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/store/userStore';
import { fetchRooms, fetchLeaderboard, fetchBalance, fetchActivePlayerCount } from '@/services/lobby';
import { signOut } from '@/services/auth';
import { getSocket } from '@/lib/socket';
import type { RoomSummary, LeaderboardEntry } from '@ludo/shared';

export const LobbyPage: FC = () => {
  const { user, balance, updateBalance } = useUserStore();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activePlayerCount, setActivePlayerCount] = useState<number | null>(null);

  const loadRooms = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchRooms();
      setRooms(data);
    } catch (err) {
      console.error('Failed to load rooms', err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  const loadLeaderboard = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
    void loadLeaderboard();
    // Re-sync balance on mount — game:over updates it in-session but a refresh bypasses that handler
    fetchBalance().then(updateBalance).catch(() => null);
    fetchActivePlayerCount().then(setActivePlayerCount).catch(() => null);

    const interval = setInterval(() => void loadRooms(), 10_000);
    return () => clearInterval(interval);
  }, [loadRooms, loadLeaderboard, updateBalance]);

  useEffect(() => {
    const socket = getSocket();
    const handleLeaderboardUpdate = ({ entries }: { entries: LeaderboardEntry[] }): void => {
      setLeaderboard(entries);
      setIsLoadingLeaderboard(false);
    };
    socket.on('leaderboard:update', handleLeaderboardUpdate);
    return () => {
      socket.off('leaderboard:update', handleLeaderboardUpdate);
    };
  }, []);

  const handleSignOut = async (): Promise<void> => {
    setIsSigningOut(true);
    await signOut();
  };

  if (!user) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar src={user.avatarUrl} displayName={user.displayName} size="md" />
          <div>
            <p className="text-sm font-semibold text-white">{user.displayName}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-amber-400">{balance.toLocaleString()} coins</p>
              {activePlayerCount !== null && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {activePlayerCount} online
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" isLoading={isSigningOut} onClick={handleSignOut}>
          Sign out
        </Button>
      </header>

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Open Rooms</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => void loadRooms()}>
                Refresh
              </Button>
              <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                + Create
              </Button>
            </div>
          </div>
          <RoomList rooms={rooms} isLoading={isLoadingRooms} />
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">Leaderboard</h2>
          <div className="rounded-xl bg-slate-800/50 px-2 py-1">
            <Leaderboard
              entries={leaderboard}
              isLoading={isLoadingLeaderboard}
              currentUserId={user.id}
            />
          </div>
        </section>
      </main>

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
