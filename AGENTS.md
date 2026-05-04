# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 15 TypeScript app using the App Router. Route pages and API handlers live in `app/`, for example `app/create/page.tsx` and `app/api/upload/route.ts`. Shared React components live in `components/`; generated shadcn/ui primitives are under `components/ui/` and should stay generic. Cross-route hooks live in `hooks/`, shared services and data helpers live in `lib/`, and static assets live in `public/`. Global styles are in `app/globals.css` and `styles/globals.css`; Tailwind and shadcn settings are in `tailwind.config.ts` and `components.json`.

## Build, Test, and Development Commands

Use the package manager matching the lockfile you are already updating; `pnpm` is preferred because `pnpm-lock.yaml` is present.

- `pnpm install`: install dependencies.
- `pnpm dev`: run the local Next.js development server.
- `pnpm build`: create a production build.
- `pnpm start`: serve the production build after `pnpm build`.
- `pnpm lint`: run the configured Next.js lint command.
- `pnpm exec tsc --noEmit`: run TypeScript checking directly.

## Coding Style & Naming Conventions

Write TypeScript with `strict` mode in mind and prefer explicit types at API, database, and component boundaries. Use the `@/` path alias instead of long relative imports. Component files use kebab-case names such as `post-preview.tsx`; exported React components use PascalCase. Keep shadcn/ui primitives in `components/ui/` reusable and put product-specific composition in `components/` or `app/`. Use Tailwind utilities and `cn` from `@/lib/utils` for conditional class names.

## Testing Guidelines

No test runner is currently configured. For risky changes, add focused tests alongside the feature before broad refactors, and document the runner in `package.json`. Until then, verify with `pnpm lint`, `pnpm exec tsc --noEmit`, and manual checks in the affected route or API endpoint. Name future tests after the unit or route they protect, for example `post-preview.test.tsx` or `app/api/upload/route.test.ts`.

## Commit & Pull Request Guidelines

Git history currently contains only the initial commit, so keep commits small and use imperative, intent-focused subjects. Follow the workspace Lore commit protocol when possible by adding useful trailers such as `Tested: pnpm lint` and `Not-tested: no automated API tests`. Pull requests should include a short problem statement, summary of changes, verification performed, linked issue if any, and screenshots for visible UI changes.

## Security & Configuration Tips

Do not commit secrets. Runtime storage is served by `host-server`; configure `HOST_SERVER_URL` and `XHS_POSTER_API_TOKEN` locally. Database and R2 credentials belong in the `host-server` environment, not in this Next.js app. Keep local values in `.env.local` and document any new required variables in the README or PR description.
