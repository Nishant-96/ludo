import { type FC } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export const LoginPage: FC = () => {
  const { user, isLoading } = useUserStore();

  if (!isLoading && user) {
    return <Navigate to="/lobby" replace />;
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-slate-900 px-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-bold tracking-tight text-white">Ludo</h1>
        <p className="text-slate-400">Real-time multiplayer</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-slate-800 p-8 shadow-xl">
        <GoogleSignInButton />
      </div>
    </div>
  );
};
