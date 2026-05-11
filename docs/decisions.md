# Engineering decisions

Non-obvious choices, with rationale. For future me and the curious reader.

## i18n: custom Context, no react-i18next

The site has three languages (EN, RU, AR) × ~300 strings. No plurals, no interpolation, no namespaces. A typed dictionary + Context hook does the job in ~80 lines.

Why not react-i18next:
- ~25 KB minified+gzip for our use case
- Verbose API (`t('hero.title', { defaultValue: ..., context: ... })`) when we just want `t.hero.title`
- Loses TypeScript inference unless you stack on resource-type-generation

The custom hook gives us autocomplete and compile-time guarantees — `ru: Content` and `ar: Content` enforce full key parity with `en`. A runtime test (`src/content/parity.test.ts`) enforces array-length parity (project list, decisions, diagrams, lessons, etc.) which the type system can't catch.

Files: `src/i18n/LangContext.tsx`, `src/i18n/langConfig.ts`, `src/content/types.ts`, `src/content/parity.test.ts`.

## langConfig — single source of truth for per-language wiring

Per-language wiring (file extensions, llms filenames, CV PDF filenames, hreflang values, og:locale tags, RTL direction, Arabic font selection, mirror-Markdown labels) used to be scattered across ~12 ternaries (`lang === 'ru' ? '.ru.md' : '.md'`, later `.ru.txt` / `.txt`) in Hero.tsx, Footer.tsx, Nav.tsx, CaseHeadTags.tsx, agentMirrors.ts, vite.config.ts, cvSource.ts, ProjectDetailPage.tsx, scripts/cv/build.mjs, server/src/ingest.js. Adding a third language meant grepping for both literal strings — error-prone.

Now: `src/i18n/langConfig.ts` exports `LANG_CONFIG: Record<Lang, LangConfig>`. Every lookup site does `LANG_CONFIG[lang].mirrorExt` / `.cvFile` / `.dir` / `.markdown.source` etc. Adding a fourth language is one entry in the table plus the content files.

`Lang` is the literal union (`'en' | 'ru' | 'ar'`); `LANGS` is a `readonly Lang[]` for iteration. `isLang(value)` is the runtime validator used in `LangContext`'s `localStorage` read and in `server/src/ingest.js` analytics validation (instead of an inline `value === 'en' || value === 'ru' || …` chain).

Files: `src/i18n/langConfig.ts`, `src/i18n/LangContext.tsx`, plus consumers listed above.

## RTL: stable shell + RTL content, code/diagrams stay LTR

When `lang === 'ar'`, `LangContext` writes `html.dir = 'rtl'`. Native CSS Grid + flex layouts auto-mirror under `dir="rtl"` — most sections need no special-casing.

The 13 physical-direction CSS rules (`margin-left`, `border-right`, `text-align: right`, `inset-{left,right}`) were converted to logical properties (`margin-inline-start`, `border-inline-end`, `text-align: end`, `inset-inline-{start,end}`). Browser support is 95%+ (Safari 14.1+).

Two design rules added on top of native flip:

1. **Site shell stays LTR even under `dir="rtl"`.** Nav inner row (agent notice + section links + theme/lang controls), hero action chips, mobile hero meta strip, case-page hero status row. Achieved via `direction: ltr; unicode-bidi: isolate` on the wrapper. Reason: the EN/RU/AR language toggle and `/llms-ar.txt` agent notice are interface chrome — they should not jump positions when switching to AR. Center nav links and case tabs flip RTL inside the LTR shell:

   ```css
   .nav-inner { direction: ltr; unicode-bidi: isolate; }
   [data-lang="ar"] .nav-links,
   [data-lang="ar"] .nav-cases { direction: rtl; unicode-bidi: isolate; }
   ```

2. **Code/pre/diagram blocks stay LTR under any lang.** ASCII diagrams use box-drawing chars and arrows designed left-to-right; mono code reads in code-direction regardless of human language. Industry norm — Linux man pages, GitHub READMEs, MDN under AR all do the same:

   ```css
   [dir="rtl"] code,
   [dir="rtl"] pre,
   [dir="rtl"] .case-diagram pre,
   [dir="rtl"] .foot,
   [dir="rtl"] .mono { direction: ltr; unicode-bidi: isolate; }
   ```

Arabic font is overridden via `[data-lang="ar"]` in `tokens.css` — `--font-display` and `--font-body` switch to `Noto Sans Arabic` (with `Geist` Latin fallback for inline tech terms). No Arabic-specific mono font; JetBrains Mono falls back gracefully and code blocks stay LTR anyway.

Trade-off: AR readers see English tech terms (`MCP`, `FastAPI`, `Telegram`, `Bearer`) inline in Arabic prose. Browser handles bidi automatically; tested visually. Rejected alternative: full Arabic translation of every API/library name — non-idiomatic, would confuse readers more than it helps.

## ProjectStatus stays a literal code, labels move to UI dict

First AR pass put Arabic strings directly into `Project.status` (`status: 'تم التسليم'`). Type was a literal union (`'Delivered' | 'Published' | …`); the AR strings forced four `as Project` casts that bypassed every type check on the AR case overrides.

Fixed: `Project.status` keeps the English literal type; user-facing labels live in `ui.projectStatusLabels: Record<ProjectStatus, string>` in each language's UI dict. AR fills `{ Delivered: 'تم التسليم', Published: 'منشور', 'R&D': 'بحث وتطوير', … }`. Render goes through the helper:

```ts
// src/lib/projectStatus.ts
export function projectStatusLabel(ui: Ui, status: ProjectStatus): string {
  return ui.projectStatusLabels[status] ?? status;
}
```

Used by `Projects.tsx`, `ProjectDetailPage.tsx`, `homeMarkdown.ts`, `caseStudyMarkdown.ts`. Casts removed; if a status is missing in a lang, the helper falls back to the English literal.

Adding a status: extend the type union in `types.ts`, then fill the new key in every language's `ui.projectStatusLabels` (compiler enforces).

## CSS: plain stylesheets, no Tailwind

The site has a strict design language. Re-implementing it in Tailwind utilities would mean:
- Re-deriving the type scale, palette, spacing — error-prone
- Cluttering the JSX with dozens of utility classes per element
- Losing the visual scan of a CSS file where each section's styles live together

