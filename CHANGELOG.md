# Changelog

Visible engineering changes to the public portfolio engine. Latest first.

## v1.0.2 — Agent text mirrors

Compatibility release for OpenAI/Anthropic-style fetch layers that treat direct
`.md` URLs and `text/markdown` responses differently from ordinary browsers and
`curl`.

**Agent surface** — canonical per-page mirrors moved from `.md` to UTF-8 `.txt`
URLs while keeping Markdown syntax in the body. `/llms.txt`, localized llms
indexes, `/llms-full.txt`, sitemap entries, HTML alternate links and generated
footer links now advertise `.txt` mirrors only.

**Production delivery** — Caddy now serves `/llms*.txt` and per-page `.txt`
mirrors as `text/plain; charset=utf-8`, removes `X-Robots-Tag` from agent
entry points, redirects legacy `.md` URLs to `.txt`, keeps `Link` discovery on
normal HTML responses, and uses gzip-only compression for agent compatibility.

**Regression guard** — added `npm run check:agent-surface` to CI so stale `.md`
links, `text/markdown`, `noindex,nofollow`, immutable text caching, or zstd
regressions fail before release.

## v1.0.1 — CV OG metadata and publication hardening

Release prep for CV Open Graph metadata and public/private publication safety.

**CV Open Graph** — added a dedicated `/cv` HTML shell with `/og/cv.png`
for social crawlers, plus browser redirect to the resolved CV PDF. Public
builds ship sanitized CV OG art; private builds can overlay the live CV OG
master into `dist/og/cv.png`.

**Case OG data** — added `npm run og:case-data` to export case-card metadata
from the typed content tree. Public case OG data is placeholder-only; private
case OG data can read deploy-only facts from an untracked JSON file via
`CASE_OG_PRIVATE_FACTS_PATH`.

**Publication safety** — private builds now keep generated text mirrors in `dist/`
instead of writing private text into `public/`, rewrite deploy metadata
(`robots.txt`, `sitemap.xml`) to the private origin, and keep public committed
metadata on `https://example.com`.

**Public surface cleanup** — removed the live-domain link from committed demo
contact/CV/footer surfaces while keeping the private deploy origin and CV paths
intact.

## v1.0 — Initial public release

First public publication of the portfolio engine.

**Frontend** — Vite + React + TypeScript, trilingual EN/RU/AR with full RTL, route-aware nav, six case-study routes, single-player video system with per-language voiceover cuts, agent-readable text mirrors of every page, generated case metadata for scrapers, content-source switch between public and private trees.

**Analytics server** — `node:http` + SQLite, daily-salted visitor IDs, dwell-time classifier, nightly rollup, Basic-Auth admin dashboard, JSON snapshot endpoints. Standalone module with its own `package.json` and a single dependency on `better-sqlite3`.

**Test harness**:

- Frontend unit tests (Vitest + jsdom): markdown helpers (snapshots per language and per case slug, prev/next nav invariants, image absolutisation, stub fallback), the dwell state machine (5s idle window, 30 min hard cap, visibility gate, per-path flush), and runtime EN/RU/AR array-length parity.
- Server unit tests (`node --test`, zero new dependencies): payload validation per event kind with truncation and finite-number checks, deterministic visitor hashing (no raw-IP echo, salt-rotation independence), dwell classification buckets, UA-family parsing.

**Tooling** — ESLint flat config (`typescript-eslint` recommended + `react-hooks`), `npm run lint` across both modules, CI matrix split (`frontend` and `server` jobs run in parallel, `concurrency` cancels superseded runs), and deploy templates for Caddy and systemd under `deploy/`.
