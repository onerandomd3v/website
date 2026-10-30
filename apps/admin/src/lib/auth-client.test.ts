import assert from 'node:assert/strict';
import { describe, it, afterEach } from 'node:test';
import { login, logout, getCurrentUser, AuthError } from './auth-client.ts';

describe('Auth Client', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('login', () => {
    it('returns the user object when credentials are valid', async () => {
      const mockUser = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'superadmin@codeddevs.com',
        isSuperAdmin: true,
      };

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ user: mockUser }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      const user = await login({
        email: 'superadmin@codeddevs.com',
        password: 'password123',
      });
      assert.deepEqual(user, mockUser);
    });

    it('throws AuthError when backend returns 401 unauthorized', async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: 'Invalid email or password' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });

      await assert.rejects(
        () => login({ email: 'superadmin@codeddevs.com', password: 'wrong' }),
        (err) => {
          assert.ok(err instanceof AuthError);
          assert.equal(err.statusCode, 401);
          assert.equal(err.message, 'Invalid email or password');
          return true;
        },
      );
    });

    it('throws AuthError on unexpected server error status', async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });

      await assert.rejects(
        () => login({ email: 'superadmin@codeddevs.com', password: 'pass' }),
        (err) => {
          assert.ok(err instanceof AuthError);
          assert.equal(err.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe('getCurrentUser', () => {
    it('returns user when active session cookie is valid', async () => {
      const mockUser = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'superadmin@codeddevs.com',
        isSuperAdmin: true,
      };

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ user: mockUser }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      const user = await getCurrentUser();
      assert.deepEqual(user, mockUser);
    });

    it('returns null when session is unauthenticated or expired (401)', async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });

      const user = await getCurrentUser();
      assert.equal(user, null);
    });

    it('returns null when fetch throws network error', async () => {
      globalThis.fetch = async () => {
        throw new Error('Network error');
      };

      const user = await getCurrentUser();
      assert.equal(user, null);
    });
  });

  describe('logout', () => {
    it('sends POST request to logout endpoint and does not throw', async () => {
      let called = false;
      globalThis.fetch = async (url, options) => {
        assert.equal(url, '/api/v1/admin/auth/logout');
        assert.equal(options?.method, 'POST');
        called = true;
        return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
      };

      await logout();
      assert.equal(called, true);
    });
  });
});
