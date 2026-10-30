import type { AdminUser, LoginCredentials } from '../types/auth.ts';

export class AuthError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export async function login(credentials: LoginCredentials): Promise<AdminUser> {
  const response = await fetch('/api/v1/admin/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    let errorMessage = 'Invalid credentials or login failed';
    try {
      const data = await response.json();
      if (data && typeof data === 'object') {
        errorMessage = data.message || data.error || errorMessage;
      }
    } catch {
      // Keep default error message if response is not JSON
    }
    throw new AuthError(errorMessage, response.status);
  }

  const data = (await response.json()) as {
    user?: AdminUser;
  } & Partial<AdminUser>;
  const user =
    data.user ?? (data.id && data.email ? (data as AdminUser) : null);

  if (!user) {
    throw new AuthError(
      'Server returned an invalid authentication response',
      500,
    );
  }

  return user;
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/v1/admin/auth/logout', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    });
  } catch (error) {
    // Log out locally even if backend network request fails
    console.error('Logout request error:', error);
  }
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  try {
    const response = await fetch('/api/v1/admin/auth/me', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    });

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      user?: AdminUser;
    } & Partial<AdminUser>;
    const user =
      data.user ?? (data.id && data.email ? (data as AdminUser) : null);
    return user ?? null;
  } catch {
    return null;
  }
}
