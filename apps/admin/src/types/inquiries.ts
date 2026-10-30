export type InquiryStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  message: string;
  status: InquiryStatus;
  statusUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InquiriesFilter {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedInquiries {
  items: Inquiry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
