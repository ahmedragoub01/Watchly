import { Router } from 'express';
import { checkConnection } from '../db/pool.js';
import { roomState } from '../state/RoomStateManager.js';

const router = Router();

router.get('/health', async (_req, res) => {
  const dbConnected = await checkConnection();
  const stats = roomState.getStats();

  res.json({
    status: dbConnected ? 'healthy' : 'degraded',
    database: dbConnected,
    rooms: stats.activeRooms,
    participants: stats.connectedParticipants,
    uptime: process.uptime(),
  });
});

export default router;
