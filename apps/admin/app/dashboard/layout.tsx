'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../src/components/protected-route';
import { useAuth } from '../../src/context/auth-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <ProtectedRoute>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
        }}
      >
        <header
          style={{
            borderBottom: '1px solid #ddd',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fafafa',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
              CodedDevs CMS
            </span>
            <nav
              style={{ display: 'flex', gap: '1rem' }}
              aria-label="Admin Navigation"
            >
              <Link
                href="/dashboard"
                style={{
                  textDecoration: 'none',
                  color: '#111',
                  fontWeight: 500,
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/website-content"
                style={{ textDecoration: 'none', color: '#555' }}
              >
                Website Content
              </Link>
              <Link
                href="/insights"
                style={{ textDecoration: 'none', color: '#555' }}
              >
                Insights
              </Link>
              <Link
                href="/inquiries"
                style={{ textDecoration: 'none', color: '#555' }}
              >
                Inquiries
              </Link>
              <Link
                href="/settings"
                style={{ textDecoration: 'none', color: '#555' }}
              >
                Settings
              </Link>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && (
              <span style={{ fontSize: '0.9rem', color: '#555' }}>
                <strong>{user.email}</strong> (Super Admin)
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '2rem' }}>{children}</div>
      </div>
    </ProtectedRoute>
  );
}
