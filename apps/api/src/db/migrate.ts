import 'dotenv/config';
import { runMigrations } from './migrator.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run migrations.');
}

await runMigrations(databaseUrl);
