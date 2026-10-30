import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPublishedArticleBySlug } from '../../../src/lib/articles-api';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchPublishedArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found | CodedDevs',
      description:
        'The requested article could not be found or has not been published.',
    };
  }

  const title = article.seoTitle || `${article.title} | CodedDevs Insights`;
  const description = article.seoDescription || article.summary;
  const canonicalUrl = article.canonicalUrl || `/insights/${article.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: article.author?.name ? [article.author.name] : undefined,
      images: article.coverImage?.url
        ? [{ url: article.coverImage.url, alt: article.coverImage.altText }]
        : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await fetchPublishedArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const formattedDate = new Date(article.publishedAt).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );

  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '3rem 1.5rem',
        fontFamily: 'sans-serif',
      }}
    >
      <nav style={{ marginBottom: '2rem' }} aria-label="Breadcrumb">
        <Link
          href="/insights"
          style={{
            color: '#0066cc',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          &larr; Back to all Insights
        </Link>
      </nav>

      <article>
        <header
          style={{
            marginBottom: '2rem',
            borderBottom: '1px solid #eee',
            paddingBottom: '1.5rem',
          }}
        >
          <time
            dateTime={article.publishedAt}
            style={{
              fontSize: '0.9rem',
              color: '#666',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            Published on {formattedDate}
          </time>

          <h1
            style={{
              fontSize: '2.5rem',
              lineHeight: 1.25,
              margin: '0 0 1rem 0',
            }}
          >
            {article.title}
          </h1>

          {article.author && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '1rem',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, display: 'block' }}>
                  {article.author.name}
                </span>
                {article.author.role && (
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>
                    {article.author.role}
                  </span>
                )}
              </div>
            </div>
          )}
        </header>

        {article.coverImage?.url && (
          <div style={{ marginBottom: '2rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImage.url}
              alt={article.coverImage.altText || article.title}
              style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
            />
          </div>
        )}

        <section
          style={{
            lineHeight: 1.8,
            fontSize: '1.1rem',
            color: '#222',
            whiteSpace: 'pre-line',
          }}
        >
          {article.content || article.summary}
        </section>

        {article.tags && article.tags.length > 0 && (
          <footer
            style={{
              marginTop: '3rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #eee',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: '#f3f4f6',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    color: '#4b5563',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </footer>
        )}
      </article>
    </main>
  );
}
