import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { RoomInfoResponse } from '@watchly/shared';

export function JoinPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(
    () => sessionStorage.getItem('watchly_displayName') || ''
  );
  const [roomInfo, setRoomInfo] = useState<RoomInfoResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    const existingSession = sessionStorage.getItem(`watchly_session_${roomId}`);
    if (existingSession && displayName) {
      navigate(`/room/${roomId}`, { replace: true });
      return;
    }

    apiGet<RoomInfoResponse>(`/rooms/${roomId}`)
      .then(info => {
        setRoomInfo(info);
        setLoading(false);
      })
      .catch(err => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, [roomId]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !roomId) return;
    sessionStorage.setItem('watchly_displayName', displayName.trim());
    navigate(`/room/${roomId}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '150px', height: '32px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease infinite' }} />
            <div style={{ width: '100px', height: '24px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease infinite' }} />
          </div>
          <div style={{ height: '220px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', animation: 'pulse 1.5s ease infinite' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--color-error)' }}>{error}</div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-card)',
            color: 'var(--color-text)',
            fontWeight: 600,
            border: '1px solid var(--color-border)',
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--color-primary)',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}>
            Join Room
          </h1>
          {roomInfo && (
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--color-text-secondary)',
            }}>
              {roomInfo.name}
            </p>
          )}
        </div>

        <form onSubmit={handleJoin} style={{
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Your Name
            </label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border)',
                fontSize: '1rem',
                transition: 'border-color var(--transition-fast)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          <button
            type="submit"
            disabled={!displayName.trim()}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: 'var(--color-primary-fg)',
              fontWeight: 700,
              fontSize: '1rem',
              opacity: !displayName.trim() ? 0.6 : 1,
              transition: 'all var(--transition-fast)',
            }}
          >
            Join Watch Party
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--color-text)';
              e.currentTarget.style.background = 'var(--color-surface)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
