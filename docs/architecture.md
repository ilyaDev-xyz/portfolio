# Architecture

## Provider tree

```tsx
// src/App.tsx
<ThemeProvider>           // src/theme/ThemeContext.tsx
  <LangProvider>          // src/i18n/LangContext.tsx
    <BrowserRouter>
      <Loader />
      <ScrollToHash />
      <AnalyticsRouteTracker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cases/:slug" element={<CaseRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </LangProvider>
</ThemeProvider>
```

`ThemeProvider` is outermost so the palette is set on `<html data-palette>` before any child reads color variables. `LangProvider` sits next so `useT()` is available everywhere. `Loader` mounts inside the router so it covers routed content during initial paint.

## i18n

No external library. Three languages: `en`, `ru`, `ar` (RTL).

- `src/i18n/langConfig.ts` is the single source of truth. `Lang = 'en' | 'ru' | 'ar'` plus a `LANG_CONFIG[lang]` table holding everything per-language: `htmlLang`, `dir` (`ltr`/`rtl`), `label`, `mdExt`, `llmsFile`, `homeFile`, `ogLocale`, `cvFile`, and a nested `markdown` labels object (used by mirror serializers).
- `src/content/index.ts` re-exports the active content tree selected by `scripts/select-content.mjs`. The committed public tree lives under `src/content/public/{en,ru,ar}.ts`; the ignored private tree can mirror that shape under `src/content/.private/`. The `Content` type enforces shape parity across all active language exports at compile time.
- `src/i18n/LangContext.tsx` holds `lang` state, syncs to `localStorage`, applies `<html lang>` (htmlLang), `<html dir>` (`ltr`/`rtl`), and `<html data-lang>` on every change. Exposes:
  - `useLang()` → `{ lang, setLang, t }`
  - `useT()` → just `t` (the active dictionary)

Sections render via:

```tsx
const A = useT().about;
return <h2>{A.pullQuote[0]}…</h2>;
```

Components that need lang-keyed file paths import from langConfig instead of branching on the lang code:

```tsx
const cfg = LANG_CONFIG[lang];
const resumeHref = `/private/${cfg.cvFile}`;        // cv-en.pdf | cv-ru.pdf | cv-ar.pdf
const llmsFile   = cfg.llmsFile;                    // llms.txt | llms-ru.txt | llms-ar.txt
```

A lang switch causes the Provider to re-render → all consumers re-render with the new dictionary. No mutation of globals.

### RTL — stable shell + RTL content

`html.dir` flips to `rtl` for `ar`. Layout strategy: physical-direction CSS (`margin-left`, `text-align: right`) is converted to logical properties (`margin-inline-start`, `text-align: end`) so grids/flex auto-mirror under RTL — see `docs/design-system.md` → "RTL".

Site shell intentionally stays LTR even under `dir="rtl"`: nav inner row, theme/lang controls, hero action chips. Achieved via `direction: ltr; unicode-bidi: isolate` on the wrapper. Content area inside the shell flips RTL:

```css
.nav-inner { direction: ltr; unicode-bidi: isolate; }   /* shell stays LTR */
[data-lang="ar"] .nav-links,
[data-lang="ar"] .nav-cases { direction: rtl; unicode-bidi: isolate; }   /* content flips */
```

Code/pre/diagram blocks stay LTR under any lang because ASCII art and code are designed left-to-right:

```css
[dir="rtl"] code,
[dir="rtl"] pre,
[dir="rtl"] .case-diagram pre,
[dir="rtl"] .foot,
[dir="rtl"] .mono { direction: ltr; unicode-bidi: isolate; }
```

Arabic font: `[data-lang="ar"]` overrides `--font-display` / `--font-body` to `Noto Sans Arabic` (with `Geist` Latin fallback for inline tech terms). Loaded via the Google Fonts URL in `index.html`.

### ProjectStatus — typed code + per-language labels

`Project.status` stays a stable English literal type (`'Delivered' | 'Published' | 'R&D' | 'MVP' | 'Personal tool' | 'Open source' | …`). User-facing labels live in `ui.projectStatusLabels: Record<ProjectStatus, string>` per content tree. Render goes through a tiny helper:

```ts
// src/lib/projectStatus.ts
export function projectStatusLabel(ui: Ui, status: ProjectStatus): string {
  return ui.projectStatusLabels[status] ?? status;
}
```

