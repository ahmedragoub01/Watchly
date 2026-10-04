import { query } from '../db/pool.js';
import type { Reaction, ReactionEmoji, REACTION_EMOJIS } from '@watchly/shared';

interface ReactionRow {
  id: string;
  room_id: string;
  sender_name: string;
  sender_session: string | null;
  sender_user_id: string | null;
  emoji: string;
  video_timestamp: number;
  created_at: Date;
}

function rowToReaction(row: ReactionRow): Reaction {
  return {
    id: row.id.toString(),
    roomId: row.room_id,
    senderName: row.sender_name,
    senderSessionId: row.sender_session ?? '',
    emoji: row.emoji as ReactionEmoji,
    videoTimestamp: row.video_timestamp,
    createdAt: row.created_at.toISOString(),
  };
}

export async function saveReaction(
  roomId: string,
  senderName: string,
  senderSession: string,
  emoji: ReactionEmoji,
  videoTimestamp: number,
): Promise<Reaction> {
  const result = await query<ReactionRow>(
    `INSERT INTO reactions (room_id, sender_name, sender_session, emoji, video_timestamp)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [roomId, senderName, senderSession, emoji, videoTimestamp],
  );

  return rowToReaction(result.rows[0]);
}

export async function getReactionsForRoom(roomId: string): Promise<Reaction[]> {
  const result = await query<ReactionRow>(
    'SELECT * FROM reactions WHERE room_id = $1 ORDER BY video_timestamp',
    [roomId],
  );

  return result.rows.map(rowToReaction);
}
