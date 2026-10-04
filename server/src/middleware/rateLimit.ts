import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

setInterval(() => {
  const now = Date.now();
  for (const store of stores.values()) {
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }
}, 60_000);

function makeLimiter(namespace: string, maxRequests: number, windowMs: number) {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = store!.get(key);

    if (!entry || entry.resetAt <= now) {
      store!.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    entry.count++;
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    next();
  };
}

export const rateLimit = (max: number, windowMs: number) => makeLimiter('api', max, windowMs);
export const authRateLimit = makeLimiter('auth', 10, 60_000);
