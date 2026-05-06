import { Fragment, useId, type CSSProperties } from 'react';
import { Chip } from '../components/atoms';
import { CopyMarkdownButton } from '../components/CopyMarkdownButton';
import { NavControls } from '../components/NavControls';
import { ResumeLink } from '../components/ResumeLink';
import { useLang } from '../i18n/LangContext';
import { LANG_CONFIG, type Lang } from '../i18n/langConfig';
import { homeToMarkdown } from '../lib/homeMarkdown';
import type { Content } from '../content/types';

/**
 * Pre-baked deterministic particle config — same seed→position pattern as the
 * old SVG version, but each ember is a small absolutely-positioned <span>
 * animated via CSS transform + opacity (GPU-composited, no SVG filter).
 *
 * Generated at module load (cheap, ~26 numeric ops) and never recomputed.
 */
const EMBERS = Array.from({ length: 26 }, (_, i) => ({
  x:      (i * 307) % 100,            // 0..99% horizontal start
  startY: (i * 13)  % 40,             // 0..39% from bottom — spawn point varies
  drift:  ((i * 91) % 17) - 8,        // -8..+8 vw lateral drift over lifetime
  size:   1.5 + (i % 3) * 0.7,        // 1.5 / 2.2 / 2.9 px
  dur:    5 + (i % 6),                // 5..10s lifetime
  delay:  +((i * 0.43) % 6).toFixed(2), // 0..5.99s phase offset
}));

function HeroFireBackdrop() {
  const rawId = useId();
  const fxId = 'hfx' + rawId.replace(/[^a-z0-9]/gi, '');

  return (
    <div className="hero-fx" aria-hidden="true">
      {/* Radial gradient stays in SVG with viewBox+slice — keeps the warm
          horizon glow stable across mobile DPRs (CSS %-sized radials dim out
          before reaching the visible edge on narrow viewports). */}
      <svg className="hero-fx-svg" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={fxId + 'r'} cx="50%" cy="95%" r="75%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${fxId}r)`} />
      </svg>

      {/* Embers — pure CSS particle system. transform + opacity only,
          no filter, no SMIL — GPU-composited on every platform. */}
      <div className="hero-fx-embers">
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className="ember"
            style={{
              '--x':       `${e.x}%`,
              '--start-y': `${e.startY}%`,
              '--drift':   `${e.drift}vw`,
              '--size':    `${e.size}px`,
              '--dur':     `${e.dur}s`,
              '--delay':   `${e.delay}s`,
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

function HeroActions({
  lang,
  content,
}: {
  lang: Lang;
  content: Content;
}) {
  const ui = content.ui;
  const cfg = LANG_CONFIG[lang];

  return (
    <div className="hero-actions">
      <ResumeLink lang={lang} ui={ui} cv={content.cv} className="hero-action-chip" />
      <CopyMarkdownButton
        getMarkdown={() =>
          homeToMarkdown(content, window.location.origin, {
            mdExt: cfg.mdExt,
            indexFile: cfg.llmsFile,
            labels: cfg.markdown,
          })
        }
        trackingId="home"
        ui={ui}
        className="hero-action-chip"
      />
    </div>
  );
}

function RoleParts({ role }: { role: string }) {
  const segments = role.split(' · ');
  return (
    <>
      {segments.map((part, i) => {
        const isLast = i === segments.length - 1;
        return (
          <Fragment key={part}>
            <span className="hero-role-seg">{part}</span>
            {!isLast && (
              <span className="hero-role-sep" aria-hidden="true">
                {' · '}
              </span>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * Mobile-only block (≤720px). Sits inside .meta-l directly below .row-top
 * (right under the NavControls trio: lang + theme). Splits the role kicker:
 * first segment ("AI Engineer") shares its row with resume + copy buttons,
 * the rest ("Full-stack Python · System architect") wraps to its own line
 * below. The whole block lives above <h1> in DOM order. Agent notice lives
 * in the Footer on mobile, not here.
 *
 * Tablets (721–1024px) skip this block — the absolutely-positioned
 * .hero-actions in the top-right corner takes over, mirroring desktop.
 */
function HeroMobileButtons({ lang, content }: { lang: Lang; content: Content }) {
  const ui = content.ui;
  const cfg = LANG_CONFIG[lang];

  return (
    <div className="hero-mobile-buttons">
      <ResumeLink lang={lang} ui={ui} cv={content.cv} className="hero-action-chip" />
      <CopyMarkdownButton
        getMarkdown={() =>
          homeToMarkdown(content, window.location.origin, {
            mdExt: cfg.mdExt,
            indexFile: cfg.llmsFile,
            labels: cfg.markdown,
          })
        }
        trackingId="home"
        ui={ui}
        className="hero-action-chip"
      />
    </div>
  );
}

function HeroMobileRole({ role }: { role: string }) {
  return (
    <div className="hero-mobile-role mono">
      <RoleParts role={role} />
    </div>
  );
}

export function Hero() {
  const { lang, t } = useLang();
  const H = t.hero;

  return (
    <section className="hero hero-a has-fx" id="home" data-screen-label="01 Hero A">
      <HeroFireBackdrop />
      <div className="container hero-stage">
        <HeroActions lang={lang} content={t} />
        <div className="grid">
          <aside className="meta-l">
            <div className="row row-top">
              <span className="no-label">§ 01 / 06</span>
              <div className="hero-ctrls-slot">
                <NavControls />
              </div>
            </div>
            <HeroMobileButtons lang={lang} content={t} />
            <div className="row row-meta">
              <span className="k">{H.metaLabels.location}</span>
              <span className="v">{H.location}</span>
            </div>
            <div className="row row-meta">
              <span className="k">{H.metaLabels.hours}</span>
              <span className="v">{H.hours}</span>
            </div>
            <div className="row row-meta">
              <span className="k">{H.metaLabels.availability}</span>
              <span className="v">{H.availability}</span>
            </div>
            <HeroMobileRole role={H.role} />
          </aside>
          <div className="main">
            <div className="mono hero-role" style={{ marginBottom: 'var(--space-5)' }}>
              {/* Each `·`-separated chunk is its own nowrap span so a line
                  break never lands mid-segment. On ≤720px, segments switch
                  to display:block (one line each) and separators hide —
                  see .hero-role rules in home.css. */}
              <RoleParts role={H.role} />
            </div>
            <h1 className="display name">{H.name}</h1>
            <p className="role">
              {H.pitch[0]}
              <em>{H.pitch[1]}</em>
              {H.pitch[2]}
            </p>
            <div className="chips">
              {H.chips.map((c) => (
                <a key={`${c.k}:${c.v}`} href="#about" className="chip-link">
                  <Chip k={c.k} v={c.v} />
                </a>
              ))}
            </div>
            <div className="cta">
              <a className="btn btn-primary" href={H.cta.primary.href}>
                {H.cta.primary.label} →
              </a>
              <a className="btn btn-ghost" href={H.cta.ghost.href}>
                {H.cta.ghost.label}
              </a>
            </div>
          </div>
          <div className="hero-meta-strip" aria-label="context">
            <span>{H.location.split(' · ').pop()}</span>
            <span>{H.hours}</span>
            <span>{H.availability}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
