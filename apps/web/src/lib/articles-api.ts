import type {
  PaginatedArticlesResponse,
  PublishedArticleDetail,
} from '../types/article';

export function getApiBaseUrl(): string {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  );
}

export async function fetchPublishedArticles(options?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedArticlesResponse> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const baseUrl = getApiBaseUrl();
  const url = new URL('/api/v1/public/articles', baseUrl);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 60,
        tags: ['articles', 'insights'],
      },
    });

    if (!response.ok) {
      return {
        items: [],
        total: 0,
        page,
        pageSize: limit,
        totalPages: 0,
      };
    }

    const data = (await response.json()) as Partial<PaginatedArticlesResponse>;
    return {
      items: Array.isArray(data.items) ? data.items : [],
      total: typeof data.total === 'number' ? data.total : 0,
      page: typeof data.page === 'number' ? data.page : page,
      pageSize: typeof data.pageSize === 'number' ? data.pageSize : limit,
      totalPages: typeof data.totalPages === 'number' ? data.totalPages : 0,
    };
  } catch (error) {
    console.error('Error fetching published articles:', error);
    return {
      items: [],
      total: 0,
      page,
      pageSize: limit,
      totalPages: 0,
    };
  }
}

export async function fetchPublishedArticleBySlug(
  slug: string,
): Promise<PublishedArticleDetail | null> {
  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/public/articles/${encodeURIComponent(slug)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 60,
        tags: [`article-${slug}`, 'insights'],
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      article?: PublishedArticleDetail;
    } & Partial<PublishedArticleDetail>;
    const article =
      data.article ??
      (data.slug && data.title ? (data as PublishedArticleDetail) : null);
    return article ?? null;
  } catch (error) {
    console.error(`Error fetching article for slug "${slug}":`, error);
    return null;
  }
}
