import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ts            INTEGER NOT NULL,
  visitor_id    TEXT    NOT NULL,
  session_id    TEXT    NOT NULL,
  kind          TEXT    NOT NULL,
  path          TEXT,
  referrer_host TEXT,
  lang          TEXT,
  theme         TEXT,
  device_class  TEXT,
  country_code  TEXT,
  payload_json  TEXT
);
CREATE INDEX IF NOT EXISTS events_ts_idx        ON events(ts);
CREATE INDEX IF NOT EXISTS events_visitor_idx   ON events(visitor_id);
CREATE INDEX IF NOT EXISTS events_session_idx   ON events(session_id);
CREATE INDEX IF NOT EXISTS events_kind_path_idx ON events(kind, path);

CREATE TABLE IF NOT EXISTS salt (
  day   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_aggregates (
  day               TEXT PRIMARY KEY,
  unique_visitors   INTEGER NOT NULL,
  sessions          INTEGER NOT NULL,
  pageviews         INTEGER NOT NULL,
  outbound_email    INTEGER NOT NULL DEFAULT 0,
  outbound_telegram INTEGER NOT NULL DEFAULT 0,
  outbound_github   INTEGER NOT NULL DEFAULT 0,
  payload_json      TEXT
);
`;

let db = null;

export function openDb(path) {
  mkdirSync(dirname(path), { recursive: true });
  const conn = new Database(path);
  conn.pragma('journal_mode = WAL');
  conn.pragma('synchronous = NORMAL');
  conn.pragma('journal_size_limit = 67108864');
  conn.pragma('temp_store = MEMORY');
  conn.pragma('mmap_size = 268435456');
  conn.exec(SCHEMA);
  db = conn;
  return conn;
}

export function getDb() {
  if (!db) throw new Error('db not opened — call openDb(path) first');
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
