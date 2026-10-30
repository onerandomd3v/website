import type { SiteSettings, AccountSecurity } from '../types/settings';

export class SettingsApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'SettingsApiError';
    this.statusCode = statusCode;
  }
}

export async function fetchAdminSettings(): Promise<SiteSettings> {
  const response = await fetch('/api/v1/admin/settings', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new SettingsApiError(
      errorBody.message ||
        `Failed to fetch settings (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.settings || data;
}

export async function updateAdminSettings(
  settings: Partial<SiteSettings>,
): Promise<SiteSettings> {
  const response = await fetch('/api/v1/admin/settings/draft', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ settings }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new SettingsApiError(
      errorBody.message ||
        `Failed to update settings draft (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.settings || data;
}

export async function publishAdminSettings(): Promise<SiteSettings> {
  const response = await fetch('/api/v1/admin/settings/publish', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new SettingsApiError(
      errorBody.message ||
        `Failed to publish settings (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.settings || data;
}

export async function fetchAccountSecurity(): Promise<AccountSecurity> {
  const response = await fetch('/api/v1/admin/account', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new SettingsApiError(
      errorBody.message ||
        `Failed to fetch account info (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.account || data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/v1/admin/account/password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new SettingsApiError(
      errorBody.message ||
        `Failed to change password (status ${response.status})`,
      response.status,
    );
  }

  return response.json();
}
