import { Router } from 'express';
import { createRoomInDb, getRoomFromDb } from '../services/roomService.js';
import { parseVideoUrl } from '../providers/validator.js';
import { generateRoomId, generateSessionId } from '../utils/generateId.js';
import { roomState } from '../state/RoomStateManager.js';
import { logger } from '../utils/logger.js';
import type { CreateRoomRequest, CreateRoomResponse, RoomInfoResponse } from '@watchly/shared';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { name, displayName, videoUrl } = req.body as CreateRoomRequest;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Room name is required' });
      return;
    }

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      res.status(400).json({ error: 'Display name is required' });
      return;
    }

    if (name.trim().length > 100) {
      res.status(400).json({ error: 'Room name is too long' });
      return;
    }

    if (displayName.trim().length > 30) {
      res.status(400).json({ error: 'Display name is too long' });
      return;
    }

    let video = null;
    if (videoUrl) {
      video = parseVideoUrl(videoUrl);
      if (!video) {
        res.status(400).json({ error: 'Invalid video URL' });
        return;
      }
    }

    const sessionId = generateSessionId();
    let roomId: string;

    try {
      roomId = await createRoomInDb(name.trim(), sessionId, video);
    } catch (err) {
      logger.warn('DB unavailable for room creation, using in-memory only', { error: (err as Error).message });
      roomId = generateRoomId();
    }

    roomState.createRoom(roomId, name.trim(), sessionId, displayName.trim(), '', video);

    const response: CreateRoomResponse = { roomId, sessionId };
    res.status(201).json(response);
  } catch (err) {
    logger.error('Failed to create room', { error: (err as Error).message });
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const inMemory = roomState.getRoom(req.params.id);

    if (inMemory) {
      const response: RoomInfoResponse = {
        id: inMemory.id,
        name: inMemory.name,
        status: inMemory.status,
        videoProvider: inMemory.video?.provider ?? null,
        videoTitle: inMemory.video?.title ?? null,
        participantCount: inMemory.participants.filter(p => p.isConnected).length,
        createdAt: new Date(inMemory.createdAt).toISOString(),
      };
      res.json(response);
      return;
    }

    const row = await getRoomFromDb(req.params.id);

    if (!row) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const response: RoomInfoResponse = {
      id: row.id,
      name: row.name,
      status: row.status as RoomInfoResponse['status'],
      videoProvider: (row.video_provider as RoomInfoResponse['videoProvider']) ?? null,
      videoTitle: row.video_title,
      participantCount: 0,
      createdAt: row.created_at.toISOString(),
    };

    res.json(response);
  } catch (err) {
    logger.error('Failed to fetch room', { error: (err as Error).message });
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

export default router;
