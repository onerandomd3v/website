import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFileSize,
  fetchMediaAssets,
  uploadMediaAsset,
  updateMediaAssetAltText,
  deleteMediaAsset,
  MediaApiError,
} from './media-client.ts';
import type { MediaAsset } from '../types/media.ts';

describe('Media API Client', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('formatFileSize', () => {
    test('formats 0 bytes', () => {
      assert.equal(formatFileSize(0), '0 B');
    });

    test('formats bytes', () => {
      assert.equal(formatFileSize(512), '512 B');
    });

    test('formats kilobytes', () => {
      assert.equal(formatFileSize(1024), '1 KB');
      assert.equal(formatFileSize(2048), '2 KB');
    });

    test('formats megabytes', () => {
      assert.equal(formatFileSize(1048576), '1 MB');
      assert.equal(formatFileSize(2.5 * 1024 * 1024), '2.5 MB');
    });
  });

  describe('fetchMediaAssets', () => {
    test('fetches media assets without params', async () => {
      const mockAssets: MediaAsset[] = [
        {
          id: 'asset-1',
          objectKey: 'uploads/hero.webp',
          url: 'https://cdn.codeddevs.com/uploads/hero.webp',
          mimeType: 'image/webp',
          byteSize: 102400,
          width: 1920,
          height: 1080,
          altText: 'Hero banner',
          referencesCount: 2,
          createdAt: '2026-10-30T10:00:00Z',
          updatedAt: '2026-10-30T10:00:00Z',
        },
      ];

      globalThis.fetch = async (input: RequestInfo | URL) => {
        assert.ok(input.toString().includes('/api/v1/admin/media'));
        return new Response(JSON.stringify({ assets: mockAssets }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const result = await fetchMediaAssets();
      assert.equal(result.length, 1);
      assert.equal(result[0].objectKey, 'uploads/hero.webp');
      assert.equal(result[0].referencesCount, 2);
    });

    test('appends search and mimeType query params', async () => {
      let capturedUrl = '';

      globalThis.fetch = async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(JSON.stringify({ assets: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await fetchMediaAssets({ search: 'banner', mimeType: 'image/' });
      assert.ok(capturedUrl.includes('search=banner'));
      assert.ok(
        capturedUrl.includes('mimeType=image%2F') ||
          capturedUrl.includes('mimeType=image/'),
      );
    });

    test('throws MediaApiError on failure', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ message: 'Internal storage error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      };

      await assert.rejects(
        async () => {
          await fetchMediaAssets();
        },
        (err: unknown) => {
          assert.ok(err instanceof MediaApiError);
          assert.equal(err.statusCode, 500);
          assert.equal(err.message, 'Internal storage error');
          return true;
        },
      );
    });
  });

  describe('uploadMediaAsset', () => {
    test('uploads file via multipart form data', async () => {
      const captured: { url?: string; method?: string; body?: unknown } = {};

      globalThis.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        captured.url = input.toString();
        captured.method = init?.method;
        captured.body = init?.body;
        return new Response(
          JSON.stringify({
            asset: {
              id: 'asset-new',
              objectKey: 'uploads/logo.png',
              url: 'https://cdn.codeddevs.com/uploads/logo.png',
              mimeType: 'image/png',
              byteSize: 2048,
              altText: 'Company Logo',
              referencesCount: 0,
              createdAt: '2026-10-30T10:00:00Z',
              updatedAt: '2026-10-30T10:00:00Z',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const file = new File(['fake-image-bytes'], 'logo.png', {
        type: 'image/png',
      });
      const asset = await uploadMediaAsset(file, 'Company Logo');

      assert.equal(captured.method, 'POST');
      assert.ok(captured.url?.includes('/api/v1/admin/media/upload'));
      assert.ok(captured.body instanceof FormData);
      assert.equal(asset.id, 'asset-new');
      assert.equal(asset.altText, 'Company Logo');
    });

    test('throws MediaApiError on upload failure', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ message: 'File format not supported' }),
          { status: 415, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const file = new File(['bad-content'], 'test.exe', {
        type: 'application/x-msdownload',
      });
      await assert.rejects(
        async () => {
          await uploadMediaAsset(file);
        },
        (err: unknown) => {
          assert.ok(err instanceof MediaApiError);
          assert.equal(err.statusCode, 415);
          assert.equal(err.message, 'File format not supported');
          return true;
        },
      );
    });
  });

  describe('updateMediaAssetAltText', () => {
    test('updates alt text via PUT request', async () => {
      const captured: {
        url?: string;
        method?: string;
        body?: { altText?: string };
      } = {};

      globalThis.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        captured.url = input.toString();
        captured.method = init?.method;
        captured.body = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            asset: {
              id: 'asset-1',
              objectKey: 'uploads/pic.jpg',
              url: 'https://cdn.codeddevs.com/uploads/pic.jpg',
              mimeType: 'image/jpeg',
              byteSize: 4096,
              altText: captured.body?.altText,
              referencesCount: 0,
              createdAt: '2026-10-30T10:00:00Z',
              updatedAt: '2026-10-30T10:00:00Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const updated = await updateMediaAssetAltText(
        'asset-1',
        'Updated description',
      );
      assert.equal(captured.method, 'PUT');
      assert.ok(captured.url?.includes('/api/v1/admin/media/asset-1/alt-text'));
      assert.equal(captured.body?.altText, 'Updated description');
      assert.equal(updated.altText, 'Updated description');
    });
  });

  describe('deleteMediaAsset and Referenced Safeguards', () => {
    test('blocks deletion when referencesCount > 0 without network call', async () => {
      let fetchCalled = false;
      globalThis.fetch = async () => {
        fetchCalled = true;
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      };

      await assert.rejects(
        async () => {
          await deleteMediaAsset('asset-referenced', 3);
        },
        (err: unknown) => {
          assert.ok(err instanceof MediaApiError);
          assert.equal(err.statusCode, 409);
          assert.ok(err.message.includes('currently referenced'));
          return true;
        },
      );

      assert.equal(
        fetchCalled,
        false,
        'Fetch must not be called when asset is referenced',
      );
    });

    test('deletes unreferenced asset when referencesCount === 0', async () => {
      const captured: { url?: string; method?: string } = {};

      globalThis.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        captured.url = input.toString();
        captured.method = init?.method;
        return new Response(
          JSON.stringify({ success: true, id: 'asset-unreferenced' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const result = await deleteMediaAsset('asset-unreferenced', 0);
      assert.equal(captured.method, 'DELETE');
      assert.ok(
        captured.url?.includes('/api/v1/admin/media/asset-unreferenced'),
      );
      assert.equal(result.success, true);
      assert.equal(result.id, 'asset-unreferenced');
    });

    test('handles delete API failure gracefully', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ message: 'Database delete failed' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      };

      await assert.rejects(
        async () => {
          await deleteMediaAsset('asset-fail', 0);
        },
        (err: unknown) => {
          assert.ok(err instanceof MediaApiError);
          assert.equal(err.statusCode, 500);
          return true;
        },
      );
    });
  });
});
