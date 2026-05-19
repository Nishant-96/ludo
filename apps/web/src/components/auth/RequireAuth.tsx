import { type FC, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';

interface RequireAuthProps {
  children: ReactNode;
}

export const RequireAuth: FC<RequireAuthProps> = ({ children }) => {
  const { user, isLoading } = useUserStore();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-900">
        <div role="status" aria-label="Loading" className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
