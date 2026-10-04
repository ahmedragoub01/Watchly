import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { usePlaybackSync } from '../hooks/usePlaybackSync';
import { VideoPlayer, type VideoPlayerHandle } from '../components/room/VideoPlayer';
import { ParticipantList } from '../components/room/ParticipantList';
import { ChatPanel } from '../components/room/ChatPanel';
import { ReactionBar } from '../components/room/ReactionBar';
import { MomentsTimeline } from '../components/room/MomentsTimeline';
import { ConnectionBanner } from '../components/room/ConnectionBanner';
import './RoomPage.css';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const playerRef = useRef<VideoPlayerHandle>(null);

  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [volume, setVolume] = useState(100);
  const [prevVolume, setPrevVolume] = useState(100); // For mute/unmute toggle

  const {
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
    play,
    pause,
    seek,
    changeVideo,
    sendMessage,
    sendReaction,
  } = useRoom();

  const getPlayerTime = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, []);
  const seekPlayer = useCallback((time: number) => {
    if (playerRef.current) {
      const player = playerRef.current as unknown as { seekTo?: (t: number) => void };
      if (player.seekTo) player.seekTo(time);
    }
  }, []);

  usePlaybackSync({
    playback: roomState?.playback ?? null,
    clockOffset,
    getPlayerTime,
    seekPlayer,
    isReady: Boolean(roomState?.video),
  });

  useEffect(() => {
    if (!roomId) return;

    const displayName = sessionStorage.getItem('watchly_displayName');
    if (!displayName) {
      navigate(`/join/${roomId}`, { replace: true });
      return;
    }

    const existingSession = sessionStorage.getItem(`watchly_session_${roomId}`);
    joinRoom(roomId, displayName, existingSession || undefined);
  }, [roomId, navigate, joinRoom]);

  useEffect(() => {
    if (sessionId && roomId) {
      sessionStorage.setItem(`watchly_session_${roomId}`, sessionId);
    }
  }, [sessionId, roomId]);

  const handleCopyLink = async () => {
    const shareUrl = window.location.href.replace('/room/', '/join/');

    // Use native share sheet on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${roomState?.name || 'Watch Party'} on Watchly`,
          text: 'Come watch with me!',
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled share — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard denied — show the URL in a prompt so user can manually copy
      window.prompt('Copy this invite link:', shareUrl);
    }
  };

  const handleChangeVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) return;
    changeVideo(videoUrlInput.trim());
    setVideoUrlInput('');
  };

  const handleReaction = (emoji: string) => {
    const time = playerRef.current?.getCurrentTime() ?? 0;
    sendReaction(emoji, time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);

    // Attempt to set volume directly via ref if VideoPlayer exposes it
    if (playerRef.current) {
      const player = playerRef.current as any;
      if (typeof player.setVolume === 'function') {
        player.setVolume(newVol);
      }
    }
  };

  const confirmLeave = () => {
    setShowLeaveModal(false);
    navigate('/');
  };

  const handleToggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
      if (playerRef.current) {
        const player = playerRef.current as any;
        if (typeof player.setVolume === 'function') player.setVolume(0);
      }
    } else {
      const restored = prevVolume > 0 ? prevVolume : 100;
      setVolume(restored);
      if (playerRef.current) {
        const player = playerRef.current as any;
        if (typeof player.setVolume === 'function') player.setVolume(restored);
      }
    }
  };

  if (!roomState) {
    return (
      <div className="room-container">
        <header className="room-loading-header" />
        <div className="room-layout room-loading-layout">
          <div className="room-main">
            <div className="room-loading-video" />
          </div>
          <div className="room-sidebar">
            <div className="room-loading-sidebar" />
          </div>
        </div>
      </div>
    );
  }

  if (roomState.status === 'ended') {
    const topReaction = Object.entries(
      reactions.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || '🍿';

    return (
      <div className="replay-container">
        <div className="replay-card">
          <div className="replay-emoji">{topReaction}</div>
          <h2 className="replay-title">Party Replay</h2>
          <p className="replay-subtitle">
            The session for "{roomState.name}" has ended. Here's a look back at your watch party.
          </p>

          <div className="replay-stats-grid">
            <div className="stat-card">
              <div className="stat-value-messages">{messages.length}</div>
              <div className="stat-label">Messages</div>
            </div>
            <div className="stat-card">
              <div className="stat-value-reactions">{reactions.length}</div>
              <div className="stat-label">Reactions</div>
            </div>
          </div>

          <button onClick={() => navigate('/')} className="btn-home">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-container">
      <ConnectionBanner status={connectionStatus} />

      <header className="room-header">
        <div className="room-header-left">
          <button
            onClick={() => navigate('/')}
            className="room-header-logo"
            aria-label="Go to Watchly home"
            title="Go home"
          >
            Watchly
          </button>
          <span className="room-header-divider" />
          <span className="room-header-title">{roomState.name}</span>
        </div>

        <div className="room-header-right">
          <div
            className={`status-indicator ${connectionStatus === 'connected' ? 'status-connected' : 'status-disconnected'}`}
          />
          <button onClick={handleCopyLink} className="btn-share">
            {copied ? '✓ Copied!' : 'Share Link'}
          </button>
          <button onClick={() => setShowLeaveModal(true)} className="btn-leave">
            Leave
          </button>
        </div>
      </header>

      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Leave Watch Party?</h3>
            <p className="modal-body">Are you sure you want to exit the room?</p>
            <div className="modal-actions">
              <button className="btn-share" onClick={() => setShowLeaveModal(false)}>Cancel</button>
              <button className="btn-leave" onClick={confirmLeave}>Leave Room</button>
            </div>
          </div>
        </div>
      )}

      <div className="room-layout">
        <div className="room-main">
          <div className="room-video-slot">
            <div className="room-video-display">
              {!roomState.video ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--color-bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  padding: '32px',
                  textAlign: 'center',
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
                      {isHost ? 'Paste a video URL to get started' : 'Waiting for the host to set a video'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {isHost ? 'YouTube, Google Drive, or a direct video link' : 'The video will appear here once it\'s ready'}
                    </div>
                  </div>
                  {isHost && (
                    <form onSubmit={handleChangeVideo} style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '480px', marginTop: '8px' }}>
                      <input
                        className="video-url-input"
                        value={videoUrlInput}
                        onChange={e => setVideoUrlInput(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        autoFocus
                        style={{ flex: 1 }}
                      />
                      <button
                        type="submit"
                        disabled={!videoUrlInput.trim()}
                        className="btn-set-video"
                      >
                        Set Video
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <VideoPlayer
                  ref={playerRef}
                  video={roomState.video}
                  playback={roomState.playback}
                  isHost={isHost}
                  clockOffset={clockOffset}
                  volume={volume}
                  onPlay={play}
                  onPause={pause}
                />
              )}
            </div>
          </div>

          <div className="room-below-video">
            {!isHost && roomState.video && (
              <div style={{
                alignSelf: 'center',
                justifySelf: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
              }}>
                <span>
                  {participants.find(p => p.sessionId === roomState.hostSessionId)?.displayName || 'Host'} controls playback
                </span>
              </div>
            )}

            <MomentsTimeline
              reactions={reactions}
              duration={playerRef.current?.getDuration() ?? 0}
              onSeek={isHost ? seek : undefined}
            />

            <div className="room-reactions-slot">
              <ReactionBar onReact={handleReaction} recentReactions={recentReactions} />
            </div>

            <div className="shared-controls-row">
              <div className="volume-container">
                <button
                  onClick={handleToggleMute}
                  aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                  title={volume === 0 ? 'Unmute' : 'Mute'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px', display: 'flex', alignItems: 'center' }}
                >
                  {volume === 0 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <line x1="23" y1="9" x2="17" y2="15"></line>
                      <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      {volume > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>}
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                  aria-label="Volume"
                />
              </div>

              {isHost && roomState.video && (
                <form onSubmit={handleChangeVideo} className="video-change-form">
                  <input
                    className="video-url-input"
                    value={videoUrlInput}
                    onChange={e => setVideoUrlInput(e.target.value)}
                    placeholder="Paste a YouTube URL to change video..."
                  />
                  <button
                    type="submit"
                    disabled={!videoUrlInput.trim()}
                    className="btn-set-video"
                  >
                    Set Video
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="room-sidebar">
          <ParticipantList
            participants={participants}
            hostSessionId={roomState.hostSessionId}
            currentSessionId={sessionId}
          />
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <ChatPanel
              messages={messages}
              onSend={sendMessage}
              currentSessionId={sessionId}
              getPlayerTime={getPlayerTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
}