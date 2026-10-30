import type { MediaAsset, MediaUploadResponse } from '../types/media';

export class MediaApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'MediaApiError';
    this.statusCode = statusCode;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function fetchMediaAssets(params?: {
  search?: string;
  mimeType?: string;
}): Promise<MediaAsset[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.mimeType) query.set('mimeType', params.mimeType);

  const qs = query.toString();
  const url = `/api/v1/admin/media${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new MediaApiError(
      errorBody.message ||
        `Failed to fetch media assets (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.assets || data.items || data;
}

export async function uploadMediaAsset(
  file: File,
  altText?: string,
): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append('file', file);
  if (altText) {
    formData.append('altText', altText);
  }

  const response = await fetch('/api/v1/admin/media/upload', {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new MediaApiError(
      errorBody.message ||
        `Failed to upload media asset (status ${response.status})`,
      response.status,
    );
  }

  const data: MediaUploadResponse = await response.json();
  return data.asset;
}

export async function updateMediaAssetAltText(
  id: string,
  altText: string,
): Promise<MediaAsset> {
  const response = await fetch(
    `/api/v1/admin/media/${encodeURIComponent(id)}/alt-text`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ altText }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new MediaApiError(
      errorBody.message ||
        `Failed to update alt text (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.asset || data;
}

export async function deleteMediaAsset(
  id: string,
  referencesCount = 0,
): Promise<{ success: boolean; id: string }> {
  // Safeguard: Check if asset is referenced by content sections or articles
  if (referencesCount > 0) {
    throw new MediaApiError(
      'Cannot delete media asset because it is currently referenced by published or draft content. Please unlink or replace it first.',
      409,
    );
  }

  const response = await fetch(
    `/api/v1/admin/media/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new MediaApiError(
      errorBody.message ||
        `Failed to delete media asset (status ${response.status})`,
      response.status,
    );
  }

  return { success: true, id };
}
