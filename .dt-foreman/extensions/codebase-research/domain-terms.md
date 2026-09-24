---
description: >
  TLDR Radar domain terms from the TypeSafe/Jev SDK that aren't
  self-explanatory, and where the core pipeline stages live.
---

# Domain terms (TypeSafe / Jev)

`src/lib/jev.ts` calls TypeSafe's `systemOne` API with three "questions" per
article, using TypeSafe's own terminology — search for these terms, not
generic synonyms:

- **Score** — a question type answered as a position on an ordered scale
  (used for `relevance`); normalized in this codebase to a 0–1
  `relevanceScore`.
- **Choice** — a question type answered as one winning option among a fixed
  set, with per-option probabilities (used for `articleType`).
- **Noul** — TypeSafe's term for a yes/no question answered as a single
  probability with *no separate confidence value* (used for `actionable`).
  If you're looking for "is this actionable" logic, grep for `noul` or
  `actionable`, not `boolean`.

## Where the pipeline stages live

`src/lib/pipeline.ts`'s `runPipeline` is the single entry point that chains
every stage for a given (edition, date): scrape (`tldr-scraper.ts`) → judge
(`jev.ts`) → gate (thresholds from `settings.ts`'s `InterestProfile`) →
deep-dive (`deep-dive-agent.ts`, using `searxng.ts`) → cache (Prisma). Start
there when tracing "how does X get from a TLDR issue onto the dashboard."
