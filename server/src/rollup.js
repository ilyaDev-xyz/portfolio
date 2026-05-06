// Nightly aggregate. Idempotent — re-runs replace via INSERT … ON CONFLICT.
// Reading-classification computed here per docs/analytics.md §3 / §9.3.

import { statSync } from 'node:fs';
import { getDb } from './db.js';
import { ensureSalt, pruneSalts } from './salt.js';
import { CASE_SLUGS } from './constants.js';

const RAW_RETENTION_DAYS = 30;

function dayBounds(daysBack) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - daysBack);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    day: start.toISOString().slice(0, 10),
    tsStart: Math.floor(start.getTime() / 1000),
    tsEnd: Math.floor(end.getTime() / 1000),
  };
}

export function classifyDwell(active, scroll) {
  if (active < 10) return 'bounce';
  if (active < 60 && scroll < 40) return 'quick_exit';
  if (active < 60 && scroll > 80) return 'scroll_skip';
  if (active < 180 && scroll >= 40 && scroll <= 70) return 'engaged_scan';
  if (active < 600 && scroll > 70) return 'probable_read';
  if (active >= 600 && scroll > 80) return 'deep_read';
  return 'engaged_scan';
}

export function emptyClassCounts() {
  return {
    bounce: 0,
    quick_exit: 0,
    scroll_skip: 0,
    engaged_scan: 0,
    probable_read: 0,
    deep_read: 0,
  };
}

function aggregateDay({ day, tsStart, tsEnd }) {
  const db = getDb();
  const base = db
    .prepare(
      `
    SELECT
      COUNT(DISTINCT visitor_id) AS unique_visitors,
      COUNT(DISTINCT session_id) AS sessions,
      SUM(CASE WHEN kind = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
      SUM(CASE WHEN kind = 'outbound' AND json_extract(payload_json, '$.kind') = 'email' THEN 1 ELSE 0 END) AS oe,
      SUM(CASE WHEN kind = 'outbound' AND json_extract(payload_json, '$.kind') = 'telegram' THEN 1 ELSE 0 END) AS ot,
      SUM(CASE WHEN kind = 'outbound' AND json_extract(payload_json, '$.kind') = 'github' THEN 1 ELSE 0 END) AS og
    FROM events WHERE ts >= ? AND ts < ?
  `,
    )
    .get(tsStart, tsEnd);

  const routesRows = db
    .prepare(
      `SELECT path, COUNT(*) AS pv FROM events
       WHERE kind = 'pageview' AND ts >= ? AND ts < ?
       GROUP BY path`,
    )
    .all(tsStart, tsEnd);
  const routes = {};
  for (const r of routesRows) routes[r.path] = r.pv;

  const top_referrers = db
    .prepare(
      `SELECT referrer_host AS host, COUNT(*) AS n FROM events
       WHERE kind = 'pageview' AND ts >= ? AND ts < ? AND referrer_host IS NOT NULL
       GROUP BY referrer_host ORDER BY n DESC LIMIT 10`,
    )
    .all(tsStart, tsEnd);

  const reading_quality_by_slug = {};
  for (const slug of CASE_SLUGS) {
    const counts = emptyClassCounts();
    const sessions = db
      .prepare(
        `SELECT
           MAX(CAST(json_extract(payload_json, '$.active_seconds') AS INTEGER)) AS active,
           MAX(CAST(json_extract(payload_json, '$.max_scroll_pct') AS INTEGER)) AS max_scroll
         FROM events
         WHERE kind = 'dwell' AND path = ? AND ts >= ? AND ts < ?
         GROUP BY session_id`,
      )
      .all(`/cases/${slug}`, tsStart, tsEnd);
    for (const s of sessions) counts[classifyDwell(s.active || 0, s.max_scroll || 0)]++;
    reading_quality_by_slug[slug] = counts;
  }

  const dwellRows = db
    .prepare(
      `SELECT path, CAST(json_extract(payload_json, '$.active_seconds') AS INTEGER) AS active
       FROM events WHERE kind = 'dwell' AND ts >= ? AND ts < ?
       ORDER BY path, active`,
    )
    .all(tsStart, tsEnd);
  const dwellByPath = {};
  for (const r of dwellRows) {
    if (!dwellByPath[r.path]) dwellByPath[r.path] = [];
    dwellByPath[r.path].push(r.active);
  }
  const dwell_percentiles = {};
  for (const path in dwellByPath) {
    const arr = dwellByPath[path];
    const at = (q) => arr[Math.min(arr.length - 1, Math.floor(arr.length * q))];
    dwell_percentiles[path] = { p50: at(0.5), p75: at(0.75), p95: at(0.95) };
  }

  const payload = { routes, top_referrers, reading_quality_by_slug, dwell_percentiles };

  db.prepare(
    `INSERT INTO daily_aggregates
      (day, unique_visitors, sessions, pageviews, outbound_email, outbound_telegram, outbound_github, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET
       unique_visitors   = excluded.unique_visitors,
       sessions          = excluded.sessions,
       pageviews         = excluded.pageviews,
       outbound_email    = excluded.outbound_email,
       outbound_telegram = excluded.outbound_telegram,
       outbound_github   = excluded.outbound_github,
       payload_json      = excluded.payload_json`,
  ).run(
    day,
    base.unique_visitors || 0,
    base.sessions || 0,
    base.pageviews || 0,
    base.oe || 0,
    base.ot || 0,
    base.og || 0,
    JSON.stringify(payload),
  );
}

function pruneRaw() {
  const cutoff = Math.floor(Date.now() / 1000) - RAW_RETENTION_DAYS * 86400;
  const result = getDb().prepare('DELETE FROM events WHERE ts < ?').run(cutoff);
  return result.changes;
}

export function runRollup() {
  // Aggregate yesterday (the just-completed UTC day). Idempotent.
  aggregateDay(dayBounds(1));
  const removed_raw = pruneRaw();
  pruneSalts();
  ensureSalt();
  return { removed_raw };
}

export function dbSizeKb(path) {
  try {
    return Math.round(statSync(path).size / 1024);
  } catch {
    return 0;
  }
}
