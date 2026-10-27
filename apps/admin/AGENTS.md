# Admin CMS instructions

Follow the root `AGENTS.md` in addition to this file.

- This app is the internal CMS. Keep its routes and interfaces separate from the public website.
- Follow existing Next.js App Router and TypeScript patterns.
- Treat authentication and session state carefully. The API must independently authorize every privileged operation; client-side guards are not security boundaries.
- Never expose credentials, tokens, or sensitive content in client bundles, URLs, or logs.
- Use clear validation, feedback, and confirmation for destructive or publishing actions.
- Do not assume unpublished content is public; keep draft/published state explicit when those features are implemented.
- Run `pnpm --filter @codeddevs/admin lint`, `typecheck`, `test`, and `build` when relevant.
