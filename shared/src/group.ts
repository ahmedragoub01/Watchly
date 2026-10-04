import type { VideoInfo } from './video';

export type GroupMemberRole = 'owner' | 'admin' | 'member';
export type GroupInvitationStatus = 'pending' | 'accepted' | 'rejected';
export type GroupWatchlistStatus = 'proposed' | 'approved' | 'watched';

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  ownerId: string;
  createdAt: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: GroupMemberRole;
  joinedAt: string;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  inviterId: string;
  inviteeId: string;
  status: GroupInvitationStatus;
  createdAt: string;
}

export interface GroupWatchlistItem {
  id: string;
  groupId: string;
  addedById: string;
  addedByName: string;
  video: VideoInfo;
  status: GroupWatchlistStatus;
  voteCount: number;
  userVoted: boolean;
  watchedAt: string | null;
  createdAt: string;
}
