'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function InsightsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Insights error boundary caught error:', error);
  }, [error]);

  return (
    <main
      style={{
        maxWidth: '600px',
        margin: '4rem auto',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}
      role="alert"
    >
      <h1
        style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#991b1b' }}
      >
        Unable to Load Insights
      </h1>
      <p style={{ color: '#555', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        An unexpected error occurred while loading this page. Please try again
        or return home.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Try Again
        </button>
        <Link
          href="/"
          style={{
            padding: '0.6rem 1.2rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            textDecoration: 'none',
            color: '#333',
          }}
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
