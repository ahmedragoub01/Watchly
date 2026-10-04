import type { Server, Socket } from 'socket.io';
import { C2S, S2C } from '@watchly/shared';
import type { JoinRoomPayload } from '@watchly/shared';
import { roomState } from '../state/RoomStateManager.js';
import { generateSessionId } from '../utils/generateId.js';
import { getRecentMessages } from '../services/chatService.js';
import { getReactionsForRoom } from '../services/reactionService.js';
import { logger } from '../utils/logger.js';

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on(C2S.ROOM_JOIN, async (payload: JoinRoomPayload) => {
    const { roomId, displayName, sessionId: existingSessionId } = payload;

    if (!roomId || !displayName) {
      socket.emit(S2C.ROOM_ERROR, { message: 'Room ID and display name are required' });
      return;
    }

    const room = roomState.getRoom(roomId);
    if (!room) {
      socket.emit(S2C.ROOM_ERROR, { message: 'Room not found' });
      return;
    }

    if (room.status === 'ended') {
      socket.emit(S2C.ROOM_ERROR, { message: 'This room has ended' });
      return;
    }

    const sessionId = existingSessionId || generateSessionId();
    const isHost = room.hostSessionId === sessionId;
    const role = isHost ? 'host' : 'participant';

    const participant = roomState.addParticipant(
      roomId,
      sessionId,
      displayName.trim(),
      socket.id,
      role as 'host' | 'participant',
    );

    if (!participant) {
      socket.emit(S2C.ROOM_ERROR, { message: 'Failed to join room' });
      return;
    }

    await socket.join(roomId);

    socket.data.sessionId = sessionId;
    socket.data.roomId = roomId;
    socket.data.displayName = displayName.trim();

    const currentRoom = roomState.getRoom(roomId)!;
    socket.emit(S2C.ROOM_STATE, {
      ...currentRoom,
      _sessionId: sessionId,
    });

    try {
      const messages = await getRecentMessages(roomId, 50);
      socket.emit(S2C.CHAT_HISTORY, messages);
    } catch (err) {
      logger.error('Failed to fetch chat history', { error: (err as Error).message });
    }

    try {
      const reactions = await getReactionsForRoom(roomId);
      socket.emit('room:reactions', reactions);
    } catch (err) {
      logger.error('Failed to fetch reactions', { error: (err as Error).message });
    }

    socket.to(roomId).emit(S2C.ROOM_PARTICIPANT_JOINED, participant);
    io.to(roomId).emit(S2C.PRESENCE_UPDATE, roomState.getParticipants(roomId));
  });

  socket.on(C2S.ROOM_LEAVE, () => {
    handleDisconnect(io, socket);
  });
}

export function handleDisconnect(io: Server, socket: Socket) {
  const result = roomState.removeParticipantBySocket(socket.id);
  if (!result) return;

  const { roomId, participant, roomEmpty } = result;

  socket.to(roomId).emit(S2C.ROOM_PARTICIPANT_LEFT, participant);
  io.to(roomId).emit(S2C.PRESENCE_UPDATE, roomState.getParticipants(roomId));

  socket.leave(roomId);

  if (roomEmpty) {
    logger.info('Room is empty, will clean up after timeout', { roomId });
  }
}
