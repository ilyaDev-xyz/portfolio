// Admin dashboard. HTTP Basic Auth + minimal HTML page + JSON endpoints.
// No public surface — see docs/analytics.md §9.1.

import { timingSafeEqual } from 'node:crypto';
import { getDb } from './db.js';
import { lastSaltRotation } from './salt.js';
import { classifyDwell, emptyClassCounts, dbSizeKb } from './rollup.js';
import { CASE_SLUGS } from './constants.js';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
if (!ADMIN_PASSWORD) {
  console.warn(
    '[admin] ADMIN_PASSWORD not set — /admin endpoints return 401 until configured.',
  );
}
const REALM = 'portfolio-analytics admin';

function unauthorized(res) {
  res.writeHead(401, {
    'WWW-Authenticate': `Basic realm="${REALM}"`,
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end('Unauthorized');
}

function checkAuth(req) {
  if (!ADMIN_PASSWORD) return false;
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Basic ')) return false;
  let decoded;
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  } catch {
    return false;
  }
  const idx = decoded.indexOf(':');
  if (idx === -1) return false;
  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  const expectedUser = Buffer.from(ADMIN_USER);
  const expectedPass = Buffer.from(ADMIN_PASSWORD);
  const givenUser = Buffer.from(user);
  const givenPass = Buffer.from(pass);
  if (givenUser.length !== expectedUser.length) return false;
  if (givenPass.length !== expectedPass.length) return false;
  return (
    timingSafeEqual(givenUser, expectedUser) &&
    timingSafeEqual(givenPass, expectedPass)
  );
}

function jsonResponse(res, data) {
  const body = JSON.stringify(data);
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, max-age=60',
  });
  res.end(body);
}

function todayTsStart() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function snapshotData() {
  const db = getDb();
  const tsStart = todayTsStart();
  const row = db
    .prepare(
      `SELECT
         COUNT(DISTINCT visitor_id) AS unique_visitors,
         COUNT(DISTINCT session_id) AS sessions,
         SUM(CASE WHEN kind = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
         SUM(CASE WHEN kind = 'outbound' THEN 1 ELSE 0 END) AS outbound
       FROM events WHERE ts >= ?`,
    )
    .get(tsStart);
  const deep = db
    .prepare(
      `SELECT COUNT(*) AS deep_reads FROM events
       WHERE ts >= ? AND kind = 'dwell'
         AND CAST(json_extract(payload_json, '$.active_seconds') AS INTEGER) > 600
         AND CAST(json_extract(payload_json, '$.max_scroll_pct') AS INTEGER) > 80`,
    )
    .get(tsStart);
  return {
    unique_visitors: row.unique_visitors || 0,
    sessions: row.sessions || 0,
    pageviews: row.pageviews || 0,
    outbound: row.outbound || 0,
    deep_reads: deep.deep_reads || 0,
  };
}

function thirtyDayData() {
  const db = getDb();
  const daily = db
    .prepare(
      `SELECT day, unique_visitors, sessions, pageviews
       FROM daily_aggregates
       WHERE day >= date('now', '-30 days')
       ORDER BY day DESC`,
    )
    .all();

  const routesRows = db
    .prepare(
      `SELECT path, COUNT(*) AS pageviews FROM events
       WHERE kind = 'pageview' AND ts >= strftime('%s', 'now', '-30 days')
       GROUP BY path
       ORDER BY pageviews DESC`,
    )
    .all();
  const routes = routesRows.map((r) => ({ ...r, median_dwell_s: 0 }));
  for (const r of routes) {
    const dwells = db
      .prepare(
        `SELECT CAST(json_extract(payload_json, '$.active_seconds') AS INTEGER) AS a
         FROM events
         WHERE kind = 'dwell' AND path = ? AND ts >= strftime('%s', 'now', '-30 days')
         ORDER BY a`,
      )
      .all(r.path)
      .map((x) => x.a);
    if (dwells.length > 0) {
      const mid = Math.floor(dwells.length / 2);
      r.median_dwell_s =
        dwells.length % 2 === 0
          ? Math.round((dwells[mid - 1] + dwells[mid]) / 2)
          : dwells[mid];
    }
  }

  const reading_quality_by_slug = {};
  for (const slug of CASE_SLUGS) {
    const counts = emptyClassCounts();
    const rows = db
      .prepare(
        `SELECT
           MAX(CAST(json_extract(payload_json, '$.active_seconds') AS INTEGER)) AS active,
           MAX(CAST(json_extract(payload_json, '$.max_scroll_pct') AS INTEGER)) AS max_scroll
         FROM events
         WHERE kind = 'dwell' AND path = ? AND ts >= strftime('%s', 'now', '-30 days')
         GROUP BY session_id`,
      )
      .all(`/cases/${slug}`);
    for (const r of rows) counts[classifyDwell(r.active || 0, r.max_scroll || 0)]++;
    reading_quality_by_slug[slug] = counts;
  }

  return { daily, routes, reading_quality_by_slug };
}

