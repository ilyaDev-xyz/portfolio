# AGENTS.md — instructions for coding agents

This file is read by Cursor, Devin, Claude Code, CodexCLI, and any agent
working on this repository.

For website consumers (LLMs fetching the deployed site), see `/llms.txt`
on the live host. That file is the website-level agent index. This file
is the repo-level agent context — different audience, different scope.

## What this repo is

Portfolio engine for [ilyadev.xyz](https://ilyadev.xyz). Vite + React +
TypeScript frontend, Node + better-sqlite3 analytics server. Trilingual
(EN/RU/AR) with full RTL.

The engine is content-tree-agnostic: a public sanitized demo tree ships
in this repo; a private tree with the author's real content lives in a
gitignored overlay used at deploy time.

## Build and run

```
npm run dev:public        # dev server with public demo content
npm run dev:private       # dev server with private content tree (fails if absent)
npm run build:public      # production build with public content (deploy-safe)
npm run build:private     # production build with private content (live deploy)
npm run typecheck         # tsc --noEmit on public tree
npm run typecheck:private # tsc --noEmit on private tree
npm test                  # Vitest, 46 tests, EN/RU/AR parity + markdown helpers
npm run lint              # ESLint flat config across frontend + server
```

Plain `npm run dev` and `npm run build` are intentional no-ops that print
the two real options. Content selection has to be explicit so a build
never accidentally ships the wrong tree.

Node ≥ 22.12; `.nvmrc` pins `22.14.0`.

## Content trees

| Path | Purpose | Tracked? |
|---|---|---|
| `src/content/public/` | Sanitized demo content (committed) | yes |
| `src/content/.private/` | Real content overlay (gitignored, has its own local git) | no |
| `src/content/active.ts` | Generated barrel — points at one of the two trees | no |

`scripts/select-content.mjs` writes `active.ts` from `CONTENT_SOURCE=public|private`.
Every npm script that touches content runs the selector first.

Both trees export the same `{ en, ru, ar }` shape (`src/content/types.ts`).
Adding a field requires updating the type + both trees + every locale.

## Notable subsystems

- `vite.config.ts` — `agentMirrorsPlugin()` writes per-page Markdown
  mirrors and `llms*.txt` indexes; `staticCaseHeadsPlugin()` rebuilds
  `dist/cases/<slug>/index.html` per case so crawlers see fully-formed
  `<head>` and JSON-LD before any JS runs.
- `src/lib/agentMirrors.ts`, `src/lib/homeMarkdown.ts`,
  `src/lib/caseStudyMarkdown.ts` — content-tree → Markdown serializers.
- `server/` — same-origin analytics server, own `package.json`, single
  dependency `better-sqlite3`. Deploys independently.
- `scripts/cv/build.mjs` — typed-content driven CV pipeline (Typst).
- `scripts/overlay-private-og.mjs` — postbuild step on `build:private`
  that overlays private OG images into `dist/og/*` so `public/og/*`
  stays public-safe.

## Deploy

Static `dist/` from `npm run build:private` is rsynced to the production
host. Caddy serves it; the analytics server runs same-origin on
loopback. Public OG images live under `public/og/`. The `build:private`
chain overlays the private OG variants into `dist/og/` after the Vite
build.

```
npm run build:private
rsync -av --delete dist/ <host>:/srv/portfolio/site/
```

## Don't

- Don't commit `src/content/active.ts` (generated, gitignored).
- Don't commit `dist/`, `node_modules/`, or anything under `public/private/`.
- Don't bypass the `:public` / `:private` distinction. There are no
  generic `dev` / `build` scripts on purpose.
- Don't push `portfolio-engine/.git` to any remote — this tree is
  local-only. The public github mirror is exported via
  `npm run export:public` to a sibling directory and squash-committed
  there.
- Don't write inline OG images to `public/og/` from a private build
  step. The privacy invariant is that `public/og/` only ever contains
  sanitized demo content (or you will leak real subtitles to the public
  github repo on next export).

## More docs

- `README.md` — engine overview for forkers
- `docs/architecture.md` — provider tree, hooks, routing, video player, telemetry
- `docs/analytics.md` — privacy-first analytics design
- `docs/content.md` — editing copy, adding projects, translating
- `docs/decisions.md` — engineering rationale per non-obvious choice
- `docs/design-system.md` — tokens, type scale, palettes
- `server/README.md` — analytics server module
