import { useEffect, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { SectionHead } from '../components/atoms';
import { CaseHeadTags } from '../components/CaseHeadTags';
import { CopyMarkdownButton } from '../components/CopyMarkdownButton';
import { caseStudyToMarkdown } from '../lib/caseStudyMarkdown';
import { projectStatusLabel } from '../lib/projectStatus';
import { LiteYouTube, toRutubeEmbedUrl } from '../components/LiteYouTube';
import { Nav } from '../components/Nav';
import { NavControls } from '../components/NavControls';
import { TransitionLink } from '../components/TransitionLink';
import { Footer } from '../sections/Footer';
import { useLang } from '../i18n/LangContext';
import { LANG_CONFIG, LANGS } from '../i18n/langConfig';
import { useVideoProvider } from '../hooks/useVideoProvider';
import { CASE_SLUGS } from '../config/cases';
import { isVideoActive } from '../state/videoState';
import { markVisitedWork } from '../state/visitState';
import {
  getSuppressVideoMorph,
  setSuppressVideoMorph,
} from '../state/transitionState';

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang, setLang } = useLang();
  const project = t.projects.find((p) => p.slug === slug);
  const [videoActive, setVideoActive] = useState(() =>
    slug ? isVideoActive(slug) : false,
  );
  const [provider, setProvider] = useVideoProvider();

  // Read the case→case suppress flag synchronously on mount. If set, this
  // render emits no `view-transition-name` on .case-video-frame, so the
  // browser snapshot for NEW falls into root (clean crossfade only).
  // useEffect below resets the flag and triggers a re-render that restores
  // the name — needed for the next home↔case morph to find a target.
  const [suppressMorph, setSuppressMorph] = useState(() =>
    getSuppressVideoMorph(),
  );

  // Stops the first-card CTA pulse on home for the rest of the session.
  useEffect(() => {
    markVisitedWork();
  }, []);

  useEffect(() => {
    if (suppressMorph) {
      setSuppressVideoMorph(false);
      setSuppressMorph(false);
    }
  }, [suppressMorph]);

  if (!project) {
    return (
      <div className="page case-page" id="top">
        <Nav />
        <main>
          <section className="section">
            <div className="container">
              <h1 className="display" style={{ fontSize: 'var(--fs-display-l)' }}>
                Unknown project
              </h1>
              <p className="body">
                No project with slug <code>{slug}</code>.
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const cs = project.caseStudy;
  const facts = cs?.heroFacts;
  const showFacts = !!facts && facts.length > 0;
  const hasMedia = !!(project.videoId || project.imageSrc);
  const mdCfg = LANG_CONFIG[lang];
  const markdownNav = {
    mirrorExt: mdCfg.mirrorExt,
    indexFile: mdCfg.llmsFile,
    homeFile: mdCfg.homeFile,
    authorName: t.hero.name,
    labels: mdCfg.markdown,
  };

  // Next-case nav follows src/config/cases.ts.
  const caseIdx = (CASE_SLUGS as readonly string[]).indexOf(project.slug);
  const nextSlug =
    caseIdx >= 0 && caseIdx < CASE_SLUGS.length - 1 ? CASE_SLUGS[caseIdx + 1] : null;
  const nextProject = nextSlug ? t.projects.find((p) => p.slug === nextSlug) : null;
  const isLastCase = caseIdx === CASE_SLUGS.length - 1;

  return (
    <div className="page case-page" id="top">
      <CaseHeadTags project={project} />
      <Nav />
      <main>
        {/* Dot-zone: single continuous 28px dot grid wrapping Hero + Context +
            Architecture. One ::before paints across all three — no per-section
            seams, no per-section fade. */}
        <div className="case-dot-zone bg-dots">
          {/* § 01 HERO — multi-layer glow mirroring home Hero (minus particles):
              SVG radial backdrop · ::before = hairline + accent sheen.
              SVG with viewBox + slice keeps the gradient strong on mobile
              (same trick as home Hero's <HeroFireBackdrop>). */}
          <section className="section case-hero" data-screen-label="Case · Hero">
            <div className="case-hero-glow" aria-hidden="true">
              <svg
                viewBox="0 0 1600 600"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <radialGradient
                    id="caseHeroGlow"
                    cx="50%"
                    cy="5%"
                    r="35%"
                  >
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
                    <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#caseHeroGlow)" />
              </svg>
            </div>
            <div className="container">
              <div className="case-hero-top">
                <div className="case-hero-status-row">
                  <div className="case-status-line">
                    {project.idx} · {project.codename ?? project.slug} · {projectStatusLabel(t.ui, project.status)}
                  </div>
                  <div className="case-hero-status-actions">
                    {cs && (
                      <CopyMarkdownButton
                        getMarkdown={() =>
                          caseStudyToMarkdown(project, t.ui, window.location.origin, markdownNav)
                        }
                        trackingId={`case-${project.slug}`}
                        ui={t.ui}
                        className="case-copy-md--desktop"
                      />
                    )}
                    <div className="case-hero-ctrls-slot">
                      <NavControls />
                    </div>
                  </div>
                </div>
                {cs && (
                  <div className="case-copy-md-mobile-row">
                    <CopyMarkdownButton
                      getMarkdown={() =>
                        caseStudyToMarkdown(project, t.ui, window.location.origin, markdownNav)
                      }
                      trackingId={`case-${project.slug}`}
                      ui={t.ui}
                      className="case-copy-md--mobile"
                    />
                  </div>
                )}
                <h1
                  style={{
                    viewTransitionName: suppressMorph
                      ? undefined
                      : `title-${project.slug}`,
                  }}
                >
                  {project.title}
                </h1>
                <p
                  className="lede"
                  style={{
                    viewTransitionName: suppressMorph
                      ? undefined
                      : `subtitle-${project.slug}`,
                  }}
                >
                  {project.subtitle}
                </p>
              </div>

              {(hasMedia || showFacts) && (
                <div
                  className={`case-hero-grid${
                    showFacts ? '' : ' case-hero-grid--video-only'
                  }`}
                >
                  {hasMedia && (
                    <div className="case-hero-video">
                      <div
                        className="case-video-frame"
                        style={{
                          viewTransitionName: suppressMorph
                            ? undefined
                            : `video-${project.slug}`,
                        }}
                      >
                        {project.videoId ? (
                          <LiteYouTube
                            videoId={project.videoId}
                            slug={project.slug}
                            title={project.title}
                            playLabel={t.ui.videoPlay}
                            loadingLabel={t.ui.videoLoading}
                            onActivate={() => setVideoActive(true)}
                            provider={provider}
                            rutubeEmbedUrl={
                              project.videoMirrorUrl
                                ? toRutubeEmbedUrl(project.videoMirrorUrl)
                                : undefined
                            }
                            thumbnail={project.thumbnail}
                            availableLanguages={
                              project.videoTranscript ? Array.from(LANGS) : undefined
                            }
                            currentLanguage={lang}
                            onSelectLanguage={setLang}
                          />
                        ) : (
                          <img
                            src={project.imageSrc}
                            alt={project.title}
                            loading="lazy"
                            decoding="async"
                            style={{
                              display: 'block',
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        )}
                      </div>
                      {project.videoId && project.videoMirrorUrl && (
                        <div
                          className={`video-mirror-slot${
                            videoActive ? ' video-mirror-slot--open' : ''
                          }`}
                        >
                          <button
                            type="button"
                            className="video-mirror video-mirror--page"
                            onClick={() =>
                              setProvider(provider === 'youtube' ? 'rutube' : 'youtube')
                            }
                            tabIndex={videoActive ? 0 : -1}
                            aria-hidden={!videoActive}
                          >
                            ↗ {provider === 'youtube' ? t.ui.videoMirror : t.ui.videoMirrorYoutube}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {showFacts && (
                    <aside className="case-hero-facts">
                      <div className="case-hero-facts-eyebrow">
                        {t.ui.caseHeroFacts}
                      </div>
                      <dl className="case-hero-facts-list">
                        {facts!.map((f) => (
                          <div key={`${f.k}:${f.v}`} className="case-hero-facts-row">
                            <dt>{f.k}</dt>
                            <dd>{f.v}</dd>
                          </div>
                        ))}
                      </dl>
                    </aside>
                  )}
                </div>
              )}
            </div>
          </section>

          {!cs && (
            <section className="section">
              <div className="container">
                <p className="body" style={{ maxWidth: '72ch' }}>
                  {project.body}
                </p>
                <p
                  className="mono"
                  style={{ color: 'var(--fg-mute)', marginTop: 'var(--space-5)' }}
                >
                  {project.foot}
                </p>
                <p
                  className="mono"
                  style={{ color: 'var(--fg-dim)', marginTop: 'var(--space-7)' }}
                >
                  [ case study content coming later ]
                </p>
              </div>
            </section>
          )}

          {cs && (
            <>
              {/* § 02 CONTEXT — 4+8 split (mirrors home About layout) */}
              <section
                className="section case-section case-context-section"
                data-screen-label="Case · Context"
              >
                <div className="container">
                  <SectionHead no="02" title={t.ui.caseSectionContext} />
                  <div className="case-context-grid">
                    {cs.contextPull && (
                      <div className="case-context-pull">
                        {Array.isArray(cs.contextPull) ? (
                          <>
                            {cs.contextPull[0]}
                            <span className="ac">{cs.contextPull[1]}</span>
                            {cs.contextPull[2]}
                          </>
                        ) : (
                          cs.contextPull
                        )}
                      </div>
                    )}
                    <div className="case-context-body">
                      {cs.context.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* § 03 ARCHITECTURE — last section in the dot zone */}
              {cs.diagrams && cs.diagrams.length > 0 && (
                <section
                  className="section case-section case-architecture"
                  data-screen-label="Case · Architecture"
                >
                  <div className="container">
                    <SectionHead no="03" title={t.ui.caseSectionArchitecture} />
                    {cs.diagrams.map((d) => {
                      const isImageDiagram = d.images && d.images.length > 0;
                      return (
                        <figure
                          key={d.title}
                          className={
                            isImageDiagram
                              ? 'case-diagram case-diagram--screenshots'
                              : 'case-diagram'
                          }
                        >
                          <div className="diagram-title">{d.title}</div>
                          {isImageDiagram ? (
                            <div
                              className="case-diagram-images"
                              style={
                                d.imageCols
                                  ? ({ ['--diagram-img-cols' as string]: d.imageCols } as CSSProperties)
                                  : undefined
                              }
                            >
                              {d.images!.map((im) => (
                                <figure key={im.src}>
                                  <img src={im.src} alt={im.alt} loading="lazy" />
                                  {im.caption && <figcaption>{im.caption}</figcaption>}
                                </figure>
                              ))}
                            </div>
                          ) : d.ascii ? (
                            <pre>{d.ascii}</pre>
                          ) : null}
                          {d.notes && d.notes.length > 0 && (
                            <dl className="diagram-notes">
                              {d.notes.map((n) => (
                                <div key={`${d.title}:${n.k}`} className="diagram-note">
                                  <dt>{n.k}</dt>
                                  <dd>{n.v}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </figure>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
        {/* end .case-dot-zone */}

        {cs && (
          <>
            {/* § 04 DECISIONS — xp-watermark per card (mirrors home Experience) */}
            <section
              className="section case-section case-decisions-section"
              data-screen-label="Case · Decisions"
            >
              <div className="container">
                <SectionHead no="04" title={t.ui.caseSectionDecisions} />
                <div className="case-decisions">
                  {cs.decisions.map((d, i) => (
                    <article
                      key={d.title}
                      className="case-decision"
                      data-num={String(i + 1).padStart(2, '0')}
                    >
                      <h3>{d.title}</h3>
                      <div className="field">
                        <span className="field-label">{t.ui.caseDecision}</span>
                        <span className="field-body">{d.decision}</span>
                      </div>
                      <div className="field">
                        <span className="field-label">{t.ui.caseWhy}</span>
                        <span className="field-body">{d.why}</span>
                      </div>
                      <div className="field">
                        <span className="field-label">{t.ui.caseCost}</span>
                        <span className="field-body">{d.cost}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* § 05 STACK — scanline + 3-col strata (mirrors home Stack) */}
            <section
              className="section case-section case-stack-section"
              data-screen-label="Case · Stack"
            >
              <div className="container">
                <SectionHead no="05" title={t.ui.caseSectionStack} />
                <div className="case-stack-strata">
                  {cs.stackTable.map((row) => (
                    <div key={row.k} className="case-stack-stratum">
                      <div className="label">{row.k}</div>
                      <div className="body">{row.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* § 06 LESSONS — bg-edge + edge-ticks (mirrors home Contact) */}
            <section
              className="section case-section case-lessons-section bg-edge"
              data-screen-label="Case · Lessons"
            >
              <span className="edge-tick edge-tick--tl" />
              <span className="edge-tick edge-tick--tr" />
              <span className="edge-tick edge-tick--bl" />
              <span className="edge-tick edge-tick--br" />
              <div className="container">
                <SectionHead no="06" title={t.ui.caseSectionLessons} />
                <div className="case-lessons-grid">
                  {cs.lessonsKeep && cs.lessonsKeep.length > 0 && (
                    <div className="case-lessons-col">
                      <div className="case-lessons-eyebrow">
                        {t.ui.caseLessonsKeep}
                      </div>
                      <ul className="case-lessons">
                        {cs.lessonsKeep.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="case-lessons-col">
                    <div className="case-lessons-eyebrow">
                      {t.ui.caseLessonsChange}
                    </div>
                    <ul className="case-lessons">
                      {cs.lessons.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {cs.statusNote && <p className="case-status">{cs.statusNote}</p>}
              </div>
            </section>
          </>
        )}

        {/* Next-case CTA — ghost button (transparent bg + border), replaces
            Footer on case pages. Vertical arrow: ↓ next, ↑ home. */}
        {nextProject ? (
          <section className="section case-next-section bg-dots">
            <div className="container case-next-wrap">
              <TransitionLink
                to={`/cases/${nextProject.slug}`}
                className="btn btn-ghost case-next-btn case-next-btn--down"
              >
                {t.ui.navCases} {nextProject.idx}
                <span className="case-next-arrow" aria-hidden="true">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path
                      d="M1 2L6 7l5-5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </TransitionLink>
            </div>
          </section>
        ) : isLastCase ? (
          <section className="section case-next-section bg-dots">
            <div className="container case-next-wrap">
              <TransitionLink
                to={`/#cases-${project.slug}`}
                className="btn btn-ghost case-next-btn case-next-btn--back"
              >
                <span className="case-next-arrow" aria-hidden="true">
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                    <path
                      d="M6 1L1 6l5 5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {t.ui.caseNextHomeEyebrow}
              </TransitionLink>
            </div>
          </section>
        ) : (
          <Footer />
        )}
      </main>
    </div>
  );
}
