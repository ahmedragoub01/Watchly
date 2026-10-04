import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { paginatedResult, parsePagination } from '../utils/pagination.js';
import { friendService } from '../services/friendService.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.use(requireAuth);

const asyncRoute = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

router.get('/', asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const { items, total } = await friendService.getFriends(userId, limit, offset);
  res.json(paginatedResult(items, total, page, limit));
}));

router.get('/requests', asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const requests = await friendService.getRequests(userId);
  res.json(requests);
}));

router.post('/request', asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const { email } = req.body;

  if (!email || typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Valid email is required (max 254 chars)' });
  }

  const result = await friendService.sendRequest(userId, email);
  if ('error' in result) return res.status(400).json({ error: result.error });
  res.json(result);
}));

router.post('/:id/accept', asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const friendshipId = req.params.id as string;

  const success = await friendService.acceptRequest(friendshipId, userId);
  if (!success) return res.status(400).json({ error: 'Could not accept friend request' });
  res.json({ success: true });
}));

router.post('/:id/reject', asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const friendshipId = req.params.id as string;

  const success = await friendService.rejectRequest(friendshipId, userId);
  if (!success) return res.status(400).json({ error: 'Could not reject friend request' });
  res.json({ success: true });
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const friendshipId = req.params.id as string;

  const success = await friendService.removeFriend(friendshipId, userId);
  if (!success) return res.status(400).json({ error: 'Could not remove friend' });
  res.json({ success: true });
}));

router.get('/:id/watchlist', asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const friendshipId = req.params.id as string;
  const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const { items, total } = await friendService.getWatchlist(friendshipId, userId, limit, offset);
  res.json(paginatedResult(items, total, page, limit));
}));

router.post('/:id/watchlist', asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const friendshipId = req.params.id as string;
  const { url, provider, title, thumbnailUrl } = req.body;

  if (!url || !provider || !title) return res.status(400).json({ error: 'Missing video details' });

  const item = await friendService.addWatchlistItem(friendshipId, userId, { url, provider, title, thumbnailUrl });
  res.json(item);
}));

router.delete('/:id/watchlist/:itemId', asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const friendshipId = req.params.id as string;
  const itemId = req.params.itemId as string;

  const success = await friendService.removeWatchlistItem(itemId, friendshipId, userId);
  if (!success) return res.status(400).json({ error: 'Could not remove item' });
  res.json({ success: true });
}));

router.patch('/:id/watchlist/:itemId/watched', asyncRoute(async (req, res) => {
  const userId = req.user!.userId;
  const friendshipId = req.params.id as string;
  const itemId = req.params.itemId as string;

  const success = await friendService.markWatchlistItemAsWatched(itemId, friendshipId, userId);
  if (!success) return res.status(400).json({ error: 'Could not mark item as watched' });
  res.json({ success: true });
}));

export default router;
