# Architecture

## Overview

The CodedDevs Technology LTD website uses a pnpm TypeScript monorepo with three application boundaries:

- **Public website (`apps/web`)** — Next.js App Router, React; presents company content to visitors.
- **Admin CMS (`apps/admin`)** — separate Next.js App Router application for authorized content management.
- **API (`apps/api`)** — Express REST API; owns server-side validation, business logic, access control, and persistence.

Both frontend applications communicate with the API for dynamic data. The admin interface must never be the sole enforcement point for permissions.

## Technology direction

- Node.js 22, pnpm 10.20.0, TypeScript
- Next.js 15 and React 19 for web and admin
- Express 5 and Zod for the API
- PostgreSQL with Drizzle ORM for planned persistence
- Secure server-side sessions for planned admin authentication
- Cloudflare R2 for planned media storage

The current repository is a scaffold; listing a technology or capability here does not mean it is fully implemented.

## Boundaries

- Keep API-owned business rules and authorization out of frontend applications.
- Do not connect public browser code directly to PostgreSQL or privileged storage credentials.
- Use explicit API contracts and validate input on the server.
- Keep media access and publishing status governed by server-side policy.
- Do not add Redis, additional services, or a microservice split without an approved requirement.

For local commands see [development.md](development.md). Consult the approved PRD/TDD for product scope; do not infer missing requirements from this overview.
