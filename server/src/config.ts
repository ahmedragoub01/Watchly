import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const jwtSecret = process.env.JWT_SECRET || '';
if (isProduction && !jwtSecret) {
  throw new Error('JWT_SECRET is required in production');
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv,
  isDev: nodeEnv === 'development',

  databaseUrl: process.env.DATABASE_URL || '',

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  jwtSecret: isProduction ? jwtSecret : (jwtSecret || 'dev-secret-change-in-production'),

  dbPoolMax: 5,
} as const;
