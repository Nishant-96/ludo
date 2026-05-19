import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@ludo/shared';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

let socket: AppSocket | null = null;

export const getSocket = (): AppSocket => {
  if (!socket) {
    throw new Error('Socket not connected. Call connectSocket first.');
  }
  return socket;
};

export const connectSocket = (token: string): AppSocket => {
  // Disconnect existing connection before creating a new one
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(SERVER_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  }) as AppSocket;

  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
