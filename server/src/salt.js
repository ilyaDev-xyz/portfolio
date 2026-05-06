import { createHash, randomBytes } from 'node:crypto';
import { getDb } from './db.js';

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export function ensureSalt(day = todayUtc()) {
  const db = getDb();
  const existing = db.prepare('SELECT value FROM salt WHERE day = ?').get(day);
  if (existing) return existing.value;
  const value = randomBytes(32).toString('hex');
  db.prepare('INSERT OR IGNORE INTO salt(day, value) VALUES (?, ?)').run(day, value);
  const row = db.prepare('SELECT value FROM salt WHERE day = ?').get(day);
  return row.value;
}

export function pruneSalts() {
  // Keep today + yesterday (grace day for late sendBeacon retries near midnight).
  const cutoff = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  getDb().prepare('DELETE FROM salt WHERE day < ?').run(cutoff);
}

export function lastSaltRotation() {
  const row = getDb().prepare('SELECT day FROM salt ORDER BY day DESC LIMIT 1').get();
  return row?.day ?? null;
}

const HASH_LEN = 32;

/**
 * Pure visitor-ID hash. SHA-256 of salt | ip | uaFamily | domain, truncated
 * to 32 hex chars. No DB access — safe for unit testing without a sqlite
 * fixture. See docs/analytics.md §4.
 */
export function hashVisitor(salt, ip, uaFamily, domain) {
  return createHash('sha256')
    .update(salt ?? '')
    .update('|')
    .update(ip ?? '')
    .update('|')
    .update(uaFamily ?? '')
    .update('|')
    .update(domain ?? '')
    .digest('hex')
    .slice(0, HASH_LEN);
}

export function visitorIdFor(ip, uaFamily, domain) {
  return hashVisitor(ensureSalt(), ip, uaFamily, domain);
}
