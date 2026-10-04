import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { User } from '@watchly/shared';

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Prevent strict mode double-firing from doing multiple API calls
  const verified = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setErrorMsg('No token found in the URL.');
      return;
    }

    if (verified.current) return;
    verified.current = true;

    apiPost<{ accessToken: string, refreshToken: string, user: User, isNew: boolean }>('/auth/verify', { token })
      .then((data) => {
        login(data.accessToken, data.refreshToken, data.user);
        setStatus('success');
        // Redirect to profile after short delay
        setTimeout(() => navigate('/profile'), 1500);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.message || 'Verification failed');
      });

  }, [searchParams, login, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'var(--color-bg-card)',
        padding: '32px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        {status === 'verifying' && (
          <>
            <h2 style={{ marginBottom: '16px' }}>Verifying Magic Link...</h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>Please wait a moment.</div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <h2 style={{ color: 'var(--color-success)', marginBottom: '16px' }}>Verified!</h2>
            <div style={{ color: 'var(--color-text-secondary)' }}>Logging you in...</div>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 style={{ color: 'var(--color-error)', marginBottom: '16px' }}>Verification Failed</h2>
            <div style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              {errorMsg}
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
