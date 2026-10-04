import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { paginatedResult, parsePagination } from '../utils/pagination.js';
import { parseVideoUrl } from '../providers/validator.js';
import { cloudinary, upload } from '../utils/cloudinary.js';
import { groupService } from '../services/groupService.js';

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

const asyncRoute = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

groupsRouter.get('/', asyncRoute(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const { items, total } = await groupService.getGroups(req.user!.userId, limit, offset);
  res.json(paginatedResult(items, total, page, limit));
}));

groupsRouter.post('/', upload.single('avatar'), asyncRoute(async (req, res) => {
  const { name } = req.body;
  let { avatarUrl } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  if (req.file) {
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: 'watchly/groups',
      overwrite: true,
      invalidate: true,
      transformation: [{ width: 400, height: 400, crop: 'fill' }]
    });
    avatarUrl = uploadResponse.secure_url;
  }

  const group = await groupService.createGroup(name, req.user!.userId, avatarUrl);
  res.json(group);
}));

groupsRouter.patch('/:id', upload.single('avatar'), asyncRoute(async (req, res) => {
  const groupId = req.params.id as string;
  const userId = req.user!.userId;

  const isAdmin = await groupService.isAdmin(groupId, userId);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const { name } = req.body;
  let { avatarUrl } = req.body;

  if (req.file) {
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: 'watchly/groups',
      public_id: groupId,
      overwrite: true,
      invalidate: true,
      transformation: [{ width: 400, height: 400, crop: 'fill' }]
    });
    avatarUrl = uploadResponse.secure_url;
  }

  const group = await groupService.updateGroup(groupId, name, avatarUrl);
  res.json(group);
}));

groupsRouter.get('/invitations', asyncRoute(async (req, res) => {
  const invites = await groupService.getInvitations(req.user!.userId);
  res.json(invites);
}));

groupsRouter.post('/invitations/:id/respond', asyncRoute(async (req, res) => {
  const { accept } = req.body;
  const success = await groupService.respondToInvitation(req.params.id as string, req.user!.userId, accept);
  if (!success) return res.status(400).json({ error: 'Failed to respond to invitation' });
  res.json({ success: true });
}));

groupsRouter.get('/:id/members', asyncRoute(async (req, res) => {
  const groupId = req.params.id as string;
  const member = await groupService.isMember(groupId, req.user!.userId);
  if (!member) return res.status(403).json({ error: 'Forbidden' });

  const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const { items, total } = await groupService.getGroupMembers(groupId, limit, offset);
  res.json(paginatedResult(items, total, page, limit));
}));

groupsRouter.post('/:id/invite', asyncRoute(async (req, res) => {
  const groupId = req.params.id as string;
  const member = await groupService.isMember(groupId, req.user!.userId);
  if (!member) return res.status(403).json({ error: 'Forbidden' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const result = await groupService.inviteUser(groupId, req.user!.userId, email);
  if ('error' in result) return res.status(400).json(result);
  res.json(result);
}));

groupsRouter.get('/:id/watchlist', asyncRoute(async (req, res) => {
  const groupId = req.params.id as string;
  const member = await groupService.isMember(groupId, req.user!.userId);
  if (!member) return res.status(403).json({ error: 'Forbidden' });

  const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const { items, total } = await groupService.getWatchlist(groupId, req.user!.userId, limit, offset);
  res.json(paginatedResult(items, total, page, limit));
}));

groupsRouter.post('/:id/watchlist', asyncRoute(async (req, res) => {
  const groupId = req.params.id as string;
  const member = await groupService.isMember(groupId, req.user!.userId);
  if (!member) return res.status(403).json({ error: 'Forbidden' });

  const { url, title, thumbnailUrl } = req.body;
  const parsed = parseVideoUrl(url);
  if (!parsed) return res.status(400).json({ error: 'Invalid or unsupported video URL' });

  const success = await groupService.addWatchlistItem(groupId, req.user!.userId, {
    url,
    provider: parsed.provider,
    title: title || 'Video',
    thumbnailUrl
  });

  if (!success) return res.status(400).json({ error: 'Failed to add video' });
  res.json({ success: true });
}));

groupsRouter.post('/:id/watchlist/:itemId/vote', asyncRoute(async (req, res) => {
  const success = await groupService.toggleVote(req.params.itemId as string, req.user!.userId);
  if (!success) return res.status(403).json({ error: 'Forbidden' });
  res.json({ success: true });
}));
