import type { Server, Socket } from 'socket.io';
import { C2S, S2C } from '@watchly/shared';
import type { SendReactionPayload, ReactionEmoji, REACTION_EMOJIS } from '@watchly/shared';
import { saveReaction } from '../services/reactionService.js';
import { logger } from '../utils/logger.js';

const VALID_EMOJIS = new Set(['😂', '🔥', '😱', '❤️', '👏', '💀']);

const REACTION_RATE_LIMIT = { max: 10, windowMs: 5000 };
const reactionLimits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const entry = reactionLimits.get(socketId);

  if (!entry || entry.resetAt <= now) {
    reactionLimits.set(socketId, { count: 1, resetAt: now + REACTION_RATE_LIMIT.windowMs });
    return false;
  }

  entry.count++;
  return entry.count > REACTION_RATE_LIMIT.max;
}

export function registerReactionHandlers(io: Server, socket: Socket) {
  socket.on(C2S.REACTION_SEND, async (payload: SendReactionPayload) => {
    const { roomId, emoji, videoTimestamp } = payload;
    const sessionId = socket.data.sessionId;
    const displayName = socket.data.displayName;

    if (!roomId || !emoji || videoTimestamp == null || !sessionId) return;
    if (!VALID_EMOJIS.has(emoji)) return;
    if (typeof videoTimestamp !== 'number' || videoTimestamp < 0) return;

    if (isRateLimited(socket.id)) return;

    try {
      await saveReaction(roomId, displayName, sessionId, emoji as ReactionEmoji, videoTimestamp);
    } catch (err) {
      logger.error('Failed to save reaction', { error: (err as Error).message });
    }

    io.to(roomId).emit(S2C.REACTION_RECEIVED, {
      emoji,
      senderName: displayName,
      senderSessionId: sessionId,
      videoTimestamp,
    });
  });
}
