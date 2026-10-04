import type { ProviderType, VideoInfo } from './video';

export type RoomStatus = 'waiting' | 'active' | 'ended';
export type ParticipantRole = 'host' | 'participant';

export interface Participant {
  sessionId: string;
  displayName: string;
  role: ParticipantRole;
  userId?: string;
  avatarUrl?: string;
  joinedAt: number;
  isConnected: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  positionAtLastUpdate: number;
  updatedAtServerTime: number;
}

export interface RoomState {
  id: string;
  name: string;
  status: RoomStatus;
  hostSessionId: string;
  video: VideoInfo | null;
  playback: PlaybackState;
  participants: Participant[];
  createdAt: number;
}

export interface JoinRoomPayload {
  roomId: string;
  displayName: string;
  sessionId?: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface PlayPayload {
  roomId: string;
  currentTime: number;
}

export interface PausePayload {
  roomId: string;
  currentTime: number;
}

export interface SeekPayload {
  roomId: string;
  seekTo: number;
}

export interface ChangeVideoPayload {
  roomId: string;
  videoUrl: string;
}

export interface PlaybackPlayEvent {
  currentTime: number;
  serverTimestamp: number;
}

export interface PlaybackPauseEvent {
  currentTime: number;
}

export interface PlaybackSeekEvent {
  seekTo: number;
  serverTimestamp: number;
}

export interface PlaybackVideoEvent {
  video: VideoInfo;
}

export interface RoomErrorEvent {
  message: string;
  code?: string;
}

export interface CreateRoomRequest {
  name: string;
  displayName: string;
  videoUrl?: string;
}

export interface CreateRoomResponse {
  roomId: string;
  sessionId: string;
}

export interface RoomInfoResponse {
  id: string;
  name: string;
  status: RoomStatus;
  videoProvider: ProviderType | null;
  videoTitle: string | null;
  participantCount: number;
  createdAt: string;
}
