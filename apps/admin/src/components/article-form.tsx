'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  generateSlug,
  calculateReadTime,
  createArticle,
  updateArticle,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  ArticleApiError,
} from '../lib/articles-client';
import type { AdminArticle, AdminArticleInput } from '../types/article';

interface ArticleFormProps {
  initialArticle?: AdminArticle;
  mode: 'create' | 'edit';
}

export function ArticleForm({ initialArticle, mode }: ArticleFormProps) {
  const router = useRouter();

  // Form field state
  const [title, setTitle] = useState(initialArticle?.draftPayload.title || '');
  const [slug, setSlug] = useState(initialArticle?.draftSlug || '');
  const [excerpt, setExcerpt] = useState(
    initialArticle?.draftPayload.excerpt || '',
  );
  const [body, setBody] = useState(initialArticle?.draftPayload.body || '');
  const [tagsInput, setTagsInput] = useState(
    (initialArticle?.draftPayload.tags || []).join(', '),
  );
  const [readTime, setReadTime] = useState<number>(
    initialArticle?.draftPayload.readTimeMinutes || 3,
  );
  const [coverImage, setCoverImage] = useState(
    initialArticle?.draftPayload.coverImage || '',
  );
  const [coverImageAlt, setCoverImageAlt] = useState(
    initialArticle?.draftPayload.coverImageAlt || '',
  );
  const [metaTitle, setMetaTitle] = useState(
    initialArticle?.draftPayload.metaTitle || '',
  );
  const [metaDescription, setMetaDescription] = useState(
    initialArticle?.draftPayload.metaDescription || '',
  );

  // Status & publication state
  const [currentArticle, setCurrentArticle] = useState<
    AdminArticle | undefined
  >(initialArticle);
  const isPublished = currentArticle?.status === 'published';

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSeoSection, setShowSeoSection] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleTitleBlur() {
    if (!slug.trim() && title.trim()) {
      setSlug(generateSlug(title));
    }
  }

  function handleBodyChange(value: string) {
    setBody(value);
    const calculated = calculateReadTime(value);
    setReadTime(calculated);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title is required.';
    }

    if (!slug.trim()) {
      errors.slug = 'Slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      errors.slug =
        'Slug must only contain lowercase letters, numbers, and hyphens.';
    }

    if (!excerpt.trim()) {
      errors.excerpt = 'Excerpt is required.';
    }

    if (!body.trim()) {
      errors.body = 'Article body content cannot be empty.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function getArticleInput(): AdminArticleInput {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      body: body.trim(),
      tags,
      readTimeMinutes: Number(readTime) || 1,
      coverImage: coverImage.trim() || undefined,
      coverImageAlt: coverImageAlt.trim() || undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
    };
  }

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const input = getArticleInput();
      if (mode === 'create') {
        const created = await createArticle(input, false);
        setSuccessMessage('Draft created successfully!');
        router.push(`/insights/${created.id}/edit`);
      } else if (currentArticle) {
        const updated = await updateArticle(currentArticle.id, input);
        setCurrentArticle(updated);
        setSuccessMessage('Draft changes saved successfully.');
      }
    } catch (err) {
      if (err instanceof ArticleApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save draft. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const input = getArticleInput();
      if (mode === 'create') {
        const created = await createArticle(input, true);
        setSuccessMessage('Article published successfully!');
        router.push(`/insights/${created.id}/edit`);
      } else if (currentArticle) {
        // Save pending edits then publish
        await updateArticle(currentArticle.id, input);
        const published = await publishArticle(currentArticle.id);
        setCurrentArticle(published);
        setSuccessMessage('Article published successfully to the live site!');
      }
    } catch (err) {
      if (err instanceof ArticleApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to publish article. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnpublish() {
    if (!currentArticle) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const unpublished = await unpublishArticle(currentArticle.id);
      setCurrentArticle(unpublished);
      setSuccessMessage(
        'Article unpublished. It is no longer accessible on the public site.',
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to unpublish article.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!currentArticle) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await deleteArticle(currentArticle.id);
      router.push('/insights');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to delete article.',
      );
      setShowDeleteModal(false);
      setIsSubmitting(false);
    }
  }

  const tagsList = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div>
      {/* Top Breadcrumb & Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
          }}
        >
          <Link
            href="/insights"
            style={{
              color: '#4f46e5',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            &larr; Insights
          </Link>
          <span style={{ color: '#9ca3af' }}>/</span>
          <span style={{ color: '#6b7280' }}>
            {mode === 'create' ? 'New Article' : title || 'Edit Article'}
          </span>
          {mode === 'edit' && (
            <span
              style={{
                marginLeft: '0.5rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: isPublished ? '#ecfdf5' : '#fef3c7',
                color: isPublished ? '#065f46' : '#92400e',
              }}
            >
              {isPublished ? 'Live on Website' : 'Draft'}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Live Preview Button */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>👁️</span> Preview
          </button>

          {/* Unpublish Button (if currently published) */}
          {mode === 'edit' && isPublished && (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '6px',
                border: '1px solid #fcd34d',
                backgroundColor: '#fffbeb',
                color: '#b45309',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'wait' : 'pointer',
              }}
            >
              Unpublish
            </button>
          )}

          {/* Delete Button (edit mode only) */}
          {mode === 'edit' && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #fee2e2',
                backgroundColor: '#fff5f5',
                color: '#b91c1c',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          )}

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#111827',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'wait' : 'pointer',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>

          {/* Publish */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'wait' : 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            {isSubmitting
              ? 'Publishing...'
              : isPublished
                ? 'Update Live Article'
                : 'Publish Article'}
          </button>
        </div>
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
          }}
        >
          {successMessage}
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
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Primary Content */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
          }}
        >
          {/* Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="article-title"
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.9rem',
                marginBottom: '0.4rem',
              }}
            >
              Article Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="article-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="e.g. Architecting Scalable Cloud Microservices"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                border: fieldErrors.title
                  ? '1px solid #ef4444'
                  : '1px solid #d1d5db',
                fontSize: '1.1rem',
                fontWeight: 600,
                boxSizing: 'border-box',
              }}
            />
            {fieldErrors.title && (
              <p
                style={{
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  marginTop: '0.3rem',
                }}
              >
                {fieldErrors.title}
              </p>
            )}
          </div>

          {/* Slug */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="article-slug"
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.85rem',
                marginBottom: '0.4rem',
              }}
            >
              URL Slug <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRight: 'none',
                  borderRadius: '6px 0 0 6px',
                  fontSize: '0.85rem',
                  userSelect: 'none',
                }}
              >
                /insights/
              </span>
              <input
                id="article-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="architecting-scalable-cloud-microservices"
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0 6px 6px 0',
                  border: fieldErrors.slug
                    ? '1px solid #ef4444'
                    : '1px solid #d1d5db',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                }}
              />
            </div>
            {fieldErrors.slug && (
              <p
                style={{
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  marginTop: '0.3rem',
                }}
              >
                {fieldErrors.slug}
              </p>
            )}
          </div>

          {/* Excerpt */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="article-excerpt"
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.85rem',
                marginBottom: '0.4rem',
              }}
            >
              Summary / Excerpt <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              id="article-excerpt"
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A brief summary for cards, search results, and OpenGraph descriptions..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: fieldErrors.excerpt
                  ? '1px solid #ef4444'
                  : '1px solid #d1d5db',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
            {fieldErrors.excerpt && (
              <p
                style={{
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  marginTop: '0.3rem',
                }}
              >
                {fieldErrors.excerpt}
              </p>
            )}
          </div>

          {/* Body Content */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.4rem',
              }}
            >
              <label
                htmlFor="article-body"
                style={{ fontWeight: 600, fontSize: '0.85rem' }}
              >
                Article Content (Markdown){' '}
                <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {body.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              id="article-body"
              rows={16}
              value={body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="Write article body in standard Markdown formatting..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: fieldErrors.body
                  ? '1px solid #ef4444'
                  : '1px solid #d1d5db',
                fontSize: '0.9rem',
                fontFamily: 'ui-monospace, monospace',
                boxSizing: 'border-box',
                lineHeight: 1.5,
                resize: 'vertical',
              }}
            />
            {fieldErrors.body && (
              <p
                style={{
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  marginTop: '0.3rem',
                }}
              >
                {fieldErrors.body}
              </p>
            )}
          </div>

          {/* SEO Metadata Accordion */}
          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: '1rem',
              marginTop: '1.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => setShowSeoSection(!showSeoSection)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#4f46e5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>{showSeoSection ? '▼' : '►'}</span> Custom SEO Metadata
              (Optional)
            </button>

            {showSeoSection && (
              <div
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div>
                  <label
                    htmlFor="article-meta-title"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#4b5563',
                      marginBottom: '0.3rem',
                    }}
                  >
                    Meta Title (Defaults to Article Title)
                  </label>
                  <input
                    id="article-meta-title"
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Custom browser tab and SEO title"
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="article-meta-desc"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#4b5563',
                      marginBottom: '0.3rem',
                    }}
                  >
                    Meta Description (Defaults to Excerpt)
                  </label>
                  <textarea
                    id="article-meta-desc"
                    rows={2}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Search engine snippet text"
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Metadata & Settings Sidebar */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {/* Publication Status Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '1.25rem',
            }}
          >
            <h2
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                margin: '0 0 0.75rem 0',
              }}
            >
              Publishing Status
            </h2>
            <div
              style={{
                fontSize: '0.85rem',
                color: '#4b5563',
                marginBottom: '0.75rem',
              }}
            >
              Status:{' '}
              <strong style={{ color: isPublished ? '#059669' : '#d97706' }}>
                {isPublished ? 'Published' : 'Draft'}
              </strong>
            </div>
            {currentArticle?.publishedAt && (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  marginBottom: '0.5rem',
                }}
              >
                Published on:{' '}
                {new Date(currentArticle.publishedAt).toLocaleDateString(
                  'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  },
                )}
              </div>
            )}
            <div
              style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.4 }}
            >
              Saving as Draft keeps changes private to the admin CMS. Publishing
              updates live public pages immediately.
            </div>
          </div>

          {/* Organization & Tags Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '1.25rem',
            }}
          >
            <h2
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                margin: '0 0 0.75rem 0',
              }}
            >
              Organization & Read Time
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="article-tags"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#4b5563',
                  marginBottom: '0.3rem',
                }}
              >
                Tags (comma separated)
              </label>
              <input
                id="article-tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Engineering, Cloud, Design"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="article-read-time"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#4b5563',
                  marginBottom: '0.3rem',
                }}
              >
                Est. Read Time (Minutes)
              </label>
              <input
                id="article-read-time"
                type="number"
                min={1}
                max={120}
                value={readTime}
                onChange={(e) =>
                  setReadTime(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Media & Cover Image Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '1.25rem',
            }}
          >
            <h2
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                margin: '0 0 0.75rem 0',
              }}
            >
              Cover Image
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="article-cover-image"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#4b5563',
                  marginBottom: '0.3rem',
                }}
              >
                Image URL
              </label>
              <input
                id="article-cover-image"
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://... or /assets/..."
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="article-cover-alt"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#4b5563',
                  marginBottom: '0.3rem',
                }}
              >
                Alt Text (Accessibility)
              </label>
              <input
                id="article-cover-alt"
                type="text"
                value={coverImageAlt}
                onChange={(e) => setCoverImageAlt(e.target.value)}
                placeholder="Descriptive alt text for screen readers"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
              }}
            >
              <div>
                <span
                  id="preview-modal-title"
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#111827',
                  }}
                >
                  Article Live Preview
                </span>
                <span
                  style={{
                    marginLeft: '0.75rem',
                    backgroundColor: '#e0e7ff',
                    color: '#4338ca',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                  }}
                >
                  Unpublished Draft Preview
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                aria-label="Close preview"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body: Reader Simulation */}
            <div
              style={{
                padding: '2rem',
                overflowY: 'auto',
                flex: 1,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {coverImage && (
                <div
                  style={{
                    width: '100%',
                    height: '240px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '1.5rem',
                    backgroundColor: '#f3f4f6',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt={coverImageAlt || title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                  marginBottom: '1rem',
                }}
              >
                {tagsList.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: '#eef2ff',
                      color: '#4338ca',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  lineHeight: 1.25,
                  margin: '0 0 1rem 0',
                  color: '#111827',
                }}
              >
                {title || 'Untitled Article'}
              </h1>

              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  gap: '1rem',
                }}
              >
                <span>By CodedDevs Team</span>
                <span>•</span>
                <span>{readTime} min read</span>
                <span>•</span>
                <span>Preview Mode</span>
              </div>

              {excerpt && (
                <p
                  style={{
                    fontSize: '1.1rem',
                    lineHeight: 1.6,
                    color: '#4b5563',
                    fontStyle: 'italic',
                    marginBottom: '1.5rem',
                  }}
                >
                  {excerpt}
                </p>
              )}

              <div
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.75,
                  color: '#1f2937',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {body || 'No content written yet.'}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '0.75rem 1.5rem',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: '#f9fafb',
              }}
            >
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && currentArticle && (
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
            zIndex: 60,
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
              Delete Article
            </h3>
            <p
              style={{
                color: '#4b5563',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
              }}
            >
              Are you sure you want to permanently delete &ldquo;
              {currentArticle.draftPayload.title}&rdquo;?
              {isPublished && (
                <span
                  style={{
                    display: 'block',
                    marginTop: '0.5rem',
                    color: '#b91c1c',
                  }}
                >
                  This article is currently published and will immediately
                  disappear from the public website.
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
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
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
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'wait' : 'pointer',
                }}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
