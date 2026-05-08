# Editing content

Visible text is selected through the active barrel:

- `src/content/index.ts` — imports generated `src/content/active.ts`
- `src/content/public/en.ts` — English public demo content (canonical)
- `src/content/public/ru.ts` — Russian public demo content
- `src/content/public/ar.ts` — Arabic / RTL public demo overlay. Fields not explicitly overridden inherit from EN via spread; private cases can ship full per-case AR translations in the ignored tree.
- `src/content/.private/` — optional ignored private tree with the same exported `{ en, ru, ar }` shape

Types are in `src/content/types.ts` and the `Content` type enforces shape parity across all three — TypeScript will reject any dictionary that's missing keys.

In the public tree, shared copy lives under `shared/*.ts` (nav, hero, about, stack, timeline, contact, footer, ui, cv), while case copy lives under `cases/case-NN/{en,ru}.ts`; AR currently overlays selected site-level fields and otherwise inherits EN. The language files compose these pieces into `Content` objects and re-export them.

Two parallel content trees: `src/content/public/` (committed, sanitized demo) and `src/content/.private/` (gitignored, real). `scripts/select-content.mjs` writes `src/content/active.ts` to point at one or the other based on `CONTENT_SOURCE=public|private`. Both trees export the same top-level `{ en, ru, ar }` shape; the internal file split can differ as long as the compiled `Content` objects stay compatible.

## Structure

```ts
{
  nav:        { links: [{ href, label }, ...] },
  hero:       { name, role, pitch, location, hours, availability, chips, cta },
  about:      { pullQuote, paragraphs, bestFit?, howWork? },
  stack:      [ { label, items: [...] }, ... ],
  projects:   [ { slug, idx, status, codename, title, subtitle, scope, proof?, production?, role, body, foot,
                   cta, cta2?, placeholder, cls, isVideo?, videoId?, videoMirrorUrl?,
                   thumbnail?, imageSrc?, videoTranscript?, caseStudy? } ],
  experience: [ { when, title, tag, body }, ... ],
  contact:    { title, sub, ways: [{ k, v, href? }] },
  footer:     { left, leftHref?, mid, right },
  ui:         { videoMirror, videoMirrorYoutube, videoPlay,
                 navBack, navCases, backToHome,
                 caseSection*, caseHeroFacts,
                 caseLessonsKeep, caseLessonsChange,
                 caseDecision, caseWhy, caseCost,
                 caseNextEyebrow, caseNextHomeEyebrow,
                 caseNextHomeTitle, caseNextHomeSubtitle,
                 projectStatusLabels: Record<ProjectStatus, string> },
  cv?:        { brand, summary, featuredSlugs, featuredBullets,
                 experienceBullets, education, languages,
                 moreCasesUrl, moreCasesNote, pdfPath? },
}
```

`Project.status` is a stable English literal (`'Delivered' | 'Published' | 'R&D' | 'MVP' | 'Personal tool' | 'Open source' | …`); user-facing labels live in `ui.projectStatusLabels`. The render helper `projectStatusLabel(ui, status)` (in `src/lib/projectStatus.ts`) does the lookup. Used by `Projects.tsx`, `ProjectDetailPage.tsx`, `homeMarkdown.ts`, `caseStudyMarkdown.ts`. To add a new status: extend the union in `types.ts`, add the label key in every language's `ui.projectStatusLabels`.

## Adding a project

1. Append a new entry to `projects[]` via the per-case files in the active content tree (public currently uses `cases/case-NN/{en,ru}.ts` plus an AR overlay; private trees may carry dedicated AR case files).
2. Required fields:
   - `slug` (URL-safe), `idx` (e.g. `'06'`), `status`, `cls`, `placeholder`
   - `title` — short identity (display heading on card)
   - `subtitle` — descriptive sentence (mono-mute, multi-line on card)
   - `scope` — fixed-shape effort line, e.g. `Solo · 7 weeks` (renders in card meta `SCOPE` row)
   - `foot` — stack list, ≤ 50 chars on one line (renders in card meta `STACK` row)
   - `role` — long-form lede (only used on case study hero, not on card)
   - `body` — paragraph (only used in case study fallback, not on card)
3. CTA links — use `/cases/{slug}` for internal routes; `ArrowLink` automatically routes via React Router for paths starting with `/`. Use `external: true` and a full URL for outbound links.
4. The router stub at `/cases/:slug` (`src/pages/ProjectDetailPage.tsx`) reads from the same dictionary — your new project will work automatically.
5. Mind the grid balance: 3-col on desktop, 2 on tablet, 1 on mobile. Six projects = clean 3+3 layout. Five = 3+2. Plan before adding.

