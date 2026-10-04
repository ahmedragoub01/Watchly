import { query } from '../db/pool.js';
import { generateRoomId } from '../utils/generateId.js';
import { parseVideoUrl } from '../providers/validator.js';
import type { VideoInfo } from '@watchly/shared';

interface RoomRow {
  id: string;
  name: string;
  host_session_id: string;
  video_url: string | null;
  video_provider: string | null;
  video_title: string | null;
  status: string;
  created_at: Date;
  ended_at: Date | null;
}

export async function createRoomInDb(
  name: string,
  hostSessionId: string,
  video: VideoInfo | null,
): Promise<string> {
  const id = generateRoomId();

  await query(
    `INSERT INTO rooms (id, name, host_session_id, video_url, video_provider, video_title, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'waiting')`,
    [id, name, hostSessionId, video?.url ?? null, video?.provider ?? null, video?.title ?? null],
  );

  return id;
}

export async function getRoomFromDb(roomId: string): Promise<RoomRow | null> {
  const result = await query<RoomRow>(
    'SELECT * FROM rooms WHERE id = $1',
    [roomId],
  );
  return result.rows[0] ?? null;
}

export async function updateRoomVideo(roomId: string, video: VideoInfo): Promise<void> {
  await query(
    'UPDATE rooms SET video_url = $1, video_provider = $2, video_title = $3 WHERE id = $4',
    [video.url, video.provider, video.title ?? null, roomId],
  );
}

export async function endRoomInDb(roomId: string): Promise<void> {
  await query(
    "UPDATE rooms SET status = 'ended', ended_at = NOW() WHERE id = $1",
    [roomId],
  );
}

export { parseVideoUrl };
