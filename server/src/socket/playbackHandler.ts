import type { Server, Socket } from 'socket.io';
import { C2S, S2C } from '@watchly/shared';
import type { PlayPayload, PausePayload, SeekPayload, ChangeVideoPayload } from '@watchly/shared';
import { roomState } from '../state/RoomStateManager.js';
import { parseVideoUrl } from '../providers/validator.js';
import { updateRoomVideo } from '../services/roomService.js';
import { logger } from '../utils/logger.js';

export function registerPlaybackHandlers(io: Server, socket: Socket) {
  socket.on(C2S.PLAYBACK_PLAY, (payload: PlayPayload) => {
    const { roomId, currentTime } = payload;
    const sessionId = socket.data.sessionId;

    if (!roomState.isHost(roomId, sessionId)) {
      socket.emit(S2C.ROOM_ERROR, { message: 'Only the host can control playback' });
      return;
    }

    const playback = roomState.play(roomId, currentTime);
    if (!playback) return;

    io.to(roomId).emit(S2C.PLAYBACK_PLAY, {
      currentTime: playback.positionAtLastUpdate,
      serverTimestamp: playback.updatedAtServerTime,
    });
  });

  socket.on(C2S.PLAYBACK_PAUSE, (payload: PausePayload) => {
    const { roomId, currentTime } = payload;
    const sessionId = socket.data.sessionId;

    if (!roomState.isHost(roomId, sessionId)) {
      socket.emit(S2C.ROOM_ERROR, { message: 'Only the host can control playback' });
      return;
    }

    const playback = roomState.pause(roomId, currentTime);
    if (!playback) return;

    io.to(roomId).emit(S2C.PLAYBACK_PAUSE, {
      currentTime: playback.positionAtLastUpdate,
    });
  });

  socket.on(C2S.PLAYBACK_SEEK, (payload: SeekPayload) => {
    const { roomId, seekTo } = payload;
    const sessionId = socket.data.sessionId;

    if (!roomState.isHost(roomId, sessionId)) {
      socket.emit(S2C.ROOM_ERROR, { message: 'Only the host can control playback' });
      return;
    }

    const playback = roomState.seek(roomId, seekTo);
    if (!playback) return;

    io.to(roomId).emit(S2C.PLAYBACK_SEEK, {
      seekTo: playback.positionAtLastUpdate,
      serverTimestamp: playback.updatedAtServerTime,
    });
  });

  socket.on(C2S.PLAYBACK_VIDEO, async (payload: ChangeVideoPayload) => {
    const { roomId, videoUrl } = payload;
    const sessionId = socket.data.sessionId;

    if (!roomState.isHost(roomId, sessionId)) {
      socket.emit(S2C.ROOM_ERROR, { message: 'Only the host can change the video' });
      return;
    }

    const video = parseVideoUrl(videoUrl);
    if (!video) {
      socket.emit(S2C.ROOM_ERROR, { message: 'Invalid video URL' });
      return;
    }

    roomState.setVideo(roomId, video);

    try {
      await updateRoomVideo(roomId, video);
    } catch (err) {
      logger.error('Failed to persist video change', { error: (err as Error).message });
    }

    io.to(roomId).emit(S2C.PLAYBACK_VIDEO, { video });
  });
}