The current `placeholder` field renders a hatch placeholder; project demos are video-based — set `videoId` (YouTube ID) on a project to replace the placeholder with a `<LiteYouTube>` facade. Set `videoMirrorUrl` (full RuTube URL) to surface a "Mirror on RuTube" toggle below the video that reveals after the user clicks play. The toggle is a sticky global switch — clicking it swaps every player site-wide to the alternate provider and remembers the choice (see `docs/architecture.md` → Video player system).

For static-image cards, set `imageSrc` to a path inside `public/` (e.g. `/temp_portfolio_pic.jpg`). The card renders a lazy-loaded `<img>` covering the same 16:9 frame (`object-fit: cover`) — used on the `site` card until a video walkthrough is recorded. The render order in `Projects.tsx` is `videoId` → `imageSrc` → `isVideo` hatch → default hatch.

### Video transcript (`videoTranscript`)

Set `videoTranscript: { synopsis, fullText }` on any project that has `videoId` to make the demo video discoverable to LLM agents that cannot watch video. When present:

- `caseStudyMarkdown.ts` emits a `## Video walkthrough` section (label localized via `ui.markdown.videoWalkthrough`) into the per-case `.md` mirrors and concatenated `llms-full.txt`. Public build/dev writes those generated mirrors under `public/`; private build writes them under `dist/`, and private dev serves them from memory.
- `vite.config.ts:videoObjectJsonLd` emits a Schema.org `VideoObject` block per language inside the static `dist/cases/<slug>/index.html` (one `<script type="application/ld+json" data-case-head>` per lang, distinguished by `@id`). Fields: `name`, `description` (synopsis), `thumbnailUrl`, `embedUrl`, `contentUrl`, `inLanguage`, `transcript` (full text). No `duration` / `uploadDate` — agents read transcript, not playback length, and the actual video host (YouTube / RuTube) carries that metadata canonically.
- `<LiteYouTube>` reads the presence of `videoTranscript` (via the parent component) to decide whether to render its lang-pill overlay (see `docs/architecture.md` → Video player system).

`synopsis` is two claim-bearing sentences. `fullText` is the verbatim voiceover, paragraph-separated by `\n\n`. When a case ships a native voiceover cut per language, the EN / RU / AR `videoTranscript` payloads should NOT be machine-translated copies of each other. The public demo tree currently overlays AR at the site level only and inherits EN per-case payloads (including `videoTranscript`); private trees with a recorded native AR cut should override the inherited transcript explicitly to keep the JSON-LD `inLanguage` accurate.

### Public CV download (`cv.pdfPath`)

The hero and contact ResumeLink chip renders only when `Content.cv` is populated. The href resolves to `cv.pdfPath` when set, else falls back to `/private/${LANG_CONFIG[lang].cvFile}`.

The static `/cv` endpoint uses the same resolution rule for its browser
redirect. Its HTML head points at `/og/cv.png` so LinkedIn Featured and other
scrapers read the CV link as a normal Open Graph HTML page instead of trying
to extract metadata from a PDF.

- Public demo tree: `src/content/public/shared/cv.ts` declares fictional Cv with `pdfPath: '/demo/cv-<lang>.pdf'`. The build step `npm run cv:build:public` writes the rendered PDF into the resolved path under `public/`. `public/demo/` is committed.
- Private tree: `cv.pdfPath` may be omitted; PDFs land in the gitignored `public/private/`.
- Forks shipping the public engine get a working CV download out of the box. Replace the bullet content in `cvEn` / `cvRu` / `cvAr` to claim it as your own.

## Card schema (uniform proof slots)

Every project card on the home page has the same rendering slots — fixed structure regardless of project content. This is what makes them visually uniform and comparable:

```
[head]      § 03.NN  ·  codename  ·  ● status      (mono row)
[media]     16:9 video, static image, or hatch placeholder
[mirror]    ↗ Mirror on RuTube                     (optional, reveals after play)
[title]     {title}                                (display h3, --fs-display-s)
[subtitle]  {subtitle}                             (mono mute, wraps as needed)
[meta]      SCOPE  {scope}                         (60-char hidden grid)
            PROOF  {proof?}                        (optional trust signal)
            SURFACE {production?}                  (optional production surface)
            STACK  {foot}                          (60-char hidden grid)
[foot]      {CTAs}                                 (only if any CTA exists)
```

