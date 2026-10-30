export interface SiteSettings {
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  footerNotice?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
}

export interface AccountSecurity {
  email: string;
  isSuperAdmin: boolean;
  activeSessionsCount: number;
  lastLoginAt?: string | null;
}
