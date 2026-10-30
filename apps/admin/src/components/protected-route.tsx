'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth-context';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      fallback ?? (
        <div
          role="status"
          aria-live="polite"
          style={{ padding: '2rem', textAlign: 'center' }}
        >
          <p>Verifying admin session...</p>
        </div>
      )
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
