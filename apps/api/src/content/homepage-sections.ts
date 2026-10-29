import { z } from 'zod';

export const HOMEPAGE_SECTION_KEYS = [
  'hero',
  'about',
  'services',
  'products',
  'projects',
  'team',
  'featured_insights',
  'contact',
] as const;

export const homepageSectionKeySchema = z.enum(HOMEPAGE_SECTION_KEYS);

const headingSchema = z.string().trim().min(1).max(160);
const bodySchema = z.string().trim().min(1).max(5_000);
const introductionSchema = z.string().trim().min(1).max(1_000).optional();

const callToActionSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    href: z.string().trim().min(1).max(2_048),
  })
  .strict();

export const homepageSectionPayloadSchemas = {
  hero: z
    .object({
      eyebrow: z.string().trim().min(1).max(80).optional(),
      heading: headingSchema,
      body: bodySchema,
      primaryCallToAction: callToActionSchema.optional(),
    })
    .strict(),
  about: z
    .object({
      heading: headingSchema,
      body: bodySchema,
    })
    .strict(),
  services: z
    .object({
      heading: headingSchema,
      introduction: introductionSchema,
    })
    .strict(),
  products: z
    .object({
      heading: headingSchema,
      introduction: introductionSchema,
    })
    .strict(),
  projects: z
    .object({
      heading: headingSchema,
      introduction: introductionSchema,
    })
    .strict(),
  team: z
    .object({
      heading: headingSchema,
      introduction: introductionSchema,
    })
    .strict(),
  featured_insights: z
    .object({
      heading: headingSchema,
      introduction: introductionSchema,
    })
    .strict(),
  contact: z
    .object({
      heading: headingSchema,
      body: bodySchema,
    })
    .strict(),
} as const;

export const homepageSectionSchema = z.discriminatedUnion('sectionKey', [
  z
    .object({
      sectionKey: z.literal('hero'),
      payload: homepageSectionPayloadSchemas.hero,
    })
    .strict(),
  z
    .object({
      sectionKey: z.literal('about'),
      payload: homepageSectionPayloadSchemas.about,
    })
    .strict(),
  z
    .object({
      sectionKey: z.literal('services'),
      payload: homepageSectionPayloadSchemas.services,
    })
    .strict(),
  z
    .object({
      sectionKey: z.literal('products'),
      payload: homepageSectionPayloadSchemas.products,
    })
    .strict(),
  z
    .object({
      sectionKey: z.literal('projects'),
      payload: homepageSectionPayloadSchemas.projects,
    })
    .strict(),
  z
    .object({
      sectionKey: z.literal('team'),
      payload: homepageSectionPayloadSchemas.team,
    })
    .strict(),
  z
    .object({
      sectionKey: z.literal('featured_insights'),
      payload: homepageSectionPayloadSchemas.featured_insights,
    })
    .strict(),
  z
    .object({
      sectionKey: z.literal('contact'),
      payload: homepageSectionPayloadSchemas.contact,
    })
    .strict(),
]);

export type HomepageSection = z.infer<typeof homepageSectionSchema>;
export type HomepageSectionKey = z.infer<typeof homepageSectionKeySchema>;
