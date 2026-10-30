'use client';

import Link from 'next/link';
import { useAuth } from '../../src/context/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Welcome, {user?.email ?? 'Super Admin'}</h1>
        <p style={{ color: '#555' }}>
          Overview and shortcuts to manage public website content and inquiries.
        </p>
      </header>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          CMS Quick Actions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          <div
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: '6px',
              padding: '1.25rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
              Website Content
            </h3>
            <p
              style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '1rem',
              }}
            >
              Manage Home sections, services, products, and team members.
            </p>
            <Link
              href="/website-content"
              style={{ color: '#0066cc', fontWeight: 500 }}
            >
              Edit Content &rarr;
            </Link>
          </div>

          <div
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: '6px',
              padding: '1.25rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
              Insights & Articles
            </h3>
            <p
              style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '1rem',
              }}
            >
              Create drafts, edit published articles, and manage updates.
            </p>
            <Link
              href="/insights"
              style={{ color: '#0066cc', fontWeight: 500 }}
            >
              Manage Articles &rarr;
            </Link>
          </div>

          <div
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: '6px',
              padding: '1.25rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
              Contact Inquiries
            </h3>
            <p
              style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '1rem',
              }}
            >
              Review visitor inquiries and manage follow-up status.
            </p>
            <Link
              href="/inquiries"
              style={{ color: '#0066cc', fontWeight: 500 }}
            >
              View Inquiries &rarr;
            </Link>
          </div>

          <div
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: '6px',
              padding: '1.25rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
              Settings & SEO
            </h3>
            <p
              style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '1rem',
              }}
            >
              Configure site-wide metadata, contact links, and media assets.
            </p>
            <Link
              href="/settings"
              style={{ color: '#0066cc', fontWeight: 500 }}
            >
              Manage Settings &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: '6px',
          padding: '1.5rem',
        }}
      >
        <h2
          style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '0.75rem' }}
        >
          Recent Inquiries
        </h2>
        <p style={{ color: '#666', fontSize: '0.95rem', margin: 0 }}>
          No new contact inquiries. New submissions from the public website
          contact form will appear here.
        </p>
      </section>
    </main>
  );
}
