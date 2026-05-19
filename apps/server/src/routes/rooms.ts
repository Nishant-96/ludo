import { Router } from 'express';
import { getRoomByCode } from '../db/queries/rooms';
import { requireAuth } from '../middleware/auth';

export const roomsRouter: Router = Router();

roomsRouter.get('/:code', requireAuth, async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.code);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    res.json({ room });
  } catch {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});
