# Analytics — design

Privacy-first, cookieless, self-hosted. Same-origin ingest endpoint, daily-salted hashed visitor ID, 30-day rolling window for raw queries, indefinite daily aggregates. Five-event taxonomy. Built on Caddy + Node 22 (plain `node:http`) + better-sqlite3 + a nightly rollup job (`server/src/cli/rollup.js`). Admin-only dashboard behind HTTP Basic Auth — no public stats surface.

Off-host backups (B2 / S3 / etc.) and a request-time rate-limit / WAF layer are NOT shipped — both are recommended in front of the `node:http` server but stay deployment concerns. The dashboard does carry a post-hoc bot-flag heuristic (`no_interaction` / `instant_scroll` / `no_idle_pattern`) computed at query time on raw rows; that is a triage aid, not a request gate.

Implementation lives under `server/`; deploy examples live under `deploy/` as `.example` files so host paths and secrets stay out of git.

---

## §1. Event taxonomy

Five events. Smaller is harder to extend; larger is graveyard data.

| # | Event | Payload | Purpose |
|---|---|---|---|
| 1 | `pageview` | `{ path, referrer_host?, lang, theme, device_class }` | Navigation funnel + traffic source |
| 2 | `dwell` | `{ path, max_scroll_pct, active_seconds, total_seconds, interaction_count }` | Real engagement quality (Parse.ly heartbeat model) — `interaction_count` is the running count of resets (scroll / click / keydown / touchstart) since mount, used by the dashboard bot-flag heuristic |
| 3 | `video` | `{ slug, action: 'play' \| 'completed' \| 'mirror_toggle', position_s? }` | Demo engagement per project |
| 4 | `outbound` | `{ kind: 'email' \| 'telegram' \| 'github', href }` | Conversion (email/telegram high; github low — repo is the site itself + empty 5y history) |
| 5 | `interaction` | `{ kind: 'lang_toggle' \| 'theme_toggle' \| 'video_provider_toggle' \| 'copy_markdown' \| 'case_card_click' \| 'case_tab_click', value? }` | UI engagement signal. `case_card_click` / `case_tab_click` are accepted by the server for forward compatibility; current UI sends the first four. |

Common envelope on every event:

```ts
{
  ts: number,            // unix seconds (NOT ms — privacy: ms enables timing fingerprinting)
  visitor_id: string,    // daily-salted SHA256 hash (see §4)
  session_id: string,    // crypto.randomUUID() in sessionStorage (clears on tab close)
  kind: EventKind,
  // ...kind-specific payload
}
```

`device_class` is parsed from User-Agent into one of `mobile | tablet | desktop`. Raw UA never written to disk.

`referrer_host` is `new URL(document.referrer).hostname` when the referrer is cross-origin (different hostname than the current page); null when the referrer is same-origin, empty, or unparseable. Full referrer URL is never stored — only the hostname survives.

---

## §2. Active-time tracking (`dwell`)

Naïve "time on page" counts wall-clock between mount and unmount — meaningless if the tab sits open in the background or the user walks away. The defensible alternative is Parse.ly's heartbeat model: count seconds where the user is *actively* engaged.

### Algorithm

```
state:
  active_seconds   = 0
  total_seconds    = 0
  max_scroll_pct   = 0
  last_interaction = Date.now()

every 1s:
  total_seconds += 1
  if total_seconds >= 1800: stop()                     // 30 min hard cap (GA4 default session timeout)
  if document.visibilityState === 'visible'
     AND (Date.now() - last_interaction) <= 5000:      // 5s idle window
    active_seconds += 1

interaction events (reset last_interaction):
  - scroll (passive listener)
  - click
  - keydown
  - touchstart (passive)
  // mousemove explicitly excluded — see "What's NOT collected" below

scroll handler (continuous):
  pct = round(scrollY / (scrollHeight - innerHeight) * 100), clamped 0..100
  max_scroll_pct = max(max_scroll_pct, pct)
```

### Idle threshold = 5s

