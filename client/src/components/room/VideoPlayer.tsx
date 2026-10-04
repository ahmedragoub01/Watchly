import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import type { PlaybackState, VideoInfo } from '@watchly/shared';

interface VideoPlayerProps {
  video: VideoInfo | null;
  playback: PlaybackState;
  isHost: boolean;
  clockOffset: number;
  volume?: number; // Added volume prop (0-100 scale)
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
}

export interface VideoPlayerHandle {
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void; // Added to handle ref calls
}

let ytApiLoaded = false;
let ytApiPromise: Promise<void> | null = null;

function loadYTApi(): Promise<void> {
  if (ytApiLoaded) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const first = document.getElementsByTagName('script')[0];
    first.parentNode?.insertBefore(tag, first);

    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      resolve();
    };
  });

  return ytApiPromise;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer({ video, playback, isHost, clockOffset, volume = 100, onPlay, onPause }, ref) {
    const ytContainerRef = useRef<HTMLDivElement>(null);
    const ytPlayerRef = useRef<YT.Player | null>(null);
    const htmlVideoRef = useRef<HTMLVideoElement>(null);

    const [isYtReady, setIsYtReady] = useState(false);
    const suppressEventsRef = useRef(false);
    const lastVideoIdRef = useRef<string | null>(null);

    // Sync volume when the prop changes
    useEffect(() => {
      // YouTube volume
      if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
        ytPlayerRef.current.setVolume(volume);
        if (volume === 0) ytPlayerRef.current.mute();
        else ytPlayerRef.current.unMute();
      }

      // HTML5 video volume
      if (htmlVideoRef.current) {
        htmlVideoRef.current.volume = volume / 100;
        htmlVideoRef.current.muted = volume === 0;
      }
    }, [volume, isYtReady, video?.provider]);

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => {
        if ((video?.provider === 'direct' || video?.provider === 'googledrive') && htmlVideoRef.current) {
          return htmlVideoRef.current.currentTime;
        }
        return ytPlayerRef.current?.getCurrentTime?.() ?? 0;
      },
      getDuration: () => {
        if ((video?.provider === 'direct' || video?.provider === 'googledrive') && htmlVideoRef.current) {
          return htmlVideoRef.current.duration || 0;
        }
        return ytPlayerRef.current?.getDuration?.() ?? 0;
      },
      setVolume: (newVolume: number) => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
          ytPlayerRef.current.setVolume(newVolume);
          if (newVolume === 0) ytPlayerRef.current.mute();
          else ytPlayerRef.current.unMute();
        }
        if (htmlVideoRef.current) {
          htmlVideoRef.current.volume = newVolume / 100;
          htmlVideoRef.current.muted = newVolume === 0;
        }
      }
    }));

    // YOUTUBE INIT
    useEffect(() => {
      if (!video || video.provider !== 'youtube') return;
      if (video.videoId === lastVideoIdRef.current && ytPlayerRef.current) return;
      lastVideoIdRef.current = video.videoId;

      let destroyed = false;

      loadYTApi().then(() => {
        if (destroyed || !ytContainerRef.current) return;

        if (ytPlayerRef.current) {
          ytPlayerRef.current.destroy();
        }

        ytContainerRef.current.innerHTML = '';
        const div = document.createElement('div');
        div.id = 'yt-player-' + Date.now();
        ytContainerRef.current.appendChild(div);

        ytPlayerRef.current = new window.YT.Player(div.id, {
          videoId: video.videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: isHost ? 1 : 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              if (destroyed) return;
              setIsYtReady(true);

              // Set initial volume on load
              ytPlayerRef.current?.setVolume(volume);
              if (volume === 0) ytPlayerRef.current?.mute();
            },
            onStateChange: (event: YT.OnStateChangeEvent) => {
              if (destroyed || suppressEventsRef.current || !isHost) return;

              const time = ytPlayerRef.current?.getCurrentTime() ?? 0;

              switch (event.data) {
                case window.YT.PlayerState.PLAYING:
                  onPlay(time);
                  break;
                case window.YT.PlayerState.PAUSED:
                  onPause(time);
                  break;
              }
            },
          },
        });
      });

      return () => {
        destroyed = true;
      };
    }, [video?.videoId, video?.provider]);

    // SYNC LOGIC
    useEffect(() => {
      if (!playback || !video) return;

      suppressEventsRef.current = true;

      // Handle YouTube
      if (video.provider === 'youtube' && isYtReady && ytPlayerRef.current) {
        const player = ytPlayerRef.current;
        if (playback.isPlaying) {
          const serverNow = Date.now() + clockOffset;
          const elapsed = (serverNow - playback.updatedAtServerTime) / 1000;
          const targetTime = playback.positionAtLastUpdate + Math.max(0, elapsed);

          const currentTime = player.getCurrentTime?.() ?? 0;
          if (Math.abs(currentTime - targetTime) > 1.0) {
            player.seekTo(targetTime, true);
          }

          const state = player.getPlayerState?.();
          if (state !== window.YT.PlayerState.PLAYING) {
            player.playVideo();
          }
        } else {
          player.pauseVideo();
          player.seekTo(playback.positionAtLastUpdate, true);
        }
      }

      // Handle Direct MP4 & Google Drive
      if ((video.provider === 'direct' || video.provider === 'googledrive') && htmlVideoRef.current) {
        const player = htmlVideoRef.current;
        if (playback.isPlaying) {
          const serverNow = Date.now() + clockOffset;
          const elapsed = (serverNow - playback.updatedAtServerTime) / 1000;
          const targetTime = playback.positionAtLastUpdate + Math.max(0, elapsed);

          const currentTime = player.currentTime;

          if (Math.abs(currentTime - targetTime) > 4.0) {
            player.currentTime = targetTime;
          }

          if (player.paused) {
            player.play().catch(console.error);
          }
        } else {
          player.pause();
          player.currentTime = playback.positionAtLastUpdate;
          player.playbackRate = 1.0;
        }
      }

      setTimeout(() => {
        suppressEventsRef.current = false;
      }, 500);
    }, [playback?.isPlaying, playback?.positionAtLastUpdate, playback?.updatedAtServerTime, isYtReady, video?.provider]);

    // SOFT-SYNC POLLING
    useEffect(() => {
      if (!playback || !playback.isPlaying || video?.provider === 'youtube') return;

      const interval = setInterval(() => {
        const player = htmlVideoRef.current;
        if (!player || player.paused) return;

        const serverNow = Date.now() + clockOffset;
        const elapsed = (serverNow - playback.updatedAtServerTime) / 1000;
        const targetTime = playback.positionAtLastUpdate + Math.max(0, elapsed);
        const currentTime = player.currentTime;
        const drift = targetTime - currentTime;

        if (drift > 0.5 && drift <= 4.0) {
          player.playbackRate = 1.15;
        } else if (drift < -0.5 && drift >= -4.0) {
          player.playbackRate = 0.85;
        } else {
          player.playbackRate = 1.0;
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        if (htmlVideoRef.current) htmlVideoRef.current.playbackRate = 1.0;
      };
    }, [playback?.isPlaying, playback?.positionAtLastUpdate, playback?.updatedAtServerTime, video?.provider]);

    // HTML5 EVENT HANDLERS
    const handleHtmlPlay = useCallback(() => {
      if (suppressEventsRef.current || !isHost || !htmlVideoRef.current) return;
      onPlay(htmlVideoRef.current.currentTime);
    }, [isHost, onPlay]);

    const handleHtmlPause = useCallback(() => {
      if (suppressEventsRef.current || !isHost || !htmlVideoRef.current) return;
      onPause(htmlVideoRef.current.currentTime);
    }, [isHost, onPause]);

    const handleHtmlSeeked = useCallback(() => {
      if (suppressEventsRef.current || !isHost || !htmlVideoRef.current) return;
      if (htmlVideoRef.current.paused) {
        onPause(htmlVideoRef.current.currentTime);
      }
    }, [isHost, onPause]);


    if (!video) {
      return (
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '1.1rem',
        }}>
          Waiting for the host to add a video...
        </div>
      );
    }

    // Shared fullscreen handler
    const handleFullscreen = () => {
      const container = ytContainerRef.current?.parentElement || htmlVideoRef.current?.parentElement;
      if (!container) return;

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      } else {
        container.requestFullscreen().catch(() => { });
      }
    };

    // Fullscreen button component
    const FullscreenButton = () => (
      <button
        onClick={handleFullscreen}
        style={{
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer'
        }}
        aria-label="Toggle Fullscreen"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>
    );

    if (video.provider === 'youtube') {
      return (
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: '#000',
          position: 'relative',
        }}>
          <div ref={ytContainerRef} style={{ width: '100%', height: '100%' }} />
          {!isHost && (
            <>
              <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                cursor: 'default',
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                zIndex: 3,
                opacity: 0,
                transition: 'opacity var(--transition-fast)',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}
              >
                <FullscreenButton />
              </div>
            </>
          )}
        </div>
      );
    }

    if (video.provider === 'direct' || video.provider === 'googledrive') {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const src = video.provider === 'googledrive'
        ? `${apiBase}/api/proxy/drive/${video.videoId}`
        : video.url;

      return (
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: '#000',
          position: 'relative',
        }}>
          <video
            ref={htmlVideoRef}
            src={src}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            controls={isHost}
            onPlay={handleHtmlPlay}
            onPause={handleHtmlPause}
            onSeeked={handleHtmlSeeked}
          />
          {!isHost && (
            <>
              <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                cursor: 'default',
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                zIndex: 3,
                opacity: 0,
                transition: 'opacity var(--transition-fast)',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}
              >
                <FullscreenButton />
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted)',
      }}>
        Unsupported video provider
      </div>
    );
  }
);