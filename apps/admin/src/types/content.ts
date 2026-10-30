export type HomepageSectionKey =
  | 'hero'
  | 'about'
  | 'services'
  | 'products'
  | 'projects'
  | 'team'
  | 'featured_insights'
  | 'contact';

export interface CallToAction {
  label: string;
  href: string;
}

export interface HeroPayload {
  eyebrow?: string;
  heading: string;
  body: string;
  primaryCallToAction?: CallToAction;
}

export interface AboutPayload {
  heading: string;
  body: string;
}

export interface SectionWithIntroPayload {
  heading: string;
  introduction?: string;
}

export interface ContactSectionPayload {
  heading: string;
  body: string;
}

export type SectionPayloadMap = {
  hero: HeroPayload;
  about: AboutPayload;
  services: SectionWithIntroPayload;
  products: SectionWithIntroPayload;
  projects: SectionWithIntroPayload;
  team: SectionWithIntroPayload;
  featured_insights: SectionWithIntroPayload;
  contact: ContactSectionPayload;
};

export interface ContentSection<T = Record<string, unknown>> {
  id: string;
  sectionKey: HomepageSectionKey;
  position: number;
  draftPayload: T;
  publishedPayload: T | null;
  draftVisible: boolean;
  publishedVisible: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export interface ContentRecord<T = Record<string, unknown>> {
  id: string;
  position: number;
  draftPayload: T;
  publishedPayload: T | null;
  draftVisible: boolean;
  publishedVisible: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export interface ServiceItemPayload {
  title: string;
  description: string;
  icon?: string;
  features?: string[];
}

export interface ProductItemPayload {
  name: string;
  tagline: string;
  description: string;
  url?: string;
  badge?: string;
}

export interface ProjectItemPayload {
  title: string;
  client?: string;
  summary: string;
  outcome?: string;
  tags?: string[];
}

export interface TeamMemberPayload {
  name: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}

export interface SiteSettingsPayload {
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  footerNotice?: string;
}

export interface SiteSettingsRecord {
  id: boolean;
  draftPayload: SiteSettingsPayload;
  publishedPayload: SiteSettingsPayload | null;
  publishedAt: string | null;
  updatedAt: string;
}
