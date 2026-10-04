import { lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';

const LandingPage = lazy(() => import('./LandingPage').then(m => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import('./DashboardPage').then(m => ({ default: m.DashboardPage })));

export function HomePage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Suspense fallback={null}>
      {user ? <DashboardPage /> : <LandingPage />}
    </Suspense>
  );
}