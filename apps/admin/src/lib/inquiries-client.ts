import type {
  Inquiry,
  InquiryStatus,
  InquiriesFilter,
  PaginatedInquiries,
} from '../types/inquiries';

export class InquiryApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'InquiryApiError';
    this.statusCode = statusCode;
  }
}

export async function fetchInquiries(
  filter?: InquiriesFilter,
): Promise<PaginatedInquiries> {
  const params = new URLSearchParams();
  if (filter?.status && filter.status !== 'all')
    params.set('status', filter.status);
  if (filter?.search) params.set('search', filter.search);
  if (filter?.page) params.set('page', String(filter.page));
  if (filter?.limit) params.set('limit', String(filter.limit));

  const query = params.toString();
  const url = `/api/v1/admin/inquiries${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new InquiryApiError(
      errorBody.message ||
        `Failed to fetch inquiries (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  const items: Inquiry[] = data.items || data.inquiries || data;

  return {
    items,
    total: data.total ?? items.length,
    page: data.page ?? 1,
    limit: data.limit ?? 15,
    totalPages: data.totalPages ?? 1,
  };
}

export async function fetchInquiryById(id: string): Promise<Inquiry> {
  if (!id) {
    throw new InquiryApiError('Inquiry ID is required', 400);
  }

  const response = await fetch(
    `/api/v1/admin/inquiries/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new InquiryApiError(
      errorBody.message ||
        `Failed to fetch inquiry (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.inquiry || data;
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<Inquiry> {
  const response = await fetch(
    `/api/v1/admin/inquiries/${encodeURIComponent(id)}/status`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new InquiryApiError(
      errorBody.message ||
        `Failed to update inquiry status (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.inquiry || data;
}

export async function deleteInquiry(
  id: string,
): Promise<{ success: boolean; id: string }> {
  const response = await fetch(
    `/api/v1/admin/inquiries/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new InquiryApiError(
      errorBody.message ||
        `Failed to delete inquiry (status ${response.status})`,
      response.status,
    );
  }

  return { success: true, id };
}
