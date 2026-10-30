import assert from 'node:assert/strict';
import { describe, it, afterEach } from 'node:test';
import {
  fetchPublishedArticles,
  fetchPublishedArticleBySlug,
} from './articles-api.ts';

describe('Articles API Client', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('fetchPublishedArticles', () => {
    it('returns published articles and pagination details on 200', async () => {
      const mockArticles = [
        {
          id: 'art-1',
          slug: 'announcing-codeddevs-platform',
          title: 'Announcing the CodedDevs Platform',
          summary: 'An overview of what we are building at CodedDevs.',
          publishedAt: '2026-10-30T09:00:00Z',
          author: { name: 'Engineering Team', role: 'CodedDevs' },
          tags: ['engineering', 'product'],
        },
      ];

      globalThis.fetch = async (url) => {
        const urlString = String(url);
        assert.ok(urlString.includes('/api/v1/public/articles'));
        return new Response(
          JSON.stringify({
            items: mockArticles,
            total: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const result = await fetchPublishedArticles({ page: 1, limit: 10 });
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0].slug, 'announcing-codeddevs-platform');
      assert.equal(result.total, 1);
    });

    it('returns empty items array gracefully when backend fails (500)', async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
        });

      const result = await fetchPublishedArticles();
      assert.deepEqual(result.items, []);
      assert.equal(result.total, 0);
    });

    it('returns empty items array gracefully on network error', async () => {
      globalThis.fetch = async () => {
        throw new Error('Connection refused');
      };

      const result = await fetchPublishedArticles();
      assert.deepEqual(result.items, []);
      assert.equal(result.total, 0);
    });
  });

  describe('fetchPublishedArticleBySlug', () => {
    it('returns published article detail when found', async () => {
      const mockArticle = {
        id: 'art-2',
        slug: 'building-modern-scalable-web',
        title: 'Building Modern Scalable Web Applications',
        summary: 'Architectural lessons from building our public CMS and site.',
        content: 'Full article body content here...',
        publishedAt: '2026-10-28T12:00:00Z',
        author: { name: 'Aliyu Mohammed', role: 'Frontend Engineer' },
      };

      globalThis.fetch = async (url) => {
        const urlString = String(url);
        assert.ok(
          urlString.includes(
            '/api/v1/public/articles/building-modern-scalable-web',
          ),
        );
        return new Response(JSON.stringify({ article: mockArticle }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const article = await fetchPublishedArticleBySlug(
        'building-modern-scalable-web',
      );
      assert.ok(article);
      assert.equal(article.title, 'Building Modern Scalable Web Applications');
      assert.equal(article.slug, 'building-modern-scalable-web');
    });

    it('returns null when article is not found or unpublished (404)', async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: 'Article not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });

      const article = await fetchPublishedArticleBySlug(
        'unpublished-draft-slug',
      );
      assert.equal(article, null);
    });

    it('returns null for empty or invalid slug without making a network request', async () => {
      let fetchCalled = false;
      globalThis.fetch = async () => {
        fetchCalled = true;
        return new Response('{}');
      };

      const article = await fetchPublishedArticleBySlug('');
      assert.equal(article, null);
      assert.equal(fetchCalled, false);
    });

    it('returns null gracefully on network failure', async () => {
      globalThis.fetch = async () => {
        throw new Error('DNS failure');
      };

      const article = await fetchPublishedArticleBySlug('any-slug');
      assert.equal(article, null);
    });
  });
});
