import { query } from '../db/pool.js';
import type { ChatMessage } from '@watchly/shared';

interface ChatRow {
  id: string;
  room_id: string;
  sender_name: string;
  sender_session: string | null;
  sender_user_id: string | null;
  content: string;
  video_timestamp: number | null;
  created_at: Date;
}

function rowToMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id.toString(),
    roomId: row.room_id,
    senderName: row.sender_name,
    senderSessionId: row.sender_session ?? '',
    senderUserId: row.sender_user_id ?? undefined,
    content: row.content,
    videoTimestamp: row.video_timestamp,
    createdAt: row.created_at.toISOString(),
  };
}

export async function saveMessage(
  roomId: string,
  senderName: string,
  senderSession: string,
  content: string,
  videoTimestamp?: number,
): Promise<ChatMessage> {
  const result = await query<ChatRow>(
    `INSERT INTO chat_messages (room_id, sender_name, sender_session, content, video_timestamp)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [roomId, senderName, senderSession, content, videoTimestamp ?? null],
  );

  return rowToMessage(result.rows[0]);
}

export async function getRecentMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
  const result = await query<ChatRow>(
    `SELECT * FROM chat_messages
     WHERE room_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [roomId, limit],
  );

  return result.rows.reverse().map(rowToMessage);
}
