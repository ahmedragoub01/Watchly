import { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { apiPost, apiGet } from '../api/client';
import { Layout } from '../components/layout/Layout';
import type { CreateRoomResponse } from '@watchly/shared';
import { SlideUp } from '../components/ui/motion';
import { LoadingDots } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { SteppedCarousel } from '../components/ui/SteppedCarousel';
import { useTrendingShows, type ShowCardData, type ShowRow } from '../hooks/useTrendingShows';

type WatchlistItem = {
  id: string;
  source_type: 'friend' | 'group';
  video_title: string;
  video_url: string;
  thumbnail_url: string;
};

/* ---------- Memoized cards: they never re-render while you type in the form ---------- */

const ShowCard = memo(function ShowCard({
  item,
  onOpen,
}: {
  item: ShowCardData;
  onOpen: (id: string) => void;
}) {
  return (
    <div
      className="show-card"
      role="link"
      tabIndex={0}
      onClick={() => onOpen(item.id)}
      onKeyDown={e => { if (e.key === 'Enter') onOpen(item.id); }}
    >
      <div className="show-card-poster">
        <img
          src={item.thumbnail}
          alt={item.title}
          width={210}
          height={295}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <span className="rating-badge">★ {item.rating}</span>
      </div>
      <h3 className="show-card-title">{item.title}</h3>
    </div>
  );
});

const WatchlistCard = memo(function WatchlistCard({
  item,
  onStart,
}: {
  item: WatchlistItem;
  onStart: (url: string, title: string) => void;
}) {
  return (
    <div
      className="show-card watchlist-card"
      role="button"
      tabIndex={0}
      onClick={() => onStart(item.video_url, item.video_title)}
      onKeyDown={e => { if (e.key === 'Enter') onStart(item.video_url, item.video_title); }}
    >
      <div className="show-card-poster show-card-poster--wide">
        {item.thumbnail_url && (
          <img src={item.thumbnail_url} alt={item.video_title} loading="lazy" decoding="async" draggable={false} />
        )}
        <div className="play-overlay"><PlayCircle size={40} color="white" /></div>
      </div>
      <h3 className="show-card-title">{item.video_title}</h3>
      <div className="show-card-sub">From {item.source_type}</div>
    </div>
  );
});

const GenreRow = memo(function GenreRow({
  row,
  onOpen,
  onLoadMore,
  hasMore,
  loadingMore,
}: {
  row: ShowRow;
  onOpen: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
}) {
  return (
    <section className="content-auto">
      <h2 className="row-title">{row.title}</h2>
      <SteppedCarousel onReachEnd={onLoadMore} hasMore={hasMore} loadingMore={loadingMore}>
        {row.items.map(item => <ShowCard key={item.id} item={item} onOpen={onOpen} />)}
      </SteppedCarousel>
    </section>
  );
});

/* ---------- Form cards own their state, so typing doesn't re-render the page ---------- */

const CreateRoomCard = memo(function CreateRoomCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLocalFile = videoUrl.startsWith('blob:');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setError('');
    setLoading(true);

    try {
      // Determine display name: use logged-in user, existing session name, or generate a random guest name
      let displayName = user?.displayName || sessionStorage.getItem('watchly_displayName');
      if (!displayName) {
        const adjectives = ['Swift', 'Cosmic', 'Silent', 'Bold', 'Neon', 'Lunar'];
        const nouns = ['Viewer', 'Watcher', 'Guest', 'Fan', 'Nomad'];
        displayName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
      }

      const data = await apiPost<CreateRoomResponse>('/rooms', {
        name: roomName.trim(),
        displayName,
        videoUrl: videoUrl.trim() || undefined,
      });

      sessionStorage.setItem(`watchly_session_${data.roomId}`, data.sessionId);
      sessionStorage.setItem('watchly_displayName', displayName);
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const handleLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUrl(URL.createObjectURL(file));
    if (!roomName) setRoomName(file.name.replace(/\.[^/.]+$/, ''));
  };

  return (
    <form onSubmit={handleCreate} className="card-form card-form--grow">
      <div>
        <label className="field-label">Room name</label>
        <input
          className="field-input"
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
          placeholder="Friday movie night"
          required
          maxLength={60}
        />
      </div>

      <div>
        <label className="field-label">
          Video URL <span style={{ opacity: 0.5 }}>(optional)</span>
        </label>
        <div className="dashboard-video-row">
          <input
            className="field-input"
            value={isLocalFile ? 'Local file selected' : videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            readOnly={isLocalFile}
            placeholder="YouTube, Drive or .mp4 link"
          />
          <label className="btn-secondary">
            Local file
            <input type="file" accept="video/mp4,video/webm" hidden onChange={handleLocalFile} />
          </label>
        </div>
        {isLocalFile && (
          <p className="field-hint">
            Friends will need to select the same file on their device to stay in sync.
          </p>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      <button type="submit" className="btn-primary" disabled={loading || !roomName.trim()}>
        {loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Creating
            <LoadingDots />
          </span>
        ) : 'Create room'}
      </button>
    </form>
  );
});

const JoinRoomCard = memo(function JoinRoomCard() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = value.trim();
    if (!raw) return;
    const code = raw.includes('/') ? raw.split('/').filter(Boolean).pop() : raw;
    navigate(`/join/${code}`);
  };

  return (
    <form onSubmit={handleJoin} className="card-form card-form--compact">
      <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Join a room</h2>
      <div className="form-inline">
        <input
          className="field-input"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Paste invite link or code"
        />
        <button type="submit" className="btn-secondary" disabled={!value.trim()}>
          Join
        </button>
      </div>
    </form>
  );
});