Used in `Projects.tsx`, `ProjectDetailPage.tsx`, `homeMarkdown.ts`, `caseStudyMarkdown.ts`. Keeps types stable while letting AR (`'Delivered'` → `'تم التسليم'`) and any future language localize labels without breaking literal-type checks. See `docs/decisions.md` → "ProjectStatus stays a literal code, labels move to UI dict".

## Theme + palette

`src/theme/ThemeContext.tsx` keeps a single `theme: 'dark' | 'light'` state. Palette is derived deterministically:

```ts
const palette = theme === 'dark' ? 'ochre' : 'electric';
```

Both `data-theme` and `data-palette` are written to `<html>`. `tokens.css` reads them via attribute selectors:

```css
[data-theme="dark"]                           { --bg: oklch(0.165 0.008 60); … }
[data-palette="ochre"][data-theme="dark"]     { --accent: oklch(0.86 0.17 72); … }
```

So switching theme automatically switches palette without any explicit logic in JS. `data-density` and `data-font-pair` are also written for token completeness (their values are static for now — hardcoded `comfortable` / `swiss`).

## Active section + scroll progress

`src/hooks/useActiveSection.ts` returns `{ activeId, progress }` where `progress` is `0..1` within the active section.

Algorithm:

1. Read every nav-section's height via `getBoundingClientRect()`.
2. Sum to `totalHeight`.
3. For each section, allocate a sub-range of `[0, maxScroll]` proportional to its weight (`height / totalHeight`).
4. The last section's range explicitly ends at `maxScroll` — guarantees Contact reaches `progress = 1` at page bottom.

The Nav passes `progress` as a CSS variable `--progress` on the active link; the underline `::after` uses `transform: scaleX(var(--progress))` to render the fill.

Throttled via `requestAnimationFrame` on `scroll` and `resize` events.

## Loader + interface entrance

The loader has three phases:

- **`pulse`** — idle. Hairline at viewport-center pulses opacity 0.22 → 0.7 (1.2s loop).
- **`rush`** — two whiteish blurred pulses run from `15%` and `85%` to center (600 ms). At T+400 ms of the rush, `html.is-loading` is removed and the loader starts fading out — so the interface lights up *before* the pulses collide. Total phase length 900 ms.
- **`gone`** — unmounted.

Hero-aligned hairline:

```ts
const hero = document.getElementById('home');
const y = hero.getBoundingClientRect().bottom;
document.documentElement.style.setProperty('--loader-line-y', `${y}px`);
```

Set after `document.fonts.ready` resolves (with a 3-second `Promise.race` fallback for slow networks). `.loader-line { top: var(--loader-line-y, 50%) }` defaults to viewport center until measured.

**Interface entrance** (`runtime.css`, "INTERFACE ENTRANCE" section):

- `index.html` adds `<html class="is-loading">` *synchronously* via an inline `<script>` before the React script. Zero FOUC.
- `html.is-loading .hero-fx, … { opacity: 0; }` hides hero/about elements during loading.
- `html:not(.is-loading) .hero-fx { animation: enter-fade 900ms ease-out 0ms backwards; }` — staggered `enter-fade` / `enter-up` keyframes with per-element `animation-delay` from T=0 ms (hero-fx) to T=1550 ms (about body).

The Loader removes `is-loading` at phase=`rush` after 400 ms — the staggered cascade plays during and after the loader fade-out.

`prefers-reduced-motion` skips the rush animation, the staggered entrances, and the Hero embers.

## Routing

Two routes:

- `/` → `<HomePage />` — composes all sections.
- `/cases/:slug` → `<ProjectDetailPage />` — full case study when `project.caseStudy` is present, minimal fallback otherwise (project metadata + "[ case study content coming later ]").

Static generated endpoint:

- `/cv` → `dist/cv/index.html` — a crawler-readable Open Graph HTML shell for recruiter surfaces. The head points at `/og/cv.png`; a tiny inline browser redirect sends real visitors to the resolved CV PDF (`cv.pdfPath`, else `/private/cv-en.pdf`). This is intentionally not a React route because LinkedIn needs stable HTML metadata before any client app runs.

`ScrollToHash` (in `src/router/ScrollToHash.tsx`) reacts to route changes — scrolls to `#hash` if present, else jumps to top. In-page hash links use the browser's native smooth scroll (`scroll-behavior: smooth` on `<html>`, with `scroll-margin-top: 72px` on section ids to account for the sticky nav).