Parse.ly's model. Strictest production model in the industry — Chartbeat uses 30s, GA4 uses 10s session-engaged ([Parse.ly KB](https://www.parse.ly/help/kb/parse-ly-measure-engaged-time), [Chartbeat methodology](https://help.chartbeat.com/hc/en-us/articles/360045890913-User-Engagement-Tracking-Methodology), [GA4 docs](https://support.google.com/analytics/answer/12798876)). 5s gives the most honest active-seconds number; lenient thresholds inflate counts on tabs sitting open.

### Hard cap = 30 min

GA4 default session timeout ([GA4 docs](https://support.google.com/analytics/answer/12798876)). Prevents an 8-hour-open tab from contributing 8h of `total_seconds`.

### Visibility gate

`document.visibilityState === 'hidden'` pauses the active counter. Backgrounded tab → no engagement accrual. Universal best practice.

### Flush trigger

```
visibilitychange === 'hidden'   →  navigator.sendBeacon('/api/track', dwellEvent)
pagehide                        →  navigator.sendBeacon('/api/track', dwellEvent)  // Safari ignores `unload`
SPA route change                →  flush + reset for new path
```

`sendBeacon` returns boolean for success but is fire-and-forget — survives page-unload, queued by browser ([MDN sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)). Fallback: `fetch(url, { keepalive: true, method: 'POST' })`.

### What's NOT collected (and why)

- **`mousemove`** — fires 60+/sec, even at 50ms throttle is 20/sec per active user. Pays off only with a heatmap renderer, session replay, or bot/UX-friction analysis ([Mouseflow](https://mouseflow.com/blog/movement-heatmaps/), [Contentsquare](https://contentsquare.com/guides/heatmaps/move-maps/)). This site has none of those — drop. Also: mobile (~30–50% of tech-content traffic) has no mousemove at all → desktop-only signal would distort the dataset.
- **`mouseover`/`mouseenter`** — same reasoning.
- **Per-keystroke value** — privacy disaster, irrelevant on a portfolio.
- **Per-event ms timestamps** — second precision is enough; ms enables timing fingerprinting.

---

## §3. Read-classification

Active seconds and scroll percentage by themselves are weak signals. A 100% scroll in 5 seconds = bot or scroll-skip; a 50% scroll over 4 minutes = engaged but bailed-after-intro. The defensible model is **multi-axis classification** anchored to **content-relative reading time**.

### Reading speed: 130 wpm for technical content

General adult silent-reading baseline is **238 wpm** (Brysbaert 2019 meta-analysis of 190 studies, [readcalc.com](https://readcalc.com/blog/average-reading-speed/)). Technical / code-heavy content runs at **100–150 wpm** ([typecount.com](https://typecount.com/blog/reading-time-calculator), [hakaru.io](https://hakaru.io/guides/words-per-minute-calculator-guide)) — readers slow down to parse syntax and re-read.

For this site (technical case-studies with ASCII diagrams + code identifiers), **130 wpm** is the slow-end of the technical band — defensible floor.

`target_read_time = word_count / 130 wpm`

For the typical 2K-word case study: target = ~15 min full read. "Real read" floor = 25–35% of target ≈ 4 min.

### Classification location: server, not client

Classification happens on the server, not in the client lib. The client ships only raw signals — `active_seconds`, `total_seconds`, `max_scroll_pct`, `interaction_count` — and never knows about the class buckets below. The admin dashboard can classify raw sessions at query time, and the nightly rollup stores per-slug class counts in `daily_aggregates.payload_json.reading_quality_by_slug`. Threshold tuning (`probable_read` corridor, `bounce` cap, etc.) is a server-side SQL/helper change with no client release.

### Multi-axis classification

| `active_seconds` | `max_scroll_pct` | Class | Interpretation |
|---|---|---|---|
| < 10 | any | `bounce` | Mis-click, instant-back. GA4-aligned bounce ([GA4 engagement](https://support.google.com/analytics/answer/12195621)). |
| 10–60 | < 40 | `quick_exit` | Read intro, lost interest. Useful signal. |
| 10–60 | > 80 | `scroll_skip` | Scroll-to-end in <60s — bot OR Spotted-pattern scanner ([NN/G](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)). Distinguished by interaction count. |
| 60–180 | 40–70 | `engaged_scan` | F-pattern reading — normal for technical readers. |
| 180–600 | > 70 | `probable_read` | Active 3–10 min on a 2K-word page → 130–260 wpm corridor. |
| > 600 | > 80 | `deep_read` | Real engagement, possibly re-read. |

Sessions exceeding the 30-min hard cap from §2 stop accruing `active_seconds` at 1800 — they don't have their own bucket, they fall back into `engaged_scan` once the timer is frozen.

### Calibration: "upper-mid technical reader"

The audience is senior engineers and technical hiring managers, not general consumers. NN/G's reading patterns research ([nngroup.com](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)) identifies three relevant patterns:

- **F-pattern** — top horizontal stripe + left rail; ~25% of text actually read on average page visit. Baseline for scanners.
- **Commitment pattern** — high-motivation readers fixate on nearly everything. Maps to `deep_read` class.
- **Spotted pattern** — skipping chunks looking for specific tokens (function names, version numbers). Characteristic of developers scanning docs. *Causes scroll-to-bottom-fast WITHOUT being a bot.*

The Spotted pattern is why `scroll_skip` class can't be auto-treated as bot — it correlates with low `active_seconds` AND low `interaction_count`, but a real scanner has at least 5+ scroll events; bots typically 0–2. Distinguished in the bot-filtering layer (§7).

---

## §4. Privacy model

### Cookieless

No `Set-Cookie`. Session ID is `crypto.randomUUID()` stored in `sessionStorage` — clears on tab close. Defines "session" as "single tab session" — defensible scope, no consent banner.

`sessionStorage` is partitioned per top-level site by Apple ITP / Firefox Total Cookie Protection — fine for our use case (no cross-site tracking intended).

### Visitor ID = daily-salted hash, never raw

```
visitor_id = sha256(daily_salt || ip || ua_family || domain).slice(0, 32)
```

- `daily_salt` — random 32-byte value, rotated at 00:00 UTC, prior salt deleted after 24h grace period (for late `sendBeacon` retries near midnight).
- `ip` — never stored in any form. Only used at hash-time inside the Worker request handler, then discarded.
- `ua_family` — parsed family only (e.g. `Chrome`, `Safari`, `Firefox`); raw UA never stored.
- `domain` — site host; stable input, included for hash-uniqueness across sites if the codebase is reused.

**After salt rotation, the input space is no longer recoverable.** A visitor returning the next day gets a different `visitor_id`. EDPB guidance treats this as not personal data post-rotation, though there is no explicit blessing of this exact pattern. Plausible and Fathom use the same approach in production ([Plausible data policy](https://plausible.io/data-policy), [Fathom data journey](https://usefathom.com/data)).

### Retention

| Layer | Retention | Why |
|---|---|---|
| Raw events | **30 days** | CNIL bar is 13 months; we go stricter as privacy-by-design. |
| Daily aggregates | **∞** | Day-level counts are not personal data. |
| Salt | 1 active day + 1 grace day | Late-arriving events around midnight. |

CNIL Sheet 16 is the canonical EU guideline ([cnil.fr](https://www.cnil.fr/en/sheet-ndeg16-use-analytics-your-websites-and-applications)).

### What is never written to disk

- Raw IP address (used in hash, then discarded)
- Full User-Agent string (only `device_class` + `ua_family` derived)
- Referrer query parameters (only hostname kept)
- Mouse coordinates / movement
- Keystroke values
- Form input
- Precise geo (city / lat-lon). Country code (ISO-2) is reserved in the schema but `NULL` — `lang` already covers the RU/non-RU split that drives most analysis on this site.

### Consent banner

This site relies on the EU "audience-measurement" exemption from prior consent — the design choices in this section (daily-rotating salt, truncated hash, no cookies, no fingerprinting, single-site scope, ≤30-day raw retention, no cross-site joining) line up with what CNIL Sheet n°16 ([cnil.fr](https://www.cnil.fr/en/sheet-ndeg16-use-analytics-your-websites-and-applications)) requires for cookieless audience measurement to be exempt. The exemption is **conditional**, not unconditional:

- A visible information notice is still required (not a cookie banner — a short privacy notice describing what is collected and the right to object).
- An object/opt-out path must exist.
- Data must serve a strict statistical purpose for this site only — no cross-site joining, no marketing repurposing.
- Retention limits must be respected (raw events ≤13 months under CNIL; this site goes stricter at 30 days).
- The 2024–2025 CNIL audience-measurement notes ([cnil.fr/fr](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience)) restate these conditions and clarify that even cookieless tooling falls back to consent if any condition slips.

Plausible and Fathom operate under the same exemption with public privacy notices ([Plausible data policy](https://plausible.io/data-policy), [Fathom data journey](https://usefathom.com/data)); this site mirrors that posture, not a blanket "no consent ever" claim.

---

## §5. Architecture

```
[Browser]
    │
    │  navigator.sendBeacon('/api/track', JSON)
    ▼
[Caddy on :443]                                   single VPS, EU region
    │  reverse_proxy /api/* → :3000
    │  reverse_proxy /admin/* → :3000
    │  file_server / → /srv/portfolio/dist  (Vite static)
    ▼
[Node 22 (plain node:http) + better-sqlite3 on :3000]
    │  validate(Sec-Fetch-Site) · parse_ua · daily_salt_hash · INSERT
    ▼
[SQLite WAL]                                      /opt/portfolio-analytics/data/events.db
    │
    ├─► nightly rollup timer (00:10 UTC)          events → daily_aggregates → drop raw >30d
    │
    └─► optional local backup timer (00:30 UTC)   sqlite3 ".backup" → gzip under server/data/backups
```

### Three processes total (systemd units)

- `caddy.service` — reverse proxy + ACME
- `portfolio-analytics.service` — Node server (plain `node:http`, the only application code we ship)
- `portfolio-backup.timer` (+ `.service`) — optional local gzipped SQLite backup under `server/data/backups`; off-host copy / retention stays a deployment concern.

Plus one rollup timer (`portfolio-rollup.timer`) firing nightly inside the same Node process via a small CLI entry — no separate daemon.

### Stack choices

| Layer | Pick | Alternative considered | Why |
|---|---|---|---|
| Runtime | **Node 22 LTS** | Bun | Bun's `bun:sqlite` ships parity gaps with `better-sqlite3` ([oven-sh/bun#16909](https://github.com/oven-sh/bun/issues/16909)); Bun breaks minor-version contracts in production (NODE_ENV defaults shifted in 1.1, `idleTimeout` in 1.1.26 — [dev.to/synsun](https://dev.to/synsun/bun-vs-nodejs-in-production-what-three-months-of-real-traffic-taught-me-3d96)); `bun build --compile` has open issues with standalone-binary completeness ([oven-sh/bun#14676](https://github.com/oven-sh/bun/issues/14676)). At 200 events/day, Node has 7 orders of magnitude headroom — Bun's perf advantages are invisible. |
| HTTP framework | **Plain `node:http`** | Hono, Fastify, Express | One ingest endpoint + ~5 admin endpoints don't earn a 5KB framework dependency. ~30 LOC manual `switch` on `req.method + req.url` is more readable than a router config and trivially auditable in DevTools. Hono's value (multi-runtime portability, Cloudflare-style API) only matters if hosting moves to Workers — explicit non-goal here. |
| SQLite binding | **better-sqlite3** | bun:sqlite | 5–6M weekly downloads, 6+ years production, zero Snyk vulns ([npm](https://www.npmjs.com/package/better-sqlite3), [Snyk](https://security.snyk.io/package/npm/better-sqlite3)). Synchronous API simpler than async sqlite drivers; for INSERT-heavy single-writer workloads it's the boring right answer. |
| Database | **SQLite WAL** | PostgreSQL | Postgres earns weight only with concurrent writers / JSONB BI / multi-process — none apply ([Airbyte](https://airbyte.com/data-engineering-resources/sqlite-vs-postgresql)). For 200 events/day on a single writer, SQLite WAL with `synchronous=NORMAL` is faster than Postgres on a 1GB-RAM VPS. |
| Reverse proxy | **Caddy** | nginx, Traefik | Native ACME (zero cert-renewal scripts), single-file Caddyfile, HTTP Basic Auth out of the box ([Programonaut comparison](https://www.programonaut.com/reverse-proxies-compared-traefik-vs-caddy-vs-nginx-docker/), [Tyblog benchmark](https://blog.tjll.net/reverse-proxy-hot-dog-eating-contest-caddy-vs-nginx/)). Lowest ops weight for solo. |
| Backup | **Optional local `sqlite3 ".backup"` + gzip** | Litestream / B2 / S3 | The shipped `.example` unit gives a simple local backup hook. Off-host retention is recommended before serious production use, but intentionally not encoded in this public template because credentials, bucket names, and rotation policy are host-specific. |
| Auth | **HTTP Basic Auth in Node (`server/src/admin.js`)** | Caddy `basicauth` directive, token-in-URL, magic link | RFC 7617 + HTTPS endorsed in 2026. Auth lives in the Node app so admin endpoints stay protected without depending on Caddy config. Constant-time compare via `crypto.timingSafeEqual` on equal-length `Buffer.from(...)` pairs. Token-in-URL leaks via Referer / browser history / clipboard. |

### Endpoint shape

```
POST /api/track
  Content-Type: application/json
  Sec-Fetch-Site: same-origin   (validated; reject otherwise)
  Body: { kind, ts, session_id, ...payload }
Response: 204 No Content (always — no echo)

GET  /admin                 → server-rendered HTML dashboard, behind Basic Auth in Node
GET  /admin/api/snapshot    → today's counts (visitors, sessions, pageviews, deep_reads)
GET  /admin/api/30d         → last-30d daily aggregates + per-route breakdown
GET  /admin/api/sessions    → recent raw sessions (debug; auto-bot-flagged)
GET  /admin/api/health      → salt rotation timestamp, last rollup, DB size
GET  /admin/api/report      → all-in-one consolidated JSON (everything the HTML
                              dashboard renders, in one fetch — agent-friendly;
                              same Basic Auth, no public surface)
```

**No public stats endpoint.** A public live-counter on a low-traffic portfolio is a reverse signal — volatile small numbers read as adoption-failure rather than honest telemetry. Anything served behind Basic Auth has zero public surface and zero adblock-loss path; the live numbers are an admin tool, not a feature.

### VPS sizing

1 vCPU / 1 GB RAM / 20 GB SSD handles 200/day with 100× spike headroom. Caddy + Node idle at ~50 MB RAM total.

---

## §6. Schema

```sql
-- Event log (append-only, 30-day retention)
CREATE TABLE events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ts            INTEGER NOT NULL,           -- unix epoch seconds
  visitor_id    TEXT    NOT NULL,           -- daily-salted SHA256 hash, 32 hex chars
  session_id    TEXT    NOT NULL,           -- crypto.randomUUID() per tab session
  kind          TEXT    NOT NULL,           -- 'pageview' | 'dwell' | 'video' | 'outbound' | 'interaction'
  path          TEXT,                       -- e.g. '/', '/cases/ai-crm'
  referrer_host TEXT,                       -- hostname only, never full URL
  lang          TEXT,                       -- 'en' | 'ru' | 'ar'
  theme         TEXT,                       -- 'dark' | 'light'
  device_class  TEXT,                       -- 'mobile' | 'tablet' | 'desktop'
  country_code  TEXT,                       -- 2-char ISO; reserved, nullable.
  payload_json  TEXT                        -- per-event extra fields (kind-specific; see §1)
);
CREATE INDEX events_ts_idx       ON events(ts);
CREATE INDEX events_visitor_idx  ON events(visitor_id);
CREATE INDEX events_session_idx  ON events(session_id);
CREATE INDEX events_kind_path_idx ON events(kind, path);

-- Daily salt rotation
CREATE TABLE salt (
  day   TEXT PRIMARY KEY,                   -- 'YYYY-MM-DD'
  value TEXT NOT NULL                       -- 64 hex chars (32 random bytes)
);

-- Long-term aggregates (kept indefinitely)
CREATE TABLE daily_aggregates (
  day               TEXT PRIMARY KEY,       -- 'YYYY-MM-DD'
  unique_visitors   INTEGER NOT NULL,
  sessions          INTEGER NOT NULL,
  pageviews         INTEGER NOT NULL,
  outbound_email    INTEGER NOT NULL DEFAULT 0,
  outbound_telegram INTEGER NOT NULL DEFAULT 0,
  outbound_github   INTEGER NOT NULL DEFAULT 0,
  payload_json      TEXT                    -- JSON: per-route breakdown, top referrer hosts,
                                            --       dwell P50/P75/P95,
                                            --       reading_quality_by_slug:
                                            --         { [slug]: { bounce, quick_exit, scroll_skip,
                                            --                     engaged_scan, probable_read, deep_read } }
                                            --       (classification computed at rollup time per §3)
);
```

### SQLite pragmas at startup

```sql
PRAGMA journal_mode = WAL;            -- concurrent reads while writing
PRAGMA synchronous = NORMAL;          -- WAL makes FULL redundant at this volume
PRAGMA journal_size_limit = 67108864; -- 64 MB cap; without this WAL grows under bursty writes
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456;         -- 256 MB; file fits in mmap entirely at expected scale
```

### Retention enforcement

Nightly rollup timer at 00:10 UTC:

```sql
-- Aggregate yesterday into daily_aggregates
INSERT INTO daily_aggregates (...) SELECT ... FROM events WHERE ts >= ? AND ts < ?;

-- Drop raw events older than 30 days
DELETE FROM events WHERE ts < strftime('%s', 'now', '-30 days');

-- Vacuum monthly to reclaim space (only when DELETE freed >10MB)
VACUUM;

-- Salt rotation runs inside the same nightly rollup pipeline (no separate
-- timer): on first request after midnight UTC, ensureSalt() lazily inserts a
-- new daily row, and the rollup CLI calls pruneSalts() to drop rows older
-- than today + yesterday (1-day grace for late beacons near midnight).
```

---

## §7. Bot filtering

Bot filtering applies in shipped application/query code, with an optional edge layer left to deployment.

### Layer 1 — edge proxy (deployment concern)

The public `deploy/Caddyfile.example` stays minimal: static files plus same-origin reverse proxy. A real host may add UA filtering, rate limits, CDN WAF rules, or fail2ban-style log processing in front of `/api/track`, but those rules are not shipped because edge modules and traffic policy vary by deployment.

### Layer 2 — ingest validate (application)

In `server/src/ingest.js` (plain `node:http` request handler):

```
- Reject non-POST methods on /api/track (405)
- Reject Content-Length > 4 KB (oversize body)
- Reject non-JSON bodies (parse failure → 400, dropped)
- Reject unknown `kind` values
- Reject events with invalid timestamps (drift > 5 min from server clock)
- Reject events with malformed payload schema (hand-rolled validators per kind — no Zod;
  one extra dep is more weight than five typeof checks)
- Drop events with `kind === 'pageview'` but `path` not in known route whitelist
- Always respond 204 No Content on accept; never echo input
```

### Layer 3 — SQL filter (analytic)

Applied at dashboard query time, not at write time (preserves raw signal for debugging):

```sql
-- Sessions to exclude from "real visitor" metrics:
WITH session_signals AS (
  SELECT
    session_id,
    COUNT(*) FILTER (WHERE kind = 'pageview') AS pageviews,
    COUNT(*) FILTER (WHERE kind = 'interaction') AS interactions,
    COUNT(*) FILTER (WHERE kind = 'dwell') AS dwells,
    MAX(json_extract(payload_json, '$.max_scroll_pct')) AS max_scroll,
    MAX(json_extract(payload_json, '$.active_seconds')) AS max_active,
    MAX(json_extract(payload_json, '$.total_seconds')) AS max_total
  FROM events
  GROUP BY session_id
),
flagged AS (
  SELECT session_id, CASE
    -- pageviews but no interaction events → likely server-side scraper
    WHEN pageviews > 0 AND interactions = 0 AND dwells = 0 THEN 'no_interaction'
    -- scroll to 100% with active < 2s → impossible for human
    WHEN max_scroll >= 100 AND max_active < 2 THEN 'instant_scroll'
    -- active_seconds == total_seconds for > 60s → impossible (humans micro-pause)
    WHEN max_active = max_total AND max_active > 60 THEN 'no_idle_pattern'
    ELSE NULL
  END AS bot_flag
  FROM session_signals
)
-- Use in metrics: WHERE session_id NOT IN (SELECT session_id FROM flagged WHERE bot_flag IS NOT NULL)
```

### Layer 4 — dashboard (visible)

The dashboard shows "raw" and "filtered" counts side-by-side, with per-filter breakdown of how many sessions each rule dropped. Black-box filtering hides bugs; explainable filtering surfaces them.

---

## §8. Anti-patterns flagged (and rejected)

What this design explicitly does NOT do, with the reasoning:

- **No `mousemove` capture.** Pays off only with a heatmap renderer. We don't have one. Mobile (no cursor) would skew the dataset desktop-only.
- **No session replay.** Hotjar/FullStory class — post-2024 EU rulings classify as wiretap-class data ([dataflirt.com](https://dataflirt.com/blog/top-7-anti-bot-detection-services-that-protect-websites-and-how-scrapers-beat-them/)); storage explodes; cost-benefit is negative on a portfolio.
- **No fingerprint composite (UA + IP + Canvas + WebGL).** EDPB-2024 treats this as personal data — defeats the no-consent-banner posture.
- **No third-party `<script>` analytics.** Lighthouse TBT/LCP regression; ~30% adblock loss; defeats first-party design.
- **No precise geo.** Country code (ISO-2) is the most we keep. City / lat-lon = consent territory. `lang` (en/ru/ar) is the audience-segmentation signal we actually use.
- **No millisecond timestamps.** Second precision is sufficient; ms enables timing attacks (fingerprinting via clock jitter).
- **No raw IP storage.** Used in hash, then discarded. Salt rotation makes hashes un-joinable across days.
- **No keystroke value capture.** DSAR liability, irrelevant on a portfolio.
- **No cookies.** sessionStorage + UUID handles the "session" concept without persistence beyond tab close.

### Anti-patterns flagged for OPS (things that bite first)

- **No off-host backup** — the shipped local `.backup` timer is only the first line of defence. Before treating analytics as durable, copy backups to B2/S3/rsync storage with explicit retention.
- **Logs eat the disk before events do** — `logrotate` configured at install time, not "later".
- **`PRAGMA journal_size_limit` unset** → WAL grows under bursty writes → "database is locked" → silent data loss.
- **Missing `Cache-Control: no-store` on `/api/track`** — Caddy can cache POST responses if misconfigured. Set explicitly in handler.
- **`PRAGMA synchronous = FULL` chosen "to be safe"** — halves write throughput for no real durability gain on WAL. NORMAL is correct.
- **Salt rotation failure is silent** — daily salt mismatch = privacy policy violation. The dashboard exposes the last rotation timestamp; production deployments should also add an external healthcheck if analytics matters operationally.
