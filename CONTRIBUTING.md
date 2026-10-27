# Contributing

Work from short-lived branches targeting `main`. Open a pull request for each change. CI must pass before merge. Keep business logic independent from external service providers where practical; do not abstract the chosen application technologies. Never commit secrets. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before requesting review.
