import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { runMigrations } from './db/migrate.js';
import { createSocketServer } from './socket/index.js';
import { roomState } from './state/RoomStateManager.js';
import healthRouter from './routes/health.js';
import roomsRouter from './routes/rooms.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import friendsRouter from './routes/friends.js';
import { groupsRouter } from './routes/groups.js';
import { proxyRouter } from './routes/proxy.js';
import notificationsRouter from './routes/notifications.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimit, authRateLimit } from './middleware/rateLimit.js';

const app = express();
const httpServer = createServer(app);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors({
  origin: config.clientUrl,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
}));

app.use(express.json());

app.use('/api', rateLimit(60, 60_000));
app.use('/api/auth', authRateLimit);

app.use('/api', healthRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/proxy', proxyRouter);
app.use('/api/notifications', notificationsRouter);

app.use(errorHandler);

const io = createSocketServer(httpServer);

setInterval(() => {
  roomState.cleanupEmptyRooms(5 * 60 * 1000);
}, 60_000);

async function start() {
  if (config.databaseUrl) {
    try {
      await runMigrations();
      logger.info('Database ready');
    } catch (err) {
      logger.error('Database migration failed', { error: (err as Error).message });
      logger.warn('Starting without database — some features will be unavailable');
    }
  } else {
    logger.warn('No DATABASE_URL configured — starting without database');
  }

  httpServer.listen(config.port, '0.0.0.0', () => {
    logger.info(`Watchly server running on 0.0.0.0:${config.port}`, {
      env: config.nodeEnv,
      clientUrl: config.clientUrl,
    });
  });
}

start();
