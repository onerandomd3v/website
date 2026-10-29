# Development

## Prerequisites

- Node.js 22
- pnpm 10.20.0 (via Corepack or an equivalent installation)
- PostgreSQL when working on database-backed features

## Install and run

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` runs workspace development scripts in parallel. The Next.js public website uses port 3000 by default; the admin app uses port 3001. Inspect `apps/api/src/index.ts` for the current API port behavior.

Run a single app with:

```bash
pnpm --filter @codeddevs/web dev
pnpm --filter @codeddevs/admin dev
pnpm --filter @codeddevs/api dev
```

## Verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For a focused change, use `pnpm --filter @codeddevs/<app> <script>` with `web`, `admin`, or `api` and the scripts defined in each package. GitHub Actions runs independent workspace, web, admin, and API checks.

## Environment and database

Use locally configured environment variables appropriate to the feature being developed. Do not commit `.env` files, secrets, or credentials. Confirm actual variable names from the implementation rather than inventing them.

PostgreSQL/Drizzle configuration and migration commands must be documented when those capabilities are implemented; the scaffold does not yet establish a verified migration workflow. Do not run migrations against production without explicit authorization.

## Database migrations

The API owns the PostgreSQL schema and reviewed migrations. Generate a migration after a schema change with:

```bash
pnpm --filter @codeddevs/api db:generate
```

Review the generated SQL under `apps/api/drizzle/migrations/` before committing it. Apply reviewed migrations explicitly with:

```bash
pnpm --filter @codeddevs/api db:migrate
```

`DATABASE_URL` is required for migration execution. The API never runs migrations at startup. Before a destructive production migration, take and verify a backup and document the rollback plan.

Database tests require `TEST_DATABASE_URL` to point to a disposable PostgreSQL database whose name contains `test`. The test suite resets that database's `public` and Drizzle migration schemas, starts the API once to prove startup does not apply migrations, then applies the reviewed migrations and verifies database invariants. Never point `TEST_DATABASE_URL` at development, staging, or production data.

## Contribution workflow

Create a task-scoped branch, implement the approved change, run relevant checks, and open a PR to `main`. Follow the root and applicable application `AGENTS.md` instructions.
