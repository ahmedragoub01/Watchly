import type {
  RoomState,
  Participant,
  PlaybackState,
  ParticipantRole,
} from '@watchly/shared';
import type { VideoInfo } from '@watchly/shared';
import { logger } from '../utils/logger.js';

function defaultPlayback(): PlaybackState {
  return {
    isPlaying: false,
    positionAtLastUpdate: 0,
    updatedAtServerTime: Date.now(),
  };
}

export class RoomStateManager {
  private rooms = new Map<string, RoomState>();
  private socketToRoom = new Map<string, { roomId: string; sessionId: string }>();

  createRoom(
    roomId: string,
    name: string,
    hostSessionId: string,
    hostDisplayName: string,
    hostSocketId: string,
    video: VideoInfo | null = null,
  ): RoomState {
    const room: RoomState = {
      id: roomId,
      name,
      status: 'waiting',
      hostSessionId,
      video,
      playback: defaultPlayback(),
      participants: [
        {
          sessionId: hostSessionId,
          displayName: hostDisplayName,
          role: 'host',
          joinedAt: Date.now(),
          isConnected: true,
        },
      ],
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    this.socketToRoom.set(hostSocketId, { roomId, sessionId: hostSessionId });
    logger.info('Room created', { roomId, name, host: hostDisplayName });
    return room;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  endRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.status = 'ended';
    room.playback.isPlaying = false;

    for (const [socketId, mapping] of this.socketToRoom) {
      if (mapping.roomId === roomId) {
        this.socketToRoom.delete(socketId);
      }
    }

    this.rooms.delete(roomId);
    logger.info('Room ended', { roomId });
  }

  addParticipant(
    roomId: string,
    sessionId: string,
    displayName: string,
    socketId: string,
    role: ParticipantRole = 'participant',
  ): Participant | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const existing = room.participants.find((p) => p.sessionId === sessionId);
    if (existing) {
      existing.isConnected = true;
      existing.displayName = displayName;
      this.socketToRoom.set(socketId, { roomId, sessionId });
      logger.info('Participant reconnected', { roomId, sessionId, displayName });
      return existing;
    }

    const participant: Participant = {
      sessionId,
      displayName,
      role,
      joinedAt: Date.now(),
      isConnected: true,
    };

    room.participants.push(participant);
    this.socketToRoom.set(socketId, { roomId, sessionId });
    logger.info('Participant joined', { roomId, sessionId, displayName });
    return participant;
  }

  removeParticipantBySocket(socketId: string): {
    roomId: string;
    sessionId: string;
    participant: Participant;
    roomEmpty: boolean;
  } | null {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return null;

    const { roomId, sessionId } = mapping;
    const room = this.rooms.get(roomId);
    if (!room) {
      this.socketToRoom.delete(socketId);
      return null;
    }

    const participant = room.participants.find((p) => p.sessionId === sessionId);
    if (!participant) {
      this.socketToRoom.delete(socketId);
      return null;
    }

    participant.isConnected = false;
    this.socketToRoom.delete(socketId);

    const roomEmpty = room.participants.every((p) => !p.isConnected);

    logger.info('Participant disconnected', { roomId, sessionId, displayName: participant.displayName, roomEmpty });
    return { roomId, sessionId, participant, roomEmpty };
  }

  getParticipants(roomId: string): Participant[] {
    return this.rooms.get(roomId)?.participants || [];
  }

  isHost(roomId: string, sessionId: string): boolean {
    const room = this.rooms.get(roomId);
    return room?.hostSessionId === sessionId;
  }

  getSessionIdBySocket(socketId: string): string | undefined {
    return this.socketToRoom.get(socketId)?.sessionId;
  }

  getRoomIdBySocket(socketId: string): string | undefined {
    return this.socketToRoom.get(socketId)?.roomId;
  }

  getCurrentPosition(roomId: string): number {
    const room = this.rooms.get(roomId);
    if (!room) return 0;

    const { playback } = room;
    if (!playback.isPlaying) {
      return playback.positionAtLastUpdate;
    }

    const elapsed = (Date.now() - playback.updatedAtServerTime) / 1000;
    return playback.positionAtLastUpdate + elapsed;
  }

  play(roomId: string, currentTime: number): PlaybackState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.playback = {
      isPlaying: true,
      positionAtLastUpdate: currentTime,
      updatedAtServerTime: Date.now(),
    };
    room.status = 'active';

    return room.playback;
  }

  pause(roomId: string, currentTime: number): PlaybackState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.playback = {
      isPlaying: false,
      positionAtLastUpdate: currentTime,
      updatedAtServerTime: Date.now(),
    };

    return room.playback;
  }

  seek(roomId: string, seekTo: number): PlaybackState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.playback = {
      isPlaying: room.playback.isPlaying,
      positionAtLastUpdate: seekTo,
      updatedAtServerTime: Date.now(),
    };

    return room.playback;
  }

  setVideo(roomId: string, video: VideoInfo): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.video = video;
    room.playback = defaultPlayback();
    room.status = 'waiting';
  }

  cleanupEmptyRooms(timeoutMs: number = 5 * 60 * 1000): string[] {
    const now = Date.now();
    const cleaned: string[] = [];

    for (const [roomId, room] of this.rooms) {
      const allDisconnected = room.participants.every((p) => !p.isConnected);
      if (!allDisconnected) continue;

      const lastActivity = Math.max(
        ...room.participants.map((p) => p.joinedAt),
        room.playback.updatedAtServerTime,
      );

      if (now - lastActivity > timeoutMs) {
        this.rooms.delete(roomId);
        cleaned.push(roomId);
        logger.info('Empty room cleaned up', { roomId });
      }
    }

    return cleaned;
  }

  getStats(): { activeRooms: number; totalParticipants: number; connectedParticipants: number } {
    let totalParticipants = 0;
    let connectedParticipants = 0;

    for (const room of this.rooms.values()) {
      totalParticipants += room.participants.length;
      connectedParticipants += room.participants.filter((p) => p.isConnected).length;
    }

    return {
      activeRooms: this.rooms.size,
      totalParticipants,
      connectedParticipants,
    };
  }
}

export const roomState = new RoomStateManager();
