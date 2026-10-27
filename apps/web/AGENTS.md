# Public website instructions

Follow the root `AGENTS.md` in addition to this file.

- This app is the public CodedDevs website, not the admin CMS. Do not introduce privileged management functions here.
- Follow existing Next.js App Router and TypeScript patterns. Prefer server-rendered content when suitable.
- Implement approved designs responsively and preserve semantic HTML, keyboard access, readable labels, and accessible interactions.
- Follow `docs/brand.md` and `docs/design.md` once approved and added. Until then, do not assume brand colors, typography, components, or layouts.
- Use approved logo SVG assets from `public/assets/logos/` when supplied; do not create substitute logos or add an icon package without a UI need.
- Keep public content discoverable with appropriate metadata and SEO practices; do not expose draft or private CMS content.
- Keep API integration explicit and handle loading, empty, and error states where applicable.
- Avoid unnecessary client-side JavaScript and dependencies.
- Run `pnpm --filter @codeddevs/web lint`, `typecheck`, `test`, and `build` when relevant.
