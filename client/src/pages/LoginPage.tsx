import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../api/client';
import { Layout } from '../components/layout/Layout';
import { SlideUp } from '../components/ui/motion';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();
  const returnTo = searchParams.get('returnTo') || '/';
  
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      navigate(returnTo);
    }
  }, [user, navigate, returnTo]);

  // 1. Google Login Flow
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setStatus('loading');
      const { credential } = credentialResponse;
      const data = await apiPost<any>('/auth/google', { credential });
      login(data.accessToken, data.refreshToken, data.user);
      navigate(returnTo || '/profile');
    } catch (err) {
      setStatus('error');
      setMessage((err as Error).message || 'Google login failed');
    }
  };

  // 2. Magic Link Flow
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      await apiPost('/auth/magic-link', { email });
      setStatus('success');
      setMessage('Check your email for the magic link!');
    } catch (err) {
      setStatus('error');
      setMessage((err as Error).message);
    }
  };

  return (
    <Layout disablePadding>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <SlideUp delay={0.1}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <Link to="/" style={{ display: 'inline-block', marginBottom: '24px' }}>
                <img src="/logo-128.webp" alt="Watchly" style={{ width: '64px', height: '64px', borderRadius: '16px' }} />
              </Link>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#fff',
                marginBottom: '8px',
                letterSpacing: '-0.02em',
              }}>
                Welcome back
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                Sign in to access your profile and friends
              </p>
            </div>

            <div style={{
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setStatus('error');
                    setMessage('Google login failed');
                  }}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  width={350}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>or continue with email</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              </div>

              <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    marginBottom: '6px',
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border)',
                      fontSize: '1rem',
                      color: 'var(--color-text)',
                      transition: 'border-color var(--transition-fast)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-button)',
                    background: 'var(--color-primary)',
                    border: 'none',
                    color: 'var(--color-primary-fg)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: status === 'loading' ? 'wait' : 'pointer',
                    opacity: status === 'loading' ? 0.6 : 1,
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  {status === 'loading' ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>

              {message && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: status === 'error' ? 'var(--color-error)' : 'var(--color-success)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}>
                  {message}
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Back to home
                </button>
              </div>
            </div>
          </div>
        </SlideUp>
      </div>
    </Layout>
  );
}
