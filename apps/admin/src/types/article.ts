export type ArticleStatus = 'draft' | 'published';

export interface ArticlePayload {
  title: string;
  excerpt: string;
  body: string;
  coverImage?: string;
  coverImageAlt?: string;
  tags?: string[];
  readTimeMinutes?: number;
  metaTitle?: string;
  metaDescription?: string;
}

export interface AdminArticle {
  id: string;
  draftSlug: string;
  publishedSlug: string | null;
  draftPayload: ArticlePayload;
  publishedPayload: ArticlePayload | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: ArticleStatus;
}

export interface AdminArticleInput {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage?: string;
  coverImageAlt?: string;
  tags?: string[];
  readTimeMinutes?: number;
  metaTitle?: string;
  metaDescription?: string;
}

export interface PaginatedAdminArticles {
  items: AdminArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
