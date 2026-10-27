# API instructions

Follow the root `AGENTS.md` in addition to this file.

- Keep the API as an Express/TypeScript modular monolith; group related behavior by feature as it grows.
- Validate untrusted request data with Zod at API boundaries. Keep HTTP handlers thin and return deliberate error responses.
- Use Drizzle for PostgreSQL access and version schema changes through reviewed migrations; never modify production schema or data without authorization.
- Treat authentication, authorization, sessions, and CMS write operations as security-sensitive. Enforce permissions on the server, not only in the admin UI.
- Do not log passwords, session tokens, secrets, or sensitive personal data.
- Preserve existing API contracts unless the task explicitly authorizes a change. Add tests for validation, authorization, and changed behavior.
- Run `pnpm --filter @codeddevs/api lint`, `typecheck`, `test`, and `build` when relevant.
