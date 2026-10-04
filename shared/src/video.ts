export type ProviderType = 'youtube' | 'googledrive' | 'direct';

export type PlayerState = 'unstarted' | 'playing' | 'paused' | 'buffering' | 'ended';

export interface VideoInfo {
  url: string;
  provider: ProviderType;
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
}

export interface ProviderCapabilities {
  canPlay: boolean;
  canPause: boolean;
  canSeek: boolean;
  canGetCurrentTime: boolean;
  canSetPlaybackRate: boolean;
}
