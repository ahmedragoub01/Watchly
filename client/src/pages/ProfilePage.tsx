import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPatch } from '../api/client';
import { Layout } from '../components/layout/Layout';
import { LoadingDots } from '../components/ui/Loading';
import type { User } from '@watchly/shared';

type SettingsTab = 'profile' | 'account';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading, logout, updateUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?returnTo=/profile');
    }
  }, [user, loading, navigate]);

  // Reset displayName when user changes
  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user?.displayName]);

  if (loading || !user) {
    return (
      <Layout>
        <div className="page-container two-column-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '48px', maxWidth: '900px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '120px', height: '28px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease infinite' }} />
            <div style={{ width: '100%', height: '40px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease infinite' }} />
            <div style={{ width: '100%', height: '40px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease infinite' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ width: '200px', height: '28px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease infinite' }} />
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'var(--color-bg-card)', animation: 'pulse 1.5s ease infinite' }} />
              <div style={{ width: '120px', height: '36px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease infinite' }} />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setStatus('error');
      setErrorMessage('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setStatus('error');
      setErrorMessage('Image must be smaller than 5MB.');
      return;
    }

    setStatus('saving');
    setErrorMessage('');
    
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const updatedUser = await apiPatch<User>(`/users/${user.id}`, formData);
      updateUser(updatedUser);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setErrorMessage((err as Error).message);
      setLocalPreview(null);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim() === user.displayName) return;

    setStatus('saving');
    setErrorMessage('');
    try {
      const updatedUser = await apiPatch<User>(`/users/${user.id}`, { displayName: displayName.trim() });
      updateUser(updatedUser);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setErrorMessage((err as Error).message || 'Failed to save');
    }
  };

  const avatarSrc = localPreview || user.avatarUrl;

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'account', label: 'Account' },
  ];

  return (
    <Layout>
      <div className="page-container two-column-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '48px', maxWidth: '900px' }}>
        
        {/* Sidebar Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Settings</h1>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: activeTab === tab.key ? 'var(--color-surface-hover)' : 'transparent',
                color: activeTab === tab.key ? 'var(--color-text)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: '0.95rem',
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {activeTab === 'profile' && (
            <>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>Profile</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Customize how others see you on Watchly.</p>
              </div>

              {/* Avatar Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  background: 'var(--color-bg-hover)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                }}>
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: status === 'saving' ? 0.6 : 1, transition: 'opacity var(--transition-fast)' }} />
                  ) : (
                    <span style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      {(user.displayName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div>
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp,image/gif" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={status === 'saving'}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
                  >
                    {status === 'saving' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        Uploading
                        <LoadingDots />
                      </span>
                    ) : 'Change Avatar'}
                  </button>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                    JPG, PNG, WebP or GIF. Max 5MB.
                  </p>
                  {status === 'error' && errorMessage && (
                    <div style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginTop: '4px' }}>{errorMessage}</div>
                  )}
                  {status === 'success' && (
                    <div style={{ color: 'var(--color-success)', fontSize: '0.85rem', marginTop: '4px' }}>Updated!</div>
                  )}
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--color-border)' }} />

              {/* Profile Form */}
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    marginBottom: '6px',
                  }}>
                    Display Name
                  </label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    maxLength={30}
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.95rem',
                      transition: 'border-color var(--transition-fast)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={status === 'saving' || displayName.trim() === user.displayName}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-primary)',
                      color: 'var(--color-primary-fg)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      opacity: status === 'saving' || displayName.trim() === user.displayName ? 0.4 : 1,
                      transition: 'opacity var(--transition-fast)',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </>
          )}

          {activeTab === 'account' && (
            <>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>Account</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Manage your account details and security.</p>
              </div>

              {/* Email (read-only) */}
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
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.95rem',
                  maxWidth: '400px',
                }}>
                  {user.email || 'Not set'}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                  Your email is used for login and friend requests.
                </p>
              </div>

              {/* Member since */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: '6px',
                }}>
                  Member Since
                </label>
                <div style={{
                  fontSize: '0.95rem',
                  color: 'var(--color-text)',
                }}>
                  {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--color-border)' }} />

              {/* Sign Out */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-error)' }}>Danger Zone</h3>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--color-error)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
