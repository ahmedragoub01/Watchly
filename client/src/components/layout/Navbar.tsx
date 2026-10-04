import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost } from '../../api/client';
import { AnimatePresence, MotionDiv, dialogPreset } from '../ui/motion';
import HomeIcon from '../icons/HomeIcon';
import UsersIcon from '../icons/UsersIcon';
import UsersGroupIcon from '../icons/UsersGroupIcon';
import UserIcon from '../icons/UserIcon';

const DESKTOP_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/friends', label: 'Friends' },
  { path: '/groups', label: 'Groups' },
];

const BOTTOM_LINKS = [
  { path: '/', label: 'Home', Icon: HomeIcon },
  { path: '/friends', label: 'Friends', Icon: UsersIcon },
  { path: '/groups', label: 'Groups', Icon: UsersGroupIcon },
  { path: '/profile', label: 'Profile', Icon: UserIcon },
];

const headerStyle: React.CSSProperties = {
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(9, 9, 11, 0.95)',
  borderBottom: '1px solid var(--color-border)',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  willChange: 'transform',
  contain: 'layout style' as any,
};

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        setNotifications(await apiGet<any[]>('/notifications'));
      } catch (err) {
        console.error(err);
      }
    };

    fetchNotifications();
    const tick = () => { if (document.visibilityState === 'visible') fetchNotifications(); };
    const interval = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setShowNotifications(false);
    setShowProfileMenu(false);
  }, [location.pathname]);

  const handleAction = async (notif: any, action: 'accept' | 'reject') => {
    try {
      if (notif.type === 'friend_request') {
        await apiPost(`/friends/${notif.friendshipId}/${action}`);
      } else if (notif.type === 'group_invitation') {
        await apiPost(`/groups/invitations/${notif.invitationId}/${action}`);
      }
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <header className="site-header" style={headerStyle}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
          <img src="/logo-128.webp" alt="Watchly Logo" width={32} height={32} style={{ borderRadius: '8px' }} />
          Watchly
        </Link>
        <Link to="/login" style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 600, borderRadius: 'var(--radius-button)', background: 'var(--color-primary)', color: 'var(--color-primary-fg)', textDecoration: 'none' }}>
          Sign In
        </Link>
      </header>
    );
  }

  const unreadCount = notifications.length;

  return (
    <>
      <header className="site-header" style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
            <img src="/logo-128.webp" alt="Watchly Logo" width={32} height={32} style={{ borderRadius: '8px' }} />
            <span className="hide-mobile">Watchly</span>
          </Link>

          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {DESKTOP_LINKS.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    position: 'relative',
                    padding: '8px 0',
                  }}
                >
                  {link.label}
                  {isActive && (
                    <MotionDiv
                      layoutId="nav-indicator"
                      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'var(--color-primary)', borderRadius: '2px 2px 0 0' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              aria-label="Notifications"
              style={{
                position: 'relative',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: showNotifications ? 'var(--color-surface-hover)' : 'transparent',
                transition: 'background var(--transition-fast)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <AnimatePresence>
                {unreadCount > 0 && (
                  <MotionDiv
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    style={{
                      position: 'absolute', top: 0, right: 0,
                      background: 'var(--color-accent)', color: 'var(--color-primary-fg)',
                      fontSize: '0.65rem', fontWeight: 800, width: '16px', height: '16px',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid var(--color-bg)',
                    }}
                  >
                    {unreadCount}
                  </MotionDiv>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <MotionDiv
                  {...dialogPreset}
                  className="notif-dropdown"
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: '-10px',
                    background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden', transformOrigin: 'top right',
                  }}
                >
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: '0.9rem' }}>
                    Notifications
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const avatarUrl = notif.type === 'friend_request' ? notif.avatarUrl : notif.groupAvatar;
                        const initial = notif.type === 'friend_request' ? notif.displayName?.charAt(0) : notif.groupName?.charAt(0);
                        return (
                          <div key={notif.id} style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '12px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg-input)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border)' }}>
                              {avatarUrl ? (
                                <img src={avatarUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                  {initial?.toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--color-text)' }}>{notif.message}</div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleAction(notif, 'accept')}
                                  style={{ flex: 1, padding: '6px', background: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleAction(notif, 'reject')}
                                  style={{
                                    flex: 1,
                                    padding: '6px',
                                    background: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    border: 'none', // Fixed visual weight conflict
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  Ignore
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>

          {/* Profile menu */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 12px 4px 4px',
                borderRadius: 'var(--radius-full)',
                background: showProfileMenu ? 'var(--color-surface-hover)' : 'transparent',
                transition: 'background var(--transition-fast)',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-bg-input)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="navbar-username" style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user.displayName}</span>
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <MotionDiv
                  {...dialogPreset}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '240px',
                    background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden', transformOrigin: 'top right',
                  }}
                >
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)' }}>{user.displayName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{user.email}</div>
                  </div>
                  <div style={{ padding: '8px' }}>
                    <Link to="/profile" className="menu-item">Account Settings</Link>
                    <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 0' }} />
                    <button
                      onClick={() => { logout(); navigate('/'); }}
                      className="menu-item menu-item--danger"
                    >
                      Sign Out
                    </button>
                  </div>
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Primary">
        {BOTTOM_LINKS.map(({ path, label, Icon }) => {
          const isActive = location.pathname === path;
          // Show notification dot on the Friends tab when there are pending notifications
          const showBadge = path === '/friends' && unreadCount > 0;
          return (
            <Link
              key={path}
              to={path}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.65rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                textDecoration: 'none',
                padding: '4px 0',
                position: 'relative',
              }}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                {showBadge && (
                  <span
                    aria-label={`${unreadCount} notifications`}
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-4px',
                      width: unreadCount > 9 ? '16px' : '10px',
                      height: '10px',
                      borderRadius: '10px',
                      background: 'var(--color-accent)',
                      border: '2px solid var(--color-bg)',
                      fontSize: '0.5rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : ''}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}