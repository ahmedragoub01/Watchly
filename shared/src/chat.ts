export interface ChatMessage {
  id: string;
  roomId: string;
  senderName: string;
  senderSessionId: string;
  senderUserId?: string;
  content: string;
  videoTimestamp: number | null;
  createdAt: string;
}

export interface SendChatPayload {
  roomId: string;
  content: string;
  videoTimestamp?: number;
}
