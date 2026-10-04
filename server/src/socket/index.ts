import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { registerRoomHandlers, handleDisconnect } from './roomHandler.js';
import { registerPlaybackHandlers } from './playbackHandler.js';
import { registerChatHandlers } from './chatHandler.js';
import { registerReactionHandlers } from './reactionHandler.js';
import { C2S, S2C } from '@watchly/shared';
import { verifyToken, type TokenPayload } from '../auth/jwt.js';

declare module 'socket.io' {
  interface Socket {
    user?: TokenPayload;
  }
}

function isSocketOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (origin === config.clientUrl) return true;
  if (config.clientServiceUrl && origin === config.clientServiceUrl) return true;
  try {
    const originUrl = new URL(origin);
    return config.isDev
      ? originUrl.hostname === 'localhost'
      : originUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isSocketOriginAllowed(origin));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();

    const payload = verifyToken<TokenPayload>(token);
    if (!payload) return next(new Error('Invalid token'));

    socket.user = payload;
    next();
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id, authenticated: !!socket.user });

    registerRoomHandlers(io, socket);
    registerPlaybackHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerReactionHandlers(io, socket);

    socket.on(C2S.CLOCK_SYNC, (payload: { clientTime: number }) => {
      socket.emit(S2C.CLOCK_SYNC_RESPONSE, {
        clientTime: payload.clientTime,
        serverTime: Date.now(),
      });
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, reason });
      handleDisconnect(io, socket);
    });
  });

  return io;
}