function sessionsData() {
  const rows = getDb()
    .prepare(
      `SELECT
         session_id,
         MIN(datetime(ts, 'unixepoch')) AS started,
         COUNT(*) AS events,
         SUM(CASE WHEN kind = 'pageview' THEN 1 ELSE 0 END) AS pvs,
         SUM(CASE WHEN kind = 'interaction' THEN 1 ELSE 0 END) AS ints,
         SUM(CASE WHEN kind = 'dwell' THEN 1 ELSE 0 END) AS dws,
         MAX(CAST(json_extract(payload_json, '$.max_scroll_pct') AS INTEGER)) AS max_scroll,
         MAX(CAST(json_extract(payload_json, '$.active_seconds') AS INTEGER)) AS max_active,
         MAX(CAST(json_extract(payload_json, '$.total_seconds') AS INTEGER)) AS max_total
       FROM events
       WHERE ts >= strftime('%s', 'now', '-7 days')
       GROUP BY session_id
       ORDER BY MIN(ts) DESC
       LIMIT 50`,
    )
    .all();
  for (const r of rows) {
    r.bot_flag = null;
    if (r.pvs > 0 && r.ints === 0 && r.dws === 0) r.bot_flag = 'no_interaction';
    else if (r.max_scroll >= 100 && r.max_active < 2) r.bot_flag = 'instant_scroll';
    else if (r.max_active === r.max_total && r.max_active > 60)
      r.bot_flag = 'no_idle_pattern';
  }
  return { sessions: rows };
}

function healthData() {
  const db = getDb();
  const dbPath = process.env.DB_PATH || './data/events.db';
  const eventsCount = db.prepare('SELECT COUNT(*) AS n FROM events').get().n;
  const aggDays = db.prepare('SELECT COUNT(*) AS n FROM daily_aggregates').get().n;
  return {
    salt_last_rotated: lastSaltRotation(),
    last_rollup: db.prepare('SELECT MAX(day) AS d FROM daily_aggregates').get().d,
    db_size_kb: dbSizeKb(dbPath),
    events_raw_count: eventsCount,
    aggregate_days: aggDays,
  };
}

// Single agent-friendly endpoint: everything the HTML dashboard renders, in one JSON.
// Same data sources as the granular endpoints — call them, wrap with metadata.
function reportData() {
  return {
    generated_at: new Date().toISOString(),
    domain: process.env.SITE_DOMAIN,
    today: snapshotData(),
    last_30_days: thirtyDayData(),
    recent_sessions: sessionsData().sessions,
    health: healthData(),
  };
}

