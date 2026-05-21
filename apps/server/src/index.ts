import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { ClientToServerEvents, ServerToClientEvents } from '@ludo/shared';
import { lobbyRouter } from './routes/lobby';
import { usersRouter } from './routes/users';
import { roomsRouter } from './routes/rooms';
import { registerSocketHandlers } from './socket';

const PORT = process.env.PORT ?? 4000;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api', lobbyRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true },
  pingTimeout: 10000,
  pingInterval: 5000,
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
