import { pool } from '../db/pool.js';
import type { Friendship, FriendProfile, FriendRequest, FriendWatchlistItem } from '@watchly/shared';
import type { VideoInfo, ProviderType } from '@watchly/shared';

export class FriendService {
  async sendRequest(requesterId: string, addresseeEmail: string): Promise<Friendship | { error: string }> {
    const addresseeRes = await pool.query('SELECT id FROM users WHERE email = $1', [addresseeEmail]);
    if (addresseeRes.rows.length === 0) {
      return { error: 'User not found' };
    }
    const addresseeId = addresseeRes.rows[0].id;

    if (requesterId === addresseeId) {
      return { error: 'Cannot send a friend request to yourself' };
    }

    const existingRes = await pool.query(
      `SELECT * FROM friendships WHERE 
        (requester_id = $1 AND addressee_id = $2) OR 
        (requester_id = $2 AND addressee_id = $1)`,
      [requesterId, addresseeId]
    );

    if (existingRes.rows.length > 0) {
      return { error: 'Friendship already exists or pending' };
    }

    const res = await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id, status) 
       VALUES ($1, $2, 'pending') RETURNING *`,
      [requesterId, addresseeId]
    );

    const requesterRes = await pool.query('SELECT display_name FROM users WHERE id = $1', [requesterId]);
    const requesterName = requesterRes.rows[0]?.display_name || 'Someone';

    try {
      const { sendEmail } = await import('./emailService.js');
      await sendEmail({
        to: addresseeEmail,
        subject: `${requesterName} sent you a friend request on Watchly`,
        html: `<p>Hi there,</p><p><strong>${requesterName}</strong> has sent you a friend request on Watchly.</p><p>Log in to your account to accept or ignore the request.</p>`,
        context: 'Friend Request',
      });
    } catch (err) {
      console.error('[Friend Request] Email failed:', err);
      throw new Error('Friend request created, but failed to send email: ' + (err as Error).message);
    }

    return this.mapToFriendship(res.rows[0]);
  }

  async acceptRequest(friendshipId: string, addresseeId: string): Promise<boolean> {
    const res = await pool.query(
      `UPDATE friendships SET status = 'accepted', updated_at = NOW() 
       WHERE id = $1 AND addressee_id = $2 AND status = 'pending' RETURNING id`,
      [friendshipId, addresseeId]
    );
    return res.rows.length > 0;
  }

  async rejectRequest(friendshipId: string, addresseeId: string): Promise<boolean> {
    const res = await pool.query(
      `UPDATE friendships SET status = 'rejected', updated_at = NOW() 
       WHERE id = $1 AND addressee_id = $2 AND status = 'pending' RETURNING id`,
      [friendshipId, addresseeId]
    );
    return res.rows.length > 0;
  }

  async removeFriend(friendshipId: string, userId: string): Promise<boolean> {
    const res = await pool.query(
      `DELETE FROM friendships 
       WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2) RETURNING id`,
      [friendshipId, userId]
    );
    return res.rows.length > 0;
  }

  async getFriends(userId: string, limit = 20, offset = 0): Promise<{ items: FriendProfile[]; total: number }> {
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM friendships f WHERE f.status = 'accepted' AND (f.requester_id = $1 OR f.addressee_id = $1)`,
      [userId]
    );
    const res = await pool.query(
      `SELECT 
         f.id as friendship_id,
         f.status,
         f.created_at,
         u.id as user_id,
         u.display_name,
         u.avatar_url
       FROM friendships f
       JOIN users u ON 
         (f.requester_id = u.id AND f.addressee_id = $1) OR 
         (f.addressee_id = u.id AND f.requester_id = $1)
       WHERE f.status = 'accepted'
       ORDER BY u.display_name ASC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      total: countRes.rows[0]?.total ?? 0,
      items: res.rows.map(row => ({
        friendshipId: row.friendship_id,
        userId: row.user_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        status: row.status,
        createdAt: row.created_at,
      })),
    };
  }

  async getRequests(userId: string): Promise<FriendRequest[]> {
    const res = await pool.query(
      `SELECT 
         f.id as friendship_id,
         f.requester_id,
         f.addressee_id,
         f.created_at,
         u.id as user_id,
         u.display_name,
         u.avatar_url
       FROM friendships f
       JOIN users u ON 
         (f.requester_id = u.id AND f.addressee_id = $1) OR 
         (f.addressee_id = u.id AND f.requester_id = $1)
       WHERE f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return res.rows.map(row => {
      const isIncoming = row.addressee_id === userId;
      return {
        friendshipId: row.friendship_id,
        userId: row.user_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        direction: isIncoming ? 'incoming' : 'outgoing',
        createdAt: row.created_at
      };
    });
  }

  async getWatchlist(
    friendshipId: string,
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ items: FriendWatchlistItem[]; total: number }> {
    const check = await pool.query(
      `SELECT id FROM friendships 
       WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2) AND status = 'accepted'`,
      [friendshipId, userId]
    );
    if (check.rows.length === 0) {
      throw new Error('Not authorized to view this watchlist');
    }

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM friend_watchlist_items WHERE friendship_id = $1`,
      [friendshipId]
    );
    const res = await pool.query(
      `SELECT w.*, u.display_name as added_by_name 
       FROM friend_watchlist_items w
       JOIN users u ON w.added_by_id = u.id
       WHERE w.friendship_id = $1
       ORDER BY w.created_at DESC
       LIMIT $2 OFFSET $3`,
      [friendshipId, limit, offset]
    );

    return {
      total: countRes.rows[0]?.total ?? 0,
      items: res.rows.map(row => ({
        id: row.id,
        friendshipId: row.friendship_id,
        addedById: row.added_by_id,
        addedByName: row.added_by_name,
        video: {
          url: row.video_url,
          provider: row.video_provider as ProviderType,
          videoId: this.parseVideoId(row.video_url, row.video_provider as ProviderType),
          title: row.video_title,
          thumbnailUrl: row.thumbnail_url
        },
        status: row.status,
        watchedAt: row.watched_at,
        createdAt: row.created_at
      })),
    };
  }

  async addWatchlistItem(
    friendshipId: string, 
    userId: string, 
    video: { url: string; provider: string; title: string; thumbnailUrl?: string }
  ): Promise<FriendWatchlistItem> {
    const check = await pool.query(
      `SELECT id FROM friendships 
       WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2) AND status = 'accepted'`,
      [friendshipId, userId]
    );
    if (check.rows.length === 0) {
      throw new Error('Not authorized to modify this watchlist');
    }

    const res = await pool.query(
      `INSERT INTO friend_watchlist_items (
        friendship_id, added_by_id, video_url, video_provider, video_title, thumbnail_url, status
       ) VALUES ($1, $2, $3, $4, $5, $6, 'unwatched') RETURNING *`,
      [friendshipId, userId, video.url, video.provider, video.title, video.thumbnailUrl || null]
    );

    const userRes = await pool.query('SELECT display_name FROM users WHERE id = $1', [userId]);

    const row = res.rows[0];
    return {
      id: row.id,
      friendshipId: row.friendship_id,
      addedById: row.added_by_id,
      addedByName: userRes.rows[0].display_name,
      video: {
        url: row.video_url,
        provider: row.video_provider as ProviderType,
        videoId: this.parseVideoId(row.video_url, row.video_provider as ProviderType),
        title: row.video_title,
        thumbnailUrl: row.thumbnail_url
      },
      status: row.status,
      watchedAt: row.watched_at,
      createdAt: row.created_at
    };
  }

  async removeWatchlistItem(itemId: string, friendshipId: string, userId: string): Promise<boolean> {
    const check = await pool.query(
      `SELECT id FROM friendships 
       WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2) AND status = 'accepted'`,
      [friendshipId, userId]
    );
    if (check.rows.length === 0) {
      return false;
    }

    const res = await pool.query(
      `DELETE FROM friend_watchlist_items WHERE id = $1 AND friendship_id = $2 RETURNING id`,
      [itemId, friendshipId]
    );
    return res.rows.length > 0;
  }

  async markWatchlistItemAsWatched(itemId: string, friendshipId: string, userId: string): Promise<boolean> {
    const check = await pool.query(
      `SELECT id FROM friendships 
       WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2) AND status = 'accepted'`,
      [friendshipId, userId]
    );
    if (check.rows.length === 0) return false;

    const res = await pool.query(
      `UPDATE friend_watchlist_items SET status = 'watched', watched_at = NOW() 
       WHERE id = $1 AND friendship_id = $2 RETURNING id`,
      [itemId, friendshipId]
    );
    return res.rows.length > 0;
  }

  private mapToFriendship(row: any): Friendship {
    return {
      id: row.id,
      requesterId: row.requester_id,
      addresseeId: row.addressee_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private parseVideoId(url: string, provider: ProviderType): string {
    if (provider === 'youtube') {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\n]+)/);
      if (match && match[1]) return match[1];
    }
    return url;
  }
}

export const friendService = new FriendService();
