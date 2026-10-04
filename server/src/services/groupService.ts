import { pool } from '../db/pool.js';
import { generateRoomId as generateId } from '../utils/generateId.js';
import type { Group, GroupMember, GroupInvitation, GroupWatchlistItem, ProviderType } from '@watchly/shared';

export class GroupService {
  async createGroup(name: string, ownerId: string, avatarUrl?: string): Promise<Group> {
    const id = generateId();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const groupRes = await client.query(
        `INSERT INTO groups (id, name, owner_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, name, ownerId, avatarUrl || null]
      );

      await client.query(
        `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'owner')`,
        [id, ownerId]
      );
      
      await client.query('COMMIT');
      
      const row = groupRes.rows[0];
      return {
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getGroups(userId: string, limit = 20, offset = 0): Promise<{ items: Group[]; total: number }> {
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM group_members WHERE user_id = $1`,
      [userId]
    );
    const res = await pool.query(
      `SELECT g.* FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      total: countRes.rows[0]?.total ?? 0,
      items: res.rows.map(row => ({
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at
      })),
    };
  }

  async updateGroup(groupId: string, name?: string, avatarUrl?: string): Promise<Group> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (avatarUrl !== undefined) {
      updates.push(`avatar_url = $${idx++}`);
      values.push(avatarUrl);
    }

    if (updates.length === 0) {
      const res = await pool.query('SELECT * FROM groups WHERE id = $1', [groupId]);
      const row = res.rows[0];
      return { id: row.id, name: row.name, ownerId: row.owner_id, avatarUrl: row.avatar_url, createdAt: row.created_at };
    }

    values.push(groupId);
    const res = await pool.query(
      `UPDATE groups SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at
    };
  }

  async getGroupMembers(groupId: string, limit = 50, offset = 0): Promise<{ items: GroupMember[]; total: number }> {
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM group_members WHERE group_id = $1`,
      [groupId]
    );
    const res = await pool.query(
      `SELECT gm.group_id, gm.user_id, gm.role, gm.joined_at, u.display_name, u.avatar_url
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at ASC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );

    return {
      total: countRes.rows[0]?.total ?? 0,
      items: res.rows.map(row => ({
        groupId: row.group_id,
        userId: row.user_id,
        role: row.role,
        joinedAt: row.joined_at,
        displayName: row.display_name,
        avatarUrl: row.avatar_url
      })),
    };
  }

  async inviteUser(groupId: string, inviterId: string, inviteeEmail: string): Promise<GroupInvitation | { error: string }> {
    const checkMem = await pool.query('SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, inviterId]);
    if (checkMem.rows.length === 0) return { error: 'Not authorized' };

    const uRes = await pool.query('SELECT id FROM users WHERE email = $1', [inviteeEmail]);
    if (uRes.rows.length === 0) return { error: 'User not found' };
    const inviteeId = uRes.rows[0].id;

    const checkExt = await pool.query('SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, inviteeId]);
    if (checkExt.rows.length > 0) return { error: 'User already in group' };

    const res = await pool.query(
      `INSERT INTO group_invitations (group_id, inviter_id, invitee_id) VALUES ($1, $2, $3) RETURNING *`,
      [groupId, inviterId, inviteeId]
    );

    const [inviterRes, groupRes] = await Promise.all([
      pool.query('SELECT display_name FROM users WHERE id = $1', [inviterId]),
      pool.query('SELECT name FROM groups WHERE id = $1', [groupId])
    ]);
    const inviterName = inviterRes.rows[0]?.display_name || 'Someone';
    const groupName = groupRes.rows[0]?.name || 'a group';

    try {
      const { sendEmail } = await import('./emailService.js');
      await sendEmail({
        to: inviteeEmail,
        subject: `${inviterName} invited you to join ${groupName} on Watchly`,
        html: `<p>Hi there,</p><p><strong>${inviterName}</strong> has invited you to join the group <strong>${groupName}</strong> on Watchly.</p><p>Log in to your account to accept the invitation.</p>`,
        context: 'Group Invite',
      });
    } catch (err) {
      console.error('[Group Invite] Email failed:', err);
      throw new Error('Group invitation created, but failed to send email: ' + (err as Error).message);
    }

    const row = res.rows[0];
    return {
      id: row.id,
      groupId: row.group_id,
      inviterId: row.inviter_id,
      inviteeId: row.invitee_id,
      status: row.status,
      createdAt: row.created_at
    };
  }

  async getInvitations(userId: string): Promise<any[]> {
    const res = await pool.query(
      `SELECT i.*, g.name as group_name, g.avatar_url as group_avatar, u.display_name as inviter_name
       FROM group_invitations i
       JOIN groups g ON i.group_id = g.id
       JOIN users u ON i.inviter_id = u.id
       WHERE i.invitee_id = $1 AND i.status = 'pending'`,
      [userId]
    );

    return res.rows.map(row => ({
      id: row.id,
      groupId: row.group_id,
      groupName: row.group_name,
      groupAvatar: row.group_avatar,
      inviterName: row.inviter_name,
      status: row.status,
      createdAt: row.created_at
    }));
  }

  async respondToInvitation(invitationId: string, inviteeId: string, accept: boolean): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        `UPDATE group_invitations SET status = $1 WHERE id = $2 AND invitee_id = $3 AND status = 'pending' RETURNING group_id`,
        [accept ? 'accepted' : 'rejected', invitationId, inviteeId]
      );

      if (res.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      if (accept) {
        const groupId = res.rows[0].group_id;
        await client.query(
          `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
          [groupId, inviteeId]
        );
      }
      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      return false;
    } finally {
      client.release();
    }
  }

  async getWatchlist(
    groupId: string,
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ items: GroupWatchlistItem[]; total: number }> {
    const memCheck = await pool.query('SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (memCheck.rows.length === 0) throw new Error('Not authorized');

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM group_watchlist_items WHERE group_id = $1`,
      [groupId]
    );
    const res = await pool.query(
      `SELECT 
         w.*, 
         u.display_name as added_by_name,
         COALESCE(SUM(v.vote), 0) as vote_count,
         EXISTS(SELECT 1 FROM group_watchlist_votes uv WHERE uv.item_id = w.id AND uv.user_id = $2 AND uv.vote > 0) as user_voted
       FROM group_watchlist_items w
       JOIN users u ON w.added_by_id = u.id
       LEFT JOIN group_watchlist_votes v ON w.id = v.item_id
       WHERE w.group_id = $1
       GROUP BY w.id, u.display_name
       ORDER BY w.status = 'watched' ASC, vote_count DESC, w.created_at DESC
       LIMIT $3 OFFSET $4`,
      [groupId, userId, limit, offset]
    );

    return {
      total: countRes.rows[0]?.total ?? 0,
      items: res.rows.map(row => ({
        id: row.id,
        groupId: row.group_id,
        addedById: row.added_by_id,
        addedByName: row.added_by_name,
        video: {
          url: row.video_url,
          provider: row.video_provider as ProviderType,
          videoId: this.parseVideoId(row.video_url, row.video_provider),
          title: row.video_title,
          thumbnailUrl: row.thumbnail_url
        },
        status: row.status,
        voteCount: parseInt(row.vote_count),
        userVoted: row.user_voted,
        watchedAt: row.watched_at,
        createdAt: row.created_at
      })),
    };
  }

  async addWatchlistItem(groupId: string, userId: string, video: { url: string; provider: string; title: string; thumbnailUrl?: string }): Promise<boolean> {
    const memCheck = await pool.query('SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (memCheck.rows.length === 0) return false;

    await pool.query(
      `INSERT INTO group_watchlist_items (group_id, added_by_id, video_url, video_provider, video_title, thumbnail_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'proposed')`,
      [groupId, userId, video.url, video.provider, video.title, video.thumbnailUrl || null]
    );
    return true;
  }

  async toggleVote(itemId: string, userId: string): Promise<boolean> {
    const membership = await pool.query(`
      SELECT 1 FROM group_members gm
      JOIN group_watchlist_items w ON w.group_id = gm.group_id
      WHERE w.id = $1 AND gm.user_id = $2`, [itemId, userId]);
    if (membership.rows.length === 0) return false;

    const check = await pool.query('SELECT vote FROM group_watchlist_votes WHERE item_id = $1 AND user_id = $2', [itemId, userId]);
    if (check.rows.length > 0) {
      if (check.rows[0].vote > 0) {
        await pool.query('DELETE FROM group_watchlist_votes WHERE item_id = $1 AND user_id = $2', [itemId, userId]);
      } else {
        await pool.query('UPDATE group_watchlist_votes SET vote = 1 WHERE item_id = $1 AND user_id = $2', [itemId, userId]);
      }
    } else {
      await pool.query('INSERT INTO group_watchlist_votes (item_id, user_id, vote) VALUES ($1, $2, 1)', [itemId, userId]);
    }
    return true;
  }

  async isOwner(groupId: string, userId: string): Promise<boolean> {
    const res = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'owner'`,
      [groupId, userId]
    );
    return res.rows.length > 0;
  }

  async isAdmin(groupId: string, userId: string): Promise<boolean> {
    const res = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')`,
      [groupId, userId]
    );
    return res.rows.length > 0;
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const res = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
    return res.rows.length > 0;
  }

  private parseVideoId(url: string, provider: string): string {
    if (provider === 'youtube') {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\n]+)/);
      if (match && match[1]) return match[1];
    }
    return url;
  }
}

export const groupService = new GroupService();
