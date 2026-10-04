import { pool } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import type { RoomState } from '@watchly/shared';

export class ReplayService {
  async generateReplay(room: RoomState): Promise<void> {
    try {
      const roomId = room.id;

      const durationSecs = Math.floor((Date.now() - room.createdAt) / 1000);
      const participantNames = Array.from(new Set(room.participants.map(p => p.displayName)));

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const msgRes = await client.query('SELECT COUNT(*) as count FROM chat_messages WHERE room_id = $1', [roomId]);
        const messageCount = parseInt(msgRes.rows[0].count, 10);

        const reactRes = await client.query('SELECT COUNT(*) as count FROM reactions WHERE room_id = $1', [roomId]);
        const reactionCount = parseInt(reactRes.rows[0].count, 10);

        const peakRes = await client.query(`
          SELECT ROUND(video_timestamp / 5) * 5 as window_ts, emoji, COUNT(*) as count
          FROM reactions 
          WHERE room_id = $1 
          GROUP BY window_ts, emoji
          ORDER BY count DESC 
          LIMIT 1
        `, [roomId]);

        let peakMomentTs = null;
        let peakMomentEmoji = null;

        if (peakRes.rows.length > 0) {
          peakMomentTs = parseFloat(peakRes.rows[0].window_ts);
          peakMomentEmoji = peakRes.rows[0].emoji;
        }

        const existing = await client.query('SELECT id FROM party_replays WHERE room_id = $1', [roomId]);
        if (existing.rows.length === 0) {
          await client.query(`
            INSERT INTO party_replays 
            (room_id, duration_secs, participant_names, reaction_count, message_count, peak_moment_ts, peak_moment_emoji)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            roomId, durationSecs, participantNames, reactionCount, messageCount, peakMomentTs, peakMomentEmoji
          ]);
        }

        await client.query('COMMIT');
        logger.info(`Generated Party Replay for room ${roomId}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error(`Failed to generate Party Replay for room ${room.id}`, { error: (err as Error).message });
    }
  }
}

export const replayService = new ReplayService();
