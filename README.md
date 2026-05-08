# Portfolio Engine

The public engine behind **[ilyadev.xyz](https://ilyadev.xyz)** — a personal
portfolio site running this codebase with its own content tree.

Vite + React + TS frontend, typed trilingual (EN / RU / AR with full RTL)
content, agent-readable Markdown mirrors of every page, and a self-hosted
privacy-first analytics server. Six case-study routes, a route-aware nav,
a single-player video system with per-language voiceover cuts, and a
content-source switch that lets the same engine drive any sibling content
tree.

[![CI](https://github.com/ilyaDev-xyz/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/ilyaDev-xyz/portfolio/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/ilyaDev-xyz/portfolio.svg)](LICENSE)

This repository is meant to be inspectable as an engineering artefact: typed
content, route-aware case pages, static Markdown mirrors for AI agents,
generated case metadata for scrapers, and self-hosted analytics under tight
data-minimisation constraints.

The committed app ships with demo content under `src/content/public/`. The
engine reads from a single barrel, `src/content/active.ts`, written by
`scripts/select-content.mjs` through explicit public/private scripts, so any
alternate content tree — a sibling fork, a PR-preview tree, a localised
variant — can be selected without touching app code. See
[Content source switch](#content-source-switch).

## Two modules

| Path        | What                                          | Read first                         |
|-------------|-----------------------------------------------|------------------------------------|
| `/` (this)  | **Frontend** — Vite + React + TS site         | this README, `docs/architecture.md`|
| `/server`   | **Analytics server** — `node:http` + SQLite   | [`server/README.md`](server/README.md), `docs/analytics.md` |

The two modules are deployable independently. The frontend can build and run
without the analytics server (analytics events are silently dropped). The
analytics server can run without the frontend (it just won't receive events).
Same-origin deploy with Caddy reverse-proxying `/api` and `/admin` to the
server is the recommended production layout — see `deploy/Caddyfile.example`.

## Quickstart — frontend

```bash
npm install
npm run dev:public      # demo content (committed)
# npm run dev:private   # your private content tree (gitignored)
```

Plain `npm run dev` is intentionally a no-op that prints the two real
options — content selection has to be explicit so a build never accidentally
ships the wrong tree.

Open <http://localhost:5173>. Vite dev-server proxies `/api` and `/admin`
to `localhost:3000` for analytics — see the server quickstart below.

```bash
npm run lint           # ESLint (flat config) — frontend + server
npm test               # Vitest run — pure helpers, dwell state machine, EN/RU/AR parity
npm run typecheck      # tsc --noEmit (public content)
npm run build:public   # deploy-safe public build → dist/
npm run cv:build:public # regenerate demo CV PDFs (run after editing cv.ts; output bytes are non-deterministic across runs, so it's a manual refresh — not part of build:public)
npm run preview        # serve dist/
```

Requires Node ≥ 22.12. The `.nvmrc` pins `22.14.0`; both
`package.json` and `server/package.json` declare the same `engines.node`.

## Quickstart — analytics server

The server lives in [`server/`](server/), has its own `package.json`, and a
single dependency on `better-sqlite3`. Standalone:

```bash
cd server
cp .env.example .env
# Edit .env — set ADMIN_PASSWORD before starting (the server returns 401 on
# /admin until it's set; production refuses to start without it).
npm install
npm start
```

Pure-helper unit tests (no SQLite, no network) live alongside the source
and run via Node's built-in test runner:

```bash
npm test            # node --test — validatePayload, hashVisitor, classifyDwell, UA parser
```

Listens on `:3000`. Endpoints:

- `POST /api/track` — analytics ingest (no auth, payload-validated)
- `GET  /admin` — dashboard (Basic Auth)
- `GET  /admin/api/{snapshot,30d,sessions,health,report}` — JSON endpoints

Full design (event taxonomy, daily-salted visitor IDs, dwell rules,
nightly rollup) in [`docs/analytics.md`](docs/analytics.md).

## Content source switch

`scripts/select-content.mjs` writes a gitignored `src/content/active.ts`
re-export from either `src/content/public/` (committed demo) or
`src/content/.private/` (gitignored override). Both trees export the same
`{ en, ru, ar }` shape. Plain `npm run dev` / `npm run build` are no-ops —
pick a tree explicitly:

- `npm run dev:public` / `npm run build:public` — public tree
- `npm run dev:private` / `npm run build:private` — private tree (fails if absent)

`npm run typecheck` / `npm test` / `npm run lint` default to the public
tree; `:private` variants exist for local override checks.

See [`docs/content.md`](docs/content.md) for the `IS_SANITIZED` gate,
content-presence feature gates (resume chip, video transcripts), and
editing conventions.

## Environment

The frontend is config-free — the analytics ingest endpoint is hardcoded to
same-origin `/api/track` and gated by `import.meta.env.PROD`, so dev builds
short-circuit and never produce `/api/track` 404s when the analytics server
isn't running locally.

The analytics server reads its config from `server/.env`. Copy the template
in [`server/.env.example`](server/.env.example) — `ADMIN_USER`, `ADMIN_PASSWORD`,
`SITE_DOMAIN`, `DB_PATH`, `PORT`. Defaults give you a working local setup;
production refuses to start unless `ADMIN_PASSWORD` is set.

Real `.env` files are gitignored.

## Social metadata (Open Graph)

The repository ships committed PNG OG images for the home route, CV route,
and each of the six case routes:

- `public/og-image.png` — home Open Graph image (1200×630)
- `public/og/cv.png` — `/cv` Open Graph image (1200×630)
- `public/og/cases/<slug>.png` × 6 — per-case Open Graph image

`vite.config.ts` overrides `<head>` per case route so `og:image`,
`og:image:width/height/type/alt`, `twitter:image`, and the JSON-LD `image`
field point at `/og/cases/<slug>.png`. The home route uses
`/og-image.png`. The `/cv` route is emitted as a static HTML head at
`dist/cv/index.html`; crawlers see `/og/cv.png`, while browsers are redirected
to the generated PDF. All Open Graph assets are PNG by design — LinkedIn rejects
WebP and SVG for `og:image`.

The committed bytes are demo content. They are replaceable static assets (see
[docs/decisions.md — Favicon family + OG/Twitter meta](docs/decisions.md)).
Per-case OG data is exported from the typed content tree with
`npm run og:case-data`. The public payload is sanitized placeholder copy; a
private build can supply deploy-only facts through `CASE_OG_PRIVATE_FACTS_PATH`.
Forking the engine: replace the eight PNGs with your own 1200×630 art and
rebuild — no engine code change required.

## Repo layout

- `src/content/public/` — committed demo content tree.
- `src/content/.private/` — gitignored override tree with the same export shape.
- `scripts/select-content.mjs` — writes ignored `src/content/active.ts` from an
  explicit `CONTENT_SOURCE`.
- `src/config/cases.ts` — frontend case slug registry for nav and next-case CTA.
- `vite.config.ts` — generates Markdown mirrors and static
  `dist/cases/<slug>/index.html` files with per-case title, description,
  alternate Markdown links, and JSON-LD.
- `server/` — same-origin analytics ingest / admin / rollup implementation.
- `deploy/` — Caddy and systemd `.example` files only; real host config stays
  out of git.

## Project map

```text
.
├── deploy/                 Example Caddy / systemd deployment files
├── docs/                   Architecture and maintenance notes
├── public/
│   ├── demo/               Committed placeholder media
│   └── cases/              Generated Markdown mirrors (build artefact)
├── scripts/
│   └── select-content.mjs  Content source selector
├── server/                 Node analytics server (own package.json)
└── src/
    ├── components/         Nav, loader, media facade, atoms
    ├── config/             Shared frontend case slug registry
    ├── content/            Types, active barrel, public/private trees
    ├── hooks/              Scroll progress and UI hooks
    ├── lib/                Markdown mirror + analytics helpers
    ├── pages/              Home and case routes
    ├── router/             Scroll-to-hash + analytics route tracker
    ├── sections/           Home-page sections
    ├── state/              Module-level stores (video, lang, theme)
    └── styles/             Tokens and section CSS
```

## Documentation

- [docs/architecture.md](docs/architecture.md) — provider tree, hooks, loader logic, routing, case-page shape, video player system, telemetry wiring, agent layer
- [docs/analytics.md](docs/analytics.md) — privacy-first analytics design (events, salt rotation, rollup, admin dashboard)
- [docs/design-system.md](docs/design-system.md) — tokens, type scale, palettes, section motifs
- [docs/content.md](docs/content.md) — editing copy, adding projects, translating
- [docs/decisions.md](docs/decisions.md) — engineering rationale (one entry per non-obvious choice)

## See it running

[**ilyadev.xyz**](https://ilyadev.xyz) — this engine in production with its own
content tree. The site itself is one of the case studies; a meta loop.

## License

[MIT](LICENSE) · © 2026 Ilya Kazantsev.

Security disclosures: see [SECURITY.md](SECURITY.md).
