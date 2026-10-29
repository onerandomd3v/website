import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { HOMEPAGE_SECTION_KEYS } from '../content/homepage-sections.js';

const createdAt = timestamp('created_at', { withTimezone: true })
  .notNull()
  .defaultNow();
/** The reviewed migration installs a PostgreSQL update trigger on every table using this column. */
const updatedAt = timestamp('updated_at', { withTimezone: true })
  .notNull()
  .defaultNow();

const homepageSectionKeyList = sql.raw(
  HOMEPAGE_SECTION_KEYS.map((key) => `'${key}'`).join(', '),
);

type PublicationStateColumns = {
  publishedAt: AnyPgColumn;
  publishedPayload: AnyPgColumn;
  publishedVisible: AnyPgColumn;
};

function publicationStateCheck(name: string, table: PublicationStateColumns) {
  return check(
    name,
    sql`(
      ${table.publishedPayload} is null
      and ${table.publishedAt} is null
      and ${table.publishedVisible} = false
    ) or (
      ${table.publishedPayload} is not null
      and ${table.publishedAt} is not null
    )`,
  );
}

export const inquiryStatus = pgEnum('inquiry_status', [
  'new',
  'in_progress',
  'resolved',
  'closed',
]);

export const auditEventType = pgEnum('audit_event_type', [
  'auth.login',
  'auth.logout',
  'auth.recovery',
  'content.save_draft',
  'content.publish',
  'content.unpublish',
  'content.delete',
  'media.upload',
  'media.delete',
  'inquiry.update',
  'settings.update',
]);

export const revalidationStatus = pgEnum('revalidation_status', [
  'pending',
  'processing',
  'succeeded',
  'failed',
]);

export const mediaReferenceSnapshot = pgEnum('media_reference_snapshot', [
  'draft',
  'published',
]);

/** Exactly one row can use this value; provisioning supplies the required row. */
export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 320 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    isSuperAdmin: boolean('is_super_admin').notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('admin_users_email_unique').on(table.email),
    uniqueIndex('admin_users_one_super_admin_unique').on(table.isSuperAdmin),
    check('admin_users_only_super_admin', sql`${table.isSuperAdmin} = true`),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'restrict' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt,
  },
  (table) => [
    uniqueIndex('sessions_token_hash_unique').on(table.tokenHash),
    index('sessions_active_expiry_index').on(table.expiresAt),
    check(
      'sessions_expiry_after_creation',
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
  ],
);

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    objectKey: text('object_key').notNull(),
    mimeType: varchar('mime_type', { length: 255 }).notNull(),
    byteSize: integer('byte_size').notNull(),
    width: integer('width'),
    height: integer('height'),
    altText: text('alt_text'),
    createdByAdminUserId: uuid('created_by_admin_user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'restrict' }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('media_assets_object_key_unique').on(table.objectKey),
    check('media_assets_positive_byte_size', sql`${table.byteSize} > 0`),
    check(
      'media_assets_valid_dimensions',
      sql`(${table.width} is null or ${table.width} > 0) and (${table.height} is null or ${table.height} > 0)`,
    ),
  ],
);

/** Known homepage sections only; their JSON is validated by the API's Zod schemas. */
export const contentSections = pgTable(
  'content_sections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sectionKey: varchar('section_key', { length: 64 }).notNull(),
    position: integer('position').notNull(),
    draftPayload: jsonb('draft_payload').notNull().default({}),
    publishedPayload: jsonb('published_payload'),
    draftVisible: boolean('draft_visible').notNull().default(true),
    publishedVisible: boolean('published_visible').notNull().default(false),
    createdAt,
    updatedAt,
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('content_sections_section_key_unique').on(table.sectionKey),
    uniqueIndex('content_sections_position_unique').on(table.position),
    check('content_sections_nonnegative_position', sql`${table.position} >= 0`),
    check(
      'content_sections_known_section_key',
      sql`${table.sectionKey} in (${homepageSectionKeyList})`,
    ),
    publicationStateCheck(
      'content_sections_publication_state_consistent',
      table,
    ),
  ],
);

