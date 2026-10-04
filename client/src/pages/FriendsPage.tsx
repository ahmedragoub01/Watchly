import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiDelete } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout/Layout';
import { LoadingCenter, LoadingDots } from '../components/ui/Loading';
import type { FriendProfile, FriendRequest, FriendWatchlistItem, Friendship } from '@watchly/shared';
import type { Paginated } from '@watchly/shared';
export function FriendsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [addEmail, setAddEmail] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addMessage, setAddMessage] = useState('');
  const [addError, setAddError] = useState('');

  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [watchlist, setWatchlist] = useState<FriendWatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Track which friend request action is in-progress to prevent double-clicks
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login?returnTo=/friends');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [friendsResponse, requests] = await Promise.all([
        apiGet<Paginated<FriendProfile>>('/friends'),
        apiGet<FriendRequest[]>('/friends/requests')
      ]);

      setFriends(friendsResponse.items);
      setRequests(requests);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) return;

    setAddLoading(true);
    setAddMessage('');
    setAddError('');

    try {
      await apiPost<Friendship>('/friends/request', { email: addEmail.trim() });
      setAddMessage('Friend request sent!');
      setAddEmail('');
      loadData();
    } catch (err: any) {
      setAddError(err.message || 'Failed to send request');
    } finally {
      setAddLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    setActionId(id);
    setActionError('');
    try {
      await apiPost(`/friends/${id}/accept`);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to accept');
    } finally {
      setActionId(null);
    }
  };

  const handleRejectOrCancel = async (id: string, isReject: boolean = false) => {
    setActionId(id);
    setActionError('');
    try {
      if (isReject) {
        await apiPost(`/friends/${id}/reject`);
      } else {
        await apiDelete(`/friends/${id}`);
      }
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleSelectFriend = async (friend: FriendProfile) => {
    setSelectedFriend(friend);
    setWatchlistLoading(true);
    try {
      const response = await apiGet<Paginated<FriendWatchlistItem>>(
        `/friends/${friend.friendshipId}/watchlist`
      );
      setWatchlist(response.items);
    } catch (err) {
      console.error(err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriend || !videoUrl.trim() || !videoTitle.trim()) return;

    let provider = 'direct';
    if (/youtube\.com|youtu\.be/.test(videoUrl)) provider = 'youtube';
    if (/drive\.google\.com/.test(videoUrl)) provider = 'googledrive';

    try {
      const newItem = await apiPost<FriendWatchlistItem>(`/friends/${selectedFriend.friendshipId}/watchlist`, {
        url: videoUrl,
        provider,
        title: videoTitle,
        thumbnailUrl: thumbnailUrl || undefined
      });
      setWatchlist([newItem, ...watchlist]);
      setVideoUrl('');
      setVideoTitle('');
      setThumbnailUrl('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartWatchParty = async (item: FriendWatchlistItem) => {
    try {
      const data = await apiPost<any>('/rooms', {
        name: `Watching with ${selectedFriend?.displayName}`,
        displayName: user?.displayName || 'Host',
        videoUrl: item.video.url,
      });
      sessionStorage.setItem(`watchly_session_${data.roomId}`, data.sessionId);
      sessionStorage.setItem('watchly_displayName', user?.displayName || 'Host');
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingCenter text="Loading friends" />
      </Layout>
    );
  }

  const incomingRequests = requests.filter(r => r.direction === 'incoming');
  const outgoingRequests = requests.filter(r => r.direction === 'outgoing');

  // Avatar helper
  const Avatar = ({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--color-bg-hover)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {src ? (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: size * 0.4, fontWeight: 600, color: 'var(--color-text-muted)' }}>{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="page-container two-column-layout" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '32px', flex: 1, minHeight: 0 }}>

        {/* LEFT COLUMN: Friend Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Add Friend */}
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px' }}>Friends</h2>
            <form onSubmit={handleSendRequest} className="form-inline">
              <input
                type="email"
                placeholder="Add by email address..."
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem',
                  transition: 'border-color var(--transition-fast)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
              <button
                type="submit"
                disabled={addLoading || !addEmail.trim()}
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-primary-fg)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  opacity: addLoading || !addEmail.trim() ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {addLoading ? <LoadingDots /> : 'Add'}
              </button>
            </form>
            {addMessage && <div style={{ color: 'var(--color-success)', fontSize: '0.85rem', marginTop: '8px' }}>{addMessage}</div>}
            {addError && <div style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginTop: '8px' }}>{addError}</div>}
          </div>

          {/* Incoming Requests */}
          {incomingRequests.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                Incoming Requests
              </div>
              {actionError && <div style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginBottom: '8px' }}>{actionError}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {incomingRequests.map(req => {
                  const isBusy = actionId === req.friendshipId;
                  return (
                    <div key={req.friendshipId} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                      background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      opacity: isBusy ? 0.6 : 1,
                      transition: 'opacity var(--transition-fast)',
                    }}>
                      <Avatar src={req.avatarUrl} name={req.displayName} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.displayName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Wants to be friends</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button disabled={isBusy} onClick={() => handleAccept(req.friendshipId)} style={{ padding: '6px 12px', background: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, opacity: isBusy ? 0.5 : 1, cursor: isBusy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', minWidth: '60px', justifyContent: 'center' }}>{isBusy ? <LoadingDots /> : 'Accept'}</button>
                        <button disabled={isBusy} onClick={() => handleRejectOrCancel(req.friendshipId, true)} style={{ padding: '6px 12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-text-secondary)', cursor: isBusy ? 'not-allowed' : 'pointer' }}>Ignore</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outgoing Requests */}
          {outgoingRequests.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                Sent Requests
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {outgoingRequests.map(req => (
                  <div key={req.friendshipId} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                    background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)',
                  }}>
                    <Avatar src={req.avatarUrl} name={req.displayName} size={36} />
                    <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{req.displayName}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Request Sent</span>
                    <button onClick={() => handleRejectOrCancel(req.friendshipId)} style={{ padding: '4px 10px', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friend List */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              Friends · {friends.length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {friends.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  No friends yet. Add someone above!
                </div>
              ) : (
                friends.map(friend => {
                  const isSelected = selectedFriend?.friendshipId === friend.friendshipId;
                  return (
                    <button
                      key={friend.friendshipId}
                      onClick={() => handleSelectFriend(friend)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        background: isSelected ? 'var(--color-surface-hover)' : 'transparent',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                        textAlign: 'left',
                      }}
                    >
                      <Avatar src={friend.avatarUrl} name={friend.displayName} size={36} />
                      <span style={{ fontWeight: isSelected ? 600 : 500, fontSize: '0.95rem' }}>{friend.displayName}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Shared Watchlist */}
        <div style={{
          background: 'var(--color-bg-elevated)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '500px',
        }}>
          {!selectedFriend ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>Select a friend to see your shared watchlist</div>
            </div>
          ) : (
            <>
              {/* Friend Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border)' }}>
                <Avatar src={selectedFriend.avatarUrl} name={selectedFriend.displayName} size={48} />
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Watchlist with {selectedFriend.displayName}</h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Movies you want to watch together</span>
                </div>
              </div>

              {/* Add Video Form */}
              <form onSubmit={handleAddVideo} className="form-inline" style={{ marginBottom: '24px' }}>
                <input
                  placeholder="Video URL"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  style={{ flex: 2, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
                <input
                  placeholder="Title"
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
                <input
                  placeholder="Poster URL (optional)"
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-border-focus)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
                <button
                  type="submit"
                  disabled={!videoUrl.trim() || !videoTitle.trim()}
                  style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'var(--color-primary-fg)', fontWeight: 600, fontSize: '0.85rem', opacity: !videoUrl.trim() || !videoTitle.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}
                >
                  Add
                </button>
              </form>

              {/* Watchlist Items */}
              {watchlistLoading ? (
                <LoadingCenter size="md" text="Loading watchlist" variant="bar" />
              ) : watchlist.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
                  <div style={{ fontSize: '2rem' }}>🍿</div>
                  <div>No movies yet. Add one above to get started!</div>
                </div>
              ) : (
                <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
                  {watchlist.map(item => (
                    <div key={item.id} style={{
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      transition: 'transform var(--transition-fast)',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      {/* Poster */}
                      <div style={{ width: '100%', aspectRatio: '16/10', background: 'var(--color-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {item.video.thumbnailUrl ? (
                          <img src={item.video.thumbnailUrl} alt={item.video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '2rem' }}>🎬</span>
                        )}
                      </div>
                      <div style={{ padding: '14px' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.video.title}</h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                          Added by {item.addedByName} · {item.video.provider}
                        </div>
                        <button
                          onClick={() => handleStartWatchParty(item)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-primary)',
                            color: 'var(--color-primary-fg)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            transition: 'opacity var(--transition-fast)',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          ▶ Watch Together
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
