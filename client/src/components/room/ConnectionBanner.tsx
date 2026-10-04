interface ConnectionBannerProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

export function ConnectionBanner({ status }: ConnectionBannerProps) {
  if (status === 'connected') return null;

  const config = {
    connecting: { text: 'Connecting to server...', color: 'var(--color-warning)' },
    reconnecting: { text: 'Reconnecting...', color: 'var(--color-warning)' },
    disconnected: { text: 'Disconnected — trying to reconnect', color: 'var(--color-error)' },
  };

  const c = config[status];

  return (
    <div style={{
      position: 'fixed',
      top: '64px', // Prevents overlapping with the Navbar
      left: 0,
      right: 0,
      zIndex: 'var(--z-toast)' as unknown as number,
      padding: '10px 16px',
      background: c.color,
      color: '#fff',
      fontSize: '0.85rem',
      fontWeight: 600,
      textAlign: 'center',
      animation: 'slideDown 300ms ease both',
    }}>
      <span style={{ animation: 'pulse 1.5s ease infinite' }}>{c.text}</span>
    </div>
  );
}