import type { Participant } from '@watchly/shared';

interface ParticipantListProps {
  participants: Participant[];
  hostSessionId: string;
  currentSessionId: string | null;
}

export function ParticipantList({ participants, hostSessionId, currentSessionId }: ParticipantListProps) {
  const connected = participants.filter(p => p.isConnected);

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
    }}>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--color-text-muted)',
        marginBottom: '12px',
      }}>
        Watching · {connected.length}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '200px', // Compact — shows ~6 participants, scrolls for more
        overflowY: 'auto',
        paddingRight: '4px',
      }}>
        {connected.map(p => (
          <div
            key={p.sessionId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: 'var(--radius-md)',
              background: p.sessionId === currentSessionId ? 'var(--color-primary-soft)' : 'transparent',
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              background: p.sessionId === hostSessionId
                ? 'var(--color-accent)'
                : 'var(--color-bg-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {p.displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {p.displayName}
                {p.sessionId === currentSessionId && (
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> (you)</span>
                )}
              </div>
            </div>
            {p.sessionId === hostSessionId && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                letterSpacing: '0.03em',
              }}>
                Host
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}