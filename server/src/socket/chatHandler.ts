import type { Server, Socket } from 'socket.io';
import { C2S, S2C } from '@watchly/shared';
import type { SendChatPayload } from '@watchly/shared';
import { saveMessage } from '../services/chatService.js';
import { logger } from '../utils/logger.js';

const CHAT_RATE_LIMIT = { max: 5, windowMs: 5000 };
const chatLimits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const entry = chatLimits.get(socketId);

  if (!entry || entry.resetAt <= now) {
    chatLimits.set(socketId, { count: 1, resetAt: now + CHAT_RATE_LIMIT.windowMs });
    return false;
  }

  entry.count++;
  return entry.count > CHAT_RATE_LIMIT.max;
}

export function registerChatHandlers(io: Server, socket: Socket) {
  socket.on(C2S.CHAT_SEND, async (payload: SendChatPayload) => {
    const { roomId, content, videoTimestamp } = payload;
    const sessionId = socket.data.sessionId;
    const displayName = socket.data.displayName;

    if (!roomId || !content || !sessionId) return;

    if (typeof content !== 'string' || content.trim().length === 0) return;
    if (content.length > 500) return;

    if (isRateLimited(socket.id)) {
      socket.emit(S2C.ROOM_ERROR, { message: 'Sending messages too fast' });
      return;
    }

    try {
      const message = await saveMessage(
        roomId,
        displayName,
        sessionId,
        content.trim(),
        videoTimestamp,
      );

      io.to(roomId).emit(S2C.CHAT_MESSAGE, message);
    } catch (err) {
      logger.error('Failed to save chat message', { error: (err as Error).message });
    }
  });
}