The token system in `tokens.css` does what Tailwind's config would; component selectors in the domain stylesheets (`base`, `home`, `media`, `case-study`, `runtime`) do what Tailwind's classes would — but readable and grep-friendly. `styles.css` is now only the cascade entry file.

## Scroll progress: proportional, not trigger-line

First implementation used a "trigger line at 20% from viewport top" — when the line crossed a section, that section was active.

Problem: at the page bottom, the trigger line is at `maxScroll + 20% viewport`. If the last section's height is less than 80% of viewport, the trigger line never enters it — Contact stayed at progress < 100% even when fully scrolled.

Fixed approach: divide `[0, maxScroll]` into per-section sub-ranges weighted by `section.height / totalHeight`. The last section's range is clamped to `maxScroll`. Result: scrolling to the very bottom always shows Contact at exactly 100%.

File: `src/hooks/useActiveSection.ts`.

## Loader: synchronous `is-loading` class

The loader hides hero/about elements via `html.is-loading .hero-fx, … { opacity: 0 }`.

If the class were applied in React's first `useEffect`, there'd be one frame where elements render visible before the class kicks in — a flash of unstyled content.

Solution: an inline `<script>` in `index.html` adds the class synchronously, *before* the React script loads. React's Loader removes it during the reveal phase. Zero FOUC.

Files: `index.html` (the script tag), `src/components/Loader.tsx` (removes the class).

## Loader hairline aligned to the real divider

The pulsing hairline measures `#home.getBoundingClientRect().bottom` and sets `--loader-line-y` so its on-screen position matches the real Hero↔About divider.

When the loader fades out, the white pulsing hairline visually transitions into the existing accent-tinted divider in the same Y. Continuity gimmick — one frame of optical magic.

Falls back to viewport center until measurement is available (i.e. before fonts ready).

## Loader: light turns on *during* the rush, no flash

Earlier version had a flash phase (radial accent burst at center). Feedback: "no flash, the light should start turning on before the pulses meet".

Now the rush phase removes `is-loading` at T+400 ms (out of 600 ms rush duration). Hero entrance animations start. Loader opacity fades from 1 → 0 between T=400 ms and T=900 ms (via keyframe `0%, 44% { opacity: 1 }`). The pulses arrive at center while the loader is mid-fade — they merge into the lit interface naturally.

## Display heading sizes: tokens, never inline `clamp()`

Got bitten by this once: I added `.section.stack .section-head h2 { font-size: clamp(1.4rem, 2.2vw, 1.9rem) }` to make Stack's heading "more compact". Result: Stack's h2 was visibly smaller than every other section's h2, breaking visual hierarchy.

Fix: introduce `--fs-display-l` token used by *all* section headings. Want to change all six headings together? Touch one variable.

Tokens: `--fs-display-hero`, `-xl`, `-l`, `-s` in `src/styles/tokens.css`.

## react-router-dom for two routes (home + case study)

Two routes today: `/` (home) and `/cases/:slug` (case studies). The router was pulled in early — when the case pages were still stubs — so:

- `ScrollToHash` already needs `useLocation` (drags the router in anyway)
- `<Nav>` reads `useLocation()` to swap to case-mode on `/cases/:slug`
- `<ProjectDetailPage>` reads `useParams()` to pick the matching project
- Bundle cost: ~12 KB gzipped — trivial for a portfolio site

No code-splitting yet — both routes load in one bundle. Lighthouse score still passes; revisit if a third route ever appears.

## Two parallel content files instead of a key-based store

The naïve i18n shape is `{ "hero.name": { en: "Ilya Kazantsev", ru: "Илья Казанцев" } }`. We don't do that. Instead, the active content tree exports two complete `Content` objects, swapped wholesale by the active-language Provider. Public demo content is committed under `src/content/public`; private real content can override it from ignored `src/content/.private`; `scripts/select-content.mjs` writes `src/content/active.ts` only when an explicit public/private script sets `CONTENT_SOURCE`.

Why:
- Editing reads naturally — short shared blocks keep EN/RU side by side, while long cases split into `en.ts` and `ru.ts` per case. No jumping between flat key-value records.
- The `Content` type enforces parity: TypeScript rejects either file if a key is missing.
- Adding a new field is one type change + two value adds. No registration, no namespace files.

Trade-off: when you add a field, the compiler complains in both files at once until both are filled. Easy to fix; we tolerate it.

## CSS @media overrides come *after* base rules

Burned twice on this. Media queries don't raise specificity — a later `.foo { ... }` rule in source order silently wins over an earlier `@media (max-width: 720px) { .foo { ... } }`.

Convention: when you write a mobile override, place it *immediately after* the base rule for the same selector — or co-locate base + overrides in the same domain stylesheet.

## No abbreviated mobile nav strip

Earlier iteration had a separate `.nav-mobile-strip` row below the main nav, with abbreviated chip labels (`Ab` / `Wk` / `Exp`). Feedback: "no abbreviations, just one base size". Replaced with a single `.nav-links` element that uses different `font-size` per breakpoint. Less code, less visual noise.

## Frosted-glass chips on hero, opaque chips on stack

Hero's three chips sit over the embers FX — they need backdrop separation. Solution: `background: color-mix(in oklab, var(--bg) 10%, transparent) + backdrop-filter: blur(8px)`. Frosted glass.

Stack's chips sit over the scanline ambient — they need to *cover* the scanlines (any opacity tells the scanlines through). Solution: opaque `background: color-mix(in oklab, var(--bg) 65%, var(--bg-raise) 35%)`. Slightly raised tone, not transparent.

Same `<Chip>` atom, different parent CSS. The atom doesn't know about backdrops — context provides them.

## Mobile hero — meta info as a passport strip at the bottom

On desktop the left sidebar (Location / Hours / Availability) reads as quiet ambient context next to the big name. On mobile, stacking it on top of the hero made those mono-caps lines compete with the name for attention.

Fix: hide the K:V rows on mobile, render a single compact mono "passport strip" (`UTC+7 · EU/US hours · Open to work`) at the bottom of the hero grid. Information preserved, hierarchy restored.

## Project cards: fixed proof schema, no body paragraph

First iteration of cards rendered the project's `role` (mono kicker), `title` (display), `body` (paragraph, ~3-4 sentences), three free-form `chips`, and a `foot` stack list. Result: every card had a different visual silhouette — body length varied 2-3×, role kicker wrapped to one or two lines depending on copy, stack list spanned one or two lines.

