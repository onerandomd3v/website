import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchAdminSettings,
  updateAdminSettings,
  publishAdminSettings,
  fetchAccountSecurity,
  changePassword,
  SettingsApiError,
} from './settings-client.ts';
import type { SiteSettings } from '../types/settings.ts';

describe('Settings API Client', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('fetchAdminSettings', () => {
    test('fetches settings successfully', async () => {
      const mockSettings: SiteSettings = {
        companyName: 'CodedDevs',
        contactEmail: 'contact@codeddevs.com',
        contactPhone: '+234 800 123 4567',
        address: 'Lagos, Nigeria',
        twitterUrl: 'https://x.com/codeddevs',
        linkedinUrl: 'https://linkedin.com/company/codeddevs',
        githubUrl: 'https://github.com/onerandomd3v',
        footerNotice: '© 2026 CodedDevs Technology LTD',
        metaTitle: 'CodedDevs | Leading Software Consultancy',
        metaDescription: 'Building resilient modern software.',
        ogImageUrl: 'https://codeddevs.com/og.png',
      };

      globalThis.fetch = async (input: RequestInfo | URL) => {
        assert.ok(input.toString().includes('/api/v1/admin/settings'));
        return new Response(JSON.stringify({ settings: mockSettings }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const result = await fetchAdminSettings();
      assert.equal(result.companyName, 'CodedDevs');
      assert.equal(result.contactEmail, 'contact@codeddevs.com');
      assert.equal(
        result.metaTitle,
        'CodedDevs | Leading Software Consultancy',
      );
    });

    test('throws SettingsApiError on HTTP error', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ message: 'Settings not initialized' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
      };

      await assert.rejects(
        async () => {
          await fetchAdminSettings();
        },
        (err: unknown) => {
          assert.ok(err instanceof SettingsApiError);
          assert.equal(err.statusCode, 404);
          assert.equal(err.message, 'Settings not initialized');
          return true;
        },
      );
    });
  });

  describe('updateAdminSettings', () => {
    test('updates settings draft via PUT request', async () => {
      const captured: {
        url?: string;
        method?: string;
        body?: { settings?: Partial<SiteSettings> };
      } = {};

      globalThis.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        captured.url = input.toString();
        captured.method = init?.method;
        captured.body = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({ settings: captured.body?.settings }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const partialUpdate: Partial<SiteSettings> = {
        metaTitle: 'New Title',
        metaDescription: 'New Description',
      };

      const result = await updateAdminSettings(partialUpdate);
      assert.equal(captured.method, 'PUT');
      assert.ok(captured.url?.includes('/api/v1/admin/settings/draft'));
      assert.equal(captured.body?.settings?.metaTitle, 'New Title');
      assert.equal(result.metaTitle, 'New Title');
    });

    test('throws SettingsApiError on failure', async () => {
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ message: 'Validation failed' }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await assert.rejects(
        async () => {
          await updateAdminSettings({ companyName: '' });
        },
        (err: unknown) => {
          assert.ok(err instanceof SettingsApiError);
          assert.equal(err.statusCode, 422);
          assert.equal(err.message, 'Validation failed');
          return true;
        },
      );
    });
  });

  describe('publishAdminSettings', () => {
    test('publishes settings live via POST request', async () => {
      const captured: { url?: string; method?: string } = {};

      globalThis.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        captured.url = input.toString();
        captured.method = init?.method;
        return new Response(
          JSON.stringify({
            settings: {
              companyName: 'CodedDevs',
              contactEmail: 'contact@codeddevs.com',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const published = await publishAdminSettings();
      assert.equal(captured.method, 'POST');
      assert.ok(captured.url?.includes('/api/v1/admin/settings/publish'));
      assert.equal(published.companyName, 'CodedDevs');
    });
  });

  describe('fetchAccountSecurity', () => {
    test('fetches Super Admin security info', async () => {
      globalThis.fetch = async (input: RequestInfo | URL) => {
        assert.ok(input.toString().includes('/api/v1/admin/account'));
        return new Response(
          JSON.stringify({
            account: {
              email: 'admin@codeddevs.com',
              isSuperAdmin: true,
              activeSessionsCount: 2,
              lastLoginAt: '2026-10-30T09:00:00Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const account = await fetchAccountSecurity();
      assert.equal(account.email, 'admin@codeddevs.com');
      assert.equal(account.isSuperAdmin, true);
      assert.equal(account.activeSessionsCount, 2);
    });
  });

  describe('changePassword', () => {
    test('sends password update request with current and new password', async () => {
      const captured: {
        url?: string;
        method?: string;
        body?: { currentPassword?: string; newPassword?: string };
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
            success: true,
            message: 'Password updated successfully',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const res = await changePassword(
        'OldPassword123!',
        'NewSecurePassword456!',
      );
      assert.equal(captured.method, 'POST');
      assert.ok(captured.url?.includes('/api/v1/admin/account/password'));
      assert.equal(captured.body?.currentPassword, 'OldPassword123!');
      assert.equal(captured.body?.newPassword, 'NewSecurePassword456!');
      assert.equal(res.success, true);
    });

    test('throws SettingsApiError when current password is invalid', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ message: 'Current password does not match' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      };

      await assert.rejects(
        async () => {
          await changePassword('WrongPass', 'NewPass123!');
        },
        (err: unknown) => {
          assert.ok(err instanceof SettingsApiError);
          assert.equal(err.statusCode, 400);
          assert.equal(err.message, 'Current password does not match');
          return true;
        },
      );
    });
  });
});
