'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ProtectedRoute } from './protected-route';
import { useAuth } from '../context/auth-context';

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Website Content', href: '/website-content' },
    { label: 'Insights', href: '/insights' },
    { label: 'Inquiries', href: '/inquiries' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <ProtectedRoute>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f9fafb',
          color: '#111827',
        }}
      >
        <header
          style={{
            borderBottom: '1px solid #e5e7eb',
            padding: '0.75rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <Link
              href="/dashboard"
              style={{
                textDecoration: 'none',
                color: '#111827',
                fontWeight: 700,
                fontSize: '1.2rem',
                letterSpacing: '-0.02em',
              }}
            >
              CodedDevs <span style={{ color: '#4f46e5' }}>CMS</span>
            </Link>

            <nav
              style={{ display: 'flex', gap: '1.25rem' }}
              aria-label="Admin Navigation"
            >
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' &&
                    pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#4f46e5' : '#4b5563',
                      borderBottom: isActive
                        ? '2px solid #4f46e5'
                        : '2px solid transparent',
                      paddingBottom: '0.25rem',
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}
          >
            {user && (
              <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                <span style={{ fontWeight: 600, color: '#111827' }}>
                  {user.email}
                </span>{' '}
                <span
                  style={{
                    backgroundColor: '#eef2ff',
                    color: '#4f46e5',
                    fontSize: '0.75rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    marginLeft: '0.25rem',
                  }}
                >
                  Super Admin
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                color: '#374151',
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: '2rem',
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