Fixed structure: every card has the same slots in the same order — head, media, mirror, title, long-form subtitle, standardized meta rows (`Scope`, optional `Proof`, optional `Surface`, `Stack`) and foot CTAs. No body paragraph, no free-form chips. Card heights become uniform because the content shape is predictable.

Why a `subtitle` field instead of reusing `body[0]`: a body paragraph optimises for *narrative*; a card subtitle optimises for *one-line scan*. Different content shapes, different fields. `body` stays in the data model for the case study fallback.

Why drop `chips` from cards: every project's chips were tagging different dimensions (one was tech keywords, another was scope claims, another was outcome metrics). Recruiters scanning four cards in five seconds couldn't compare them. Replaced with labelled meta rows that have the *same* shape on every card: `SCOPE`, `PROOF`, `SURFACE`, `STACK`.

Meta-row layout: hidden 56px grid for the label, 1fr for the value. Labels are mono uppercase via CSS `text-transform`, kept untranslated in source ("Scope", "Stack") because they're typographic markers like `GET`/`POST`, not user-facing copy. Value column has `text-overflow: ellipsis` as a safety net if a stack list overshoots 50 chars.

## Nav swaps mode on case-study routes

On `/` the nav shows section anchors (`Home / About / Cases / …`) with a scroll-progress underline. On `/cases/:slug` the same `<Nav>` component renders a different layout: `← Back` left, a `Case 01 · 02 · 03 · 04 · 05 · 06` tab list center, controls right.

Why route-aware in one component instead of two:

- Sticky-nav visual is identical (height, blur, border) — splitting would duplicate that wrapper just to swap children.
- Theme + lang controls behave identically across both — the `<NavControls>` slot is shared.
- `useLocation()` is a one-line route check; mode-specific render is cheap.

The `CASE_SLUGS` whitelist now covers all six projects — `ai-crm, ai-warehouse, ai-video-editor, roblox-game, macos-vpn, portfolio-site`. Earlier experimental slugs were excluded or renamed while the case-study template stabilised; all six current projects now have `/cases/:slug` pages with full `caseStudy` payloads. Slugs themselves were renamed in a later pass — see "HR-coded slugs, codename = slug" below.

Mobile compromise: both modes now hide nav controls and surface them in the hero. Home does it via `.hero-ctrls-slot` inside `.row-top`; the case page uses a parallel `.case-hero-status-row` wrapping the status line + `.case-hero-ctrls-slot`. Earlier the case mode kept controls in the nav (no equivalent slot existed); when `CASE_SLUGS` grew from 4 to 6, the inline controls + back chip + 6 tabs no longer fit one row, so the case-hero slot was added to mirror home. The back link becomes an outlined chevron-only chip; tabs centre in the remaining cell. At `≤520px` the `Work` label is dropped (`#01..#06`) — same info, half the width. At `≤380px` (iPhone SE / Mini) tab gap and back-chip padding tighten one notch further. See the mobile blocks for `.nav.nav--case` in `base.css`.

## Case-study hero: 8/4 split, video + FACTS spec-sheet

The case page hero is two side-by-side blocks:

- Cols 1–8 (~67%): LiteYouTube facade. Video is the work — gets two-thirds of the row.
- Cols 9–12 (~33%): a FACTS panel — 4–6 mono key:value rows (Scope, Surfaces, Tool surface, Auth model, Status). Reads as a tear-sheet.

Earlier iterations tried 1) full-width video → recruiter scrolled past it; 2) 1/3 video + 2/3 walkthrough list with timestamps → the timestamps weren't clickable, the list was redundant with the video, and the imbalance made the video feel small.

The FACTS panel is structural, not narrative — every recruit-facing fact in 5 scannable lines. The video carries the demonstration; FACTS carries the spec.

Mobile (≤900px): stacks vertically — video first, FACTS below. Both reach full width.

## Hero glow mirrors home Hero — multi-layer, no particles

Home Hero's warm wash comes from three layers: SVG `<radialGradient>` over a `<rect>`, 26 animated ember particles, and `.hero::after` tapered hairline + accent sheen.

