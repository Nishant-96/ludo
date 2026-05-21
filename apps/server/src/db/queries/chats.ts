import { db } from '../client';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  displayName: string;
  message: string;
  timestamp: string;
}

export const saveMessage = async (params: {
  roomId: string;
  userId: string;
  message: string;
}): Promise<string> => {
  const { data, error } = await db.from('chats').insert({
    room_id: params.roomId,
    user_id: params.userId,
    message: params.message,
  }).select('created_at').single();

  if (error || !data) throw new Error(`Failed to save chat message: ${error?.message}`);
  return data.created_at as string;
};

export const getRoomMessages = async (roomId: string, limit = 50): Promise<ChatMessage[]> => {
  const { data, error } = await db
    .from('chats')
    .select('id, room_id, user_id, message, created_at, users(display_name)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>)
    .reverse()
    .map((m) => ({
      id: m.id as string,
      roomId: m.room_id as string,
      senderId: m.user_id as string,
      displayName: (m.users as { display_name: string }).display_name,
      message: m.message as string,
      timestamp: m.created_at as string,
    }));
};

export const getLeaderboard = async (limit = 20): Promise<Array<{
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  balance: number;
  rank: number;
}>> => {
  const { data, error } = await db
    .from('wallets')
    .select('user_id, balance, users(display_name, avatar_url)')
    .order('balance', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row, index) => ({
    userId: row.user_id as string,
    displayName: (row.users as { display_name: string }).display_name,
    avatarUrl: (row.users as { avatar_url: string | null }).avatar_url,
    balance: row.balance as number,
    rank: index + 1,
  }));
};
