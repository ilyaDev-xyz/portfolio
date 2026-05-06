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
