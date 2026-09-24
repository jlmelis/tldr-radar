---
description: >
  TLDR Radar has no automated test suite — build/lint commands and the
  explicit testability gap to work around until one exists.
---

# TLDR Radar: no automated tests exist

> This documents a real gap, verified against `package.json` (no
> jest/vitest/playwright/testing-library dependency), the repo (no
> `*.test.*` / `*.spec.*` files anywhere), and the absence of any
> `.github/workflows` or other CI. Do not invent a test command — there
> isn't one.

## Commands that do exist

- Whole-project build: `npm run build` (`next build`) — this is the closest
  thing to a correctness gate; it runs the TypeScript compiler as part of
  the Next.js build.
- Lint (whole project, no per-file scoping supported by the `lint` script):
  `npm run lint` (`eslint`, flat config in `eslint.config.mjs`).
- There is **no scoped/single-file test command** and **no whole-suite test
  command**, because there is no test runner configured at all.

## What to do instead

When implementing or changing behavior in this project:

1. Run `npm run lint` and `npm run build` — these are the only automated
   correctness signals available.
2. Manually exercise the change: `npm run dev` (or `docker compose up -d`)
   and use the affected flow in the browser at <http://localhost:3210> (or
   `:3000` in local dev). For pipeline/scraper/Jev changes, trigger a real
   run via the dashboard's run controls rather than assuming correctness
   from reading the code.
3. State explicitly, in whatever summary or brief you produce, that the
   change was verified by lint + build + manual exercise, not by an
   automated test — never claim or imply test coverage that doesn't exist.

If a future change introduces a real test runner, replace this file with
one documenting its actual whole-suite and scoped commands (per the
`build-with-tests` skill's normal format) rather than leaving this gap note
in place.
