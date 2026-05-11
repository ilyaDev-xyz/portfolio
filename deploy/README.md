# Deploy examples

Example-only deploy files for a self-hosted static portfolio plus same-origin
analytics server.

Copy these files outside the repo and replace every `/srv/portfolio` and
`portfolio.example.com` placeholder with host paths. Keep real `.env`, Caddy
site files, and systemd unit copies out of git.

## Files

- `Caddyfile.example` — static `dist/` host, SPA fallback, `/api/*` and `/admin/*` proxy.
- `systemd/portfolio-analytics.service.example` — Node analytics server.
- `systemd/portfolio-rollup.timer.example` + `.service.example` — daily aggregate rollup.
- `systemd/portfolio-backup.timer.example` + `.service.example` — nightly SQLite backup hook.

## Agent surface headers

`/llms.txt`, `/llms-ru.txt`, `/llms-ar.txt`, and `/llms-full.txt` are public
crawler entry points. Serve them as `text/plain; charset=utf-8`, with no
`X-Robots-Tag`, and with `Cache-Control: no-cache, must-revalidate`.

Per-page `.txt` mirrors are duplicate-readable agent material. They contain
Markdown syntax but are served as `text/plain; charset=utf-8` to stay boring
for strict AI fetch proxies. Legacy `.md` URLs redirect to the canonical `.txt`
mirrors but are not advertised in `llms.txt`, sitemap, or alternate links.
Do not use `nofollow` on llms or text mirrors: agents and crawler search layers
need to follow the links inside them.

Only hashed Vite assets under `/assets/*` should be immutable. Plain text,
HTML, robots, sitemap, and agent mirrors must revalidate.

Use `encode gzip`, not `encode zstd gzip`. Some AI fetch proxies advertise zstd
but fail to decode it downstream, which can surface as opaque 502s even though
direct browser and curl requests work.

Keep the `Link: </llms.txt>; rel="llms-txt"` discovery header on normal site
responses, not on `/llms*.txt` or mirror responses themselves. Text agent files
should be boring: status 200, UTF-8 text, no self-referential discovery header.

## Minimal flow

```sh
cd /srv/portfolio
npm ci
npm run build:public
cd server
npm ci --omit=dev
npm start
```

Run the systemd units from the host, not from the repository checkout.
