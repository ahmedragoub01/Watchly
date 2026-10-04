import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface TokenPayload {
  userId: string;
}

export interface MagicLinkPayload {
  email: string;
  type: 'magic_link';
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '1h' });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '30d' });
}

export function signMagicLinkToken(email: string): string {
  return jwt.sign({ email, type: 'magic_link' }, config.jwtSecret, { expiresIn: '15m' });
}

export function verifyToken<T>(token: string): T | null {
  try {
    return jwt.verify(token, config.jwtSecret) as T;
  } catch {
    return null;
  }
}