Hard rules:
- `subtitle` is intentionally long-form prose — current cards run 150–250 chars and wrap across multiple lines below the title. No char cap.
- `foot` (stack list) must fit one line. Aim ≤ 50 chars. The `dd` cell uses `text-overflow: ellipsis` as a safety net.
- `proof` and `production` render only when present. Use them for standardized trust signals: video/walkthrough/demo-data/public artifact, and client server/live/local/personal/MVP surface.
- `body` and `chips` are NOT rendered on the card — they're used elsewhere (`body` in case study fallback, `chips` is a legacy field).
- `role` is also not rendered on the card; only on the case study hero as a lede.

## Adding a case study

A project becomes a full case study by setting the optional `caseStudy` field on its entry in `en.ts` / `ru.ts`. The page at `/cases/:slug` renders six ordered sections when this field is present, otherwise it falls back to the minimal stub.

Shape (from `src/content/types.ts`):

```ts
caseStudy: {
  metrics:       [{ v: string }, …],            // legacy — not currently rendered
  contextPull?:  string,                         // short display-type thesis on cols 1-4 of Context
  context:       [string, …],                    // 1-2 paragraphs on cols 5-12 of Context
  heroFacts?:    [{ k, v }, …],                  // FACTS spec-sheet panel on cols 9-12 of Hero
  diagrams?:     [{ title, ascii?, images?, notes? }, …],  // ASCII <pre> OR screenshot grid, + optional key:value notes
  decisions:     [{ title, decision, why, cost }, …],  // ~4 cards in a 2-col grid with watermarks
  stackTable:    [{ k, v }, …],                  // 3-col strata cells (label + body)
  lessonsKeep?:  [string, …],                    // "Carry forward" — cols 1-6 of Lessons
  lessons:       [string, …],                    // "Would change" — cols 7-12 of Lessons
  statusNote?:   string,                         // optional locked sentence below the lessons; render is guarded
}
```

Authoring conventions:

- `heroFacts[]` is the spec-sheet panel sitting on cols 9-12 of the hero (next to the video). Each row is `k` (mono caps label) + `v` (mono body). Aim for 4–6 rows that read like a tear-sheet — Scope, Surfaces, Tool surface, Auth model, Status.
- `contextPull` renders as a short display-type thesis on the left half of Context (cols 1-4). Keep it under ~12 words — it's the "elevator pitch" for the project.
- `context[]` is 1-2 paragraphs on cols 5-12. Each paragraph is capped at `--measure` (65ch).
- `diagrams[]` carries two variants. **ASCII**: set `ascii` (template literal rendered inside `<pre>`). Use box-drawing chars (`─│┌┐└┘├┤┬┴┼╔╗╚╝═║▼▲►◄→←↑↓`) — JetBrains Mono renders them cleanly. Keep diagrams under ~80 chars wide for mobile horizontal scroll comfort. **Screenshot**: set `images: [{ src, alt, caption? }, …]` — paths are relative to `public/`; rendered in a full-width 2-col grid (col widths set to image natural aspects so heights line up without pillarbox/letterbox). The variant is auto-detected; setting both is undefined.
- `diagrams[].notes[]` are key:value side-blocks. For ASCII variant they sit on the right (cols 1-2 of a 2-col diagram layout). For screenshot variant they sit below the image grid, capped at `--measure`. Each note has a mono caps label + body sentence.
- `decisions[].title` should NOT include "1.", "2." prefixes — the per-card watermark draws the index automatically.
- `lessonsKeep` (Carry forward) and `lessons` (Would change) split into a 6+6 grid. Aim for 3 short bullets each — this is the page's "what's worth repeating vs what would change" balance.
- All three lang case files (EN/RU/AR) must populate the same `caseStudy` shape — `Content` + the runtime parity test enforce both shape and array lengths. Translate field-by-field; ASCII diagrams should localize text labels (Client → Клиент → العميل) but keep box characters identical. Diagrams remain LTR-rendered under RTL via `[dir="rtl"] .case-diagram pre { direction: ltr; unicode-bidi: isolate }` — see `docs/architecture.md` → "RTL".

