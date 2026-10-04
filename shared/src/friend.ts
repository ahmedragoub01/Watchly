import type { VideoInfo } from './video';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';
export type WatchlistItemStatus = 'unwatched' | 'watched';

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FriendWatchlistItem {
  id: string;
  friendshipId: string;
  addedById: string;
  addedByName: string;
  video: VideoInfo;
  status: WatchlistItemStatus;
  watchedAt: string | null;
  createdAt: string;
}

export interface FriendProfile {
  friendshipId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  status: FriendshipStatus;
  createdAt: string;
}

export interface FriendRequest {
  friendshipId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  direction: 'incoming' | 'outgoing';
  createdAt: string;
}
