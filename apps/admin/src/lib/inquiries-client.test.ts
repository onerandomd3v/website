import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchInquiries,
  fetchInquiryById,
  updateInquiryStatus,
  deleteInquiry,
  InquiryApiError,
} from './inquiries-client.ts';

describe('Inquiries API Client', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('fetchInquiries', () => {
    test('fetches inquiries without filter', async () => {
      const mockItems = [
        {
          id: 'inq-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          message: 'Interested in enterprise cloud migration.',
          status: 'new' as const,
          createdAt: '2026-10-30T10:00:00Z',
        },
      ];

      globalThis.fetch = async (input: RequestInfo | URL) => {
        assert.ok(input.toString().includes('/api/v1/admin/inquiries'));
        return new Response(
          JSON.stringify({
            items: mockItems,
            total: 1,
            page: 1,
            limit: 15,
            totalPages: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const result = await fetchInquiries();
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0].email, 'jane@example.com');
      assert.equal(result.total, 1);
    });

    test('builds query parameters for status, search, and pagination', async () => {
      let capturedUrl = '';

      globalThis.fetch = async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(JSON.stringify({ items: [], total: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await fetchInquiries({
        status: 'in_progress',
        search: 'Fintech',
        page: 2,
        limit: 10,
      });

      assert.ok(capturedUrl.includes('status=in_progress'));
      assert.ok(capturedUrl.includes('search=Fintech'));
      assert.ok(capturedUrl.includes('page=2'));
      assert.ok(capturedUrl.includes('limit=10'));
    });

    test('throws InquiryApiError on HTTP error', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ message: 'Unauthorized access' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        );
      };

      await assert.rejects(
        async () => {
          await fetchInquiries();
        },
        (err: unknown) => {
          assert.ok(err instanceof InquiryApiError);
          assert.equal(err.statusCode, 401);
          assert.equal(err.message, 'Unauthorized access');
          return true;
        },
      );
    });
  });

  describe('fetchInquiryById', () => {
    test('fetches single inquiry by ID', async () => {
      const mockInquiry = {
        id: 'inq-123',
        name: 'Alex Smith',
        email: 'alex@example.com',
        company: 'Apex Tech',
        message: 'Looking for architecture review.',
        status: 'new' as const,
        createdAt: '2026-10-30T10:00:00Z',
      };

      globalThis.fetch = async (input: RequestInfo | URL) => {
        assert.ok(input.toString().includes('/api/v1/admin/inquiries/inq-123'));
        return new Response(JSON.stringify({ inquiry: mockInquiry }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const result = await fetchInquiryById('inq-123');
      assert.equal(result.id, 'inq-123');
      assert.equal(result.name, 'Alex Smith');
      assert.equal(result.company, 'Apex Tech');
    });

    test('throws error if ID is empty', async () => {
      await assert.rejects(
        async () => {
          await fetchInquiryById('');
        },
        (err: unknown) => {
          assert.ok(err instanceof InquiryApiError);
          assert.equal(err.statusCode, 400);
          return true;
        },
      );
    });
  });

  describe('updateInquiryStatus', () => {
    test('sends status update request', async () => {
      const captured: {
        url?: string;
        method?: string;
        body?: { status?: string };
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
            inquiry: {
              id: 'inq-99',
              name: 'Taylor',
              email: 'taylor@example.com',
              message: 'Demo inquiry',
              status: captured.body?.status,
              createdAt: '2026-10-30T10:00:00Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const updated = await updateInquiryStatus('inq-99', 'resolved');
      assert.equal(captured.method, 'PUT');
      assert.ok(
        captured.url?.includes('/api/v1/admin/inquiries/inq-99/status'),
      );
      assert.equal(captured.body?.status, 'resolved');
      assert.equal(updated.status, 'resolved');
    });

    test('throws InquiryApiError if status update fails', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ message: 'Invalid status transition' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      };

      await assert.rejects(
        async () => {
          await updateInquiryStatus('inq-99', 'closed');
        },
        (err: unknown) => {
          assert.ok(err instanceof InquiryApiError);
          assert.equal(err.statusCode, 400);
          assert.equal(err.message, 'Invalid status transition');
          return true;
        },
      );
    });
  });

  describe('deleteInquiry', () => {
    test('sends DELETE request for specified inquiry ID', async () => {
      const captured: { url?: string; method?: string } = {};

      globalThis.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        captured.url = input.toString();
        captured.method = init?.method;
        return new Response(JSON.stringify({ success: true, id: 'inq-50' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const result = await deleteInquiry('inq-50');
      assert.equal(captured.method, 'DELETE');
      assert.ok(captured.url?.includes('/api/v1/admin/inquiries/inq-50'));
      assert.equal(result.success, true);
      assert.equal(result.id, 'inq-50');
    });

    test('throws InquiryApiError on delete failure', async () => {
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ message: 'Inquiry not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await assert.rejects(
        async () => {
          await deleteInquiry('inq-unknown');
        },
        (err: unknown) => {
          assert.ok(err instanceof InquiryApiError);
          assert.equal(err.statusCode, 404);
          return true;
        },
      );
    });
  });
});