The case Hero needs the same warmth without the particles (a sub-page shouldn't have the same liveliness as the personal hero). Two layers reused:

1. **SVG `<radialGradient>`** in `.case-hero-glow` — same opacity stops as home (0.18 → 0.05 → 0), `cy="5%" r="35%"` (mirror of home's `cy="95%" r="75%"` plus toned-down to fit the smaller hero). Crucially uses `preserveAspectRatio="xMidYMid slice"` so the gradient is viewBox-stable on mobile — a CSS `radial-gradient(ellipse 75% at 50% 0%, ...)` would have its 75% radius hit the visible edge on a 360px-wide screen and dim out before reaching it; the SVG approach shows the central, strong part of the gradient on any viewport.
2. **`.case-hero::before`** — exact mirror of `.hero::after`: a 1px tapered hairline (linear-gradient) at the top edge of the case hero plus a narrow accent radial sheen descending from it.

Why two layers and not one: a single radial reads as a flat wash. Layering a hairline-edged accent below it gives the glow a "horizon line" — a precise edge that radial gradients alone never produce.

## Continuous dot grid via `.case-dot-zone` wrapper

Three case sections wear `bg-dots`: Hero, Context, Architecture. Naïve approach: each section gets its own `::before` painting the 28px dot pattern. Problem: each section's `::before` starts at top-left of its own box, so the dot rows don't align across section boundaries — visible seam where one section ends and another begins.

Fix: wrap all three in a single `.case-dot-zone` `<div>`. Move the `bg-dots` class from the sections to the wrapper. Now one `::before` paints across all three sections — the dot grid is one continuous pattern, no per-section reset, no seams.

Side effect: per-section mask fades disappear (mask is on the wrapper, not each section). Single soft fade only at the very bottom of the wrapper transitions into the non-dotted Decisions section. Three sections feel like one cohesive zone.

Tried `background-attachment: fixed` first — solved the alignment but locked the dots to the viewport (they don't scroll with content). Felt wrong. Wrapper approach scrolls naturally and aligns inherently.

## ASCII diagrams instead of Mermaid lib

Two architecture diagrams (sequence + component) live in `case-study.diagrams[].ascii` as plain string content rendered into a `<pre>`. No Mermaid library, no client-side rendering, no SVG generation step.

Why:

- ~200 KB JS for two diagrams is not justified on a portfolio site that targets Lighthouse 95+.
- JetBrains Mono (the site's mono token) renders box-drawing chars (`─│┌┐└┘├┤┬┴┼╔╗╚╝═║▼▲►◄→←↑↓`) cleanly across themes — the diagram inherits the design language for free.
- An ASCII diagram in mono on a `--bg-sunk` block reads as a deliberate engineer-style artifact rather than a decorative pulled-in graphic. Same energy as the `.hatch` placeholders.

If someone later needs to *edit* a diagram, the source is right there in `en.ts` / `ru.ts` as a template literal — no round-trip through external tooling.

## Diagram captions are structured notes, not paragraphs

First version had `diagrams[].caption: string` — a single paragraph rendered below each ASCII block. On wide screens that left the right half of the section empty, and the prose ran wider than the eye wants to track.

Replaced with `diagrams[].notes: { k, v }[]` — an array of small key:value blocks. Layout becomes 2-col: ASCII on the left (max-content width), notes stacked on the right (capped at `--measure`, ≈ 65ch). On screens narrower than 1024px the layout collapses to single column.

Each note has a mono caps `k` ("Message states (7)", "Why a separate bridge", "Trust model") and a 1-2 sentence `v`. Reads as design rationale next to the diagram, not a single dense paragraph below it.

## Decisions: 2-col cards with per-card watermark

`caseStudy.decisions[]` renders as a 2-col grid of cards. Each card has a `data-num` attribute (`"01"`, `"02"`, …). CSS `::before` reads the attribute and paints it as a faint display-type background number in the top-right corner of the card.

Mirrors home Experience's `xp-watermark` (huge year behind each row). Same visual logic, different shape — cards instead of rows because decisions have 3 fields each (decision / why / cost) and need vertical containers.

Side effect: titles drop their "1.", "2." prefixes (the watermark draws the index). Cleaner.

## Stack as 3-col strata, not a table

First case-page Stack rendered `stackTable[]` as a `120px / 1fr` table — `Backend | Python · Django ...` on one row, `Frontend | React ...` on the next. Functional but generic.

Home Stack renders 9 categories in a 3×3 strata grid (display-l label + chip-list per cell). Same tonal voice — should appear identical on both pages.

New case-page Stack: `stackTable[]` rendered as 3-col strata (`repeat(3, 1fr)`), each cell with a `display-s` label + a mono body block (`color-mix` opaque plate over the scanline ambient — same backdrop pattern as home Stack chips). Six rows fit a clean 3×2 layout. Reads as one continuous "stack zone" with the home page.

## Lessons: 6+6 keep / change split

First Lessons section was a single column of 5 bullets, all "things I'd change". Looked penitential — and visually empty (single-column prose at `--measure` left two-thirds of the row empty on desktop).

Restructured to 6+6 grid mirroring home Contact's 7+5 split. Left column (cols 1-6): "Carry forward" — 3 short bullets of what the project got right and would build again 1:1. Right column (cols 7-12): "Would change" — 3 bullets of what would be done differently next time. Status paragraph below both columns.

The "carry forward + would change" pair reads as honest engineering retrospective, not just regrets. Recruiter takeaway: the project shipped something worth repeating *and* the author has clear views on what to refactor.

Field shape: existing `lessons` (singular) keeps semantics as the "would change" list (no rename, smaller diff). New `lessonsKeep?` (optional) for the "carry forward" list.

## Next-case CTA replaces Footer

On `/cases/:slug` the site Footer (small mono copyright row) is replaced by a centred frosted-glass ghost button — `.case-next-btn` — that links to `/cases/{nextSlug}` with a ↓ arrow, or to `/#cases` with a ↑ arrow on the last case (`portfolio-site`).

Why drop the Footer specifically on case pages:

- A case study is a focused single-flow document; a tiny copyright row at the bottom is anticlimactic
- The natural next intent is "read the next case" — the page should answer that intent, not require a return-to-index trip
- The button uses the same frosted-glass backdrop as home Hero chips, sat over a smaller bg-dots zone — visual continuity with the rest of the page

Vertical arrow metaphor: case pages are scrolled top-to-bottom; the next case sits "below" this one in mental geography (even though the URL changes). ↓ matches that. Last case → ↑ to home, the inverse.

Looping the last case back to the first was considered. Rejected because it's confusing — a case-list is a finite set, not a carousel; "back to home" is the honest CTA at the end.

## Loader bg is hardcoded near-black, not `var(--bg)`

User wanted "everything in darkness" for the loader regardless of current theme. So the loader background is `oklch(0.08 0 0)` — near-black — and the pulsing hairline is white. On light theme, this means a brief dark→light transition during reveal, which fits the "darkness, then light breaks through" narrative.

## Hero embers: CSS particles, not SVG filter + SMIL

First version of `<HeroFireBackdrop>` used an SVG `<filter>` with `feTurbulence` + `feDisplacementMap` applied to a `<g>` of 26 `<circle>`s, each running two SMIL `<animate>` elements (`cy` + `opacity`). Look was correct — a subtle warble through rising embers — but iOS Safari was effectively unusable: visible frame drops, render artefacts on particles, and **measurable phone heat** within ~2 minutes of having the page open. iPhone 16 Pro Max reproduced it consistently; cheap Android did not.

### Why iOS specifically

- WebKit rasterizes SVG filters on the CPU (Chromium uses Skia's GPU pipeline). The implementation is roughly an order of magnitude slower for animated inputs.
- A filter applied to a group with animating children invalidates the filter cache every frame — WebKit re-rasterizes the entire filtered region per frame, full DPR.
- `feTurbulence` + `feDisplacementMap` is one of the heaviest combos (per-pixel Perlin noise + sampling from another filter's output).
- 52 SMIL animations (26 × 2) compound the cost — SMIL is being phased out and runs through a slow, non-GPU code path in WebKit.
- ProMotion at 120Hz on iPhone Pro models doubles the effective work.
- Combined: 100% GPU/CPU pegged for what looks like a static ambient effect. Cheap Android renders the same scene at <30% load because Chromium's Skia caches the filter more aggressively.

### Replacement

26 absolutely-positioned `<span>`s, each animated via CSS `@keyframes` on `transform: translate3d(...)` + `opacity` only. Glow from `box-shadow: 0 0 4px var(--accent)` (per-element GPU-cached, no `filter: blur` which forces a layer raster). Per-particle CSS custom properties (`--x`, `--start-y`, `--drift`, `--size`, `--dur`, `--delay`) drive variety from a deterministic seed pattern (same `i * 307 % …` style as the SVG version, so the visual rhythm is preserved). No filter, no SMIL, no displacement.

### What was lost vs kept

- **Lost**: warble — the sub-pixel noise displacement on rising particles. Visually subtle and not worth the cost.
- **Kept**: rising motion, fade in/out, horizontal drift, glow, deterministic positions, 26 particles.
- The static `<radialGradient>` over `<rect>` (warm horizon glow) stays in SVG — viewBox-stable across mobile DPRs and effectively free since it doesn't animate.

### General lesson

SVG `<filter>` on iOS Safari is CPU-bound and very slow when applied to animated content. Default to CSS `transform` + `opacity` for any ambient animation; SVG filters OK only on static elements or when there's explicit budget. Glow via `box-shadow` (cached per-element on GPU) beats `filter: blur` for the same look. For warble/turbulence on moving content, the right approach is a static baked-noise underlay (PNG/SVG generated once) with CSS particles on top — never a runtime SVG filter on animated children.

## Mirror toggle replaces external link to RuTube

Earlier the mirror link was `<a target="_blank">` opening RuTube on a new tab. Two issues: 1) two players for the same video on two surfaces breaks playback continuity; 2) for users in regions where YouTube is blocked, the friction of hopping out felt wrong.

Replaced with a `<button>` toggle inside `LiteYouTube`. Clicking flips the global `provider` ('youtube' ↔ 'rutube'); the iframe re-renders with the alternate embed URL (`toRutubeEmbedUrl()` translates `/video/...` → `/play/embed/...`). Mirror label flips ("Mirror on RuTube" ↔ "Mirror on YouTube").

CSS gain: `.video-mirror` now serves both `<a>` (legacy/none-anchor cases) and `<button>` — the rule got `background: transparent; border: none; padding: 0; cursor: pointer` reset, the rest of the typography unchanged.

## Video provider preference: global, sticky, in localStorage

Three options on the table for the toggle's scope:

- **Per-card** — each card holds its own provider state. Rejected: clicking RuTube on five cards in a row is the exact opposite of "I'd rather watch on RuTube".
- **Session-sticky (in-memory only)** — choice survives card navigation but resets on reload. Rejected: returning user has to re-pick on every visit.
- **localStorage-sticky + global** — chosen. One toggle anywhere swaps every mounted player and remembers across reloads.

Implementation in `src/state/videoProviderState.ts`: in-memory cache → localStorage write → broadcast to a `Set<>` of subscribers. `useVideoProvider()` is a thin React-bound view (subscribe in `useEffect`, local `useState` for re-render). Default `'youtube'` if no localStorage entry; `try/catch` around storage access for private mode / quota.

Cross-tab sync via `window.addEventListener('storage', …)` is *not* implemented — other tabs won't pick up the change until reload. Acceptable trade-off for now; revisit if it surfaces as a friction.

## Single global "currently playing" slot

Without a constraint, multiple cards can autoplay simultaneously — clicking play on card B while card A still plays gives two audio streams; toggling the provider triggers every active iframe to re-render with `autoplay=1`, all of them blasting at once.

Module: `src/state/currentPlayerState.ts` holds `currentSlug: string | null` + a subscriber set + `claimPlayback(slug)` / `releasePlayback(slug)`. `LiteYouTube` participates by:

- Calling `claimPlayback(slug)` from the facade `onClick`.
- Listening to YouTube's `infoDelivery` postMessage for `playerState === 1` (covers manual play in the iframe controls) and calling `claimPlayback(slug)`.
- Reading `currentSlug` via `useCurrentPlayer()` and gating the iframe `src`'s `autoplay=1` parameter on `isCurrent`. When another card claims, this card's `isCurrent` flips false, src recomputes without `autoplay`, iframe reloads — effectively a pause.

Why src-based pause and not postMessage `pauseVideo`: works uniformly for both providers (RuTube's postMessage API is less reliable across versions) without duplicating per-provider command logic. Trade-off: brief reload flicker on the paused card. YouTube's `start=lastTime` param keeps position; RuTube reloads from start.

## View transitions extended to title and subtitle

The base mechanism (`useTransitionNavigate` wrapping `navigate()` in `document.startViewTransition()`) had only the video frame opted in via `viewTransitionName: video-${slug}`. Title (`<h3>` on home → `<h1>` on case) and subtitle (`.subtitle` → `.lede`) fell into the root crossfade and visibly "appeared at the top" of the case page instead of morphing from their card position.

Added paired `view-transition-name` on both surfaces — `title-${slug}` and `subtitle-${slug}` — so the browser FLIP-morphs them alongside the video. The case page gates these via the existing `suppressMorph` ref (set during case→case navigation in `TransitionLink`); same selector list extended to clear `.case-hero-top h1, .case-hero-top .lede` on the old page snapshot so two different titles don't collide on the same screen position.

Caveat: the browser snapshots elements as bitmaps and FLIP-scales — text gets mildly blurry mid-morph (h3 → h1 is ~3-5× scale). Acceptable on a 480 ms morph. If quality regresses on a particular pairing, the fallback is a manual FLIP via Web Animations API (50–80 lines of measure + animate); not in yet because the browser version reads well enough.

## CaseStudy.status made optional

`caseStudy.statusNote` is an optional one-sentence wrap-up under the lessons section ("Built, deployed, and delivered to client. Walk-through on request."). It is intentionally named `statusNote`, not `status`, so it cannot be confused with the top-level project status badge (`Delivered`, `MVP`, etc.).

Type is `statusNote?: string`; `ProjectDetailPage` guards the render (`{cs.statusNote && <p className="case-status">…</p>}`). All six cases now have full `caseStudy` payloads — `statusNote` is set per-case where the lessons-section wrap-up adds value, omitted where it would duplicate the Hero `Status` row.

## Image diagrams alongside ASCII

The case-study `diagrams[]` field originally only carried ASCII (`{ title, ascii, notes? }`). Adding screenshot evidence — first instance: AI-CRM agent-topology screenshots — needed first-class support without breaking the existing three ASCII diagrams.

`CaseStudyDiagram` now has `ascii?: string`, `images?: { src, alt, caption? }[]`, and `imageCols?: string`. `ProjectDetailPage` branches on which is set; `ascii` mode renders `<pre>` in col 1 with notes on col 2 (existing behaviour). `images` mode applies a `.case-diagram--screenshots` CSS modifier that:

- Spans full width (col 1 `max-content` is too narrow for screenshots)
- Reads `grid-template-columns` from a `--diagram-img-cols` CSS variable so column ratios travel with the data, not with the CSS. Default is `1fr 1fr`; each diagram opts into its own ratio via `imageCols` (rendered as inline `style={{ '--diagram-img-cols': … }}` on the image grid).
- Falls back to single column on `≤1024px`, identical to ASCII variant.

Convention for `imageCols`: each fr value equals `image_width / image_height` of the matching image. That keeps both columns at the same rendered height — no pillarbox, no letterbox.

In use:
- AI-CRM agent topologies → `0.96fr 1.16fr` (1400×1456 = 0.96; 1400×1204 = 1.16).
- Roblox AI art pipeline output → `0.80fr 1.33fr` (1280×1600 = 0.80; 1600×1200 = 1.33).

The `fr = W/H` formula gives perfectly equal heights only when the `<img>` itself has no inner padding — any constant offset (padding, border) on a `width: 100%` image breaks the math by a fixed amount that grows with aspect mismatch (~1px for AI-CRM aspects, ~13px for Roblox aspects). Therefore `.case-diagram-images img` keeps the border but no padding; the bordered frame still reads as a deliberate inset, and heights match across mismatched aspects.

Screenshot file paths point inside `public/` (no Vite-import — Pillow-quantised PNGs are static assets).

Earlier attempt: force `aspect-ratio: 1.16` + `object-fit: contain` on both images. Rejected — the taller image got visible pillarbox bars on left/right.

## Status badge: single nominal word

Project-card status badge originally rendered as `● {p.status}` with values like `Published · 2025` and `Live · iterating`. Two issues: (1) the leading `●` was a visual accent that competed with the `§ NN` index marker on the same `card-head` row; (2) date suffixes leaked information that didn't add scan-value (`· 2025` for Published — the year is in the timeline, not the status; `· iterating` for Live — over-explaining).

Fix: badge is one nominal word (or short nominal phrase — `R&D`, `Open source`). Six values across all six cards: `Delivered`, `Published`, `R&D`, `MVP`, `Personal tool`, `Open source`. Changed in `Projects.tsx:72` (drop `●`) and content (`status: 'Published · 2025'` → `'Published'`, etc., in both `en.ts` and `ru.ts`). `Open source` is used for the portfolio-site card because the public repository URL is part of the proof surface.

The CSS dot before the status (`.status::before`) was never present — the bullet was inline character `●` in JSX, which made the removal a one-character JSX edit.

## Favicon family + OG/Twitter meta — generated externally, wired locally

`public/` carries the icon family (`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `manifest.webmanifest`) plus the OG image set (`og-image.png`, `og/cv.png`, `og/cases/<slug>.png` × 6 — committed sanitized demo content). These are static replaceable assets; no engine code depends on how the PNGs are produced.

`index.html` adds the full set of `<link rel="icon">`, `<link rel="manifest">`, `<meta name="theme-color">` (matches `manifest.theme_color` `#110e0b`), plus `og:*` (type/site_name/url/title/description/image + width/height/type/alt/locale + alternate locale), `twitter:*` (summary_large_image card with title/description/image), and `<link rel="canonical">`.

For case routes the `vite.config.ts` plugin overrides `<head>` per slug, including `og:image` pointing at `/og/cases/<slug>.png`. The same build emits `dist/cv/index.html`: social crawlers see a normal HTML page with `/og/cv.png`, while browsers are redirected to the resolved PDF path. Home, CV and case OG are PNG, not SVG/WebP — LinkedIn rejects vector and WebP for `og:image`; PNG/JPG only.

Decision: keep two parallel icon masters — one for `≤48px` sizes (a single bold `i` glyph that survives at 16px); a separate full dot-grid composition for `≥180px`. At `≤48px` the full mark turns into pixel mush; only the single glyph survives. At `≥180px` the dot grid + composition reads as a real brand mark.

The OG image (1200×630) mirrors the home Hero layout: warm ochre radial heat in the top half, tapered hairline + accent sheen at the divider, cool blue glow in the bottom half. All gradient stops match `tokens.css` exactly — the site palette is the single source of truth. CV and per-case OG use a billboard layout so social cards stay readable, but case copy is not a second marketing layer: `scripts/og/export-case-og-data.mjs` exports public placeholder labels (`Case 01`, `Case 02`, etc.). Private deployments can pass an untracked `CASE_OG_PRIVATE_FACTS_PATH` JSON file to add deploy-only Scope/System/Result facts without committing those facts to the public repo.

### Public vs private OG (privacy invariant)

The site has two parallel content trees (`src/content/public/` committed demo, `src/content/.private/` real). The OG generator mirrors that split:

- `public/og-image.png`, `public/og/cv.png`, and `public/og/cases/<slug>.png` are committed and contain **public/demo content only**. They are safe to push to the public github repo via `npm run export:public` and serve on a public-content `build:public`.
- `npm run build:private` runs `scripts/overlay-private-og.mjs` after `vite build`, which copies the matching private masters from `PRIVATE_OG_DIR` directly over `dist/og-image.png`, `dist/og/cv.png`, and `dist/og/cases/<slug>.png`. `public/og/*` is never written by the private pipeline, so a stray `git status` after `build:private` cannot accidentally surface private OG bytes for commit.

Operator workflow when private content changes: export case OG data from the active content tree (`npm run og:case-data`), regenerate public/private OG masters with the project's asset pipeline, commit only the public set under `public/og/*`, and point `PRIVATE_OG_DIR` at the untracked private master directory for `npm run build:private`. Set `SKIP_PRIVATE_OG_OVERLAY=1` in environments without private masters (CI build:private smoke checks).

## HR-coded slugs, codename = slug

Slugs were initially named after each project's developer codename (`airea`, `phantasos`, `wms-bot`, `bullet-reign`) — fine for the author, opaque for an HR scanner reading the URL bar or an LLM agent indexing the case-study list. `/cases/phantasos` doesn't tell anyone the page is about an AI video editor.

Renamed to keyword-bearing kebab-case so the URL itself reads as the project type:

| was | now |
|---|---|
| `airea` | `ai-crm` |
| `roblox` | `roblox-game` |
| `phantasos` | `ai-video-editor` |
| `wms` | `ai-warehouse` |
| `mvpn` | `macos-vpn` |
| `site` | `portfolio-site` |

Touched: `Nav.tsx` + `ProjectDetailPage.tsx` `CASE_SLUGS`, `slug` / `cta.href` / `cls` in both content files, `KNOWN_PATHS` in `server/src/ingest.js`, `SLUGS` in `server/src/{rollup,admin}.js`, comment example in `index.html`. Generated text mirrors follow the new slug naturally.

The card head row's `codename` slot was made redundant by the rename — title + slug already cover identity, so a separate codename added nothing. Set `codename = slug` for all six projects (`§ 03.03 · ai-video-editor · R&D`). Earlier two cards had `codename: null` which left a visible gap; uniform rule eliminates the gap and reads as deliberate cross-reference between URL and head.

`portfolio-site` status is `Open source` once the public repository URL exists. The footer and Contact section link to the GitHub repository, so the status carries a real proof path rather than a vague promise.

## Text mirror per page (agent layer)

Every page has a plain-text Markdown sibling at the same URL — `/cases/ai-crm.txt`, `/index.txt`, etc. RU gets `.ru.txt`; AR gets `.ar.txt`. Corpora-level entry points sit at the root: `/llms.txt`, `/llms-ru.txt`, `/llms-ar.txt` (curated indexes per [llmstxt.org spec](https://llmstxt.org)), plus `/llms-full.txt` (everything concatenated, EN, single fetch).

Why not just rely on HTML: AI search and user-directed agent fetchers need a clean text twin that is cheaper to parse than React-rendered HTML. `.md` is a common convention, but some OpenAI/Anthropic browser/fetch layers have shown opaque safety failures on direct `.md` URLs; canonical mirrors therefore use `.txt` while retaining Markdown syntax in the body.

Built at dev-server start and at `vite build` time from the active EN/RU/AR content tree via two pure serializers (`src/lib/homeMarkdown.ts` for the home page, `src/lib/caseStudyMarkdown.ts` for cases). Public build/dev writes the generated files under `public/`; private build writes them under `dist/`; private dev serves them from memory so private mirrors never overwrite public demo mirrors. The same serializers power the in-page "copy text" button (`src/components/CopyMarkdownButton.tsx`) — agents (and humans) can grab the page without scraping the rendered DOM.

Files are gitignored — they're build artefacts, never authoritative source. A direct-serve Vite middleware bypasses Vite's static handler for generated `.txt` files because Vite's SPA-fallback otherwise routes `.txt` requests through `index.html` (returning the SPA shell for `/llms.txt`). The middleware serves public files from `publicDir`, private dev files from memory, and preview files from `dist`, while pinning an explicit UTF-8 `Content-Type` — without the explicit charset browsers fall back to Windows-1252 and Cyrillic mangles to mojibake.

Production is stricter than the original dev-server shape for compatibility with AI fetch/search proxies: `/llms.txt`, `/llms-ru.txt`, `/llms-ar.txt`, `/llms-full.txt`, and per-page `.txt` mirrors are served as `text/plain; charset=utf-8` and carry no `X-Robots-Tag`. They are public entry points. Legacy `.md` URLs redirect to `.txt` equivalents but are not advertised; the deploy Caddyfile is guarded by `npm run check:agent-surface` so a future `noindex,nofollow`, stale `.md` link, or immutable-cache regression fails CI.

Compression is also part of the contract: Caddy uses `encode gzip`, not
`encode zstd gzip`. During the 2026-05 agent-fetch incident, direct origin
fetches worked, but clients that advertised zstd could receive
`Content-Encoding: zstd`; some fetch stacks then failed decoding and surfaced
the response as a 502. Gzip is boring and universally handled.

The HTTP `Link` discovery header is intentionally kept off `/llms*.txt` and
mirror responses themselves. It belongs on normal site responses where it helps
headless clients discover the agent index without parsing HTML. On the agent
text files, the body already is the discovery surface, and a self-referential
`Link: </llms.txt>` adds parser risk without adding signal.

`llms-full.txt` carries size metadata on line 1 as an HTML comment (invisible in Markdown render, line-1 readable for raw-text agents) and in each language index's "Full corpus" link description. Format: `~Nk chars · ~N KB` — chars (string length, deterministic) are preferred over tokens (varies by tokenizer) per the spec's silence on size warnings; tokens are not added because they'd be misleading across cl100k vs o200k vs Claude tokenizer. Recomputed every build, never hand-edited. Filename remains canonical `llms-full.txt` — Cloudflare, Stripe and others use the same fixed path; renaming for size-warning purposes would break the convention agents look for.

Per-case `<link rel="alternate" type="text/plain" hreflang="...">` is injected by `CaseHeadTags.tsx` — on mount it strips every `[data-case-head]` node (covering both the static head injected at build time for direct-loaded case pages and any stale client-side tag) plus the homepage text alternates, then installs case-specific alternates and an `Article` JSON-LD, all tagged. On unmount it strips its tagged set and calls `applyHomeDefaults()` to restore the title / description / homepage text alternates that ship in `dist/index.html` so SPA navigation back to Home doesn't carry case state in `<head>`.

## Analytics server stays plain JS, not TypeScript

The frontend is TypeScript end-to-end. The analytics server in `server/` is plain ES-module JavaScript: no `tsc`, no source maps, no separate watch loop, no transpile step in production.

**Decision.** Server module (`server/src/*.js`) keeps using JavaScript with JSDoc on the small public surface. The risk surface — `validatePayload`, `hashVisitor`, `classifyDwell`, `parseUaFamily`, `parseDeviceClass` — is a handful of pure functions. Each one is unit-tested via `node --test` (see `server/test/`), which catches the same shape errors a compiler would.

**Why.**

- One ingest endpoint + ~5 admin endpoints + a CLI rollup don't earn a build pipeline. The whole server is ~600 LOC, single writer, single deploy unit.
- TypeScript would force a `tsc --noEmit` step in CI plus emitted-vs-source decisions in production (run TS via `tsx`/`ts-node`? compile-and-ship `dist/`? source maps?). Each of those is a small operational tax with no proportional payoff at this size.
- The actual type pressure points (HTTP body shape, payload whitelists, classifier table) live in `validatePayload` and `classifyDwell`. Both are now exported and exercised by `node:test` with named edge-case tests — that's where a type-error would have caught a bug, and that's where the test does too.
- Keeps the server inspectable: a reviewer reading `server/src/ingest.js` sees the literal handler, not a transpilation artefact.

**Cost.** Refactors lose compiler-driven find-references and rename safety; reviewers have to read JSDoc rather than rely on inline types. JSON payloads coming in over the wire have no compile-time guarantee — only the runtime validators stand between bad data and the SQLite write.

**Revisit when.** Any of:

- A 3rd endpoint family is added (beyond ingest + admin + rollup CLI).
- Code or types become shared between client (`src/`) and server (`server/src/`) — duplication will start hurting before TypeScript's setup cost does.
- Server LOC crosses ~2K and the surface stops being inspectable in one read.

## VideoObject JSON-LD: minimum fields, per language, transcript-driven

Each case study with a video ships a Schema.org `VideoObject` block per language inside the static `dist/cases/<slug>/index.html` head, distinguished by `@id: <origin>/cases/<slug>#video-<lang>`. Fields kept: `name`, `description` (synopsis), `thumbnailUrl`, `embedUrl`, `contentUrl`, `inLanguage`, `transcript`. Fields dropped: `duration`, `uploadDate`.

**Why.**

- Audience for this JSON-LD is LLM crawlers (ChatGPT, Perplexity, Claude, Gemini), not Google's video-rich-result shelf. Agents read transcript and description, not playback length, so `duration` adds no signal. `uploadDate` is canonically published by the video host (YouTube / RuTube), not the portfolio page that links to it — duplicating it here invites drift.
- Each language has its own narration cut (different `videoId`, recorded separately). One block per cut is more honest than one shared block with a `caption[]` list — the audio language differs, not just the subs.
- `transcript` is a real Schema.org property (`Text`) that agents do parse — Vimeo shipped "LLM-friendly transcripts" in mid-2025 specifically because of this. Including the verbatim voiceover gives agents enough to cite the case study from a query like "find a portfolio that built a real-estate AI CRM".

**Cost.** Static HTML carries 3× the JSON-LD weight per case (one block per lang). On six cases × ~2-3 KB transcripts that's ~50 KB extra in `dist/`, paid once per case-page hit and cacheable. Smaller than a single thumbnail.

The same content lands in the agent text mirrors as a `## Video walkthrough` section (label localized via `ui.markdown.videoWalkthrough`) so agents that prefer Markdown over JSON-LD parsing also see the synopsis + transcript. Both surfaces are derived from one `videoTranscript: { synopsis, fullText }` field on `Project` — no duplicate authoring.

## Language pill on the player, not native-script in the pill

`<LiteYouTube>` overlays a small pill `EN · RU · AR` (top-right, RTL-aware via `inset-inline-end`) when the project carries a `videoTranscript` and there are 2+ available languages. Clicking a pill calls `setLang` from `useLang()`; the project payload swaps with the global lang (different `videoId` per lang) and the iframe reloads with the matching cut.

**Why.** The global `NavControls` lang switcher already exists in the page header, but most visitors won't think to reach for it just to discover the video has alt-language cuts. A localized affordance on the player itself signals the choice in the spot where it matters. The handler stops propagation so the pill click doesn't register as a play-overlay tap on the thumbnail facade.

**Why short Latin codes, not native scripts.** The pill is small. Native-script labels (`EN · Русский · العربية`) are wide enough to push the play overlay or wrap on mobile. Latin codes match the global `NavControls` (`LANG_CONFIG[l].label`) so visitors already pattern-match the affordance.

**Cost.** Three extra props on `<LiteYouTube>` (`availableLanguages`, `currentLanguage`, `onSelectLanguage`); each caller (`Projects.tsx` home cards + `ProjectDetailPage.tsx` hero) computes `availableLanguages = project.videoTranscript ? [...LANGS] : undefined`. The pill is hidden when not applicable — single-language videos stay clean.

## Resume link: gate on `cv` content presence, not `IS_SANITIZED`

The hero + contact ResumeLink chip used to early-return `null` when `IS_SANITIZED === true` (i.e. the public content tree). That coupled "is this the public engine?" to "is the resume downloadable?", which broke the moment the public demo wanted its own placeholder CV.

**Decision.** ResumeLink takes `cv?: Cv` as a prop. It renders only when `cv` is set; the href resolves to `cv.pdfPath` when present, else falls back to `/private/${LANG_CONFIG[lang].cvFile}`. Both content trees populate `cv` — public with fictional bullets and `pdfPath: '/demo/cv-<lang>.pdf'`, private with real content and (optionally) the legacy gitignored path.

**Why.**

- Public forks now get a working download from a clean build. `npm run cv:build:public` runs the Typst pipeline against the public content tree and writes PDFs to `public/demo/`; Vite then copies them into `dist/demo/` on the next build. The PDF render is non-deterministic across runs (Typst PDF backend embeds varying CreationDate/InstanceID metadata that `set document(date: none)` does not fully suppress), so the script is **not** wired into `build:public` — running it would dirty tracked bytes on every CI run. Authors regenerate explicitly after editing `cv.ts` and commit the new PDFs.
- `IS_SANITIZED` stays as a coarse "this is the public deploy" signal where it's actually meaningful (footer disclaimers, etc.) but it is no longer a feature gate masquerading as a privacy gate.
- The path indirection (`cv.pdfPath`) lets the build pipeline output to the right directory without a code branch — `scripts/cv/build.mjs` reads `content.cv.pdfPath` and resolves the dirname under `public/`, with `..` segments stripped to keep the input untrusted-by-default.

**Cost.** Two callers (`Hero.tsx`, `Contact.tsx`) pass `cv={content.cv}` / `cv={t.cv}`. New `Cv.pdfPath?: string` field. New `cv:build:public` script — invoked manually when `cv.ts` content changes (see note above on non-determinism). The fallback path `/private/${cvFile}` keeps existing private builds working without a content edit.
