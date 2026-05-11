# Design system

The site uses CSS custom properties as the single source of truth. No utility framework, no CSS-in-JS. One token file plus domain stylesheets:

- `src/styles/tokens.css` — all the variables
- `src/styles/styles.css` — cascade entry that imports domain files
- `src/styles/base.css` — globals · layout · type · nav · chrome · chips · hatch
- `src/styles/home.css` — hero · about · projects · stack · experience · contact · footer · hero-fx
- `src/styles/media.css` — video facade, provider toggle, language pill
- `src/styles/case-study.css` — `/cases/:slug` subsystem
- `src/styles/runtime.css` — loader · interface entrance · view transitions

## Tokens

### Colors (oklch)

Two themes (`light`, `dark`) × three palettes (`mono`, `ochre`, `electric`).

Theme determines `--bg`, `--bg-raise`, `--bg-sunk`, `--fg`, `--fg-mute`, `--fg-dim`, `--line`, `--line-strong`, `--hatch`. Palette overlays `--accent`, `--accent-contrast`, `--accent-soft`, `--accent-alt`.

Active palette is derived from theme in `ThemeContext.tsx`:

- dark → **ochre** (warm gold accent, cool blue accent-alt)
- light → **electric** (cool blue accent, warm gold accent-alt)

### Spacing

```
--space-1: 4px      --space-6: 32px
--space-2: 8px      --space-7: 48px
--space-3: 12px     --space-8: 64px
--space-4: 16px     --space-9: 96px
--space-5: 24px     --space-10: 128px
```

`--gutter: 24px` — grid column gap. `--max-width: 1440px` — container. `--measure: 65ch` — prose reading width (paragraphs, list items, captions).

### Type scale (display)

```
--fs-display-hero  clamp(3rem, 9vw, 8rem)        Hero name (h1)
--fs-display-xl    clamp(2.5rem, 6.5vw, 6rem)    Contact pitch (h2)
--fs-display-l     clamp(2rem, 4vw, 3rem)        Section heading h2, About pull quote
--fs-display-s     clamp(1.2rem, 1.6vw, 1.5rem)  Project card h3, Stack stratum label
```

**Rule of thumb: prefer a `--fs-display-*` token for any size that participates in the display-type scale.** If a new display size is needed, add a token. Inline `clamp()` is acceptable for one-off body / lede / stratum-label sizes that are scoped to a single selector and do not show up elsewhere — the `.h-xxl/.h-l/.h-m/.lede` helpers in `base.css` and the per-section sizes in `home.css` / `case-study.css` are the legacy examples. Promote them to tokens if the same value starts repeating across files. (See [decisions.md](decisions.md) for the time the inline-clamp rule was learned the hard way on the display scale.)

### Fonts

Three font pairs available via `data-font-pair`: `editorial` (Fraunces), `engineer` (IBM Plex), `swiss` (Space Grotesk + Geist).

Currently the site is hardcoded to `swiss` in `ThemeContext.tsx`:

```
--font-display: Space Grotesk
--font-body:    Geist
--font-mono:    Geist Mono
```

The other two pairs are still defined in `tokens.css` and would activate by changing the data attribute.

**Arabic override.** When `data-lang="ar"`, `tokens.css` overrides display + body to `Noto Sans Arabic` with `Geist` Latin fallback (so inline tech terms like `MCP`/`FastAPI`/`Telegram` keep readable in the same flow). No Arabic-specific mono font; JetBrains Mono falls back gracefully and code blocks stay LTR. Loaded via the Google Fonts URL in `index.html` alongside the existing Latin fonts.

```css
[data-lang="ar"] {
  --font-display: 'Noto Sans Arabic', 'Geist', ui-sans-serif, system-ui, sans-serif;
  --font-body:    'Noto Sans Arabic', 'Geist', ui-sans-serif, system-ui, sans-serif;
  --display-tracking: 0;   /* Arabic doesn't take letter-spacing; clear it */
}
```

### RTL

`html.dir` flips to `rtl` when `lang === 'ar'` (set in `LangContext`). Layout strategy:

- **Logical CSS properties everywhere directional.** `margin-inline-start` / `margin-inline-end` instead of `margin-left/right`; `text-align: start/end` instead of `left/right`; `inset-inline-start/end` instead of `left/right` for absolute positioning; `border-inline-start/end` instead of `border-left/right`. Browser support 95%+ (Safari 14.1+).
- **Stable LTR shell, RTL content.** Site shell elements (nav inner row, theme/lang controls, hero action chips, mobile hero meta strip, case-page hero status row) keep `direction: ltr; unicode-bidi: isolate` so the language toggle and agent-notice chrome don't jump positions when switching to AR. Center nav links and case tabs flip RTL inside the LTR shell via `[data-lang="ar"] .nav-links, .nav-cases { direction: rtl; … }`. See `docs/decisions.md` → "RTL: stable shell + RTL content".
- **Code/pre/diagrams stay LTR under any lang.** ASCII diagrams, code blocks, mono spec-sheets, the `.foot` stack list — all wear `[dir="rtl"] code, pre, .case-diagram pre, .foot, .mono { direction: ltr; unicode-bidi: isolate }`. Industry norm; ASCII art is designed left-to-right and shouldn't mirror.
- **Runtime parity test** (`src/content/parity.test.ts`) iterates all non-EN langs and checks array lengths (project list, decisions, diagrams, lessons, etc.) match EN. Catches "added a case in EN, forgot AR" before commit.

## Per-section visual motif

Each section has one signature ambient effect. All built from the same accent + fg + line tokens — no images.

### Home page (`/`)

