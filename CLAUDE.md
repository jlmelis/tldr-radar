@AGENTS.md

## dt-foreman

This project has `.dt-foreman/extensions/` for dt-foreman's extensible
skills:

- `stack-conventions/nextjs-app-router.md` — Next.js App Router
  foundation/consumer boundary, Server Actions, Prisma data access.
- `build-with-tests/no-test-suite.md` — this project has no automated test
  suite; documents the gap and what to run instead (lint + build + manual
  exercise).
- `cross-cutting-concerns/dates-and-single-user.md` — mandatory: date
  handling (`YYYY-MM-DD` opaque strings, no timezone normalization) and the
  single-user/no-auth deployment model.
- `codebase-research/domain-terms.md` — TypeSafe/Jev terms (Score, Choice,
  Noul) and where the pipeline stages live.

No extensions exist for `user-story-writing`, `technical-brief-writing`,
`acceptance-testing`, or `implementation-validation` — nothing
project-specific was found to override those skills' generic defaults.
