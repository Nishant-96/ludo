import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@ludo/shared';
import { verifyToken } from '../middleware/auth';
import { registerRoomHandlers } from './handlers/roomHandlers';
import { registerGameHandlers } from './handlers/gameHandlers';
import { registerChatHandlers } from './handlers/chatHandlers';
import { GameRoomRegistry } from '../game/GameRoomRegistry';
import { incrementConnected, decrementConnected } from './connectedUsers';

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents> & { userId: string };

export const registerSocketHandlers = (io: AppServer): void => {
  const registry = GameRoomRegistry.getInstance();

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) { next(new Error('Authentication required')); return; }

    const userId = await verifyToken(token);
    if (!userId) { next(new Error('Invalid or expired token')); return; }

    (socket as AppSocket).userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    const appSocket = socket as AppSocket;
    incrementConnected();

    registerRoomHandlers(io, appSocket, registry);
    registerGameHandlers(io, appSocket, registry);
    registerChatHandlers(io, appSocket, registry);

    socket.on('disconnect', () => {
      decrementConnected();
      registry.handleDisconnect(io, appSocket.userId);
    });
  });
};
