import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, ArrowLeft } from 'lucide-react';
import { apiPost } from '../api/client';
import { Layout } from '../components/layout/Layout';
import { LoadingCenter } from '../components/ui/Loading';
import type { CreateRoomResponse } from '@watchly/shared';
import { SlideUp } from '../components/ui/motion';
import { useAuth } from '../context/AuthContext';

// TVMaze returns HTML; keep only basic tags and strip all attributes (prevents XSS)
const sanitize = (html: string) =>
  html
    .replace(/<(?!\/?(?:p|b|i|em|strong|br)\b)[^>]*>/gi, '')
    .replace(/<(\/?)(p|b|i|em|strong|br)\b[^>]*>/gi, '<$1$2>');

export function MoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`https://api.tvmaze.com/shows/${id}`, { signal: ctrl.signal })
      .then(res => res.json())
      .then(data => { setMovie(data); setLoading(false); })
      .catch(err => {
        if (err.name !== 'AbortError') { console.error(err); setLoading(false); }
      });
    return () => ctrl.abort();
  }, [id]);

  const summary = useMemo(() => sanitize(movie?.summary || 'No description available.'), [movie?.summary]);

  const handleStartWatchParty = async () => {
    if (!user || !movie || starting) return;
    setStarting(true);
    try {
      const data = await apiPost<CreateRoomResponse>('/rooms', {
        name: movie.name || 'Watch Party',
        displayName: user.displayName,
        videoUrl: '',
      });
      sessionStorage.setItem(`watchly_session_${data.roomId}`, data.sessionId);
      sessionStorage.setItem('watchly_displayName', user.displayName);
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      console.error('Failed to start watch party', err);
      setStarting(false);
    }
  };

  if (loading || !movie) {
    return (
      <Layout disablePadding>
        {loading ? (
          <LoadingCenter text="Loading show" />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--color-text-muted)' }}>
            Show not found.
          </div>
        )}
      </Layout>
    );
  }

  return (
    <Layout disablePadding>
      <div className="page-container">
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '28px', fontWeight: 600, background: 'transparent', padding: '8px 0', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} /> Back
        </button>

        <SlideUp delay={0.05}>
          <div className="movie-hero">
            <div className="movie-poster" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
              {movie.image?.original && (
                <img src={movie.image.original} alt={movie.name} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            <div className="movie-info" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h1 style={{ fontSize: 'clamp(1.8rem, 7vw, 3.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                {movie.name}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px 16px', flexWrap: 'wrap', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                {movie.rating?.average && (
                  <div style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: 'var(--radius-button)' }}>
                    ★ {movie.rating.average}
                  </div>
                )}
                {movie.premiered && <div>{movie.premiered.substring(0, 4)}</div>}
                {movie.network?.name && <div>{movie.network.name}</div>}
                {movie.genres?.length > 0 && <div>• {movie.genres.join(', ')}</div>}
              </div>

              <div
                style={{ fontSize: '1.05rem', color: 'var(--color-text)', lineHeight: 1.7, opacity: 0.9, marginTop: '8px', maxWidth: '65ch' }}
                dangerouslySetInnerHTML={{ __html: summary }}
              />

              <div className="movie-actions">
                <button
                  className="cta-btn"
                  onClick={handleStartWatchParty}
                  disabled={starting || !user}
                  title={!user ? 'Sign in to create a watch party' : undefined}
                >
                  <PlayCircle size={22} />
                  {starting ? 'Creating room…' : !user ? 'Sign in to watch' : `Create Room for ${movie.name}`}
                </button>
              </div>
            </div>
          </div>
        </SlideUp>
      </div>
    </Layout>
  );
}
