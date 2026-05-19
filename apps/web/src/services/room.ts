import type { Room } from '@ludo/shared';
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

export const getRoomByCode = async (code: string): Promise<Room | null> => {
  const res = await fetch(`${SERVER_URL}/api/rooms/${code}`, {
    headers: await authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch room');
  const data = await res.json() as { room: Room };
  return data.room;
};