/* ---------- Page ---------- */

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rows, loading: showsLoading, loadingMore, hasMore, loadMore } = useTrendingShows();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [wlLoading, setWlLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWlLoading(false);
      return;
    }
    let cancelled = false;
    apiGet<{ watchlist: WatchlistItem[] }>(`/users/${user.id}/dashboard`)
      .then(d => { if (!cancelled) setWatchlist(d.watchlist); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setWlLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openMovie = useCallback((id: string) => navigate(`/movie/${id}`), [navigate]);

  const startWatchParty = useCallback(async (url: string, title: string) => {
    try {
      let displayName = user?.displayName || sessionStorage.getItem('watchly_displayName');
      if (!displayName) {
        displayName = 'Guest Watcher';
      }
      const data = await apiPost<CreateRoomResponse>('/rooms', {
        name: title || 'Watch Party',
        displayName,
        videoUrl: url,
      });
      sessionStorage.setItem(`watchly_session_${data.roomId}`, data.sessionId);
      sessionStorage.setItem('watchly_displayName', displayName);
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      console.error('Failed to start watch party', err);
    }
  }, [user, navigate]);

  const [firstRow, ...otherRows] = rows;

  const rowProps = { onOpen: openMovie, onLoadMore: loadMore, hasMore, loadingMore };

  return (
    <Layout disablePadding>
      <div className="dashboard-layout">
        {/* Left: actions (stretches to match the right column height) */}
        <aside className="dashboard-side">
          <SlideUp delay={0.05} className="dashboard-side-inner">
            <div className="dashboard-welcome">
              <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.2 }}>
                {user ? `Welcome back, ${user?.displayName?.split(' ')[0]}` : 'Welcome to Watchly'}
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 6 }}>Ready for a watch party?</p>
            </div>
            <CreateRoomCard />
            <JoinRoomCard />
          </SlideUp>
        </aside>

        {/* Right: watchlist + first row */}
        <section className="dashboard-top">
          <SlideUp delay={0.1}>
            <h2 className="row-title">Your watchlist</h2>
            {wlLoading ? (
              <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ width: '240px', height: '160px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', flexShrink: 0, animation: 'pulse 1.5s ease infinite' }} />
                ))}
              </div>
            ) : !user ? (
              <div className="empty-box">Sign in to sync your personal watchlist.</div>
            ) : watchlist.length === 0 ? (
              <div className="empty-box">Nothing here yet. Add videos with friends or groups.</div>
            ) : (
              <SteppedCarousel autoplay={false} itemWidth={240}>
                {watchlist.map(item => (
                  <WatchlistCard key={`${item.source_type}-${item.id}`} item={item} onStart={startWatchParty} />
                ))}
              </SteppedCarousel>
            )}
          </SlideUp>

          {showsLoading && (
            <div style={{ display: 'flex', gap: '16px', overflow: 'hidden', marginTop: '16px' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ width: '210px', flexShrink: 0 }}>
                  <div style={{ width: '100%', height: '295px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s ease infinite' }} />
                  <div style={{ width: '60%', height: '14px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-sm)', marginTop: '10px', animation: 'pulse 1.5s ease infinite' }} />
                </div>
              ))}
            </div>
          )}
          {firstRow && (
            <SlideUp delay={0.15}>
              <GenreRow row={firstRow} {...rowProps} />
            </SlideUp>
          )}
        </section>

        {/* Starts at the far left, right under the create-room card */}
        {otherRows.length > 0 && (
          <div className="dashboard-rows">
            {otherRows.map(row => <GenreRow key={row.title} row={row} {...rowProps} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}