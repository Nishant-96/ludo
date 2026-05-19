import { Router } from 'express';
import { getOpenRooms } from '../db/queries/rooms';
import { getLeaderboard } from '../db/queries/chats';
import { requireAuth } from '../middleware/auth';
import { getConnectedCount } from '../socket/connectedUsers';

export const lobbyRouter: Router = Router();

lobbyRouter.get('/rooms', requireAuth, async (_req, res) => {
  try {
    const rooms = await getOpenRooms();
    res.json({ rooms });
  } catch {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

lobbyRouter.get('/stats', requireAuth, (_req, res) => {
  res.json({ activePlayerCount: getConnectedCount() });
});

lobbyRouter.get('/leaderboard', requireAuth, async (_req, res) => {
  try {
    const entries = await getLeaderboard(20);
    res.json({ entries });
  } catch {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});
