import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchPublishedArticles } from '../../src/lib/articles-api';

export const metadata: Metadata = {
  title: 'Insights | CodedDevs Technology LTD',
  description:
    'Read articles, technical deep dives, and company updates from the engineering and product team at CodedDevs.',
  openGraph: {
    title: 'Insights | CodedDevs Technology LTD',
    description:
      'Read articles, technical deep dives, and company updates from the engineering and product team at CodedDevs.',
    type: 'website',
  },
};

export default async function InsightsPage() {
  const { items: articles } = await fetchPublishedArticles({
    page: 1,
    limit: 20,
  });

  return (
    <main
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '3rem 1.5rem',
        fontFamily: 'sans-serif',
      }}
    >
      <header
        style={{
          marginBottom: '2.5rem',
          borderBottom: '1px solid #eee',
          paddingBottom: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>Insights</h1>
        <p style={{ color: '#555', fontSize: '1.1rem', margin: 0 }}>
          Articles, engineering perspectives, and company updates from
          CodedDevs.
        </p>
      </header>

      {articles.length === 0 ? (
        <section
          role="status"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            No Published Insights Yet
          </h2>
          <p style={{ color: '#666', margin: 0 }}>
            Check back soon for new articles, project case studies, and
            engineering updates.
          </p>
        </section>
      ) : (
        <section aria-label="Published articles">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {articles.map((article) => (
              <li
                key={article.id || article.slug}
                style={{
                  marginBottom: '2rem',
                  paddingBottom: '2rem',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <article>
                  <header>
                    <time
                      dateTime={article.publishedAt}
                      style={{
                        fontSize: '0.875rem',
                        color: '#666',
                        display: 'block',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {new Date(article.publishedAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        },
                      )}
                    </time>
                    <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>
                      <Link
                        href={`/insights/${encodeURIComponent(article.slug)}`}
                        style={{ color: '#111', textDecoration: 'none' }}
                      >
                        {article.title}
                      </Link>
                    </h2>
                  </header>

                  <p
                    style={{
                      color: '#444',
                      lineHeight: 1.6,
                      margin: '0 0 1rem 0',
                    }}
                  >
                    {article.summary}
                  </p>

                  <footer
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {article.author?.name && (
                      <span style={{ fontSize: '0.875rem', color: '#555' }}>
                        By {article.author.name}
                        {article.author.role ? ` · ${article.author.role}` : ''}
                      </span>
                    )}
                    <Link
                      href={`/insights/${encodeURIComponent(article.slug)}`}
                      style={{
                        fontSize: '0.9rem',
                        color: '#0066cc',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Read article &rarr;
                    </Link>
                  </footer>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