const contentRecordColumns = () => ({
  id: uuid('id').defaultRandom().primaryKey(),
  position: integer('position').notNull(),
  draftPayload: jsonb('draft_payload').notNull().default({}),
  publishedPayload: jsonb('published_payload'),
  draftVisible: boolean('draft_visible').notNull().default(true),
  publishedVisible: boolean('published_visible').notNull().default(false),
  createdAt,
  updatedAt,
  publishedAt: timestamp('published_at', { withTimezone: true }),
});

export const services = pgTable('services', contentRecordColumns(), (table) => [
  uniqueIndex('services_position_unique').on(table.position),
  check('services_nonnegative_position', sql`${table.position} >= 0`),
  publicationStateCheck('services_publication_state_consistent', table),
]);

export const products = pgTable('products', contentRecordColumns(), (table) => [
  uniqueIndex('products_position_unique').on(table.position),
  check('products_nonnegative_position', sql`${table.position} >= 0`),
  publicationStateCheck('products_publication_state_consistent', table),
]);

export const projects = pgTable('projects', contentRecordColumns(), (table) => [
  uniqueIndex('projects_position_unique').on(table.position),
  check('projects_nonnegative_position', sql`${table.position} >= 0`),
  publicationStateCheck('projects_publication_state_consistent', table),
]);

export const teamMembers = pgTable(
  'team_members',
  contentRecordColumns(),
  (table) => [
    uniqueIndex('team_members_position_unique').on(table.position),
    check('team_members_nonnegative_position', sql`${table.position} >= 0`),
    publicationStateCheck('team_members_publication_state_consistent', table),
  ],
);

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    draftSlug: varchar('draft_slug', { length: 160 }).notNull(),
    publishedSlug: varchar('published_slug', { length: 160 }),
    draftPayload: jsonb('draft_payload').notNull().default({}),
    publishedPayload: jsonb('published_payload'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('articles_draft_slug_unique').on(table.draftSlug),
    uniqueIndex('articles_published_slug_unique')
      .on(table.publishedSlug)
      .where(sql`${table.publishedSlug} is not null`),
    index('articles_published_at_index').on(table.publishedAt),
    check(
      'articles_publication_state_consistent',
      sql`(
        ${table.publishedPayload} is null
        and ${table.publishedSlug} is null
        and ${table.publishedAt} is null
      ) or (
        ${table.publishedPayload} is not null
        and ${table.publishedSlug} is not null
        and length(btrim(${table.publishedSlug})) > 0
        and ${table.publishedAt} is not null
      )`,
    ),
  ],
);

export const siteSettings = pgTable(
  'site_settings',
  {
    id: boolean('id').primaryKey().default(true),
    draftPayload: jsonb('draft_payload').notNull().default({}),
    publishedPayload: jsonb('published_payload'),
    createdAt,
    updatedAt,
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    check('site_settings_singleton', sql`${table.id} = true`),
    check(
      'site_settings_publication_state_consistent',
      sql`(
        ${table.publishedPayload} is null
        and ${table.publishedAt} is null
      ) or (
        ${table.publishedPayload} is not null
        and ${table.publishedAt} is not null
      )`,
    ),
  ],
);

/**
 * Media usage is deliberately normalized instead of being embedded in JSON.
 * Every row points to exactly one content owner and one draft/published slot.
 * The media FK is restrictive, so an asset cannot be deleted while any owner
 * still references it.
 */
