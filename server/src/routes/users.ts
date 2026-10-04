import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../auth/middleware.js';
import { cloudinary, upload } from '../utils/cloudinary.js';
import { toUserResponse } from '../utils/toUserResponse.js';

const router = Router();

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, display_name, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(toUserResponse(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { displayName } = req.body;

    if (req.user?.userId !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let avatarUrl = req.body.avatarUrl;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: 'watchly/avatars',
        public_id: id,
        overwrite: true,
        invalidate: true,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        ]
      });

      avatarUrl = uploadResponse.secure_url;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (displayName) {
      updates.push(`display_name = $${idx++}`);
      values.push(displayName);
    }

    if (avatarUrl !== undefined) {
      updates.push(`avatar_url = $${idx++}`);
      values.push(avatarUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${idx} 
      RETURNING id, email, display_name, avatar_url, updated_at
    `;

    const result = await pool.query(query, values);
    res.json(toUserResponse(result.rows[0]));

  } catch (err) {
    next(err);
  }
});

router.get('/:id/dashboard', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user?.userId !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const friendWatchlistRes = await pool.query(`
      SELECT fwi.*, 'friend' as source_type 
      FROM friend_watchlist_items fwi
      JOIN friendships f ON f.id = fwi.friendship_id
      WHERE (f.requester_id = $1 OR f.addressee_id = $1)
      AND fwi.status = 'unwatched'
      ORDER BY fwi.created_at DESC
      LIMIT 10
    `, [id]);

    const groupWatchlistRes = await pool.query(`
      SELECT gwi.*, 'group' as source_type
      FROM group_watchlist_items gwi
      JOIN group_members gm ON gm.group_id = gwi.group_id
      WHERE gm.user_id = $1
      AND gwi.status = 'proposed'
      ORDER BY gwi.created_at DESC
      LIMIT 10
    `, [id]);

    const watchlist = [...friendWatchlistRes.rows, ...groupWatchlistRes.rows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15);

    const trending = [
      { id: '1', title: 'Top Movie Night 2026', provider: 'youtube', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' },
      { id: '2', title: 'Coding Live Stream', provider: 'youtube', url: 'https://youtube.com/watch?v=1', thumbnail_url: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=400' },
      { id: '3', title: 'Gaming Highlights', provider: 'youtube', url: 'https://youtube.com/watch?v=2', thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
      { id: '4', title: 'Tech Review Weekly', provider: 'youtube', url: 'https://youtube.com/watch?v=3', thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400' }
    ];

    res.json({ watchlist, trending });
  } catch (err) {
    next(err);
  }
});

export default router;
