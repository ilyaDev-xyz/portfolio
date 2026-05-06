# Changelog

Visible engineering changes to the public portfolio engine. Latest first.

## v1.0 — Initial public release

First public publication of the portfolio engine.

**Frontend** — Vite + React + TypeScript, trilingual EN/RU/AR with full RTL, route-aware nav, six case-study routes, single-player video system with per-language voiceover cuts, agent-readable Markdown mirrors of every page, generated case metadata for scrapers, content-source switch between public and private trees.

**Analytics server** — `node:http` + SQLite, daily-salted visitor IDs, dwell-time classifier, nightly rollup, Basic-Auth admin dashboard, JSON snapshot endpoints. Standalone module with its own `package.json` and a single dependency on `better-sqlite3`.

**Test harness**:

- Frontend unit tests (Vitest + jsdom): markdown helpers (snapshots per language and per case slug, prev/next nav invariants, image absolutisation, stub fallback), the dwell state machine (5s idle window, 30 min hard cap, visibility gate, per-path flush), and runtime EN/RU/AR array-length parity.
- Server unit tests (`node --test`, zero new dependencies): payload validation per event kind with truncation and finite-number checks, deterministic visitor hashing (no raw-IP echo, salt-rotation independence), dwell classification buckets, UA-family parsing.

**Tooling** — ESLint flat config (`typescript-eslint` recommended + `react-hooks`), `npm run lint` across both modules, CI matrix split (`frontend` and `server` jobs run in parallel, `concurrency` cancels superseded runs), and deploy templates for Caddy and systemd under `deploy/`.
