// POST /api/track validators + INSERT. See docs/analytics.md §7 Layer 2.

import { getDb } from './db.js';
import { visitorIdFor } from './salt.js';
import { parseDeviceClass, parseUaFamily } from './ua.js';
import { KNOWN_PATHS, KNOWN_SLUGS } from './constants.js';

const KNOWN_KINDS = new Set(['pageview', 'dwell', 'video', 'outbound', 'interaction']);
const KNOWN_LANGS = new Set(['en', 'ru', 'ar']);
const KNOWN_OUTBOUND = new Set(['email', 'telegram', 'github']);
const KNOWN_VIDEO_ACTIONS = new Set(['play', 'completed', 'mirror_toggle']);
const KNOWN_INTERACTIONS = new Set([
  'lang_toggle',
  'theme_toggle',
  'video_provider_toggle',
  'case_card_click',
  'case_tab_click',
  'copy_markdown',
]);

const MAX_BODY = 4096;
const TS_DRIFT_S = 5 * 60;
const MAX_VIDEO_POSITION_S = 6 * 60 * 60;
const SITE_DOMAIN = process.env.SITE_DOMAIN;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let len = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      len += chunk.length;
      if (len > MAX_BODY) {
        req.destroy();
        reject(new Error('body_too_large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function clientIp(req) {
  // Behind Caddy in prod, X-Forwarded-For carries the client IP.
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress ?? '';
}

/**
 * Per-kind payload validator. Pure function — exported for unit testing.
 * Returns the canonical insert-ready row shape on success, or null on any
 * schema/whitelist failure. The HTTP handler then wraps the row with
 * Sec-Fetch-Site / body-size / timestamp-drift checks.
 */
export function validatePayload(kind, body) {
  switch (kind) {
    case 'pageview': {
      if (typeof body.path !== 'string' || !KNOWN_PATHS.has(body.path)) return null;
      const referrerHost =
        typeof body.referrer_host === 'string' &&
        body.referrer_host.trim().length > 0 &&
        body.referrer_host.length <= 200
          ? body.referrer_host
          : null;
      return {
        path: body.path,
        referrer_host: referrerHost,
        lang: KNOWN_LANGS.has(body.lang) ? body.lang : null,
        theme: body.theme === 'dark' || body.theme === 'light' ? body.theme : null,
        payload: null,
      };
    }
    case 'dwell': {
      if (typeof body.path !== 'string' || !KNOWN_PATHS.has(body.path)) return null;
      const numeric = ['active_seconds', 'total_seconds', 'max_scroll_pct', 'interaction_count'];
      for (const k of numeric) {
        if (
          typeof body[k] !== 'number' ||
          !Number.isFinite(body[k]) ||
          body[k] < 0 ||
          body[k] > 100000
        ) return null;
      }
      return {
        path: body.path,
        referrer_host: null,
        lang: null,
        theme: null,
        payload: {
          active_seconds: Math.floor(body.active_seconds),
          total_seconds: Math.floor(body.total_seconds),
          max_scroll_pct: Math.max(0, Math.min(100, Math.floor(body.max_scroll_pct))),
          interaction_count: Math.floor(body.interaction_count),
        },
      };
    }
    case 'video': {
      if (typeof body.slug !== 'string' || !KNOWN_SLUGS.has(body.slug)) return null;
      if (!KNOWN_VIDEO_ACTIONS.has(body.action)) return null;
      const p = { slug: body.slug, action: body.action };
      if (
        typeof body.position_s === 'number' &&
        Number.isFinite(body.position_s) &&
        body.position_s >= 0 &&
        body.position_s <= MAX_VIDEO_POSITION_S
      ) {
        p.position_s = Math.floor(body.position_s);
      }
      return { path: null, referrer_host: null, lang: null, theme: null, payload: p };
    }
    case 'outbound': {
      if (!KNOWN_OUTBOUND.has(body.kind)) return null;
      return {
        path: null,
        referrer_host: null,
        lang: null,
        theme: null,
        payload: {
          kind: body.kind,
          href: typeof body.href === 'string' ? body.href.slice(0, 500) : null,
        },
      };
    }
    case 'interaction': {
      if (!KNOWN_INTERACTIONS.has(body.kind)) return null;
      const p = { kind: body.kind };
      if (typeof body.value === 'string') p.value = body.value.slice(0, 100);
      return { path: null, referrer_host: null, lang: null, theme: null, payload: p };
    }
  }
  return null;
}

let insertStmt;

function getInsertStmt() {
  if (!insertStmt) {
    insertStmt = getDb().prepare(`
      INSERT INTO events
        (ts, visitor_id, session_id, kind, path, referrer_host, lang, theme, device_class, country_code, payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
    `);
  }
  return insertStmt;
}

export async function handleIngest(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405).end();
    return;
  }
  // Sec-Fetch-Site: same-origin required. Browsers attach it on fetch();
  // anything cross-site, opaque, or non-browser (curl, no header) is rejected.
  // See analytics.md §7 endpoint shape.
  if (req.headers['sec-fetch-site'] !== 'same-origin') {
    res.writeHead(403).end();
    return;
  }
  let raw;
  try {
    raw = await readBody(req);
  } catch {
    res.writeHead(413).end();
    return;
  }
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.writeHead(400).end();
    return;
  }
  if (typeof body.ts !== 'number' || !Number.isFinite(body.ts)) {
    res.writeHead(400).end();
    return;
  }
  const nowS = Math.floor(Date.now() / 1000);
  if (Math.abs(body.ts - nowS) > TS_DRIFT_S) {
    res.writeHead(400).end();
    return;
  }
  if (
    typeof body.session_id !== 'string' ||
    body.session_id.trim().length === 0 ||
    body.session_id.length > 100
  ) {
    res.writeHead(400).end();
    return;
  }
  if (!KNOWN_KINDS.has(body.kind)) {
    res.writeHead(400).end();
    return;
  }
  const validated = validatePayload(body.kind, body);
  if (!validated) {
    res.writeHead(400).end();
    return;
  }

  const ua = req.headers['user-agent'] ?? '';
  const uaFamily = parseUaFamily(ua);
  const deviceClass = parseDeviceClass(ua);
  const ip = clientIp(req);
  const visitorId = visitorIdFor(ip, uaFamily, SITE_DOMAIN);

  try {
    getInsertStmt().run(
      body.ts,
      visitorId,
      body.session_id,
      body.kind,
      validated.path,
      validated.referrer_host,
      validated.lang,
      validated.theme,
      deviceClass,
      validated.payload ? JSON.stringify(validated.payload) : null,
    );
  } catch (e) {
    console.error('ingest INSERT failed', e);
    res.writeHead(500).end();
    return;
  }
  res.writeHead(204, { 'Cache-Control': 'no-store' }).end();
}
