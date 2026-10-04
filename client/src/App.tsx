import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/HomePage';

const JoinPage = lazy(() => import('./pages/JoinPage').then(m => ({ default: m.JoinPage })));
const RoomPage = lazy(() => import('./pages/RoomPage').then(m => ({ default: m.RoomPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const VerifyPage = lazy(() => import('./pages/VerifyPage').then(m => ({ default: m.VerifyPage })));
const FriendsPage = lazy(() => import('./pages/FriendsPage').then(m => ({ default: m.FriendsPage })));
const GroupsPage = lazy(() => import('./pages/GroupsPage').then(m => ({ default: m.GroupsPage })));
const MoviePage = lazy(() => import('./pages/MoviePage').then(m => ({ default: m.MoviePage })));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder.apps.googleusercontent.com';

function cancelExistingGsi() {
  if (typeof window === 'undefined') return;
  const gsi = (window as any).google?.accounts?.id;
  if (typeof gsi?.cancel === 'function') {
    try { gsi.cancel(); } catch (_) { /* noop */ }
  }
}

export default function App() {
  const cleanupRan = useRef(false);

  useEffect(() => {
    cancelExistingGsi();
    return () => {
      if (cleanupRan.current) return;
      cleanupRan.current = true;
      cancelExistingGsi();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/join/:roomId" element={<JoinPage />} />
                <Route path="/room/:roomId" element={<RoomPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/verify" element={<VerifyPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/movie/:id" element={<MoviePage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </MotionConfig>
  );
}

