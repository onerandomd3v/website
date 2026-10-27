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

## Contribution workflow

Create a task-scoped branch, implement the approved change, run relevant checks, and open a PR to `main`. Follow the root and applicable application `AGENTS.md` instructions.
