---
description: >
  TLDR Radar's date/timezone handling convention and its single-user,
  unauthenticated deployment model — two things every brief touching dates
  or access control must address explicitly.
---

# Date handling

The TLDR issue `date` (used in `Run.date`, URLs, and the scraper) is a
`YYYY-MM-DD` calendar-day string that identifies *which newsletter issue*
(it's the date segment of `tldr.tech/<edition>/<date>`), not a timestamp of
when it was fetched or created. `src/app/page.tsx` produces "today" with
`date-fns`' `format(new Date(), "yyyy-MM-dd")` using the server process's
local clock — there is no explicit timezone conversion or UTC normalization
anywhere in the pipeline.

Any feature that touches `date` must state:

- That it treats `date` as an opaque `YYYY-MM-DD` string (string
  comparison/equality), not a parsed `Date` — parsing it into a `Date`
  object and comparing across timezones can shift which calendar day it
  resolves to.
- Whether it relies on "today" (server local time) — if so, note that the
  server's local timezone determines the calendar day, which matters if the
  app is ever deployed somewhere other than the user's own timezone (it
  currently is not — Docker Compose runs it as a local/home-server tool).

If a feature has no date dimension, say so explicitly rather than omitting
the topic.

# Single-user, no auth

TLDR Radar has no authentication, no user accounts, and no multi-tenancy —
`InterestProfile` is a single row with a hardcoded id (`"default"`), and the
app is designed to run on `localhost` or a private home server for one
person. Any brief that touches settings, profiles, or access should state
that it is intentionally single-user and not introduce
per-user/per-tenant scoping unless the user has explicitly asked for
multi-user support (a significant scope change from what exists today).