export const mediaAssetReferences = pgTable(
  'media_asset_references',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'restrict' }),
    snapshot: mediaReferenceSnapshot('snapshot').notNull(),
    fieldKey: varchar('field_key', { length: 64 }).notNull(),
    position: integer('position').notNull().default(0),
    contentSectionId: uuid('content_section_id').references(
      () => contentSections.id,
      { onDelete: 'cascade' },
    ),
    serviceId: uuid('service_id').references(() => services.id, {
      onDelete: 'cascade',
    }),
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'cascade',
    }),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'cascade',
    }),
    teamMemberId: uuid('team_member_id').references(() => teamMembers.id, {
      onDelete: 'cascade',
    }),
    articleId: uuid('article_id').references(() => articles.id, {
      onDelete: 'cascade',
    }),
    siteSettingsId: boolean('site_settings_id').references(
      () => siteSettings.id,
      { onDelete: 'cascade' },
    ),
    createdAt,
  },
  (table) => [
    index('media_asset_references_media_asset_id_index').on(table.mediaAssetId),
    check(
      'media_asset_references_exactly_one_owner',
      sql`num_nonnulls(
        ${table.contentSectionId},
        ${table.serviceId},
        ${table.productId},
        ${table.projectId},
        ${table.teamMemberId},
        ${table.articleId},
        ${table.siteSettingsId}
      ) = 1`,
    ),
    check(
      'media_asset_references_nonempty_field_key',
      sql`length(btrim(${table.fieldKey})) > 0`,
    ),
    check(
      'media_asset_references_nonnegative_position',
      sql`${table.position} >= 0`,
    ),
    uniqueIndex('media_asset_references_content_section_slot_unique')
      .on(
        table.contentSectionId,
        table.snapshot,
        table.fieldKey,
        table.position,
      )
      .where(sql`${table.contentSectionId} is not null`),
    uniqueIndex('media_asset_references_service_slot_unique')
      .on(table.serviceId, table.snapshot, table.fieldKey, table.position)
      .where(sql`${table.serviceId} is not null`),
    uniqueIndex('media_asset_references_product_slot_unique')
      .on(table.productId, table.snapshot, table.fieldKey, table.position)
      .where(sql`${table.productId} is not null`),
    uniqueIndex('media_asset_references_project_slot_unique')
      .on(table.projectId, table.snapshot, table.fieldKey, table.position)
      .where(sql`${table.projectId} is not null`),
    uniqueIndex('media_asset_references_team_member_slot_unique')
      .on(table.teamMemberId, table.snapshot, table.fieldKey, table.position)
      .where(sql`${table.teamMemberId} is not null`),
    uniqueIndex('media_asset_references_article_slot_unique')
      .on(table.articleId, table.snapshot, table.fieldKey, table.position)
      .where(sql`${table.articleId} is not null`),
    uniqueIndex('media_asset_references_site_settings_slot_unique')
      .on(table.siteSettingsId, table.snapshot, table.fieldKey, table.position)
      .where(sql`${table.siteSettingsId} is not null`),
  ],
);

export const inquiries = pgTable(
  'inquiries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    email: varchar('email', { length: 320 }).notNull(),
    company: varchar('company', { length: 200 }),
    message: text('message').notNull(),
    status: inquiryStatus('status').notNull().default('new'),
    statusUpdatedByAdminUserId: uuid(
      'status_updated_by_admin_user_id',
    ).references(() => adminUsers.id, { onDelete: 'restrict' }),
    statusUpdatedAt: timestamp('status_updated_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index('inquiries_status_created_at_index').on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorAdminUserId: uuid('actor_admin_user_id').references(
      () => adminUsers.id,
      {
        onDelete: 'restrict',
      },
    ),
    eventType: auditEventType('event_type').notNull(),
    targetType: varchar('target_type', { length: 64 }).notNull(),
    targetId: uuid('target_id'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt,
  },
  (table) => [index('audit_events_created_at_index').on(table.createdAt)],
);

/** Durable records for revalidation failures after a successful publication commit. */
export const revalidationJobs = pgTable(
  'revalidation_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resourceType: varchar('resource_type', { length: 64 }).notNull(),
    resourceId: uuid('resource_id'),
    status: revalidationStatus('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index('revalidation_jobs_pending_index').on(
      table.status,
      table.nextAttemptAt,
    ),
    check(
      'revalidation_jobs_nonnegative_attempts',
      sql`${table.attempts} >= 0`,
    ),
  ],
);