const HTML_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>portfolio-analytics — admin</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <style>
    :root { color-scheme: dark; }
    body { font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; background: #110e0b; color: #d6cfb8; margin: 0; padding: 28px 32px 64px; max-width: 1100px; }
    h1 { font-size: 16px; font-weight: 500; margin: 0 0 4px; letter-spacing: -0.01em; }
    h2 { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #8a7e5e; margin: 28px 0 12px; }
    a { color: #e8b56a; }
    .links { color: #6b6249; margin: 0 0 8px; }
    .links a { margin-right: 12px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 5px 16px 5px 0; text-align: left; vertical-align: top; }
    th { color: #8a7e5e; font-weight: 500; border-bottom: 1px solid #2a241a; }
    td { border-bottom: 1px solid #1a160f; }
    .num { font-variant-numeric: tabular-nums; text-align: right; padding-right: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px 28px; margin: 12px 0 4px; }
    .stat-label { color: #6b6249; text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em; }
    .stat-value { font-size: 22px; color: #e8e3cf; font-variant-numeric: tabular-nums; }
    .muted { color: #6b6249; }
    code { color: #e8b56a; }
    .health div { margin: 2px 0; }
  </style>
</head>
<body>
  <h1>portfolio-analytics — admin</h1>
  <p class="links">
    <a href="/admin/api/snapshot">snapshot.json</a>
    <a href="/admin/api/30d">30d.json</a>
    <a href="/admin/api/sessions">sessions.json</a>
    <a href="/admin/api/health">health.json</a>
    <a href="/admin/api/report">report.json</a>
  </p>
  <h2>Today</h2>
  <div id="snapshot" class="grid"></div>
  <h2>Last 30 days · daily</h2>
  <div id="trends"></div>
  <h2>Per-route · 30d</h2>
  <div id="routes"></div>
  <h2>Reading quality · 30d · per case</h2>
  <div id="reading"></div>
  <h2>Recent sessions · 7d</h2>
  <div id="sessions"></div>
  <h2>Health</h2>
  <div id="health" class="health muted"></div>

  <script>
    const $ = (id) => document.getElementById(id);
    function el(tag, cls, text) {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text !== undefined) node.textContent = String(text);
      return node;
    }
    async function j(url) {
      const r = await fetch(url, { credentials: 'same-origin' });
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }

    j('/admin/api/snapshot').then((d) => {
      const root = $('snapshot');
      const stats = [
        ['Visitors', d.unique_visitors],
        ['Sessions', d.sessions],
        ['Pageviews', d.pageviews],
        ['Deep reads', d.deep_reads],
        ['Outbound', d.outbound],
      ];
      for (const [l, v] of stats) {
        const wrap = document.createElement('div');
        wrap.append(el('div', 'stat-label', l));
        wrap.append(el('div', 'stat-value', v));
        root.append(wrap);
      }
    });

    j('/admin/api/30d').then((d) => {
      // daily
      const t = el('table');
      const head = el('tr');
      ['Day', 'Visitors', 'Sessions', 'Pageviews'].forEach((h, i) => {
        head.append(el('th', i > 0 ? 'num' : ''));
        head.lastChild.textContent = h;
      });
      const thead = el('thead'); thead.append(head); t.append(thead);
      const body = el('tbody');
      for (const r of d.daily) {
        const tr = el('tr');
        tr.append(el('td', '', r.day));
        tr.append(el('td', 'num', r.unique_visitors));
        tr.append(el('td', 'num', r.sessions));
        tr.append(el('td', 'num', r.pageviews));
        body.append(tr);
      }
      t.append(body);
      $('trends').append(t);

      // routes
      const rt = el('table');
      const rhead = el('tr');
      ['Path', 'Pageviews', 'Median dwell (s)'].forEach((h, i) => {
        const th = el('th', i > 0 ? 'num' : '');
        th.textContent = h; rhead.append(th);
      });
      const rthead = el('thead'); rthead.append(rhead); rt.append(rthead);
      const rb = el('tbody');
      for (const r of d.routes) {
        const tr = el('tr');
        tr.append(el('td', '', r.path));
        tr.append(el('td', 'num', r.pageviews));
        tr.append(el('td', 'num', r.median_dwell_s));
        rb.append(tr);
      }
      rt.append(rb);
      $('routes').append(rt);

      // reading
      const rq = el('table');
      const classes = ['bounce','quick_exit','scroll_skip','engaged_scan','probable_read','deep_read'];
      const rqhead = el('tr');
      const th0 = el('th'); th0.textContent = 'Slug'; rqhead.append(th0);
      classes.forEach((c) => { const th = el('th', 'num'); th.textContent = c; rqhead.append(th); });
      const rqthead = el('thead'); rqthead.append(rqhead); rq.append(rqthead);
      const rqb = el('tbody');
      for (const slug in d.reading_quality_by_slug) {
        const row = d.reading_quality_by_slug[slug];
        const tr = el('tr');
        tr.append(el('td', '', slug));
        classes.forEach((c) => tr.append(el('td', 'num', row[c] || 0)));
        rqb.append(tr);
      }
      rq.append(rqb);
      $('reading').append(rq);
    });

    j('/admin/api/sessions').then((d) => {
      const t = el('table');
      const head = el('tr');
      ['Session', 'Started', 'Events', 'Bot flag'].forEach((h, i) => {
        const th = el('th', i === 2 ? 'num' : '');
        th.textContent = h; head.append(th);
      });
      const thead = el('thead'); thead.append(head); t.append(thead);
      const body = el('tbody');
      for (const r of d.sessions) {
        const tr = el('tr');
        const sidTd = el('td');
        const code = el('code', '', r.session_id.slice(0, 8) + '…');
        sidTd.append(code);
        tr.append(sidTd);
        tr.append(el('td', '', r.started));
        tr.append(el('td', 'num', r.events));
        tr.append(el('td', r.bot_flag ? '' : 'muted', r.bot_flag || '—'));
        body.append(tr);
      }
      t.append(body);
      $('sessions').append(t);
    });

    j('/admin/api/health').then((d) => {
      const root = $('health');
      const lines = [
        'Salt last rotated: ' + (d.salt_last_rotated || '(never)'),
        'Last rollup: ' + (d.last_rollup || '(none)'),
        'DB size: ' + d.db_size_kb + ' KB',
        'Events (raw): ' + d.events_raw_count,
        'Aggregates (days): ' + d.aggregate_days,
      ];
      for (const l of lines) root.append(el('div', '', l));
    });
  </script>
</body>
</html>`;

export function handleAdmin(req, res) {
  if (!checkAuth(req)) return unauthorized(res);
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname;
  try {
    if (path === '/admin' || path === '/admin/') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(HTML_PAGE);
      return;
    }
    if (path === '/admin/api/snapshot') return jsonResponse(res, snapshotData());
    if (path === '/admin/api/30d') return jsonResponse(res, thirtyDayData());
    if (path === '/admin/api/sessions') return jsonResponse(res, sessionsData());
    if (path === '/admin/api/health') return jsonResponse(res, healthData());
    if (path === '/admin/api/report') return jsonResponse(res, reportData());
    res.writeHead(404).end();
  } catch (e) {
    console.error('admin error', e);
    res.writeHead(500).end();
  }
}

export function adminConfigured() {
  return Boolean(ADMIN_PASSWORD);
}
