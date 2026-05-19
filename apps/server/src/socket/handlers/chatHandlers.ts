import type { AppServer, AppSocket } from '../index';
import type { GameRoomRegistry } from '../../game/GameRoomRegistry';
import { saveMessage } from '../../db/queries/chats';
import { getUserById } from '../../db/queries/users';

const MAX_MESSAGE_LENGTH = 500;

export const registerChatHandlers = (
  io: AppServer,
  socket: AppSocket,
  registry: GameRoomRegistry
): void => {
  socket.on('chat:send', async ({ roomCode, message }, callback) => {
    try {
      const trimmed = message.trim();

      if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) {
        callback({ ok: false, error: 'Invalid message' });
        return;
      }

      if (!socket.rooms.has(roomCode)) {
        callback({ ok: false, error: 'Not in this room' });
        return;
      }

      const gameRoom = registry.get(roomCode);
      if (!gameRoom?.roomId) {
        callback({ ok: false, error: 'Room not found' });
        return;
      }

      const user = await getUserById(socket.userId);
      if (!user) {
        callback({ ok: false, error: 'User not found' });
        return;
      }

      await saveMessage({ roomId: gameRoom.roomId, userId: socket.userId, message: trimmed });

      io.to(roomCode).emit('chat:message', {
        senderId: socket.userId,
        displayName: user.displayName,
        message: trimmed,
        timestamp: new Date().toISOString(),
      });

      callback({ ok: true, data: null });
    } catch (err) {
      console.error('chat:send error:', err);
      callback({ ok: false, error: 'Failed to send message' });
    }
  });
};
