import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { Pool } from 'pg';
import { runMigrations } from './migrator.js';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is required for database tests and must name a dedicated test database.',
  );
}

const parsedTestDatabaseUrl = new URL(testDatabaseUrl);
const testDatabaseName = parsedTestDatabaseUrl.pathname.slice(1);

if (!/(^|[-_])test($|[-_])/.test(testDatabaseName)) {
  throw new Error(
    `Refusing to reset database "${testDatabaseName}" because its name is not explicitly marked as a test database.`,
  );
}

async function expectDatabaseError(
  operation: Promise<unknown>,
  code: string,
  constraint: string,
) {
  await assert.rejects(operation, (error: unknown) => {
    if (!(error instanceof Error)) return false;

    const databaseError = error as Error & {
      code?: string;
      constraint?: string;
    };
    assert.equal(databaseError.code, code);
    assert.equal(databaseError.constraint, constraint);
    return true;
  });
}

async function waitForApiStartup(child: ReturnType<typeof spawn>) {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('API did not start within 10 seconds.')),
      10_000,
    );

    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`API exited before startup with code ${String(code)}.`));
    });
    child.stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('API listening on')) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

test('reviewed migrations and database invariants', async (context) => {
  const pool = new Pool({ connectionString: testDatabaseUrl });
  context.after(async () => pool.end());

  await pool.query('drop schema if exists drizzle cascade');
  await pool.query('drop schema if exists public cascade');
  await pool.query('create schema public');

  await context.test('API startup never runs migrations', async () => {
    const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
        PORT: '0',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    try {
      await waitForApiStartup(child);
      const result = await pool.query<{ table_name: string }>(
        `select table_name
         from information_schema.tables
         where table_schema = 'public'`,
      );
      assert.deepEqual(result.rows, []);
    } finally {
      if (child.exitCode === null) {
        child.kill();
        await Promise.race([once(child, 'exit'), delay(5_000)]);
      }
    }
  });

  await context.test(
    'migrations apply to a clean PostgreSQL database',
    async () => {
      await runMigrations(testDatabaseUrl);

      const result = await pool.query<{ table_name: string }>(
        `select table_name
       from information_schema.tables
       where table_schema = 'public'
       order by table_name`,
      );
      const tableNames = result.rows.map((row) => row.table_name);

      assert.ok(tableNames.includes('admin_users'));
      assert.ok(tableNames.includes('articles'));
      assert.ok(tableNames.includes('content_sections'));
      assert.ok(tableNames.includes('media_asset_references'));
    },
  );

  const adminResult = await pool.query<{ id: string }>(
    `insert into admin_users (email, password_hash)
     values ('admin@codeddevs.test', 'test-password-hash')
     returning id`,
  );
  const adminUserId = adminResult.rows[0]?.id;
  assert.ok(adminUserId);

  await context.test('the database enforces one Super Admin', async () => {
    await expectDatabaseError(
      pool.query(
        `insert into admin_users (email, password_hash)
         values ('second-admin@codeddevs.test', 'test-password-hash')`,
      ),
      '23505',
      'admin_users_one_super_admin_unique',
    );

    await expectDatabaseError(
      pool.query(
        `insert into admin_users (email, password_hash, is_super_admin)
         values ('not-super-admin@codeddevs.test', 'test-password-hash', false)`,
      ),
      '23514',
      'admin_users_only_super_admin',
    );
  });

  await context.test('article slugs are globally reserved', async () => {
    await pool.query(
      `insert into articles (
         draft_slug,
         published_slug,
         draft_payload,
         published_payload,
         published_at
       ) values ($1, $2, $3::jsonb, $4::jsonb, now())`,
      ['first-draft', 'shared-published-slug', '{}', '{"title":"First"}'],
    );

    await expectDatabaseError(
      pool.query(
        `insert into articles (
           draft_slug,
           published_slug,
           draft_payload,
           published_payload,
           published_at
         ) values ($1, $2, $3::jsonb, $4::jsonb, now())`,
        ['second-draft', 'shared-published-slug', '{}', '{"title":"Second"}'],
      ),
      '23505',
      'articles_published_slug_unique',
    );

    await pool.query(
      `insert into articles (draft_slug, draft_payload)
       values ('shared-draft-slug', '{}'::jsonb)`,
    );

    await expectDatabaseError(
      pool.query(
        `insert into articles (draft_slug, draft_payload)
         values ('shared-draft-slug', '{}'::jsonb)`,
      ),
      '23505',
      'articles_draft_slug_unique',
    );

    await expectDatabaseError(
      pool.query(
        `insert into articles (draft_slug, draft_payload)
         values ('shared-published-slug', '{}'::jsonb)`,
      ),
      '23505',
      'articles_slug_global_unique',
    );

    await expectDatabaseError(
      pool.query(
        `insert into articles (
           draft_slug,
           published_slug,
           draft_payload,
           published_payload,
           published_at
         ) values ($1, $2, '{}'::jsonb, '{}'::jsonb, now())`,
        ['unique-draft-slug', 'shared-draft-slug'],
      ),
      '23505',
      'articles_slug_global_unique',
    );
  });

  await context.test(
    'invalid publication-state combinations fail',
    async () => {
      await expectDatabaseError(
        pool.query(
          `insert into articles (draft_slug, draft_payload, published_payload)
         values ('invalid-article', '{}'::jsonb, '{}'::jsonb)`,
        ),
        '23514',
        'articles_publication_state_consistent',
      );

      await expectDatabaseError(
        pool.query(
          `insert into content_sections (
           section_key,
           position,
           draft_payload,
           published_visible
         ) values ('hero', 0, '{}'::jsonb, true)`,
        ),
        '23514',
        'content_sections_publication_state_consistent',
      );

      await expectDatabaseError(
        pool.query(
          `insert into services (position, draft_payload, published_payload)
         values (0, '{}'::jsonb, '{}'::jsonb)`,
        ),
        '23514',
        'services_publication_state_consistent',
      );

      await expectDatabaseError(
        pool.query(
          `insert into site_settings (published_at)
         values (now())`,
        ),
        '23514',
        'site_settings_publication_state_consistent',
      );
    },
  );

  await context.test(
    'unknown homepage section keys fail at the database boundary',
    async () => {
      await expectDatabaseError(
        pool.query(
          `insert into content_sections (section_key, position, draft_payload)
         values ('testimonials', 0, '{}'::jsonb)`,
        ),
        '23514',
        'content_sections_known_section_key',
      );
    },
  );

  await context.test(
    'draft and published media references prevent asset deletion',
    async () => {
      const serviceResult = await pool.query<{ id: string }>(
        `insert into services (
           position,
           draft_payload,
           published_payload,
           published_at
         ) values (0, '{}'::jsonb, '{}'::jsonb, now())
         returning id`,
      );
      const serviceId = serviceResult.rows[0]?.id;
      assert.ok(serviceId);

      for (const snapshot of ['draft', 'published'] as const) {
        const assetResult = await pool.query<{ id: string }>(
          `insert into media_assets (
             object_key,
             mime_type,
             byte_size,
             created_by_admin_user_id
           ) values ($1, 'image/png', 128, $2)
           returning id`,
          [`test/${snapshot}.png`, adminUserId],
        );
        const assetId = assetResult.rows[0]?.id;
        assert.ok(assetId);

        await pool.query(
          `insert into media_asset_references (
             media_asset_id,
             snapshot,
             field_key,
             service_id
           ) values ($1, $2, 'cover', $3)`,
          [assetId, snapshot, serviceId],
        );

        await expectDatabaseError(
          pool.query('delete from media_assets where id = $1', [assetId]),
          '23503',
          'media_asset_references_media_asset_id_media_assets_id_fk',
        );
      }
    },
  );

  await context.test(
    'database triggers advance updated_at for direct SQL writes',
    async () => {
      const triggerResult = await pool.query<{ trigger_name: string }>(
        `select trigger.tgname as trigger_name
         from pg_trigger as trigger
         join pg_class as table_class on table_class.oid = trigger.tgrelid
         join pg_namespace as table_schema on table_schema.oid = table_class.relnamespace
         where table_schema.nspname = 'public'
           and trigger.tgisinternal = false
           and trigger.tgname like '%_set_updated_at'
         order by trigger.tgname`,
      );

      assert.deepEqual(
        triggerResult.rows.map((row) => row.trigger_name),
        [
          'admin_users_set_updated_at',
          'articles_set_updated_at',
          'content_sections_set_updated_at',
          'inquiries_set_updated_at',
          'media_assets_set_updated_at',
          'products_set_updated_at',
          'projects_set_updated_at',
          'revalidation_jobs_set_updated_at',
          'services_set_updated_at',
          'site_settings_set_updated_at',
          'team_members_set_updated_at',
        ],
      );

      const inserted = await pool.query<{ id: string; updated_at: Date }>(
        `insert into inquiries (name, email, message)
         values ($1, $2, $3)
         returning id, updated_at`,
        [
          'Database Test',
          'database-test@codeddevs.test',
          'Testing updated_at behavior.',
        ],
      );
      const inquiry = inserted.rows[0];
      assert.ok(inquiry);

      await delay(20);

      const updated = await pool.query<{ updated_at: Date }>(
        `update inquiries
         set status = 'resolved',
             updated_at = '2000-01-01T00:00:00.000Z'
         where id = $1
         returning updated_at`,
        [inquiry.id],
      );

      assert.ok(updated.rows[0]?.updated_at);
      assert.ok(updated.rows[0].updated_at > inquiry.updated_at);
      assert.ok(
        updated.rows[0].updated_at > new Date('2000-01-01T00:00:00.000Z'),
      );
    },
  );
});