`ArrowLink` (`src/components/atoms/ArrowLink.tsx`) automatically picks the right element: `<Link>` for internal routed paths (starting with `/`), `<a>` for hash links and external URLs.

## Nav — route-aware

`Nav.tsx` renders one of two layouts depending on `useLocation().pathname`:

- **Home mode** (`/`) — centered list of section anchors (`#home`, `#about`, `#cases`, `#timeline`, `#stack`, `#contact`) with a scroll-progress underline driven by `useActiveSection`.
- **Case mode** (`/cases/:slug`) — three-up layout: a `← Back` link to `/#cases`, a `Case 01 · 02 · … · 06` tab list across the six case-study slugs (`ai-crm`, `ai-warehouse`, `ai-video-editor`, `roblox-game`, `macos-vpn`, `portfolio-site`), and the same `<NavControls>` (theme + lang). The active project tab gets a full-width accent underline and an accent-colored number; other tabs muted.

Slug whitelist for the case tabs lives in `src/config/cases.ts` as `CASE_SLUGS` — all six projects are listed. Slugs are keyword-bearing kebab-case (`ai-crm`, not the older opaque `airea`) so the URL is HR/agent-readable on its own. See `docs/decisions.md` → "HR-coded slugs, codename = slug".

Mobile (≤720px): both home and case modes hide the nav controls and show them in their respective hero status rows — `.hero-ctrls-slot` inside `.row-top` on home, `.case-hero-ctrls-slot` inside `.case-hero-status-row` on the case page. Case nav becomes a 2-up grid: an outlined back chip (SVG chevron) + centred `Case NN` tabs. At ≤520px the `Case` label is dropped and tabs collapse to `#NN`; at ≤380px gaps and back-chip padding tighten further.

## ProjectDetailPage

When `project.caseStudy` is present, the page renders six ordered sections — Hero, Context, Architecture, Decisions, Stack, Lessons & status — using the same `<SectionHead>` atom (sections 02–06) and the standard 12-col grid as the home page. Per-section motifs are mapped in `docs/design-system.md`: scanline on Stack, watermark per card on Decisions, `bg-edge` + edge-ticks on Lessons; Hero/Context/Architecture share one continuous dot grid.

Hero is an 8 / 4 col split: LiteYouTube facade on cols 1–8, FACTS spec-sheet panel on cols 9–12 (driven by `caseStudy.heroFacts`). Status line / h1 / lede sit above the split in their own 12-col grid. Hero glow has three layers — an SVG `<radialGradient>` with `preserveAspectRatio="slice"` (viewBox-stable on mobile), a `.case-hero::before` tapered hairline + accent sheen, and the dot grid below them.

Hero · Context · Architecture wrap in a single `.case-dot-zone` so one `bg-dots::before` paints continuously through all three (no per-section seam). A bottom-only mask fade transitions out of the dot grid into Decisions.

The Footer is replaced on case pages by `.case-next-section` — a centred frosted-glass ghost button. Goes to `/cases/{nextSlug}` with a ↓ arrow, or to `/#cases` with a ↑ arrow on the last case (`portfolio-site`). The vertical arrow metaphor signals "scroll into next case" / "return up to home".

When `caseStudy` is absent, the page falls back to a minimal block: project metadata, the same video preview as on the home card, and a "[ case study content coming later ]" line — followed by the same next-case CTA.

## Video player system

Two layers on top of `<LiteYouTube>` make the player feel coherent across all six cards + their case-study heroes.

### Provider toggle (YouTube ↔ RuTube)

The mirror button under each video used to be an external link (`<a target="_blank">` opening RuTube). It is now a toggle:

- Default provider: **YouTube** (`videoId` in content drives the embed).
- Click mirror → flip provider to RuTube → `LiteYouTube` re-renders with the RuTube embed iframe (URL derived from `videoMirrorUrl` via `toRutubeEmbedUrl()`: `/video/...` → `/play/embed/...`).
- Mirror label flips: `Mirror on RuTube` → `Mirror on YouTube` (`ui.videoMirrorYoutube`).