| Section    | Motif                                       | CSS handle                  |
|------------|---------------------------------------------|-----------------------------|
| Hero       | Radial accent heat + 26 CSS particle embers | `.hero-fx` + `.hero-ember` spans |
| About      | Top warm radial glow                        | `.about-glow`               |
| Projects   | 28px dot-grid with top/bottom mask fade     | `.bg-dots::before`          |
| Timeline   | Huge year watermarks per row                | `.xp-watermark`             |
| Stack      | Repeating 1px scanline (5px gap)            | `.section.stack::before`    |
| Contact    | Four corner edge ticks (drafting style)     | `.edge-tick--{tl,tr,bl,br}` |

**Hero↔About divider** is its own thing: a tapered hairline (linear-gradient on `.hero::after`) with a narrow accent radial sheen above it. Replaces what would have been a plain `border-bottom`.

### Case study page (`/cases/:slug`)

Every section on the case page mirrors a home-page section's motif and layout pattern, so the page reads as the same site, just with project content. Mapping in order:

| Case section        | Motif                                          | Mirrors home    |
|---------------------|------------------------------------------------|-----------------|
| § 01 Hero           | dot-zone (continuous bg-dots) + ochre radial glow + tapered hairline + accent sheen | home Hero (multi-layer SVG glow, minus particles) |
| § 02 Context        | dot-zone + 4+8 pull-quote / body split         | home About (4+8 pull / body) |
| § 03 Architecture   | dot-zone + ASCII diagrams + structured notes   | home Projects (media zone) |
| § 04 Decisions      | per-card watermark (`data-num`)                | home Experience (`xp-watermark`) |
| § 05 Stack          | scanline + 3-col strata grid                   | home Stack (1:1) |
| § 06 Lessons        | `bg-edge` + 4 edge-tick corners + 6+6 keep/change split | home Contact (7+5) |

Hero · Context · Architecture share **one** `bg-dots::before` via a `.case-dot-zone` wrapper — single 28px grid through all three, no per-section seam, single soft fade only at the very bottom into the non-dotted Decisions section.

Hero glow has three layers (CSS `.case-hero::before` + `.case-hero-glow svg`):

1. SVG `<radialGradient cy="5%" r="35%">` over `<rect>` with `preserveAspectRatio="xMidYMid slice"` — viewBox-stable on mobile (no edge dimming as %-sized CSS radials would suffer)
2. CSS hairline (1px tapered linear-gradient) at the top edge
3. Narrow accent radial sheen rising below the hairline

Mirrors home `<HeroFireBackdrop>` minus the 26 ember particles — same visual logic, flipped to the top of the case page.

Every visible section header on the case page uses the same `<SectionHead>` atom (`§ NN` mono num + display title) as home. No bespoke section heads.

Footer is replaced by a frosted-glass ghost button (`.case-next-btn`) that links to the next case (`↓` arrow) or back to home on the last case (`↑` arrow). See `docs/decisions.md`.

**Hero morph from home card.** Three paired elements get matching `view-transition-name` on the home card and the case hero so they FLIP-morph in sync during home → `/cases/:slug` navigation: video frame (`video-${slug}`), title (`title-${slug}`), subtitle (`subtitle-${slug}`). Case → case nav strips these names on the old snapshot via `TransitionLink` to collapse into a clean root crossfade. See `docs/decisions.md` → "View transitions extended to title and subtitle".

## Player overlays and controls

`<LiteYouTube>` (`src/components/LiteYouTube.tsx`) keeps only the primitives that must sit over the media frame. User controls that would obscure playback live in `<VideoControlsRow>` underneath the 16:9 frame.

| Class               | Purpose                                                   | Position             |
|---------------------|-----------------------------------------------------------|----------------------|
| `.player-spinner`   | Provider-swap loader (8-dot ring + label, ember palette)  | Centered, full inset |
| `.video-controls-row` | One-line row for language cuts + provider mirror         | Below the frame      |
| `.lite-yt-langs`    | Language-pill container                                  | Inline in row        |
| `.lite-yt-lang-btn` | One per available language; `aria-pressed` = current lang | Inline inside pill   |
| `.video-mirror`     | Provider mirror toggle; full label collapses on narrow mobile | Inline in row    |

The language pill uses short Latin codes (`EN`/`RU`/`AR`) to match the global `NavControls` switcher and keep the row on one line. Native-script labels are intentionally not used here; the longer variants (`EN · Русский · العربية`) belong in larger page-level surfaces. On narrow screens the mirror button displays only the destination provider (`RuTube` / `YouTube`) while the full localized text remains available to assistive tech through `aria-label`.

## CSS conventions

- **Selectors are scoped by section class** (`.hero-a`, `.about`, `.section.stack`) — no BEM, no CSS modules. Easy to grep.
- **`@media` overrides go *after* the base rule** in source order. Media queries don't raise specificity; a later base rule will silently win otherwise. This is a real bug-attractor — see `docs/decisions.md`.
- **Heavy use of `color-mix(in oklab, ...)`** for tinted overlays (e.g. `color-mix(in oklab, var(--bg) 25%, transparent)` for the frosted hero chips). Avoids opacity tricks on the wrong color.
- **Mask fades use absolute or `max(absolute, %)`** — `linear-gradient(180deg, transparent 0, #000 max(var(--space-9), 12%), …)` so fade size adapts to section height while having a sane minimum.

## When to add a new token

**Yes** if:
- Multiple selectors will use the same value
- The value participates in a scale (heading, spacing, etc.)
- You'd want to adjust it once and propagate

**No** if:
- It's a one-off positional value (`top: 6px` for an icon nudge)
- It only makes sense in one selector

## When in doubt about visual changes

Match the home page first — its conventions are stable. Look at how the matching section type is built (asymmetric splits in About / Contact, full-width grids in Projects / Stack / Experience) and replicate the same approach with the new content. Avoid inventing layout patterns the rest of the site doesn't already use.
