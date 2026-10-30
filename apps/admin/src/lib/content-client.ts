import type {
  ContentSection,
  ContentRecord,
  SiteSettingsRecord,
  SiteSettingsPayload,
} from '../types/content';

export class ContentApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ContentApiError';
    this.statusCode = statusCode;
  }
}

// ----------------------------------------------------
// Content Sections (Homepage Layout & Metadata)
// ----------------------------------------------------

export async function fetchContentSections(): Promise<ContentSection[]> {
  const response = await fetch('/api/v1/admin/content/sections', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to fetch content sections (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  const sections: ContentSection[] = data.sections || data.items || data;
  return [...sections].sort((a, b) => a.position - b.position);
}

export async function updateSectionDraft<T = Record<string, unknown>>(
  sectionKey: string,
  payload: T,
): Promise<ContentSection<T>> {
  const response = await fetch(
    `/api/v1/admin/content/sections/${encodeURIComponent(sectionKey)}/draft`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ payload }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to update section draft (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.section || data;
}

export async function reorderSections(
  sectionOrders: { sectionKey: string; position: number }[],
): Promise<ContentSection[]> {
  const response = await fetch('/api/v1/admin/content/sections/reorder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ orders: sectionOrders }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to reorder sections (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  const sections: ContentSection[] = data.sections || data.items || data;
  return [...sections].sort((a, b) => a.position - b.position);
}

export async function toggleSectionVisibility(
  sectionKey: string,
  visible: boolean,
): Promise<ContentSection> {
  const response = await fetch(
    `/api/v1/admin/content/sections/${encodeURIComponent(sectionKey)}/visibility`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ visible }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to update visibility (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.section || data;
}

export async function publishSection(
  sectionKey: string,
): Promise<ContentSection> {
  const response = await fetch(
    `/api/v1/admin/content/sections/${encodeURIComponent(sectionKey)}/publish`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to publish section (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.section || data;
}

export async function unpublishSection(
  sectionKey: string,
): Promise<ContentSection> {
  const response = await fetch(
    `/api/v1/admin/content/sections/${encodeURIComponent(sectionKey)}/unpublish`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to unpublish section (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.section || data;
}

export async function publishAllSections(): Promise<{
  success: boolean;
  count: number;
}> {
  const response = await fetch('/api/v1/admin/content/sections/publish-all', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to publish all sections (status ${response.status})`,
      response.status,
    );
  }

  return response.json();
}

// ----------------------------------------------------
// Structured Records (Services, Products, Projects, Team)
// ----------------------------------------------------

export async function fetchRecords<T = Record<string, unknown>>(
  collection: 'services' | 'products' | 'projects' | 'team_members',
): Promise<ContentRecord<T>[]> {
  const response = await fetch(`/api/v1/admin/content/${collection}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to fetch ${collection} (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  const items: ContentRecord<T>[] = data.items || data.records || data;
  return [...items].sort((a, b) => a.position - b.position);
}

export async function createRecord<T = Record<string, unknown>>(
  collection: string,
  payload: T,
  draftVisible = true,
): Promise<ContentRecord<T>> {
  const response = await fetch(`/api/v1/admin/content/${collection}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ payload, draftVisible }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to create ${collection} record (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.record || data.item || data;
}

export async function updateRecordDraft<T = Record<string, unknown>>(
  collection: string,
  id: string,
  payload: T,
): Promise<ContentRecord<T>> {
  const response = await fetch(
    `/api/v1/admin/content/${collection}/${encodeURIComponent(id)}/draft`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ payload }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to update record draft (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.record || data.item || data;
}

export async function reorderRecords(
  collection: string,
  orders: { id: string; position: number }[],
): Promise<ContentRecord[]> {
  const response = await fetch(`/api/v1/admin/content/${collection}/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ orders }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to reorder ${collection} (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  const items: ContentRecord[] = data.items || data.records || data;
  return [...items].sort((a, b) => a.position - b.position);
}

export async function toggleRecordVisibility(
  collection: string,
  id: string,
  visible: boolean,
): Promise<ContentRecord> {
  const response = await fetch(
    `/api/v1/admin/content/${collection}/${encodeURIComponent(id)}/visibility`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ visible }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to update visibility (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.record || data.item || data;
}

export async function publishRecord(
  collection: string,
  id: string,
): Promise<ContentRecord> {
  const response = await fetch(
    `/api/v1/admin/content/${collection}/${encodeURIComponent(id)}/publish`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to publish record (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.record || data.item || data;
}

export async function unpublishRecord(
  collection: string,
  id: string,
): Promise<ContentRecord> {
  const response = await fetch(
    `/api/v1/admin/content/${collection}/${encodeURIComponent(id)}/unpublish`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to unpublish record (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.record || data.item || data;
}

export async function deleteRecord(
  collection: string,
  id: string,
): Promise<{ success: boolean; id: string }> {
  const response = await fetch(
    `/api/v1/admin/content/${collection}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to delete record (status ${response.status})`,
      response.status,
    );
  }

  return { success: true, id };
}

// ----------------------------------------------------
// Site Settings (Footer, Contacts & Global Metadata)
// ----------------------------------------------------

export async function fetchSiteSettings(): Promise<SiteSettingsRecord> {
  const response = await fetch('/api/v1/admin/content/settings', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to fetch site settings (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.settings || data;
}

export async function updateSiteSettingsDraft(
  payload: SiteSettingsPayload,
): Promise<SiteSettingsRecord> {
  const response = await fetch('/api/v1/admin/content/settings/draft', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ payload }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to update site settings (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.settings || data;
}

export async function publishSiteSettings(): Promise<SiteSettingsRecord> {
  const response = await fetch('/api/v1/admin/content/settings/publish', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ContentApiError(
      errorBody.message ||
        `Failed to publish site settings (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.settings || data;
}