The choice is **global, sticky, persisted in localStorage** (`src/state/videoProviderState.ts`) — kept in a module-level cache + a `Set` of subscribers + a `localStorage` key (`video-provider`). React-bound view via `src/hooks/useVideoProvider.ts`. One toggle on any card swaps every mounted player site-wide and remembers the choice on the next visit.

### Single-player rule

`src/state/currentPlayerState.ts` holds a single `currentSlug: string | null` slot — at most one video plays site-wide at a time. `LiteYouTube` participates by:

- Calling `claimPlayback(slug)` from the facade `onClick` and from the YouTube `infoDelivery` postMessage when `playerState === 1` (covers manual play via iframe controls).
- Reading `currentSlug` via `useCurrentPlayer()` (subscriber-backed). `isCurrent === currentSlug === slug`.
- Gating the iframe `src`'s `autoplay=1` on `isCurrent`. When another player claims, this one's `isCurrent` flips false, src recomputes without `autoplay`, iframe reloads — effectively a pause. YouTube preserves position via the `start` param (driven by `recordVideoTime` postMessage tracking); RuTube reloads from start.

The same gating handles the provider-swap autoplay-burst: when the toggle fires, all mounted players re-render with the new provider, but only the one matching `currentSlug` gets `autoplay=1`.

### Language pill (multilingual cuts)

Each video case ships **separate cuts per language** — different `videoId` on each lang's `Project` payload, recorded with native voiceover. To make those cuts discoverable without forcing the visitor to dig in the global lang switcher, `<LiteYouTube>` accepts:

- `availableLanguages?: Lang[]` — list of langs that carry a transcript for this video. The caller derives this from `project.videoTranscript ? [...LANGS] : undefined`.
- `currentLanguage?: Lang` — used to mark the active pill via `aria-pressed`.
- `onSelectLanguage?: (lang) => void` — wired to `setLang` from `useLang()`. Clicking a pill swaps the global UI language; the project payload swaps with it (different `videoId` per lang); the iframe reloads with the matching cut.

The pill renders as an absolute-positioned overlay (top-right, RTL-aware via `inset-inline-end`) above both the thumbnail facade and the active iframe. CSS classes `.lite-yt-langs` (container) and `.lite-yt-lang-btn` (each lang button) live in `src/styles/media.css`. Click handler stops propagation so it doesn't trigger the play-overlay click on the thumbnail. The pill is hidden when `availableLanguages` is unset or has fewer than 2 entries — single-language videos stay clean.

### Agent-discoverable transcripts

Per-language `VideoObject` JSON-LD is emitted into the static `dist/cases/<slug>/index.html` head by `vite.config.ts:videoObjectJsonLd`. One `<script type="application/ld+json" data-case-head>` block per lang (en / ru / ar), each disambiguated by `@id: <origin>/cases/<slug>#video-<lang>`. Fields are minimal — `name`, `description` (synopsis), `thumbnailUrl`, `embedUrl`, `contentUrl`, `inLanguage`, `transcript` (full text). No `duration`, no `uploadDate` — those add no signal to LLM crawlers and the video host (YouTube / RuTube) carries them canonically.

The same content also lands in the agent Markdown mirrors as a `## Video walkthrough` section (label localized via `ui.markdown.videoWalkthrough`) emitted by `src/lib/caseStudyMarkdown.ts` whenever `project.videoTranscript` is present. The section carries the synopsis paragraph followed by the verbatim voiceover, paragraph-split by `\n\n` from `videoTranscript.fullText`. Reaches both per-case `cases/<slug>{.md,.ru.md,.ar.md}` files and `llms-full.txt`.

## Telemetry

Privacy-first, cookieless, self-hosted. Full design in `docs/analytics.md`; below is the integration shape.

```
src/lib/analytics.ts        Envelope + sendBeacon → fetch keepalive fallback. 5 events.
src/lib/dwell.ts            Heartbeat, 5s idle window, 30 min hard cap. Flush on
                            visibilitychange / pagehide / SPA route change.
src/router/AnalyticsRouteTracker.tsx
                            Mounted inside BrowserRouter; fires `pageview` and
                            (re)starts `dwell` on every pathname change.
```

Wiring points (one analytics call per real user action — no client-side classification):

