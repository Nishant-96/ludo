import type { LeaderboardEntry, RoomSummary } from '@ludo/shared';
import { getSession } from './auth';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

const authHeaders = async (): Promise<HeadersInit> => {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
};

export const fetchActivePlayerCount = async (): Promise<number> => {
  const res = await fetch(`${SERVER_URL}/api/stats`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  const data = await res.json() as { activePlayerCount: number };
  return data.activePlayerCount;
};

export const fetchBalance = async (): Promise<number> => {
  const res = await fetch(`${SERVER_URL}/api/users/me`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch balance');
  const data = await res.json() as { balance: number };
  return data.balance;
};

export const fetchRooms = async (): Promise<RoomSummary[]> => {
  const res = await fetch(`${SERVER_URL}/api/rooms`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch rooms');
  const data = await res.json() as { rooms: RoomSummary[] };
  return data.rooms;
};

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const res = await fetch(`${SERVER_URL}/api/leaderboard`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  const data = await res.json() as { entries: LeaderboardEntry[] };
  return data.entries;
};
