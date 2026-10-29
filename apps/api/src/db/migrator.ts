import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDatabase } from './client.js';

export const migrationsFolder = fileURLToPath(
  new URL('../../drizzle/migrations', import.meta.url),
);

export async function runMigrations(databaseUrl: string) {
  const { db, pool } = createDatabase(databaseUrl);

  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
}