Nav case-study tabs are driven by `src/config/cases.ts` (`CASE_SLUGS`). `Nav.tsx` uses it for case tabs; `ProjectDetailPage.tsx` uses it for next-case CTA logic. Server-side the same list is repeated as `KNOWN_PATHS` in `server/src/ingest.js` and `SLUGS` in `server/src/{rollup,admin}.js`; keep those cross-runtime lists in sync when adding a project. Adding a new project to the frontend whitelist makes it appear as `Case 0N` in the case-page nav. Currently: `ai-crm`, `ai-warehouse`, `ai-video-editor`, `roblox-game`, `macos-vpn`, `portfolio-site` — all six projects. The next-case CTA at the bottom of each page reads from the same whitelist — last project (`portfolio-site`) gets a "Back to home" CTA instead of a next-link.

Slug naming convention: keyword-bearing kebab-case (`ai-crm`, not `airea`) so the URL itself reads as the project category to an HR scanner or an LLM agent indexing the case list. The `codename` field on each project mirrors the slug exactly — no separate brand codename — keeping the head row (`§ 03.NN · codename · ● status`) self-consistent with the URL bar.

## Editing the Stack

`stack[]` lives in `src/content/public/shared/stack.ts` for the public demo tree and can be overridden by `src/content/.private/shared/stack.ts` locally. Nine categories currently fit a 3×3 grid perfectly. Removing or adding entries changes the grid balance — still readable, just less symmetric.

The `wide: true` flag on a category is a leftover from the prototype's 4-column layout. The current strata grid does not consume it; safe to ignore or remove.

## Editing the Timeline

`experience[]` comes from `src/content/public/shared/timeline.ts` in the public tree. Each row needs `when`, `title`, `tag`, `body`. The year watermark behind each row is auto-extracted from `when` via regex (`\b(20\d{2})\b`) in `src/sections/Experience.tsx`.

## Editing the Hero

- `hero.role` → kicker line above the name ("AI Engineer & Full-stack Python")
- `hero.name` → the big display name
- `hero.pitch` → pitch sentence as a 3-tuple `[before, em, after]` — middle string is wrapped in `<em>` (same pattern as `about.pullQuote`)
- `hero.location` / `.hours` / `.availability` → left meta sidebar (desktop) and the bottom meta strip (mobile, only `hours` + `availability` shown — `location` only in desktop sidebar)
- `hero.chips` → three frosted chips below the pitch

Chip click behavior is hardcoded in `Hero.tsx`: all three chips scroll to `#about`. The chips are trust headlines, not navigation categories.

## Editing translations

All three lang files (`en.ts`, `ru.ts`, `ar.ts`) must always have the same shape (enforced by `Content` type) and matching array lengths (enforced by `src/content/parity.test.ts`). When editing:

1. Make the change in every lang file in the same commit, or accept a transient TypeScript / parity-test error.
2. After edits, verify all three lang toggles in the nav switch the affected text correctly.
3. Arabic translations follow this term-consistency rule (kept in `.private/translation-glossary.md`, a private overlay not shipped with the public repo) — keep product names, library names, protocols, file paths, API names, and model names in English; translate operator-level prose terms (audit trail → سجل تدقيق, tool call → استدعاء أداة, etc.).

If you add a new field, update `types.ts` first — all three lang files will then be flagged by the compiler until you fill the new key in each.

## Where each piece appears

| Field                              | Rendered in                          |
|------------------------------------|--------------------------------------|
| `nav.links`                        | `Nav.tsx` (header)                   |
| `hero.name`                        | Hero h1                              |
| `hero.role`                        | Hero kicker (mono, above name)       |
| `hero.location/hours/availability` | Hero left meta + mobile bottom strip |
| `hero.chips`                       | Three frosted chips below the pitch  |
| `about.pullQuote`                  | Pull quote (highlighted middle word) |
| `about.paragraphs`                 | Right column paragraphs              |
| `projects[].cta`                   | Primary CTA; external GitHub for portfolio-site |
| `projects[].cta2`                  | Secondary CTA; case-study link when primary is external |
| `projects[].proof/production`      | Card proof/surface meta rows         |
| `projects[].videoTranscript`       | Markdown `## Video walkthrough` + dist HTML `VideoObject` JSON-LD per lang |
| `cv.pdfPath`                       | ResumeLink chip href (hero + contact); fallback `/private/cv-<lang>.pdf` |
| `experience[].when`                | Year watermark + visible date        |
| `stack[].items`                    | Pill chips inside each stratum cell  |
| `contact.title`                    | Big italicised middle word           |
| `contact.ways`                     | Email / Telegram / Intro call rows   |
| `footer.left/leftHref/mid/right`   | Footer row; `leftHref` turns left label into a link |
