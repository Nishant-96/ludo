import { randomUUID } from 'node:crypto';
import type { AppServer, AppSocket } from '../index';
import type { GameRoomRegistry } from '../../game/GameRoomRegistry';
import { getRoomByCode, createRoom, addPlayerToRoom, getNextAvailableColorAndCorner } from '../../db/queries/rooms';
import { getUserById } from '../../db/queries/users';
import { getBalance } from '../../db/queries/wallets';
import { getRoomMessages } from '../../db/queries/chats';

// 6-character room code: hex chars from a UUID segment, lowercased
const generateRoomCode = (): string =>
  randomUUID().replace(/-/g, '').slice(0, 6).toLowerCase();

export const registerRoomHandlers = (
  io: AppServer,
  socket: AppSocket,
  registry: GameRoomRegistry
): void => {
  socket.on('room:create', async ({ capacity }, callback) => {
    try {
      const user = await getUserById(socket.userId);
      if (!user) {
        callback({ ok: false, error: 'User not found' });
        return;
      }

      const code = generateRoomCode();
      const room = await createRoom({ code, capacity, createdBy: socket.userId });

      // Assign first color/corner to creator
      const { color, corner } = await getNextAvailableColorAndCorner(room.id);
      await addPlayerToRoom({ roomId: room.id, userId: socket.userId, color, corner });

      // Track in memory
      const gameRoom = registry.getOrCreate(code);
      gameRoom.roomId = room.id;
      gameRoom.addPlayer({
        userId: socket.userId,
        displayName: user.displayName,
        color,
        corner,
        socketId: socket.id,
        isConnected: true,
        isForfeited: false,
      });
      registry.trackUser(socket.userId, code);

      await socket.join(code);

      // Fetch full room with players for response
      const fullRoom = await getRoomByCode(code);
      if (!fullRoom) throw new Error('Room not found after creation');

      callback({ ok: true, data: { room: fullRoom } });
    } catch (err) {
      console.error('room:create error:', err);
      callback({ ok: false, error: 'Failed to create room' });
    }
  });

  socket.on('room:join', async ({ roomCode }, callback) => {
    try {
      const room = await getRoomByCode(roomCode);

      if (!room) {
        callback({ ok: false, error: 'Room not found' });
        return;
      }

      if (room.status !== 'waiting') {
        callback({ ok: false, error: 'Room is no longer accepting players' });
        return;
      }

      // Check if player is rejoining (reconnect scenario)
      const existingPlayer = room.players.find((p) => p.userId === socket.userId);
      const gameRoom = registry.getOrCreate(roomCode);
      gameRoom.roomId = room.id;

      if (existingPlayer) {
        // Reconnect flow — handled via handlePlayerReconnect
        gameRoom.handlePlayerReconnect(io, socket.userId, socket.id);
        await socket.join(roomCode);

        // Replay chat history to reconnecting player
        const history = await getRoomMessages(room.id);
        for (const msg of history) {
          socket.emit('chat:message', {
            senderId: msg.senderId,
            displayName: msg.displayName,
            message: msg.message,
            timestamp: msg.timestamp,
          });
        }

        const updatedRoom = await getRoomByCode(roomCode);
        callback({ ok: true, data: { room: updatedRoom! } });
        return;
      }

      if (room.players.length >= room.capacity) {
        callback({ ok: false, error: 'Room is full' });
        return;
      }

      const balance = await getBalance(socket.userId);
      if (balance < 100) {
        callback({ ok: false, error: 'Insufficient coins to join (minimum 100 required)' });
        return;
      }

      const user = await getUserById(socket.userId);
      if (!user) {
        callback({ ok: false, error: 'User not found' });
        return;
      }

      const { color, corner } = await getNextAvailableColorAndCorner(room.id);
      await addPlayerToRoom({ roomId: room.id, userId: socket.userId, color, corner });

      gameRoom.addPlayer({
        userId: socket.userId,
        displayName: user.displayName,
        color,
        corner,
        socketId: socket.id,
        isConnected: true,
        isForfeited: false,
      });
      registry.trackUser(socket.userId, roomCode);

      await socket.join(roomCode);

      // Notify existing players
      socket.to(roomCode).emit('player:joined', {
        player: {
          userId: socket.userId,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          color,
          corner,
          isConnected: true,
        },
      });

      const updatedRoom = await getRoomByCode(roomCode);
      if (!updatedRoom) throw new Error('Room not found after join');

      // Sync full room state to joining player
      socket.emit('room:state', { room: updatedRoom });

      // Replay chat history to newly joined player
      const history = await getRoomMessages(updatedRoom.id);
      for (const msg of history) {
        socket.emit('chat:message', {
          senderId: msg.senderId,
          displayName: msg.displayName,
          message: msg.message,
          timestamp: msg.timestamp,
        });
      }

      callback({ ok: true, data: { room: updatedRoom } });
    } catch (err) {
      console.error('room:join error:', err);
      callback({ ok: false, error: 'Failed to join room' });
    }
  });
};
