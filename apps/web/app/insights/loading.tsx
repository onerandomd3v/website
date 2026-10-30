export default function InsightsLoading() {
  return (
    <main
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '3rem 1.5rem',
        fontFamily: 'sans-serif',
      }}
      role="status"
      aria-busy="true"
    >
      <header
        style={{
          marginBottom: '2.5rem',
          borderBottom: '1px solid #eee',
          paddingBottom: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>Insights</h1>
        <p style={{ color: '#777' }}>Loading published articles...</p>
      </header>
    </main>
  );
}
