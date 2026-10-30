'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  fetchAdminArticles,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  ArticleApiError,
} from '../../src/lib/articles-client';
import type { AdminArticle } from '../../src/types/article';

export default function InsightsListPage() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'published' | 'draft'
  >('all');

  // Deletion modal state
  const [articleToDelete, setArticleToDelete] = useState<AdminArticle | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Action in-flight state (e.g. quick publishing)
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(
    null,
  );

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchAdminArticles({
        search: searchQuery.trim() || undefined,
        status: statusFilter,
      });
      setArticles(response.items);
    } catch (err) {
      if (err instanceof ArticleApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          'Failed to load articles. Please check your connection.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadArticles();
  }

  async function handleTogglePublish(article: AdminArticle) {
    setActionInProgressId(article.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (article.status === 'published') {
        const updated = await unpublishArticle(article.id);
        setArticles((prev) =>
          prev.map((a) => (a.id === article.id ? updated : a)),
        );
        setSuccessMessage(
          `Article "${article.draftPayload.title}" has been unpublished.`,
        );
      } else {
        const updated = await publishArticle(article.id);
        setArticles((prev) =>
          prev.map((a) => (a.id === article.id ? updated : a)),
        );
        setSuccessMessage(
          `Article "${article.draftPayload.title}" published successfully!`,
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to update publication status.',
      );
    } finally {
      setActionInProgressId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!articleToDelete) return;
    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteArticle(articleToDelete.id);
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
      setSuccessMessage(
        `Article "${articleToDelete.draftPayload.title}" deleted.`,
      );
      setArticleToDelete(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to delete article.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  // Filter client-side if search query entered without submitting form
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const query = searchQuery.toLowerCase();
    return articles.filter((a) => {
      const title = a.draftPayload.title.toLowerCase();
      const slug = a.draftSlug.toLowerCase();
      const excerpt = a.draftPayload.excerpt.toLowerCase();
      return (
        title.includes(query) || slug.includes(query) || excerpt.includes(query)
      );
    });
  }, [articles, searchQuery]);

  const counts = useMemo(() => {
    const total = articles.length;
    const published = articles.filter((a) => a.status === 'published').length;
    const draft = total - published;
    return { total, published, draft };
  }, [articles]);

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              margin: '0 0 0.5rem 0',
            }}
          >
            Insights & Articles
          </h1>
          <p style={{ color: '#4b5563', margin: 0, fontSize: '0.95rem' }}>
            Manage company publications, draft technical articles, and control
            live visibility.
          </p>
        </div>

        <Link
          href="/insights/new"
          style={{
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <span>+</span> New Article
        </Link>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#065f46',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['all', 'published', 'draft'] as const).map((tab) => {
            const isSelected = statusFilter === tab;
            const count =
              tab === 'all'
                ? counts.total
                : tab === 'published'
                  ? counts.published
                  : counts.draft;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected
                    ? '1px solid #4f46e5'
                    : '1px solid #e5e7eb',
                  backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                  color: isSelected ? '#4f46e5' : '#4b5563',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab}{' '}
                <span style={{ opacity: 0.7, fontWeight: 500 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form
          onSubmit={handleSearch}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, slug..."
            aria-label="Search articles"
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.85rem',
              width: '220px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f3f4f6',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            color: '#6b7280',
          }}
        >
          <p style={{ margin: 0 }}>Loading articles...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px dashed #d1d5db',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 0.5rem 0',
            }}
          >
            {searchQuery ? 'No articles match your search' : 'No articles yet'}
          </h2>
          <p
            style={{
              color: '#6b7280',
              maxWidth: '400px',
              margin: '0 auto 1.5rem auto',
              fontSize: '0.9rem',
            }}
          >
            {searchQuery
              ? 'Try modifying your search keywords or clear filters to see all articles.'
              : 'Create your first draft or article to publish insights to the public CodedDevs website.'}
          </p>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadArticles();
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Clear Search
            </button>
          ) : (
            <Link
              href="/insights/new"
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '0.55rem 1.1rem',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'inline-block',
              }}
            >
              Write First Article
            </Link>
          )}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  color: '#4b5563',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '0.75rem 1.25rem' }}>Title & Slug</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Tags</th>
                <th style={{ padding: '0.75rem 1rem' }}>Last Updated</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((article) => {
                const isPublished = article.status === 'published';
                const formattedDate = article.updatedAt
                  ? new Date(article.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—';
                const isOperating = actionInProgressId === article.id;

                return (
                  <tr
                    key={article.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    {/* Title & Slug */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <Link
                        href={`/insights/${article.id}/edit`}
                        style={{
                          textDecoration: 'none',
                          color: '#111827',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          display: 'block',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {article.draftPayload.title || 'Untitled Article'}
                      </Link>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          fontFamily: 'monospace',
                        }}
                      >
                        /insights/{article.draftSlug}
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: isPublished ? '#ecfdf5' : '#fef3c7',
                          color: isPublished ? '#065f46' : '#92400e',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isPublished
                              ? '#10b981'
                              : '#f59e0b',
                          }}
                        />
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>

                    {/* Tags */}
                    <td style={{ padding: '1rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.3rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        {article.draftPayload.tags &&
                        article.draftPayload.tags.length > 0 ? (
                          article.draftPayload.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                backgroundColor: '#f3f4f6',
                                color: '#4b5563',
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                              }}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span
                            style={{ color: '#9ca3af', fontSize: '0.8rem' }}
                          >
                            —
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td
                      style={{
                        padding: '1rem',
                        color: '#6b7280',
                        fontSize: '0.85rem',
                      }}
                    >
                      {formattedDate}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {/* Edit Button */}
                        <Link
                          href={`/insights/${article.id}/edit`}
                          style={{
                            padding: '0.35rem 0.7rem',
                            borderRadius: '5px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                          }}
                        >
                          Edit
                        </Link>

                        {/* Quick Toggle Publish */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(article)}
                          disabled={isOperating}
                          style={{
                            padding: '0.35rem 0.7rem',
                            borderRadius: '5px',
                            border: isPublished
                              ? '1px solid #fcd34d'
                              : '1px solid #a7f3d0',
                            backgroundColor: isPublished
                              ? '#fffbeb'
                              : '#ecfdf5',
                            color: isPublished ? '#b45309' : '#047857',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: isOperating ? 'wait' : 'pointer',
                            opacity: isOperating ? 0.6 : 1,
                          }}
                        >
                          {isOperating
                            ? '...'
                            : isPublished
                              ? 'Unpublish'
                              : 'Publish'}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setArticleToDelete(article)}
                          aria-label={`Delete ${article.draftPayload.title}`}
                          style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '5px',
                            border: '1px solid #fee2e2',
                            backgroundColor: '#fff5f5',
                            color: '#b91c1c',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {articleToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '460px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3
              id="delete-dialog-title"
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#991b1b',
                marginTop: 0,
                marginBottom: '0.75rem',
              }}
            >
              Confirm Article Deletion
            </h3>
            <p
              style={{
                color: '#4b5563',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
              }}
            >
              Are you sure you want to delete{' '}
              <strong>
                &ldquo;{articleToDelete.draftPayload.title || 'Untitled'}&rdquo;
              </strong>
              ?
              {articleToDelete.status === 'published' && (
                <span
                  style={{
                    display: 'block',
                    marginTop: '0.5rem',
                    color: '#b91c1c',
                  }}
                >
                  Warning: This article is currently published and will
                  immediately become unavailable on the live public website.
                </span>
              )}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                disabled={isDeleting}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isDeleting ? 'wait' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
