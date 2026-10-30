import Link from 'next/link';

export default function ArticleNotFound() {
  return (
    <main
      style={{
        maxWidth: '600px',
        margin: '4rem auto',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Article Not Found
      </h1>
      <p style={{ color: '#555', lineHeight: 1.6, marginBottom: '2rem' }}>
        The article you are looking for does not exist, has been removed, or has
        not been published yet.
      </p>
      <Link
        href="/insights"
        style={{
          display: 'inline-block',
          backgroundColor: '#0066cc',
          color: '#fff',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        &larr; Return to Insights
      </Link>
    </main>
  );
}
