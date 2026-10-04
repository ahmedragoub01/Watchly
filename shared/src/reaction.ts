export const REACTION_EMOJIS = ['😂', '🔥', '😱', '❤️', '👏', '💀'] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

export interface Reaction {
  id: string;
  roomId: string;
  senderName: string;
  senderSessionId: string;
  emoji: ReactionEmoji;
  videoTimestamp: number;
  createdAt: string;
}

export interface SendReactionPayload {
  roomId: string;
  emoji: ReactionEmoji;
  videoTimestamp: number;
}

export interface ReactionReceivedEvent {
  emoji: ReactionEmoji;
  senderName: string;
  senderSessionId: string;
  videoTimestamp: number;
}

export interface Moment {
  startTime: number;
  endTime: number;
  reactions: Reaction[];
  intensity: number;
  peakEmoji: ReactionEmoji;
  participants: string[];
}