- `pageview` + `dwell` — `AnalyticsRouteTracker` reacts to `useLocation().pathname`.
- `outbound` — `ArrowLink.tsx` onClick on `external` links; `classifyOutbound()` maps `mailto:` / `t.me` / `github.com` to the three known kinds.
- `interaction.lang_toggle` / `theme_toggle` — wrapping `setLang` / `setTheme` in their Contexts (only fires on actual change).
- `interaction.video_provider_toggle` — `setVideoProvider` (only on actual provider change).
- `video.play` / `video.completed` — `LiteYouTube`: facade onClick fires `play`; YouTube `infoDelivery` postMessage with `playerState === 0` fires `completed` with current position.

The server lives in `server/` (separate `package.json`, single dep on `better-sqlite3`). In dev, Vite proxies `/api` and `/admin` to `localhost:3000`. In production, Caddy reverse_proxies the same paths same-origin.

## Agent layer (Markdown mirrors)

Every page has a Markdown sibling at the same URL — `/index.md`, `/cases/<slug>.md` × 6, plus the [llmstxt.org](https://llmstxt.org) entry points: `/llms.txt` (curated index) and `/llms-full.txt` (concatenated EN corpus, single fetch). RU gets `.ru.md` siblings + `/llms-ru.txt`. AR gets `.ar.md` siblings + `/llms-ar.txt`. Designed for AI search citation (Perplexity, ChatGPT search, Google AI Overviews, Bing Copilot) which prefers a clean Markdown twin over HTML scraping.

Per-language mirror config (file extension, llms filename, home filename, markdown labels) lives in `LANG_CONFIG[lang]` and is iterated via `LANGS` — adding a fourth language means populating one entry in `langConfig.ts` plus the `Content` tree.

```
src/lib/agentMirrors.ts          Build orchestrator. Iterates LANGS, calls
                                 homeToMarkdown / caseStudyToMarkdown per page,
                                 returns the mirror file map for the active
                                 content tree.
src/lib/homeMarkdown.ts          Pure serializer: Hero · About · Stack · Cases
                                 · Timeline · Contact → Markdown.
src/lib/caseStudyMarkdown.ts     Pure serializer: Hero · Context · heroFacts
                                 · Architecture (ASCII fenced or images) ·
                                 Decisions · Stack · Lessons → Markdown.
                                 prev/next/index footer links between sibling .md.
src/components/CopyMarkdownButton.tsx
                                 In-page button — re-runs the same serializer
                                 in-memory, writes to clipboard. No file fetch.
src/components/CaseHeadTags.tsx
                                 On case routes: per-page <link rel="alternate"
                                 type="text/markdown"> (EN/RU/AR) + Schema.org
                                 Article JSON-LD. Hides the global homepage
                                 alternates while a case is mounted.
```

The Vite plugin `agentMirrorsPlugin` (in `vite.config.ts`) regenerates files for
the active source without crossing the public/private boundary:

- public build/dev writes mirrors under `public/` (gitignored build artefacts)
  so the committed demo tree can be inspected locally;
- private build writes mirrors only under `dist/`;
- private dev serves mirrors from memory instead of writing private text into
  `public/`;
- preview serves mirrors from `dist/`.

A direct-serve middleware bypasses Vite's static handler for `.md` and `.txt`
(Vite's SPA-fallback otherwise routes `.txt` requests through `index.html`) and
pins `Content-Type: text/{plain,markdown}; charset=utf-8` — without it browsers
fall back to Windows-1252 and Cyrillic mangles to mojibake.

`llms-full.txt` carries a self-described size in line 1 (HTML comment, hidden from Markdown renderers): `<!-- llms-full.txt · concat of EN home + 6 cases · ~Nk chars · ~N KB -->`. Both language indexes (`llms.txt`, `llms-ru.txt`) cite the same size next to the "Full corpus" link, so agents can budget context before fetching. See `docs/decisions.md` → "Markdown twin per page (agent layer)".

## File-level conventions

- Sections (`src/sections/*.tsx`) each render exactly one `<section>` with its own id and CSS class.
- Atoms (`src/components/atoms/*.tsx`) are tiny, presentational, prop-driven. No state, no context except via children.
- `src/hooks/*.ts` are stateless utilities returning plain values; React-only side-effects allowed (event listeners, RAF).
- `src/styles/styles.css` is the cascade entry file. It imports domain stylesheets in order: `base.css`, `home.css`, `media.css`, `case-study.css`, `runtime.css`. No CSS modules / CSS-in-JS — selectors stay grep-friendly, while the split keeps cascade bugs bounded to smaller files.
