import { type FC, lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { connectSocket } from '@/lib/socket';
import { useUserStore } from '@/store/userStore';
import { useSocket } from '@/hooks/useSocket';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const LobbyPage = lazy(() => import('@/pages/LobbyPage').then((m) => ({ default: m.LobbyPage })));
const RoomPage = lazy(() => import('@/pages/RoomPage').then((m) => ({ default: m.RoomPage })));

const PageFallback: FC = () => (
  <div className="flex min-h-dvh items-center justify-center bg-slate-900">
    <div role="status" aria-label="Loading page" className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
  </div>
);

// Mounted once at app level so socket handlers survive route changes.
// Only rendered after auth sets user, guaranteeing connectSocket() has been called.
const SocketManager: FC = () => { useSocket(); return null; };

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export const App: FC = () => {
  const { user, setUser, clearUser } = useUserStore();

  useEffect(() => {
    // cancelled guard prevents stale async callbacks from StrictMode double-mount.
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') { clearUser(); return; }
      if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') return;

      if (session?.user && session.access_token) {
        try {
          const res = await fetch(`${SERVER_URL}/api/users/me`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          });
          if (cancelled) return;
          if (res.ok) {
            const { user, balance } = await res.json() as { user: Parameters<typeof setUser>[0]; balance: number };
            setUser(user, balance);
            connectSocket(session.access_token);
          } else {
            clearUser();
          }
        } catch {
          if (!cancelled) clearUser();
        }
      } else {
        clearUser();
      }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [setUser, clearUser]);

  return (
    <ErrorBoundary>
      {user && <SocketManager />}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/lobby" element={<RequireAuth><LobbyPage /></RequireAuth>} />
          <Route path="/room/:code" element={<RequireAuth><RoomPage /></RequireAuth>} />
          <Route path="/" element={<Navigate to="/lobby" replace />} />
          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};
