# portfolio-analytics

Privacy-first telemetry server. Plain `node:http` + `better-sqlite3`. Design doc: `docs/analytics.md`.

## Local dev

```bash
cd server
cp .env.example .env
# edit .env — set ADMIN_PASSWORD (intentionally blank in .env.example so a
#             careless cp does not inherit a real-looking default; dev accepts
#             an empty password with a loud warning, production refuses to
#             start unless it is set)
npm install
npm start
```

Server listens on `:3000`. Vite dev proxies `/api` and `/admin` to it.

- `/api/track` — POST ingest endpoint (no auth).
- `/admin` — dashboard HTML (Basic Auth).
- `/admin/api/{snapshot,30d,sessions,health}` — granular JSON endpoints (Basic Auth).
- `/admin/api/report` — agent-friendly all-in-one JSON: same data as `/admin` HTML, single fetch.

## Rollup (manual / cron)

```bash
npm run rollup    # aggregates yesterday + prunes raw >30d + rotates salt
```

Idempotent. In production this fires nightly via `portfolio-rollup.timer` (added at deploy time, task #5).

## Files

- `src/index.js` — http dispatch (`/api/track` → ingest, `/admin/*` → admin, else 404)
- `src/db.js` — SQLite open + schema + WAL pragmas
- `src/salt.js` — daily salt rotation + visitor_id hash
- `src/ua.js` — UA family + device-class parser
- `src/ingest.js` — POST /api/track validators + INSERT
- `src/admin.js` — Basic Auth + dashboard HTML + JSON endpoints
- `src/rollup.js` — nightly aggregate (callable + reusable)
- `src/cli/rollup.js` — CLI entry for systemd timer
