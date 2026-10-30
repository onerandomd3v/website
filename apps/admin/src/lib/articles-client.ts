import type {
  AdminArticle,
  AdminArticleInput,
  PaginatedAdminArticles,
} from '../types/article';

export class ArticleApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ArticleApiError';
    this.statusCode = statusCode;
  }
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

export function calculateReadTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export async function fetchAdminArticles(options?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedAdminArticles> {
  const params = new URLSearchParams();
  if (options?.search) params.set('search', options.search);
  if (options?.status && options.status !== 'all')
    params.set('status', options.status);
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));

  const queryString = params.toString();
  const url = `/api/v1/admin/articles${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ArticleApiError(
      errorBody.message ||
        `Failed to fetch articles (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();

  const items: AdminArticle[] = (data.items || []).map(
    (item: Partial<AdminArticle>) => {
      const isPublished = Boolean(item.publishedAt && item.publishedPayload);
      return {
        id: item.id || '',
        draftSlug: item.draftSlug || '',
        publishedSlug: item.publishedSlug || null,
        draftPayload: item.draftPayload || {
          title: '',
          excerpt: '',
          body: '',
        },
        publishedPayload: item.publishedPayload || null,
        publishedAt: item.publishedAt || null,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        status: isPublished ? 'published' : 'draft',
      };
    },
  );

  return {
    items,
    total: data.total ?? items.length,
    page: data.page ?? 1,
    limit: data.limit ?? 10,
    totalPages: data.totalPages ?? 1,
  };
}

export async function fetchAdminArticleById(id: string): Promise<AdminArticle> {
  if (!id) {
    throw new ArticleApiError('Article ID is required', 400);
  }

  const response = await fetch(
    `/api/v1/admin/articles/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ArticleApiError(
      errorBody.message ||
        `Failed to fetch article (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  const item: Partial<AdminArticle> = data.article || data;

  const isPublished = Boolean(item.publishedAt && item.publishedPayload);

  return {
    id: item.id || id,
    draftSlug: item.draftSlug || '',
    publishedSlug: item.publishedSlug || null,
    draftPayload: item.draftPayload || {
      title: '',
      excerpt: '',
      body: '',
    },
    publishedPayload: item.publishedPayload || null,
    publishedAt: item.publishedAt || null,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    status: isPublished ? 'published' : 'draft',
  };
}

export async function createArticle(
  input: AdminArticleInput,
  publishImmediately = false,
): Promise<AdminArticle> {
  const response = await fetch('/api/v1/admin/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      ...input,
      publishImmediately,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ArticleApiError(
      errorBody.message ||
        `Failed to create article (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  const item: Partial<AdminArticle> = data.article || data;
  const isPublished = Boolean(item.publishedAt && item.publishedPayload);

  return {
    id: item.id || '',
    draftSlug: item.draftSlug || input.slug,
    publishedSlug: item.publishedSlug || null,
    draftPayload: item.draftPayload || {
      title: input.title,
      excerpt: input.excerpt,
      body: input.body,
      tags: input.tags,
      coverImage: input.coverImage,
      coverImageAlt: input.coverImageAlt,
      readTimeMinutes: input.readTimeMinutes,
    },
    publishedPayload: item.publishedPayload || null,
    publishedAt: item.publishedAt || null,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    status: isPublished ? 'published' : 'draft',
  };
}

export async function updateArticle(
  id: string,
  input: AdminArticleInput,
): Promise<AdminArticle> {
  const response = await fetch(
    `/api/v1/admin/articles/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ArticleApiError(
      errorBody.message ||
        `Failed to update article (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  const item: Partial<AdminArticle> = data.article || data;
  const isPublished = Boolean(item.publishedAt && item.publishedPayload);

  return {
    id: item.id || id,
    draftSlug: item.draftSlug || input.slug,
    publishedSlug: item.publishedSlug || null,
    draftPayload: item.draftPayload || {
      title: input.title,
      excerpt: input.excerpt,
      body: input.body,
    },
    publishedPayload: item.publishedPayload || null,
    publishedAt: item.publishedAt || null,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    status: isPublished ? 'published' : 'draft',
  };
}

export async function publishArticle(id: string): Promise<AdminArticle> {
  const response = await fetch(
    `/api/v1/admin/articles/${encodeURIComponent(id)}/publish`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ArticleApiError(
      errorBody.message ||
        `Failed to publish article (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  const item: Partial<AdminArticle> = data.article || data;

  return {
    id: item.id || id,
    draftSlug: item.draftSlug || '',
    publishedSlug: item.publishedSlug || item.draftSlug || '',
    draftPayload: item.draftPayload || {
      title: '',
      excerpt: '',
      body: '',
    },
    publishedPayload: item.publishedPayload || item.draftPayload || null,
    publishedAt: item.publishedAt || new Date().toISOString(),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    status: 'published',
  };
}

export async function unpublishArticle(id: string): Promise<AdminArticle> {
  const response = await fetch(
    `/api/v1/admin/articles/${encodeURIComponent(id)}/unpublish`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ArticleApiError(
      errorBody.message ||
        `Failed to unpublish article (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  const item: Partial<AdminArticle> = data.article || data;

  return {
    id: item.id || id,
    draftSlug: item.draftSlug || '',
    publishedSlug: null,
    draftPayload: item.draftPayload || {
      title: '',
      excerpt: '',
      body: '',
    },
    publishedPayload: null,
    publishedAt: null,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    status: 'draft',
  };
}

export async function deleteArticle(
  id: string,
): Promise<{ success: boolean; id: string }> {
  const response = await fetch(
    `/api/v1/admin/articles/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ArticleApiError(
      errorBody.message ||
        `Failed to delete article (status ${response.status})`,
      response.status,
    );
  }

  return { success: true, id };
}
