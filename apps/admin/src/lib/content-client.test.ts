import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchContentSections,
  updateSectionDraft,
  reorderSections,
  toggleSectionVisibility,
  publishSection,
  unpublishSection,
  publishAllSections,
  fetchRecords,
  createRecord,
  updateRecordDraft,
  deleteRecord,
  fetchSiteSettings,
  updateSiteSettingsDraft,
  ContentApiError,
} from './content-client.ts';

describe('Content API Client', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Homepage Sections', () => {
    test('fetchContentSections returns sorted sections', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            sections: [
              {
                sectionKey: 'about',
                position: 1,
                draftPayload: { heading: 'About' },
              },
              {
                sectionKey: 'hero',
                position: 0,
                draftPayload: { heading: 'Hero' },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const sections = await fetchContentSections();
      assert.equal(sections.length, 2);
      assert.equal(sections[0].sectionKey, 'hero');
      assert.equal(sections[1].sectionKey, 'about');
    });

    test('updateSectionDraft sends payload to section endpoint', async () => {
      const captured: {
        url?: string;
        method?: string;
        body?: { payload?: { heading?: string } };
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
            section: {
              sectionKey: 'hero',
              draftPayload: captured.body?.payload,
            },
          }),
          { status: 200 },
        );
      };

      const updated = await updateSectionDraft('hero', {
        heading: 'New Hero Heading',
      });
      assert.equal(captured.method, 'PUT');
      assert.ok(
        captured.url?.includes('/api/v1/admin/content/sections/hero/draft'),
      );
      assert.equal(captured.body?.payload?.heading, 'New Hero Heading');
      assert.equal(updated.draftPayload.heading, 'New Hero Heading');
    });

    test('reorderSections updates position and sorts result', async () => {
      const captured: { orders?: { sectionKey: string; position: number }[] } =
        {};

      globalThis.fetch = async (
        _input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        const parsed = JSON.parse(init?.body as string) as {
          orders: { sectionKey: string; position: number }[];
        };
        captured.orders = parsed.orders;
        return new Response(
          JSON.stringify({
            sections: [
              { sectionKey: 'about', position: 0 },
              { sectionKey: 'hero', position: 1 },
            ],
          }),
          { status: 200 },
        );
      };

      const reordered = await reorderSections([
        { sectionKey: 'about', position: 0 },
        { sectionKey: 'hero', position: 1 },
      ]);

      assert.equal(captured.orders?.length, 2);
      assert.equal(reordered[0].sectionKey, 'about');
      assert.equal(reordered[1].sectionKey, 'hero');
    });

    test('toggleSectionVisibility updates draft visibility', async () => {
      const captured: { body?: { visible?: boolean } } = {};

      globalThis.fetch = async (
        _input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        captured.body = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            section: {
              sectionKey: 'contact',
              draftVisible: captured.body?.visible,
            },
          }),
          { status: 200 },
        );
      };

      const res = await toggleSectionVisibility('contact', false);
      assert.equal(captured.body?.visible, false);
      assert.equal(res.draftVisible, false);
    });

    test('publishSection, unpublishSection and publishAllSections work as expected', async () => {
      const called: string[] = [];

      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = input.toString();
        called.push(url);
        if (url.includes('/publish-all')) {
          return new Response(JSON.stringify({ success: true, count: 8 }), {
            status: 200,
          });
        }
        if (url.includes('/publish')) {
          return new Response(
            JSON.stringify({
              section: {
                sectionKey: 'hero',
                publishedPayload: { heading: 'Live Hero' },
                publishedAt: '2026-10-30T12:00:00Z',
              },
            }),
            { status: 200 },
          );
        }
        if (url.includes('/unpublish')) {
          return new Response(
            JSON.stringify({
              section: {
                sectionKey: 'hero',
                publishedPayload: null,
                publishedAt: null,
              },
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      };

      const published = await publishSection('hero');
      assert.equal(published.publishedPayload?.heading, 'Live Hero');
      assert.ok(published.publishedAt);

      const unpublished = await unpublishSection('hero');
      assert.equal(unpublished.publishedPayload, null);

      const all = await publishAllSections();
      assert.equal(all.success, true);
      assert.equal(all.count, 8);
    });
  });

  describe('Structured Collections (Services, Products, Team)', () => {
    test('fetchRecords returns sorted records for collection', async () => {
      globalThis.fetch = async (input: RequestInfo | URL) => {
        assert.ok(input.toString().includes('/api/v1/admin/content/services'));
        return new Response(
          JSON.stringify({
            items: [
              { id: 'srv-2', position: 1, draftPayload: { title: 'Second' } },
              { id: 'srv-1', position: 0, draftPayload: { title: 'First' } },
            ],
          }),
          { status: 200 },
        );
      };

      const items = await fetchRecords('services');
      assert.equal(items.length, 2);
      assert.equal(items[0].id, 'srv-1');
      assert.equal(items[1].id, 'srv-2');
    });

    test('createRecord, updateRecordDraft, and deleteRecord work properly', async () => {
      const methods: string[] = [];

      globalThis.fetch = async (
        _input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        methods.push(init?.method || 'GET');
        if (init?.method === 'POST') {
          return new Response(
            JSON.stringify({
              record: { id: 'new-id', draftPayload: { title: 'Created' } },
            }),
            { status: 201 },
          );
        }
        if (init?.method === 'PUT') {
          return new Response(
            JSON.stringify({
              record: { id: 'new-id', draftPayload: { title: 'Updated' } },
            }),
            { status: 200 },
          );
        }
        if (init?.method === 'DELETE') {
          return new Response(JSON.stringify({ success: true, id: 'new-id' }), {
            status: 200,
          });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      };

      const created = await createRecord('services', { title: 'Created' });
      assert.equal(created.id, 'new-id');

      const updated = await updateRecordDraft('services', 'new-id', {
        title: 'Updated',
      });
      assert.equal(updated.draftPayload.title, 'Updated');

      const deleted = await deleteRecord('services', 'new-id');
      assert.equal(deleted.success, true);

      assert.deepEqual(methods, ['POST', 'PUT', 'DELETE']);
    });
  });

  describe('Site Settings', () => {
    test('fetchSiteSettings and updateSiteSettingsDraft work properly', async () => {
      const captured: { body?: { payload?: { companyName?: string } } } = {};

      globalThis.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        if (init?.method === 'PUT') {
          captured.body = JSON.parse(init?.body as string);
          return new Response(
            JSON.stringify({
              settings: {
                id: true,
                draftPayload: captured.body?.payload,
                publishedPayload: null,
              },
            }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({
            settings: {
              id: true,
              draftPayload: { companyName: 'CodedDevs Technology LTD' },
              publishedPayload: null,
            },
          }),
          { status: 200 },
        );
      };

      const settings = await fetchSiteSettings();
      assert.equal(
        settings.draftPayload.companyName,
        'CodedDevs Technology LTD',
      );

      const updated = await updateSiteSettingsDraft({
        companyName: 'Updated CodedDevs LTD',
        contactEmail: 'hello@codeddevs.com',
      });

      assert.equal(
        captured.body?.payload?.companyName,
        'Updated CodedDevs LTD',
      );
      assert.equal(updated.draftPayload.companyName, 'Updated CodedDevs LTD');
    });

    test('handles API errors with ContentApiError and status code', async () => {
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ message: 'Forbidden access' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await assert.rejects(
        async () => {
          await fetchSiteSettings();
        },
        (err: unknown) => {
          return (
            err instanceof ContentApiError &&
            err.statusCode === 403 &&
            err.message === 'Forbidden access'
          );
        },
      );
    });
  });
});
