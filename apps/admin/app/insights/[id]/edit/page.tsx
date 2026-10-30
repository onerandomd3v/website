'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  fetchAdminArticleById,
  ArticleApiError,
} from '../../../../src/lib/articles-client';
import { ArticleForm } from '../../../../src/components/article-form';
import type { AdminArticle } from '../../../../src/types/article';

export default function EditArticlePage() {
  const params = useParams();
  const id =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : '';

  const [article, setArticle] = useState<AdminArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    fetchAdminArticleById(id)
      .then((data) => {
        if (isMounted) {
          setArticle(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (err instanceof ArticleApiError && err.statusCode === 404) {
            setErrorMessage('The requested article was not found.');
          } else {
            setErrorMessage(
              err.message || 'Failed to load article for editing.',
            );
          }
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div
        style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          color: '#6b7280',
        }}
      >
        <p style={{ margin: 0 }}>Loading article details...</p>
      </div>
    );
  }

  if (errorMessage || !article) {
    return (
      <div
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #fecaca',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            color: '#991b1b',
            marginTop: 0,
            marginBottom: '0.5rem',
          }}
        >
          Unable to Load Article
        </h2>
        <p
          style={{
            color: '#4b5563',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}
        >
          {errorMessage || 'Article not found.'}
        </p>
        <Link
          href="/insights"
          style={{
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          &larr; Back to Articles
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ArticleForm initialArticle={article} mode="edit" />
    </div>
  );
}
