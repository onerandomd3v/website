import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#f9fafb',
        color: '#111827',
      }}
    >
      <h1
        style={{
          fontSize: '3rem',
          fontWeight: 800,
          color: '#4f46e5',
          margin: 0,
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginTop: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        Page Not Found
      </h2>
      <p
        style={{
          color: '#6b7280',
          maxWidth: '420px',
          margin: '0 auto 2rem auto',
          fontSize: '0.95rem',
        }}
      >
        The admin page or resource you are looking for does not exist or has
        been moved.
      </p>
      <Link
        href="/dashboard"
        style={{
          backgroundColor: '#4f46e5',
          color: '#ffffff',
          padding: '0.6rem 1.25rem',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
        }}
      >
        &larr; Return to Dashboard
      </Link>
    </div>
  );
}
