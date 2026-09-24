---
description: >
  TLDR Radar's Next.js 16 App Router conventions — foundation/consumer
  boundary, Server Actions, Prisma/SQLite data access, and styling.
---

# TLDR Radar stack conventions

Next.js 16 (App Router), TypeScript (`strict: true`), Prisma 7 +
`better-sqlite3` adapter, Tailwind v4, Vercel AI SDK. Single Next.js app, no
monorepo.

## Foundation / consumer file boundary

- **Foundation**: `src/lib/**` (business logic, DB access, scraping, Jev
  integration, deep-dive agent, pipeline orchestration), `src/app/actions.ts`
  (`"use server"` mutations — the only write path from the UI),
  `prisma/schema.prisma` and `prisma/migrations/**`.
- **Consumer**: `src/app/page.tsx`, `src/app/settings/page.tsx`,
  `src/app/layout.tsx` (Server Components that call into `src/lib` directly
  to fetch data — there is no API layer between them), and everything in
  `src/components/**` (client components).

## Data access

- All DB access goes through the singleton Prisma client exported from
  `src/lib/db.ts` (`PrismaBetterSqlite3` adapter, cached on `globalThis`
  outside production for HMR) — never instantiate `PrismaClient` elsewhere.
- After editing `prisma/schema.prisma`, run `npx prisma generate` (output
  goes to `src/generated/prisma`, gitignored) and `npx prisma migrate dev` to
  create a migration.
- Structured data that doesn't need SQL querying is stored as a
  JSON-encoded `String` column (`JSON.stringify` on write, `JSON.parse` on
  read) — follow this for new fields like `relevanceLegend` or
  `deepDive.resources` rather than normalizing into new tables/columns.

## Server Actions

- All mutations live in `src/app/actions.ts`, marked `"use server"` at the
  top of the file (not per-function).
- Every mutating action calls `revalidatePath(...)` on every page whose data
  it affects before returning — don't add a mutation without this.

## Syntax rules

- Strict TypeScript throughout (`tsconfig.json` has `"strict": true`); no
  implicit `any`.
- Path alias `@/*` → `./src/*`.
- Styling is Tailwind v4 utility classes inline in JSX (see
  `src/app/page.tsx`, `src/components/*.tsx`) — no component library, no
  CSS modules.
- Pages that must always read live DB state set
  `export const dynamic = "force-dynamic"` (see `src/app/page.tsx`) rather
  than relying on default caching behavior.

## Verification commands

Run `npm run lint` (ESLint, `eslint-config-next` core-web-vitals +
typescript) before reporting done. There is no separate typecheck script;
`tsc` runs implicitly as part of `npm run build`. See the `build-with-tests`
extension for the (missing) test situation.
