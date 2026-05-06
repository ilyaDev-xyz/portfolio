// portfolio-analytics — main entry. Plain node:http, ~30 LOC dispatch.
// See docs/analytics.md §5 / §9.2.

import { createServer } from 'node:http';
import { openDb, closeDb } from './db.js';
import { ensureSalt } from './salt.js';
import { handleIngest } from './ingest.js';
import { handleAdmin, adminConfigured } from './admin.js';

if (!process.env.SITE_DOMAIN) {
  console.error('FATAL: SITE_DOMAIN is required (set in .env). See .env.example.');
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || '3000', 10);
// Default to 127.0.0.1 — Caddy is the public surface, the analytics server
// should not answer requests from the open internet directly. Override
// HOST=0.0.0.0 in `.env` if you really need external access.
const HOST = process.env.HOST || '127.0.0.1';
const DB_PATH = process.env.DB_PATH || './data/events.db';

openDb(DB_PATH);
ensureSalt();

if (!adminConfigured()) {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'FATAL: ADMIN_PASSWORD is required in production. Set it in .env. See .env.example.',
    );
    process.exit(1);
  }
  console.warn(
    '⚠ admin auth NOT configured — set ADMIN_PASSWORD in .env to enable /admin',
  );
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname;

  if (path === '/api/track') {
    handleIngest(req, res).catch((e) => {
      console.error('ingest unhandled', e);
      try {
        res.writeHead(500).end();
      } catch {}
    });
    return;
  }
  if (path === '/admin' || path.startsWith('/admin/')) {
    handleAdmin(req, res);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`portfolio-analytics on ${HOST}:${PORT}, db=${DB_PATH}`);
});

function shutdown() {
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
