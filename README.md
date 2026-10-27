# CodedDevs Website

The company website and content management system for CodedDevs Technology LTD.

## Workspace

- `apps/web` — public Next.js website
- `apps/admin` — internal Next.js content management interface
- `apps/api` — Express REST API
- `packages/*` — reserved for shared packages when needed

## Requirements

Node.js 22 and pnpm 10.20.0. PostgreSQL is required for database-backed features as they are implemented.

## Quick start

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The web app defaults to port 3000 and the admin app to port 3001. Refer to `apps/api/src/index.ts` for the API's current port configuration.

## Checks

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

See [development](docs/development.md) for workspace commands and [architecture](docs/architecture.md) for application boundaries. Contributors and coding agents should read [AGENTS.md](AGENTS.md) and the applicable app-specific instructions.

> The repository is currently a foundation scaffold. Documented planned capabilities are not necessarily implemented.
