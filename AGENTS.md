# Repository instructions

## Context

This monorepo powers the CodedDevs Technology LTD public website and its internal CMS. Read `README.md`, `docs/architecture.md`, and the relevant application files before changing code. For work under `apps/api`, `apps/web`, or `apps/admin`, also follow that directory's `AGENTS.md`.

## Scope and architecture

- Preserve the pnpm monorepo and the boundaries between public website, admin UI, and API.
- Use the existing Node.js 22, pnpm 10.20.0, TypeScript, Next.js, Express, Zod, PostgreSQL, and Drizzle choices where applicable.
- Keep changes focused on the assigned issue. Do not introduce new infrastructure, packages, architectural patterns, or product features without a demonstrated need and approval.
- Inspect existing code and conventions before implementing. Do not assume planned features already exist.
- For UI or brand-related work, follow `docs/brand.md` and `docs/design.md` once the Product & Brand Designer has provided and approved them. Until then, do not invent brand tokens, visual standards, or design specifications; ask for the approved direction when needed.
- Keep credentials and environment-specific values out of Git. Do not operate on production systems or data without explicit authorization.

## Linear workflow

- Track implementation work in the [CodedDevs Website & CMS project](https://linear.app/codeddevs/project/codeddevs-website-and-cms-34b87fee6525) in the CodedDevs Linear workspace. The canonical GitHub repository is `onerandomd3v/website`, not `coded-devs/website`.
- Before starting, read the assigned Linear issue, its acceptance criteria, dependencies, and relevant project documentation. Check whether blockers are resolved; only work on independently safe portions when a dependency remains open.
- Keep changes within the assigned issue's scope. If requirements are unclear or conflict with the PRD, TDD, or repository instructions, record the blocker in Linear and seek a decision instead of guessing or expanding scope.
- Include the issue identifier in the short-lived branch name and pull request title or description (for example, `feat/COD-314-database-schema`). Open each task's PR against `main` in `onerandomd3v/website`.
- Keep the Linear issue status accurate: `Todo` before work, `In Progress` while implementing, `In Review` when its PR is ready for review, and `Done` only after merge and verification. Record blockers and implementation notes on the issue.
- Link the PR to its Linear issue, summarize changes and verification evidence, and keep the issue open when the PR is merely created. Do not mark checks as passed unless they were actually run and passed.
- Do not recreate work already completed in the repository. Close out an issue only for verified delivered work, and report unmet acceptance criteria rather than silently omitting them.

## Working agreement

- Work on a short-lived branch and open a pull request targeting `main` for each task; do not push directly to `main`.
- Explain changes, tests run, and any limitations in the PR. Do not report checks as passed unless they actually ran successfully.
- Follow existing formatting and lint rules. Add or update tests when changing behavior; keep unrelated refactors out of the PR.
- Run relevant workspace checks before handoff. CI includes Workspace, Web, Admin, and API checks; do not bypass failing checks.
- Ask when an assignment conflicts with documented boundaries or requires a product/security decision. Do not silently expand scope.

## Reference

- `docs/architecture.md` — system boundaries and approved technical direction
- `docs/development.md` — local setup and verification commands
- `docs/brand.md` and `docs/design.md` — future designer-owned guidelines; not yet available
- App-level `AGENTS.md` — only rules specific to that application
