export const C2S = {
  ROOM_JOIN:          'room:join',
  ROOM_LEAVE:         'room:leave',

  PLAYBACK_PLAY:      'playback:play',
  PLAYBACK_PAUSE:     'playback:pause',
  PLAYBACK_SEEK:      'playback:seek',
  PLAYBACK_VIDEO:     'playback:video',

  CHAT_SEND:          'chat:send',

  REACTION_SEND:      'reaction:send',

  PRESENCE_HEARTBEAT: 'presence:heartbeat',

  CLOCK_SYNC:         'clock:sync',
} as const;

export const S2C = {
  ROOM_STATE:                'room:state',
  ROOM_PARTICIPANT_JOINED:   'room:participant_joined',
  ROOM_PARTICIPANT_LEFT:     'room:participant_left',
  ROOM_ENDED:                'room:ended',
  ROOM_ERROR:                'room:error',

  PLAYBACK_PLAY:             'playback:play',
  PLAYBACK_PAUSE:            'playback:pause',
  PLAYBACK_SEEK:             'playback:seek',
  PLAYBACK_VIDEO:            'playback:video',

  CHAT_MESSAGE:              'chat:message',
  CHAT_HISTORY:              'chat:history',

  REACTION_RECEIVED:         'reaction:received',

  PRESENCE_UPDATE:           'presence:update',

  CLOCK_SYNC_RESPONSE:       'clock:sync_response',
} as const;
