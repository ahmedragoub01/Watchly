import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '../socket/socket';
import { C2S, S2C } from '@watchly/shared';
import type {
  RoomState,
  Participant,
  JoinRoomPayload,
  PlaybackPlayEvent,
  PlaybackPauseEvent,
  PlaybackSeekEvent,
  PlaybackVideoEvent,
  ChatMessage,
  ReactionReceivedEvent,
  Reaction,
} from '@watchly/shared';

import { playNotificationSound } from '../utils/audio';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface UseRoomReturn {
  roomState: RoomState | null;
  sessionId: string | null;
  isHost: boolean;
  participants: Participant[];
  connectionStatus: ConnectionStatus;
  messages: ChatMessage[];
  reactions: Reaction[];
  recentReactions: ReactionReceivedEvent[];
  clockOffset: number;

  joinRoom: (roomId: string, displayName: string, existingSessionId?: string) => void;
  leaveRoom: () => void;
  play: (currentTime: number) => void;
  pause: (currentTime: number) => void;
  seek: (seekTo: number) => void;
  changeVideo: (videoUrl: string) => void;
  sendMessage: (content: string, videoTimestamp?: number) => void;
  sendReaction: (emoji: string, videoTimestamp: number) => void;
}

export function useRoom(): UseRoomReturn {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [recentReactions, setRecentReactions] = useState<ReactionReceivedEvent[]>([]);
  const [clockOffset, setClockOffset] = useState(0);
  const roomIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const displayNameRef = useRef<string>('User');

  useEffect(() => {
    const socket = connectSocket();
    const manager = socket.io;

    const onConnect = () => {
      setConnectionStatus('connected');

      socket.emit(C2S.CLOCK_SYNC, { clientTime: Date.now() });

      if (roomIdRef.current && sessionIdRef.current) {
        socket.emit(C2S.ROOM_JOIN, {
          roomId: roomIdRef.current,
          displayName: displayNameRef.current,
          sessionId: sessionIdRef.current,
        });
      }
    };

    const onDisconnect = () => setConnectionStatus('disconnected');
    const onReconnecting = () => setConnectionStatus('reconnecting');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    manager.on('reconnect_attempt', onReconnecting);
    manager.on('reconnect', onConnect);

    if (socket.connected) onConnect();

    socket.on(S2C.CLOCK_SYNC_RESPONSE, (data: { clientTime: number; serverTime: number }) => {
      const rtt = Date.now() - data.clientTime;
      const offset = data.serverTime - data.clientTime - rtt / 2;
      setClockOffset(offset);
    });

    socket.on(S2C.ROOM_STATE, (state: RoomState & { _sessionId?: string }) => {
      if (state._sessionId) {
        setSessionId(state._sessionId);
        sessionIdRef.current = state._sessionId;
      }
      const { _sessionId, ...cleanState } = state;
      setRoomState(cleanState as RoomState);
    });

    socket.on(S2C.ROOM_PARTICIPANT_JOINED, (participant: Participant) => {
      setRoomState(prev => {
        if (!prev) return prev;
        const exists = prev.participants.some(p => p.sessionId === participant.sessionId);
        if (exists) {
          return {
            ...prev,
            participants: prev.participants.map(p =>
              p.sessionId === participant.sessionId ? { ...p, ...participant } : p
            ),
          };
        }
        return { ...prev, participants: [...prev.participants, participant] };
      });
    });

    socket.on(S2C.ROOM_PARTICIPANT_LEFT, (participant: Participant) => {
      setRoomState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.map(p =>
            p.sessionId === participant.sessionId ? { ...p, isConnected: false } : p
          ),
        };
      });
    });

    socket.on(S2C.PRESENCE_UPDATE, (participants: Participant[]) => {
      setRoomState(prev => (prev ? { ...prev, participants } : prev));
    });

    socket.on(S2C.PLAYBACK_PLAY, (event: PlaybackPlayEvent) => {
      setRoomState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'active',
          playback: {
            isPlaying: true,
            positionAtLastUpdate: event.currentTime,
            updatedAtServerTime: event.serverTimestamp,
          },
        };
      });
    });

    socket.on(S2C.PLAYBACK_PAUSE, (event: PlaybackPauseEvent) => {
      setRoomState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          playback: {
            isPlaying: false,
            positionAtLastUpdate: event.currentTime,
            updatedAtServerTime: Date.now(),
          },
        };
      });
    });

    socket.on(S2C.PLAYBACK_SEEK, (event: PlaybackSeekEvent) => {
      setRoomState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          playback: {
            ...prev.playback,
            positionAtLastUpdate: event.seekTo,
            updatedAtServerTime: event.serverTimestamp,
          },
        };
      });
    });

    socket.on(S2C.PLAYBACK_VIDEO, (event: PlaybackVideoEvent) => {
      setRoomState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          video: event.video,
          playback: { isPlaying: false, positionAtLastUpdate: 0, updatedAtServerTime: Date.now() },
        };
      });
    });

    socket.on(S2C.CHAT_HISTORY, (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on(S2C.CHAT_MESSAGE, (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      if (message.senderSessionId !== sessionIdRef.current) {
        playNotificationSound();
      }
    });

    socket.on('room:reactions', (rxns: Reaction[]) => {
      setReactions(rxns);
    });

    socket.on(S2C.REACTION_RECEIVED, (event: ReactionReceivedEvent) => {
      setRecentReactions(prev => [...prev, event]);
      setTimeout(() => {
        setRecentReactions(prev => prev.slice(1));
      }, 2000);
    });

    socket.on(S2C.ROOM_ENDED, () => {
      setRoomState(prev => (prev ? { ...prev, status: 'ended' } : prev));
    });

    return () => {
      manager.off('reconnect_attempt', onReconnecting);
      manager.off('reconnect', onConnect);
      socket.removeAllListeners();
      disconnectSocket();
    };
  }, []);

  const joinRoom = useCallback((roomId: string, displayName: string, existingSessionId?: string) => {
    const socket = getSocket();
    roomIdRef.current = roomId;
    displayNameRef.current = displayName;
    if (existingSessionId) sessionIdRef.current = existingSessionId;
    const payload: JoinRoomPayload = { roomId, displayName, sessionId: existingSessionId };
    socket.emit(C2S.ROOM_JOIN, payload);
  }, []);

  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    socket.emit(C2S.ROOM_LEAVE, {});
    roomIdRef.current = null;
    sessionIdRef.current = null;
    setRoomState(null);
    setMessages([]);
    setReactions([]);
  }, []);

  const play = useCallback((currentTime: number) => {
    if (!roomIdRef.current) return;
    getSocket().emit(C2S.PLAYBACK_PLAY, { roomId: roomIdRef.current, currentTime });
  }, []);

  const pause = useCallback((currentTime: number) => {
    if (!roomIdRef.current) return;
    getSocket().emit(C2S.PLAYBACK_PAUSE, { roomId: roomIdRef.current, currentTime });
  }, []);

  const seek = useCallback((seekTo: number) => {
    if (!roomIdRef.current) return;
    getSocket().emit(C2S.PLAYBACK_SEEK, { roomId: roomIdRef.current, seekTo });
  }, []);

  const changeVideo = useCallback((videoUrl: string) => {
    if (!roomIdRef.current) return;
    getSocket().emit(C2S.PLAYBACK_VIDEO, { roomId: roomIdRef.current, videoUrl });
  }, []);

  const sendMessage = useCallback((content: string, videoTimestamp?: number) => {
    if (!roomIdRef.current) return;
    getSocket().emit(C2S.CHAT_SEND, { roomId: roomIdRef.current, content, videoTimestamp });
  }, []);

  const sendReaction = useCallback((emoji: string, videoTimestamp: number) => {
    if (!roomIdRef.current) return;
    getSocket().emit(C2S.REACTION_SEND, { roomId: roomIdRef.current, emoji, videoTimestamp });
  }, []);

  const isHost = Boolean(roomState && sessionId && roomState.hostSessionId === sessionId);
  const participants = roomState?.participants || [];

  return {
    roomState,
    sessionId,
    isHost,
    participants,
    connectionStatus,
    messages,
    reactions,
    recentReactions,
    clockOffset,
    joinRoom,
    leaveRoom,
    play,
    pause,
    seek,
    changeVideo,
    sendMessage,
    sendReaction,
  };
}
