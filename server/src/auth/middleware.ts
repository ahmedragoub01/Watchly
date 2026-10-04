import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt.js';
import type { TokenPayload } from './jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken<TokenPayload>(token);

  if (!payload || !payload.userId) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  req.user = payload;
  next();
}
