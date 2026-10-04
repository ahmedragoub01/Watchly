import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import {
  StaggerContainer, StaggerItem, ScrollReveal, BlurFade
} from '../components/ui/motion';
import { LoadingDots } from '../components/ui/Loading';
import { PlayCircle, Users, MessageSquare, Zap, Sparkles, Shield, Tv } from 'lucide-react';
import { apiPost } from '../api/client';
import type { CreateRoomResponse } from '@watchly/shared';
import { useAuth } from '../context/AuthContext';

/**
 * Defers loading the YouTube embed iframe until it scrolls into view.
 * YouTube's player JS is ~800KB — loading it eagerly blocks initial paint.
 */
function LazyYouTubeHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadIframe, setLoadIframe] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setLoadIframe(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <BlurFade delay={0.8} className="landing-hero-visual" style={{ marginTop: '80px', width: '100%', maxWidth: '1000px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
          position: 'relative',
          overflow: 'hidden',
          background: '#000',
          pointerEvents: 'none',
        }}
      >
        {loadIframe && (
          <iframe
            src="https://www.youtube.com/embed/c_Sf-XY3t-I?autoplay=1&mute=1&loop=1&playlist=c_Sf-XY3t-I&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1"
            title="Watchly Preview"
            frameBorder="0"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              transform: 'translate(-50%, -50%) scale(1.2)',
              pointerEvents: 'none',
              border: 'none',
            }}
          />
        )}

        {/* Cinematic Overlay to blend seamlessly */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(9, 9, 11, 0.0) 0%, rgba(9, 9, 11, 0.4) 80%, rgba(9, 9, 11, 0.8) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Live Emoji Reactions Demo inside Player */}
        <div className="video-reaction-boundary" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
          <div className="reaction-track">
            <div className="emoji-float" style={{ animationDelay: '0s', right: '10px' }}>🔥</div>
            <div className="emoji-float" style={{ animationDelay: '0.7s', right: '35px' }}>😂</div>
            <div className="emoji-float" style={{ animationDelay: '1.4s', right: '60px' }}>✨</div>
          </div>
        </div>
      </div>
    </BlurFade>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Looping Typewriter Effect State
  const [typedText, setTypedText] = useState('');
  const fullText = "Feel it together.";

  // Looping Typewriter Logic
  useEffect(() => {
    let currentLength = 0;
    let isDeleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const type = () => {
      if (!isDeleting && currentLength < fullText.length) {
        currentLength++;
        setTypedText(fullText.slice(0, currentLength));
        timeout = setTimeout(type, 120);
      } else if (!isDeleting && currentLength === fullText.length) {
        // Pause at the end before deleting
        timeout = setTimeout(() => { isDeleting = true; type(); }, 3500);
      } else if (isDeleting && currentLength > 0) {
        currentLength--;
        setTypedText(fullText.slice(0, currentLength));
        timeout = setTimeout(type, 60);
      } else if (isDeleting && currentLength === 0) {
        isDeleting = false;
        // Pause before typing again
        timeout = setTimeout(type, 800);
      }
    };

    timeout = setTimeout(type, 200);
    return () => clearTimeout(timeout);
  }, []);

  const handleInstantRoomCreation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalRoomName = roomName.trim() || 'Movie Night';
    setLoading(true);
    setError('');

    try {
      let displayName = user?.displayName || sessionStorage.getItem('watchly_displayName');
      if (!displayName) {
        const adjectives = ['Swift', 'Cosmic', 'Silent', 'Bold', 'Neon', 'Lunar'];
        const nouns = ['Viewer', 'Watcher', 'Guest', 'Fan', 'Nomad'];
        displayName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
      }

      const data = await apiPost<CreateRoomResponse>('/rooms', {
        name: finalRoomName,
        displayName,
      });

      sessionStorage.setItem(`watchly_session_${data.roomId}`, data.sessionId);
      sessionStorage.setItem('watchly_displayName', displayName);

      navigate(`/room/${data.roomId}`);
    } catch (err) {
      console.error('Failed to create room from landing page:', err);
      setError((err as Error).message || 'Could not create room. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Layout disablePadding>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        overflowX: 'hidden',
      }}>

        {/* Hero Section */}
        <section className="landing-hero" style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 24px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Golden Glow Behind the Text */}
          <div className="hero-glow-layer" />

          {/* Grid Pattern Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          <StaggerContainer style={{ textAlign: 'center', maxWidth: '900px', zIndex: 1, position: 'relative' }}>
            <StaggerItem>
              <h1 style={{
                fontSize: 'clamp(2.2rem, 9vw, 5.5rem)',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.05,
                letterSpacing: '-0.05em',
                marginBottom: '28px',
              }}>
                Watch together.{' '}
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                  minHeight: '1.1em', // Prevents layout shift while typewriter is empty
                }}>
                  {typedText || '\u00A0'}
                </span>
                <span className="typing-cursor" />
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p style={{
                fontSize: 'clamp(1.1rem, 2.2vw, 1.35rem)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                maxWidth: '640px',
                margin: '0 auto 40px',
                fontWeight: 400,
              }}>
                Host perfectly synchronized watch parties instantly. No sign-up required for guests — just start a room, share the link, and watch.
              </p>
            </StaggerItem>

            <StaggerItem>
              {/* Instant Room Creation Form */}
              <form onSubmit={handleInstantRoomCreation} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxWidth: '540px',
                margin: '0 auto 16px'
              }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Optional room name..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    maxLength={60}
                    style={{
                      flex: 1,
                      minWidth: '240px',
                      padding: '16px 20px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 'var(--radius-button)',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '16px 32px',
                      background: 'var(--color-primary)',
                      color: 'var(--color-primary-fg)',
                      borderRadius: 'var(--radius-button)',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      opacity: loading ? 0.7 : 1,
                      transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s',
                      outline: 'none',
                    }}
                    onMouseEnter={e => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.background = 'var(--color-primary-hover)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.background = 'var(--color-primary)';
                    }}>
                    <PlayCircle size={20} />
                    {loading ? (
                      <>
                        Creating
                        <LoadingDots />
                      </>
                    ) : 'Start Watching'}
                  </button>
                </div>
                {error && <div style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
              </form>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                <span>Already have an account?</span>
                <Link to="/login" style={{ color: '#fff', textDecoration: 'underline', fontWeight: 500, outline: 'none' }}>Sign In</Link>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* Hero Visual — Untouchable Autoplaying YouTube Video with Reactions
              The iframe is deferred until it scrolls into view to avoid loading
              ~800KB of YouTube player JS during the critical rendering path. */}
          <LazyYouTubeHero />
        </section>

        {/* Stats Bar */}
        <ScrollReveal direction="up" style={{ width: '100%', maxWidth: '900px', padding: '0 24px' }}>
          <div className="landing-stats" style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            overflow: 'hidden',
            margin: '-40px auto 0',
            position: 'relative',
            zIndex: 2,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {[
              { label: 'Latency', value: '<50', suffix: 'ms' },
              { label: 'Max Participants', value: '10', suffix: '+' },
              { label: 'Cost', value: '$0', suffix: '' },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '32px 24px',
                textAlign: 'center',
                background: 'rgba(9, 9, 11, 0.95)',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                  {stat.value}{stat.suffix}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px', fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Features Section — Asymmetrical Bento Grid */}
        <section style={{
          width: '100%',
          maxWidth: '1200px',
          padding: '140px 24px 120px',
        }}>
          <ScrollReveal direction="up" style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '16px', color: '#fff' }}>
              Everything you need.{' '}
              <span style={{ color: 'var(--color-text-secondary)' }}>Nothing you don't.</span>
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
              Built for small groups who just want to watch something together.
            </p>
          </ScrollReveal>

          <div className="landing-features">
            {[
              { icon: <Zap size={28} />, title: 'Frame-Perfect Sync', desc: 'Timestamp-based synchronization keeps everyone on exactly the same frame. No countdown needed.' },
              { icon: <Users size={28} />, title: 'Instant Rooms', desc: 'Create a room in seconds and share the link. No accounts required.' },
              { icon: <MessageSquare size={28} />, title: 'Spoiler-Safe Chat', desc: 'Messages tied to timestamps are locked until you reach that point. The future stays hidden.' },
              { icon: <Sparkles size={28} />, title: 'Moments Timeline', desc: 'See where the group went crazy. Reactions are plotted on a timeline so you can relive the hype.' },
              { icon: <Shield size={28} />, title: 'Privacy First', desc: 'No tracking, no ads, no data selling. Your watch parties are yours. Period.' },
              { icon: <Tv size={28} />, title: 'Any Video Source', desc: 'YouTube, Google Drive, direct MP4 links, or local files.' },
            ].map((feature, i) => (
              <div key={i} className={`bento-item bento-item-${i}`}>
                <ScrollReveal delay={0} direction="up" style={{ height: '100%' }}>
                  <div style={{
                    padding: '36px 32px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'background 0.2s, border-color 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    }}>
                    <div style={{
                      color: '#fff',
                      marginBottom: '20px',
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {feature.icon}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.02em', color: '#fff' }}>{feature.title}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.65, fontSize: '0.95rem' }}>{feature.desc}</p>
                  </div>
                </ScrollReveal>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section style={{
          width: '100%',
          maxWidth: '900px',
          padding: '40px 24px 140px',
        }}>
          <ScrollReveal direction="up" style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#fff' }}>
              Three steps. That's it.
            </h2>
          </ScrollReveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
              { step: '01', title: 'Create a room', desc: 'Pick a name, paste a video URL (or upload a file), and you\'re the host.' },
              { step: '02', title: 'Share the link', desc: 'Send the invite link to your friends. They join instantly — no sign-up required.' },
              { step: '03', title: 'Watch & react', desc: 'Play, pause, react, and chat in perfect sync. Every hype moment is captured.' },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={0} direction="up">
                <div className="landing-how-item" style={{
                  padding: '32px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.01)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: 'rgba(255,255,255,0.1)',
                    lineHeight: 1,
                    flexShrink: 0,
                    width: '60px',
                    letterSpacing: '-0.04em',
                  }}>
                    {item.step}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em', color: '#fff' }}>{item.title}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '1rem' }}>{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          width: '100%',
          padding: '100px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <ScrollReveal direction="up" className="landing-cta-card" style={{
            maxWidth: '700px',
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            padding: '64px 40px',
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '16px', color: '#fff' }}>
              Ready to watch together?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '40px' }}>
              Create your first room in under 10 seconds. Completely free.
            </p>
            <button onClick={() => handleInstantRoomCreation()} disabled={loading} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 40px',
              background: 'var(--color-primary)',
              color: 'var(--color-primary-fg)',
              borderRadius: 'var(--radius-button)',
              fontWeight: 700,
              fontSize: '1.1rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              textDecoration: 'none',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s',
              outline: 'none',
            }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = 'var(--color-primary-hover)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.background = 'var(--color-primary)';
              }}>
              <PlayCircle size={20} />
              {loading ? (
                <>
                  Creating
                  <LoadingDots />
                </>
              ) : 'Get Started Free'}
            </button>
          </ScrollReveal>
        </section>

        {/* Footer */}
        <footer className="landing-footer" style={{
          width: '100%',
          padding: '48px 24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          maxWidth: '1200px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '0.85rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>Watchly</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span style={{ color: 'inherit' }}>Built by Ahmed Ragoub</span>
            {/* TODO: Replace with your actual GitHub repo URL */}
            <a href="https://github.com/watchly" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>GitHub</a>
          </div>
        </footer>

      </div>
    </Layout>
  );
}