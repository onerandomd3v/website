CREATE TYPE "public"."audit_event_type" AS ENUM('auth.login', 'auth.logout', 'auth.recovery', 'content.save_draft', 'content.publish', 'content.unpublish', 'content.delete', 'media.upload', 'media.delete', 'inquiry.update', 'settings.update');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."media_reference_snapshot" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."revalidation_status" AS ENUM('pending', 'processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"is_super_admin" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_only_super_admin" CHECK ("admin_users"."is_super_admin" = true)
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_slug" varchar(160) NOT NULL,
	"published_slug" varchar(160),
	"draft_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_payload" jsonb,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_publication_state_consistent" CHECK ((
        "articles"."published_payload" is null
        and "articles"."published_slug" is null
        and "articles"."published_at" is null
      ) or (
        "articles"."published_payload" is not null
        and "articles"."published_slug" is not null
        and length(btrim("articles"."published_slug")) > 0
        and "articles"."published_at" is not null
      ))
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_admin_user_id" uuid,
	"event_type" "audit_event_type" NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_key" varchar(64) NOT NULL,
	"position" integer NOT NULL,
	"draft_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_payload" jsonb,
	"draft_visible" boolean DEFAULT true NOT NULL,
	"published_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "content_sections_nonnegative_position" CHECK ("content_sections"."position" >= 0),
	CONSTRAINT "content_sections_known_section_key" CHECK ("content_sections"."section_key" in ('hero', 'about', 'services', 'products', 'projects', 'team', 'featured_insights', 'contact')),
	CONSTRAINT "content_sections_publication_state_consistent" CHECK ((
      "content_sections"."published_payload" is null
      and "content_sections"."published_at" is null
      and "content_sections"."published_visible" = false
    ) or (
      "content_sections"."published_payload" is not null
      and "content_sections"."published_at" is not null
    ))
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(320) NOT NULL,
	"company" varchar(200),
	"message" text NOT NULL,
	"status" "inquiry_status" DEFAULT 'new' NOT NULL,
	"status_updated_by_admin_user_id" uuid,
	"status_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_asset_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"snapshot" "media_reference_snapshot" NOT NULL,
	"field_key" varchar(64) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"content_section_id" uuid,
	"service_id" uuid,
	"product_id" uuid,
	"project_id" uuid,
	"team_member_id" uuid,
	"article_id" uuid,
	"site_settings_id" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_asset_references_exactly_one_owner" CHECK (num_nonnulls(
        "media_asset_references"."content_section_id",
        "media_asset_references"."service_id",
        "media_asset_references"."product_id",
        "media_asset_references"."project_id",
        "media_asset_references"."team_member_id",
        "media_asset_references"."article_id",
        "media_asset_references"."site_settings_id"
      ) = 1),
	CONSTRAINT "media_asset_references_nonempty_field_key" CHECK (length(btrim("media_asset_references"."field_key")) > 0),
	CONSTRAINT "media_asset_references_nonnegative_position" CHECK ("media_asset_references"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_key" text NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"alt_text" text,
	"created_by_admin_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_positive_byte_size" CHECK ("media_assets"."byte_size" > 0),
	CONSTRAINT "media_assets_valid_dimensions" CHECK (("media_assets"."width" is null or "media_assets"."width" > 0) and ("media_assets"."height" is null or "media_assets"."height" > 0))
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position" integer NOT NULL,
	"draft_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_payload" jsonb,
	"draft_visible" boolean DEFAULT true NOT NULL,
	"published_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "products_nonnegative_position" CHECK ("products"."position" >= 0),
	CONSTRAINT "products_publication_state_consistent" CHECK ((
      "products"."published_payload" is null
      and "products"."published_at" is null
      and "products"."published_visible" = false
    ) or (
      "products"."published_payload" is not null
      and "products"."published_at" is not null
    ))
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position" integer NOT NULL,
	"draft_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_payload" jsonb,
	"draft_visible" boolean DEFAULT true NOT NULL,
	"published_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "projects_nonnegative_position" CHECK ("projects"."position" >= 0),
	CONSTRAINT "projects_publication_state_consistent" CHECK ((
      "projects"."published_payload" is null
      and "projects"."published_at" is null
      and "projects"."published_visible" = false
    ) or (
      "projects"."published_payload" is not null
      and "projects"."published_at" is not null
    ))
);
--> statement-breakpoint
CREATE TABLE "revalidation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" varchar(64) NOT NULL,
	"resource_id" uuid,
	"status" "revalidation_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "revalidation_jobs_nonnegative_attempts" CHECK ("revalidation_jobs"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position" integer NOT NULL,
	"draft_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_payload" jsonb,
	"draft_visible" boolean DEFAULT true NOT NULL,
	"published_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "services_nonnegative_position" CHECK ("services"."position" >= 0),
	CONSTRAINT "services_publication_state_consistent" CHECK ((
      "services"."published_payload" is null
      and "services"."published_at" is null
      and "services"."published_visible" = false
    ) or (
      "services"."published_payload" is not null
      and "services"."published_at" is not null
    ))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_expiry_after_creation" CHECK ("sessions"."expires_at" > "sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"draft_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "site_settings_singleton" CHECK ("site_settings"."id" = true),
	CONSTRAINT "site_settings_publication_state_consistent" CHECK ((
        "site_settings"."published_payload" is null
        and "site_settings"."published_at" is null
      ) or (
        "site_settings"."published_payload" is not null
        and "site_settings"."published_at" is not null
      ))
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position" integer NOT NULL,
	"draft_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_payload" jsonb,
	"draft_visible" boolean DEFAULT true NOT NULL,
	"published_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "team_members_nonnegative_position" CHECK ("team_members"."position" >= 0),
	CONSTRAINT "team_members_publication_state_consistent" CHECK ((
      "team_members"."published_payload" is null
      and "team_members"."published_at" is null
      and "team_members"."published_visible" = false
    ) or (
      "team_members"."published_payload" is not null
      and "team_members"."published_at" is not null
    ))
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_admin_user_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_status_updated_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("status_updated_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset_references" ADD CONSTRAINT "media_asset_references_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset_references" ADD CONSTRAINT "media_asset_references_content_section_id_content_sections_id_fk" FOREIGN KEY ("content_section_id") REFERENCES "public"."content_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset_references" ADD CONSTRAINT "media_asset_references_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset_references" ADD CONSTRAINT "media_asset_references_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset_references" ADD CONSTRAINT "media_asset_references_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset_references" ADD CONSTRAINT "media_asset_references_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset_references" ADD CONSTRAINT "media_asset_references_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset_references" ADD CONSTRAINT "media_asset_references_site_settings_id_site_settings_id_fk" FOREIGN KEY ("site_settings_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_created_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("created_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_unique" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_one_super_admin_unique" ON "admin_users" USING btree ("is_super_admin");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_draft_slug_unique" ON "articles" USING btree ("draft_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_published_slug_unique" ON "articles" USING btree ("published_slug") WHERE "articles"."published_slug" is not null;--> statement-breakpoint
CREATE INDEX "articles_published_at_index" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "audit_events_created_at_index" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_sections_section_key_unique" ON "content_sections" USING btree ("section_key");--> statement-breakpoint
CREATE UNIQUE INDEX "content_sections_position_unique" ON "content_sections" USING btree ("position");--> statement-breakpoint
CREATE INDEX "inquiries_status_created_at_index" ON "inquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "media_asset_references_media_asset_id_index" ON "media_asset_references" USING btree ("media_asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_references_content_section_slot_unique" ON "media_asset_references" USING btree ("content_section_id","snapshot","field_key","position") WHERE "media_asset_references"."content_section_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_references_service_slot_unique" ON "media_asset_references" USING btree ("service_id","snapshot","field_key","position") WHERE "media_asset_references"."service_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_references_product_slot_unique" ON "media_asset_references" USING btree ("product_id","snapshot","field_key","position") WHERE "media_asset_references"."product_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_references_project_slot_unique" ON "media_asset_references" USING btree ("project_id","snapshot","field_key","position") WHERE "media_asset_references"."project_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_references_team_member_slot_unique" ON "media_asset_references" USING btree ("team_member_id","snapshot","field_key","position") WHERE "media_asset_references"."team_member_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_references_article_slot_unique" ON "media_asset_references" USING btree ("article_id","snapshot","field_key","position") WHERE "media_asset_references"."article_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_references_site_settings_slot_unique" ON "media_asset_references" USING btree ("site_settings_id","snapshot","field_key","position") WHERE "media_asset_references"."site_settings_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_object_key_unique" ON "media_assets" USING btree ("object_key");--> statement-breakpoint
CREATE UNIQUE INDEX "products_position_unique" ON "products" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_position_unique" ON "projects" USING btree ("position");--> statement-breakpoint
CREATE INDEX "revalidation_jobs_pending_index" ON "revalidation_jobs" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE UNIQUE INDEX "services_position_unique" ON "services" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_active_expiry_index" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_position_unique" ON "team_members" USING btree ("position");--> statement-breakpoint
CREATE FUNCTION "set_updated_at"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	NEW.updated_at = clock_timestamp();
	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "admin_users_set_updated_at"
BEFORE UPDATE ON "admin_users"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "articles_set_updated_at"
BEFORE UPDATE ON "articles"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "content_sections_set_updated_at"
BEFORE UPDATE ON "content_sections"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "inquiries_set_updated_at"
BEFORE UPDATE ON "inquiries"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "media_assets_set_updated_at"
BEFORE UPDATE ON "media_assets"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "products_set_updated_at"
BEFORE UPDATE ON "products"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "projects_set_updated_at"
BEFORE UPDATE ON "projects"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "revalidation_jobs_set_updated_at"
BEFORE UPDATE ON "revalidation_jobs"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "services_set_updated_at"
BEFORE UPDATE ON "services"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "site_settings_set_updated_at"
BEFORE UPDATE ON "site_settings"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "team_members_set_updated_at"
BEFORE UPDATE ON "team_members"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();--> statement-breakpoint
CREATE FUNCTION "enforce_article_slug_reservation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	first_slug text;
	second_slug text;
BEGIN
	first_slug := LEAST(NEW.draft_slug, COALESCE(NEW.published_slug, NEW.draft_slug));
	second_slug := GREATEST(NEW.draft_slug, COALESCE(NEW.published_slug, NEW.draft_slug));

	PERFORM pg_advisory_xact_lock(hashtextextended(first_slug, 0));
	IF second_slug <> first_slug THEN
		PERFORM pg_advisory_xact_lock(hashtextextended(second_slug, 0));
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "articles" AS other
		WHERE other.id <> NEW.id
			AND (
				other.published_slug = NEW.draft_slug
				OR (
					NEW.published_slug IS NOT NULL
					AND other.draft_slug = NEW.published_slug
				)
			)
	) THEN
		RAISE EXCEPTION USING
			ERRCODE = '23505',
			CONSTRAINT = 'articles_slug_global_unique',
			MESSAGE = 'article slugs are globally reserved';
	END IF;

	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "articles_enforce_slug_reservation"
BEFORE INSERT OR UPDATE OF "draft_slug", "published_slug" ON "articles"
FOR EACH ROW EXECUTE FUNCTION "enforce_article_slug_reservation"();
