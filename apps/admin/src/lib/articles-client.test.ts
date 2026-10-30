import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSlug,
  calculateReadTime,
  fetchAdminArticles,
  fetchAdminArticleById,
  createArticle,
  updateArticle,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  ArticleApiError,
} from './articles-client.ts';

describe('Articles Client Helper Functions', () => {
  test('generateSlug transforms string into clean URL-safe slug', () => {
    assert.equal(
      generateSlug('Building Scalable Web Applications in 2026!'),
      'building-scalable-web-applications-in-2026',
    );
    assert.equal(
      generateSlug('   Multiple   Spaces   & Special @ Characters $#   '),
      'multiple-spaces-special-characters',
    );
    assert.equal(
      generateSlug('under_scores_and-hyphens'),
      'under-scores-and-hyphens',
    );
    assert.equal(generateSlug('---leading-trailing---'), 'leading-trailing');
  });

  test('calculateReadTime calculates reading duration in minutes', () => {
    assert.equal(calculateReadTime(''), 1);
    assert.equal(calculateReadTime('One two three four five'), 1);

    const longText = Array(450).fill('word').join(' ');
    assert.equal(calculateReadTime(longText), 3);
  });
});

describe('Admin Articles API Client', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('fetchAdminArticles fetches list and maps status correctly', async () => {
    let capturedUrl = '';

    globalThis.fetch = async (input: RequestInfo | URL) => {
      capturedUrl = input.toString();
      return new Response(
        JSON.stringify({
          items: [
            {
              id: 'art-1',
              draftSlug: 'first-article',
              publishedSlug: 'first-article',
              draftPayload: {
                title: 'First Article',
                excerpt: 'Excerpt',
                body: 'Body',
              },
              publishedPayload: {
                title: 'First Article',
                excerpt: 'Excerpt',
                body: 'Body',
              },
              publishedAt: '2026-10-30T10:00:00Z',
            },
            {
              id: 'art-2',
              draftSlug: 'second-article-draft',
              publishedSlug: null,
              draftPayload: {
                title: 'Second Draft',
                excerpt: 'Draft Excerpt',
                body: 'Draft Body',
              },
              publishedPayload: null,
              publishedAt: null,
            },
          ],
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const result = await fetchAdminArticles({
      search: 'article',
      status: 'published',
    });

    assert.ok(capturedUrl.includes('search=article'));
    assert.ok(capturedUrl.includes('status=published'));
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].status, 'published');
    assert.equal(result.items[1].status, 'draft');
  });

  test('fetchAdminArticles handles API error responses', async () => {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ message: 'Unauthorized session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await assert.rejects(
      async () => {
        await fetchAdminArticles();
      },
      (err: unknown) => {
        return (
          err instanceof ArticleApiError &&
          err.statusCode === 401 &&
          err.message === 'Unauthorized session'
        );
      },
    );
  });

  test('fetchAdminArticleById fetches article and throws on 404', async () => {
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes('art-found')) {
        return new Response(
          JSON.stringify({
            article: {
              id: 'art-found',
              draftSlug: 'found',
              publishedSlug: 'found',
              draftPayload: { title: 'Found', excerpt: 'E', body: 'B' },
              publishedPayload: { title: 'Found', excerpt: 'E', body: 'B' },
              publishedAt: '2026-10-30T00:00:00Z',
            },
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
      });
    };

    const found = await fetchAdminArticleById('art-found');
    assert.equal(found.id, 'art-found');
    assert.equal(found.status, 'published');

    await assert.rejects(
      async () => {
        await fetchAdminArticleById('unknown');
      },
      (err: unknown) => {
        return err instanceof ArticleApiError && err.statusCode === 404;
      },
    );
  });

  test('createArticle sends POST request with payload and publish flag', async () => {
    const captured: {
      body?: {
        title?: string;
        slug?: string;
        excerpt?: string;
        body?: string;
        publishImmediately?: boolean;
      };
    } = {};

    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const parsed = JSON.parse(init?.body as string) as {
        title?: string;
        slug?: string;
        excerpt?: string;
        body?: string;
        publishImmediately?: boolean;
      };
      captured.body = parsed;
      return new Response(
        JSON.stringify({
          article: {
            id: 'new-id',
            draftSlug: parsed.slug,
            publishedSlug: parsed.publishImmediately ? parsed.slug : null,
            draftPayload: {
              title: parsed.title,
              excerpt: parsed.excerpt,
              body: parsed.body,
            },
            publishedPayload: parsed.publishImmediately
              ? {
                  title: parsed.title,
                  excerpt: parsed.excerpt,
                  body: parsed.body,
                }
              : null,
            publishedAt: parsed.publishImmediately
              ? new Date().toISOString()
              : null,
          },
        }),
        { status: 201 },
      );
    };

    const article = await createArticle(
      {
        title: 'New Article',
        slug: 'new-article',
        excerpt: 'Summary',
        body: 'Full content',
      },
      true,
    );

    assert.equal(captured.body?.title, 'New Article');
    assert.equal(captured.body?.publishImmediately, true);
    assert.equal(article.id, 'new-id');
    assert.equal(article.status, 'published');
  });

  test('updateArticle sends PUT request with updated data', async () => {
    const captured: {
      method?: string;
      body?: {
        title?: string;
        slug?: string;
        excerpt?: string;
        body?: string;
      };
    } = {};

    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      captured.method = init?.method || '';
      const parsed = JSON.parse(init?.body as string) as {
        title?: string;
        slug?: string;
        excerpt?: string;
        body?: string;
      };
      captured.body = parsed;
      return new Response(
        JSON.stringify({
          article: {
            id: 'art-1',
            draftSlug: parsed.slug,
            draftPayload: {
              title: parsed.title,
              excerpt: parsed.excerpt,
              body: parsed.body,
            },
          },
        }),
        { status: 200 },
      );
    };

    const updated = await updateArticle('art-1', {
      title: 'Updated Title',
      slug: 'updated-title',
      excerpt: 'Updated Excerpt',
      body: 'Updated Body',
    });

    assert.equal(captured.method, 'PUT');
    assert.equal(updated.draftPayload.title, 'Updated Title');
  });

  test('publishArticle, unpublishArticle, and deleteArticle work properly', async () => {
    const endpointsCalled: string[] = [];

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      endpointsCalled.push(`${init?.method || 'GET'} ${url}`);
      if (url.includes('/publish')) {
        return new Response(
          JSON.stringify({
            article: {
              id: 'art-1',
              draftSlug: 'art',
              publishedSlug: 'art',
              draftPayload: { title: 'Art', excerpt: 'E', body: 'B' },
              publishedPayload: { title: 'Art', excerpt: 'E', body: 'B' },
              publishedAt: '2026-10-30T00:00:00Z',
            },
          }),
          { status: 200 },
        );
      }
      if (url.includes('/unpublish')) {
        return new Response(
          JSON.stringify({
            article: {
              id: 'art-1',
              draftSlug: 'art',
              publishedSlug: null,
              draftPayload: { title: 'Art', excerpt: 'E', body: 'B' },
              publishedPayload: null,
              publishedAt: null,
            },
          }),
          { status: 200 },
        );
      }
      if (init?.method === 'DELETE') {
        return new Response(JSON.stringify({ success: true, id: 'art-1' }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    };

    const pub = await publishArticle('art-1');
    assert.equal(pub.status, 'published');

    const unpub = await unpublishArticle('art-1');
    assert.equal(unpub.status, 'draft');

    const del = await deleteArticle('art-1');
    assert.equal(del.success, true);
    assert.equal(del.id, 'art-1');

    assert.ok(
      endpointsCalled.some(
        (e) => e.startsWith('POST') && e.includes('/publish'),
      ),
    );
    assert.ok(
      endpointsCalled.some(
        (e) => e.startsWith('POST') && e.includes('/unpublish'),
      ),
    );
    assert.ok(
      endpointsCalled.some(
        (e) =>
          e.startsWith('DELETE') && e.includes('/api/v1/admin/articles/art-1'),
      ),
    );
  });
});
