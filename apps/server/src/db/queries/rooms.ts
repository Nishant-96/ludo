import { db } from '../client';
import type { Room, RoomSummary, RoomCapacity, RoomStatus, RoomPlayer, PlayerColor } from '@ludo/shared';

const COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];

export const createRoom = async (params: {
  code: string;
  capacity: RoomCapacity;
  createdBy: string;
}): Promise<Room> => {
  const { data, error } = await db
    .from('rooms')
    .insert({
      code: params.code,
      capacity: params.capacity,
      created_by: params.createdBy,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create room: ${error?.message}`);

  return {
    id: data.id,
    code: data.code,
    capacity: data.capacity,
    status: data.status,
    createdBy: data.created_by,
    players: [],
    createdAt: data.created_at,
  };
};

export const getRoomByCode = async (code: string): Promise<Room | null> => {
  const { data: room, error } = await db
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !room) return null;

  const { data: players } = await db
    .from('room_players')
    .select('*, users(display_name, avatar_url)')
    .eq('room_id', room.id);

  const mappedPlayers: RoomPlayer[] = (players ?? []).map((p: Record<string, unknown>) => ({
    userId: p.user_id as string,
    displayName: (p.users as { display_name: string }).display_name,
    avatarUrl: (p.users as { avatar_url: string | null }).avatar_url,
    color: p.color as PlayerColor,
    corner: p.corner as 0 | 1 | 2 | 3,
    isConnected: true,
  }));

  return {
    id: room.id,
    code: room.code,
    capacity: room.capacity,
    status: room.status,
    createdBy: room.created_by,
    players: mappedPlayers,
    createdAt: room.created_at,
  };
};

export const getOpenRooms = async (): Promise<RoomSummary[]> => {
  const { data, error } = await db
    .from('rooms')
    .select('id, code, capacity, status, created_at, room_players(user_id)')
    .eq('status', 'waiting')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data.map((r: Record<string, unknown>) => {
    const players = (r.room_players as Array<{ user_id: string }>) ?? [];
    return {
      id: r.id as string,
      code: r.code as string,
      capacity: r.capacity as RoomCapacity,
      status: r.status as RoomStatus,
      playerCount: players.length,
      participantIds: players.map((p) => p.user_id),
      createdAt: r.created_at as string,
    };
  });
};

export const updateRoomStatus = async (roomId: string, status: RoomStatus): Promise<void> => {
  const { error } = await db
    .from('rooms')
    .update({ status })
    .eq('id', roomId);

  if (error) throw new Error(`Failed to update room status: ${error.message}`);
};

export const addPlayerToRoom = async (params: {
  roomId: string;
  userId: string;
  color: PlayerColor;
  corner: 0 | 1 | 2 | 3;
}): Promise<void> => {
  const { error } = await db.from('room_players').insert({
    room_id: params.roomId,
    user_id: params.userId,
    color: params.color,
    corner: params.corner,
  });

  if (error) throw new Error(`Failed to add player to room: ${error.message}`);
};

export const removePlayerFromRoom = async (roomId: string, userId: string): Promise<void> => {
  await db.from('room_players').delete().eq('room_id', roomId).eq('user_id', userId);
};

export const getNextAvailableColorAndCorner = async (
  roomId: string
): Promise<{ color: PlayerColor; corner: 0 | 1 | 2 | 3 }> => {
  const { data } = await db
    .from('room_players')
    .select('color, corner')
    .eq('room_id', roomId);

  const usedColors = new Set((data ?? []).map((p: { color: string }) => p.color));
  const usedCorners = new Set((data ?? []).map((p: { corner: number }) => p.corner));

  const color = COLORS.find((c) => !usedColors.has(c));
  const corner = ([0, 1, 2, 3] as const).find((c) => !usedCorners.has(c));

  if (color === undefined || corner === undefined) {
    throw new Error('Room is full');
  }

  return { color, corner };
};
