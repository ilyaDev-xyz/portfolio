import { useState } from 'react';
import { ArrowLink, HatchPlaceholder, SectionHead } from '../components/atoms';
import { LiteYouTube, toRutubeEmbedUrl } from '../components/LiteYouTube';
import { VideoControlsRow } from '../components/VideoControlsRow';
import { useLang, useT } from '../i18n/LangContext';
import { getHasVisitedWork } from '../state/visitState';
import { useVideoProvider } from '../hooks/useVideoProvider';
import { LANGS } from '../i18n/langConfig';
import type { Project, Ui } from '../content/types';
import { projectStatusLabel } from '../lib/projectStatus';

function ProjectCard({
  p,
  ui,
  pulseCta,
}: {
  p: Project;
  ui: Ui;
  pulseCta?: boolean;
}) {
  const cls = ['card', p.cls, pulseCta ? 'pulse-cta' : ''].filter(Boolean).join(' ');
  const [provider, setProvider] = useVideoProvider();
  const [activationRequest, setActivationRequest] = useState(0);
  const { lang, setLang } = useLang();
  const rutubeEmbedUrl = p.videoMirrorUrl ? toRutubeEmbedUrl(p.videoMirrorUrl) : undefined;
  // Each video case ships separate cuts in EN/RU/AR — switching lang
  // swaps the project payload (incl. videoId), so the player reloads
  // with the matching narration.
  const availableLanguages = p.videoTranscript ? Array.from(LANGS) : undefined;

  let imageNode;
  if (p.videoId) {
    imageNode = (
      <LiteYouTube
        videoId={p.videoId}
        slug={p.slug}
        title={p.title}
        playLabel={ui.videoPlay}
        loadingLabel={ui.videoLoading}
        provider={provider}
        rutubeEmbedUrl={rutubeEmbedUrl}
        thumbnail={p.thumbnail}
        activationRequest={activationRequest}
      />
    );
  } else if (p.imageSrc) {
    imageNode = (
      <img
        src={p.thumbnail ?? p.imageSrc}
        alt={p.title}
        loading="lazy"
        decoding="async"
        className="card-image"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  } else if (p.isVideo) {
    imageNode = (
      <HatchPlaceholder label="▶  PLAY DEMO" corner="video · 16:9" style={{ position: 'absolute', inset: 0 }} />
    );
  } else {
    imageNode = (
      <HatchPlaceholder
        label={p.placeholder}
        corner={`${p.slug}.png`}
        style={{ position: 'absolute', inset: 0 }}
      />
    );
  }

  const hasCta = Boolean(p.cta || p.cta2);

  return (
    <article id={`cases-${p.slug}`} className={cls} data-screen-label={`03 Project ${p.idx}`}>
      <div className="card-head">
        <span className="idx">§ 03.{p.idx}</span>
        {p.codename && <span className="codename">{p.codename}</span>}
        <span className="status">{projectStatusLabel(ui, p.status)}</span>
      </div>
      <div
        className="media-frame"
        style={{ viewTransitionName: `video-${p.slug}` }}
      >
        {imageNode}
      </div>
      <VideoControlsRow
        availableLanguages={availableLanguages}
        currentLanguage={lang}
        onSelectLanguage={setLang}
        provider={provider}
        mirrorLabel={
          p.videoMirrorUrl
            ? provider === 'youtube' ? ui.videoMirror : ui.videoMirrorYoutube
            : undefined
        }
        onToggleMirror={
          p.videoMirrorUrl
            ? () => {
                setProvider(provider === 'youtube' ? 'rutube' : 'youtube');
                setActivationRequest((value) => value + 1);
              }
            : undefined
        }
      />
      <div className="card-body">
        <h3 style={{ viewTransitionName: `title-${p.slug}` }}>{p.title}</h3>
        <p className="subtitle" style={{ viewTransitionName: `subtitle-${p.slug}` }}>
          {p.subtitle}
        </p>
        <dl className="card-meta">
          <div className="card-meta-row">
            <dt>Scope</dt>
            <dd>{p.scope}</dd>
          </div>
          {p.proof && (
            <div className="card-meta-row">
              <dt>Proof</dt>
              <dd>{p.proof}</dd>
            </div>
          )}
          {p.production && (
            <div className="card-meta-row">
              <dt>Surface</dt>
              <dd>{p.production}</dd>
            </div>
          )}
          <div className="card-meta-row">
            <dt>Stack</dt>
            <dd>{p.foot}</dd>
          </div>
        </dl>
      </div>
      {hasCta && (
        <div className="card-foot">
          {p.cta &&
            (pulseCta ? (
              <span className="cta-with-dot">
                <span className="cta-dot" aria-hidden="true">●</span>
                <ArrowLink href={p.cta.href} external={p.cta.external}>
                  {p.cta.label}
                </ArrowLink>
              </span>
            ) : (
              <ArrowLink href={p.cta.href} external={p.cta.external}>
                {p.cta.label}
              </ArrowLink>
            ))}
          {p.cta2 && (
            <ArrowLink href={p.cta2.href} external={p.cta2.external}>
              {p.cta2.label}
            </ArrowLink>
          )}
        </div>
      )}
    </article>
  );
}

export function Projects() {
  const t = useT();
  // Computed once per mount — the flag flips after the first /cases/:slug
  // visit, so re-mounts (route returns to /) read the latest value.
  const showPulse = !getHasVisitedWork();
  return (
    <section className="section bg-dots" id="cases" data-screen-label="03 Cases">
      <div className="container">
        <SectionHead no="03" title={t.ui.sectionCases} />
        <div className="projects-grid">
          {t.projects.map((p, i) => (
            <ProjectCard
              key={p.slug}
              p={p}
              ui={t.ui}
              pulseCta={showPulse && i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
