export interface ArticleAuthor {
  name: string;
  role?: string;
  avatarUrl?: string;
}

export interface ArticleMedia {
  url: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface PublishedArticleSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  author?: ArticleAuthor;
  coverImage?: ArticleMedia;
  tags?: string[];
}

export interface PublishedArticleDetail extends PublishedArticleSummary {
  content: string;
  canonicalUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface PaginatedArticlesResponse {
  items: PublishedArticleSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
