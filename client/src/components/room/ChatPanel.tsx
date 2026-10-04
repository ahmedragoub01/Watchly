import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@watchly/shared';
import { formatTime } from '../../utils/formatTime';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (content: string, videoTimestamp?: number) => void;
  currentSessionId: string | null;
  getPlayerTime: () => number;
}

export function ChatPanel({ messages, onSend, currentSessionId, getPlayerTime }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getPlayerTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [getPlayerTime]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim(), getPlayerTime());
    setInput('');
  };

  const handleReveal = (msgId: string) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev);
      next.add(msgId);
      return next;
    });
  };

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
    }}>
      <div style={{
        padding: '14px 16px 10px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--color-text-muted)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        Chat
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: 0,
        scrollbarGutter: 'stable',
        overscrollBehavior: 'contain',
      }}>
        {messages.length === 0 && (
          <div style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem',
            textAlign: 'center',
            padding: '24px 12px',
            lineHeight: 1.6,
          }}>
            <div style={{ marginBottom: '8px' }}>No messages yet</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
               Messages are tied to the video timestamp. Future messages are hidden to prevent spoilers.
            </div>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderSessionId === currentSessionId;
          const isFuture = msg.videoTimestamp != null && msg.videoTimestamp > currentTime + 5;
          const isSpoiler = isFuture && !isMe && !revealedSpoilers.has(msg.id);

          return (
            <div
              key={msg.id}
              style={{
                animation: 'fadeIn 150ms ease both',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                marginBottom: '2px',
              }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isMe ? 'var(--color-primary)' : 'var(--color-text)',
                }}>
                  {msg.senderName}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  color: 'var(--color-text-muted)',
                }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.videoTimestamp != null && (
                  <span style={{
                    fontSize: '0.65rem',
                    color: isSpoiler ? 'var(--color-warning)' : 'var(--color-accent)',
                    background: isSpoiler ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-accent-soft)',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: isSpoiler ? 700 : 400,
                  }}>
                    {isSpoiler ? `SPOILER · at ${formatTime(msg.videoTimestamp)}` : formatTime(msg.videoTimestamp)}
                  </span>
                )}
              </div>

              {isSpoiler ? (
                <button
                  onClick={() => handleReveal(msg.id)}
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    padding: '12px 16px',
                    minHeight: '44px', // Touch target accessibility
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  Reveal future message
                </button>
              ) : (
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontSize: '0.875rem',
              transition: 'border-color var(--transition-fast)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: input.trim() ? 'var(--color-primary)' : 'var(--color-surface)',
              color: input.trim() ? 'var(--color-primary-fg)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all var(--transition-fast)',
              cursor: input.trim() ? 'pointer' : 'default',
            }}
          >
            Send
          </button>
        </div>
        {input.length > 400 && (
          <div style={{
            fontSize: '0.65rem',
            color: input.length > 480 ? 'var(--color-error)' : 'var(--color-text-muted)',
            textAlign: 'right',
            marginTop: '4px',
            fontWeight: input.length > 480 ? 600 : 400,
          }}>
            {input.length}/500
          </div>
        )}
      </form>
    </div>
  );
}