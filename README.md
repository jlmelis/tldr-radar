# TLDR Radar

A local tool that scrapes your subscribed [TLDR](https://tldr.tech) newsletter
editions, uses **Jev** (TypeSafe's System One model) to judge every article
against a personal interest profile, and hands the subset that looks worth
digging into off to a small OpenAI model running as a tool-calling agent that
searches the web (via a self-hosted SearXNG instance) for tutorials and
deeper resources.

Runs are cached per (edition, date), so revisiting a day never re-scrapes,
re-judges, or re-searches.

## How it decides what to show you

For every scraped article, Jev answers three independent questions in one
request:

- **Relevance** (Score) — how relevant is this to your stated interest
  profile.
- **Article type** (Choice) — is this a new tool/framework, a technique, a
  model release, a research finding, or business/funding news.
- **Actionable** (Noul) — does this look like something with real hands-on
  material to find (docs, a repo, a tutorial), as opposed to being primarily
  news.

Two independently-tunable thresholds (Settings) turn those into what you see:

- **Interest gate** (relevance ≥ threshold) — irrelevant articles are hidden
  entirely. This is the whole point of the tool.
- **Search gate** (actionable ≥ threshold, only evaluated among articles that
  passed the interest gate) — decides whether the deep-dive agent runs.

So every relevant article on the dashboard is labeled either **relevant with
additional resources** or **relevant with no additional resources** — a plain
model-release headline clears the interest gate but never triggers a search;
a new framework or tool clears both.

## Setup

1. Copy `.env.example` to `.env` and fill in:
   - `TYPESAFE_API_KEY` — from [typesafe.ai](https://typesafe.ai)
   - `OPENAI_API_KEY` — any OpenAI key; `OPENAI_MODEL` defaults to a small,
     cheap model (`gpt-4o-mini`)
   - `SEARXNG_SECRET` — any random string, e.g. `openssl rand -hex 32`
     (only used by the `searxng` container in docker-compose)

2. Start everything:

   ```sh
   docker compose up -d
   ```

   This builds the app, runs Prisma migrations against a Docker-volume-backed
   SQLite database, and starts a self-hosted SearXNG instance the deep-dive
   agent uses for free, local web search.

3. Open <http://localhost:3210>.

Data persists in the `app-data` and `searxng-data` Docker volumes across
restarts. `docker compose down` stops the containers without deleting them;
add `-v` if you want to wipe cached runs entirely.

## Local development (without Docker)

```sh
npm install --legacy-peer-deps
npx prisma migrate dev
npm run dev
```

You'll also need a local SearXNG instance (or point `SEARXNG_URL` at the one
from `docker compose up searxng`) for the deep-dive agent to work.

## Project layout

- `src/lib/tldr-scraper.ts` — fetches and parses a TLDR issue page
  (`tldr.tech/<edition>/<date>`); returns `found: false` for dates with no
  published issue (weekends/holidays) instead of erroring.
- `src/lib/jev.ts` — the TypeSafe/Jev integration; one `systemOne` call per
  article with the three questions above.
- `src/lib/deep-dive-agent.ts` — the Vercel AI SDK tool-calling agent that runs
  a few targeted SearXNG queries (docs, tutorial, repo) per article, then a
  second call curates which results are genuinely hands-on material worth
  showing, discarding news coverage of the same announcement.
- `src/lib/pipeline.ts` — orchestrates scrape → judge → gate → deep-dive →
  cache for a given (edition, date), and reads back a run's results with the
  gates re-derived from the current thresholds (so changing a threshold in
  Settings never requires re-running Jev).
- `src/app` — the dashboard (Home, Settings) and server actions that trigger
  the pipeline and update settings.
