<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TLDR Radar

A local, single-user tool that scrapes your subscribed [TLDR](https://tldr.tech)
newsletter editions, uses **Jev** (TypeSafe's System One model) to judge every
article against a personal interest profile, and hands the subset that looks
worth digging into off to a small OpenAI model running as a tool-calling agent
that searches the web (via a self-hosted SearXNG instance) for tutorials and
deeper resources. Runs are cached per (edition, date).

## Setup

1. Copy `.env.example` to `.env` and fill in `TYPESAFE_API_KEY`,
   `OPENAI_API_KEY` (optionally `OPENAI_MODEL`, defaults to `gpt-4o-mini`),
   and `SEARXNG_SECRET` (e.g. `openssl rand -hex 32`).
2. Docker (recommended): `docker compose up -d` — builds the app, runs Prisma
   migrations against a Docker-volume-backed SQLite database, and starts a
   self-hosted SearXNG instance. App is served on <http://localhost:3210>
   (mapped from container port 3000).
3. Local (without Docker): `npm install --legacy-peer-deps` (required —
   `better-sqlite3` / Prisma peer deps don't resolve cleanly without it), then
   `npx prisma migrate dev`, then `npm run dev`. You'll also need a local
   SearXNG instance (or point `SEARXNG_URL` at `docker compose up searxng`).

## Commands

- `npm run dev` — start the Next.js dev server.
- `npm run build` — production build.
- `npm run start` — run a production build.
- `npm run lint` — ESLint (`eslint-config-next` core-web-vitals + typescript
  rulesets).
- `npx prisma generate` — regenerate the Prisma client into
  `src/generated/prisma` (gitignored, not committed) after editing
  `prisma/schema.prisma`.
- `npx prisma migrate dev` — create/apply a migration locally.
- **No automated test suite exists** (no Jest/Vitest/Playwright/etc. in
  `package.json`, no test files in the repo). There is no whole-suite or
  scoped test command to run. Treat this as a real gap, not an oversight to
  paper over — verify changes via `npm run lint`, `npx tsc --noEmit` (there's
  no dedicated typecheck script, but `tsconfig.json` has `strict: true`), and
  manual exercise of the affected flow (`npm run dev` + the browser), and say
  so explicitly rather than claiming test coverage that doesn't exist.

## Directory map

- `src/app` — Next.js App Router. `page.tsx` is the dashboard (Home),
  `settings/page.tsx` is the settings screen, `actions.ts` holds all
  `"use server"` mutations (the only write path from the UI), `layout.tsx` /
  `globals.css` are the root shell and Tailwind v4 entrypoint.
- `src/components` — client React components (`ArticleList`,
  `EditionsManager`, `RunControls`, `SettingsForm`) rendered by the App
  Router pages.
- `src/lib` — all business logic:
  - `db.ts` — Prisma client singleton (`PrismaBetterSqlite3` adapter,
    cached on `globalThis` outside production to survive HMR).
  - `tldr-scraper.ts` — fetches and parses a TLDR issue page
    (`tldr.tech/<edition>/<date>`) with `cheerio`; returns `found: false`
    (rather than throwing) for dates with no published issue, detected by
    checking whether the response's final URL still matches the requested
    edition/date after following redirects.
  - `jev.ts` — the TypeSafe/Jev integration. One `systemOne` call per
    article answers three questions in one request: `relevance` (a `score`
    question, normalized to 0–1), `articleType` (a `choice` question), and
    `actionable` (a `noul` question — TypeSafe's term for a yes/no
    probability with no separate confidence value). If you're searching for
    this integration, "Noul" is the term to grep for, not "boolean" or
    "yes/no".
  - `deep-dive-agent.ts` — the Vercel AI SDK (`ai` package) tool-calling
    agent that runs targeted SearXNG queries (docs, tutorial, repo) per
    article, then a second call curates which results are genuinely
    hands-on material, discarding news coverage of the same announcement.
  - `searxng.ts` — SearXNG HTTP client used by the deep-dive agent.
  - `pipeline.ts` — orchestrates scrape → judge → gate → deep-dive → cache
    for a given (edition, date); `getRunView` reads back a cached run with
    the interest/search gates re-derived from the *current* threshold
    settings, so changing a threshold in Settings never requires re-running
    Jev.
  - `settings.ts` — CRUD for the single `InterestProfile` row (id
    `"default"`; there is no multi-profile or multi-user concept).
  - `editions.ts` — TLDR edition management (slug/name/enabled).
- `src/generated/prisma` — generated Prisma client output. Gitignored; run
  `npx prisma generate` after cloning or after schema changes.
- `prisma/` — `schema.prisma` (SQLite datasource) and `migrations/`.
- `searxng/` — SearXNG `settings.yml`, bind-mounted read-only into the
  `searxng` container by `docker-compose.yml`.
- `public/` — static assets.

## Architecture notes and conventions

- **No API routes.** All server-side work happens through Next.js Server
  Components (pages fetch directly from `src/lib`, e.g. `page.tsx` calls
  `getRunView`/`listEditions` directly) and Server Actions in
  `src/app/actions.ts`. There is no `src/app/api/**`.
- Every mutating Server Action calls `revalidatePath(...)` on the affected
  page(s) afterward (see `actions.ts`) — don't forget this when adding a new
  mutation.
- `page.tsx` sets `export const dynamic = "force-dynamic"` because it always
  reads live DB state and must never be prerendered/cached by Next.js.
- Complex/structured data that doesn't need to be queried in SQL is stored
  as JSON-encoded `String` columns in Prisma (`relevanceLegend`,
  `articleTypeProbabilities`, `deepDive.resources`, `jevJudgment.rawResponse`)
  — `JSON.stringify` on write, `JSON.parse` on read. Follow this pattern
  rather than adding new columns/tables for similar cases.
- Pipeline errors are caught and recorded as data (`Run.status = "ERROR"` /
  `Run.error`, `DeepDive.status = "ERROR"` / `DeepDive.error`) rather than
  thrown out of `runPipeline` — the UI reads status/error off the row. Follow
  this pattern for new pipeline stages rather than letting exceptions
  propagate to the caller.
- The TLDR issue `date` is a `YYYY-MM-DD` calendar-day string (matching the
  URL slug `tldr.tech/<edition>/<date>`), not a timestamp — it identifies
  *which issue*, not when it was fetched. It's produced with
  `date-fns`' `format(new Date(), "yyyy-MM-dd")` using the server's local
  clock; there's no explicit timezone normalization. Keep dates as opaque
  `YYYY-MM-DD` strings end-to-end rather than parsing them into `Date`
  objects for comparison.
- Path alias `@/*` → `./src/*` (see `tsconfig.json`).
- Styling is Tailwind v4 (via `@tailwindcss/postcss`), utility classes
  inline in JSX, neutral color palette — no component library.
- `tsconfig.json` has `"strict": true`; keep new code strict-clean.
- This is a genuinely single-user, single-tenant, unauthenticated local tool
  (meant to run on `localhost` or a home server) — there is no auth model
  and no multi-tenancy to preserve when adding features.

## Testing

There are no automated tests in this repo today (see Commands above). When
implementing a feature, verify it by running the app locally
(`npm run dev`, or `docker compose up -d`) and exercising the flow in the
browser, and run `npm run lint`. Do not claim test coverage that doesn't
exist.

## Commit conventions

No enforced commit message format; git history is informal single-author
commits (e.g. "tweaks", "fixing some stuff"). There's no CI, no
`.github/workflows`, and no CONTRIBUTING doc — nothing else to reconcile
here.
