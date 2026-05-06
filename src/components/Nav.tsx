import { type CSSProperties, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';
import { LANG_CONFIG } from '../i18n/langConfig';
import { useActiveSection } from '../hooks/useActiveSection';
import { CASE_SLUGS } from '../config/cases';
import { NavControls } from './NavControls';
import { TransitionLink } from './TransitionLink';

export function Nav() {
  const { t, lang } = useLang();
  const location = useLocation();
  const isCase = location.pathname.startsWith('/cases/');
  const currentSlug = isCase
    ? location.pathname.slice('/cases/'.length).replace(/\/+$/, '')
    : null;
  const llmsFile = LANG_CONFIG[lang].llmsFile;

  const N = t.nav;
  const homeIds = useMemo(
    () => (isCase ? [] : N.links.map((l) => l.href.slice(1))),
    [N.links, isCase],
  );
  const { activeId, progress } = useActiveSection(homeIds);
  const progressStyle = { '--progress': progress } as CSSProperties;

  if (isCase) {
    const cases = t.projects.filter((p) =>
      (CASE_SLUGS as readonly string[]).includes(p.slug),
    );
    return (
      <header className="nav nav--case">
        <div className="container nav-inner nav-inner--case">
          <div className="nav-back">
            <TransitionLink
              to={currentSlug ? `/#cases-${currentSlug}` : '/#cases'}
              aria-label={t.ui.backToHome}
            >
              <span className="nav-back-arrow" aria-hidden="true">
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
              <span className="nav-back-label">{t.ui.navBack}</span>
            </TransitionLink>
          </div>
          <nav className="nav-links nav-cases" aria-label="case studies">
            {cases.map((p, i) => {
              const isActive = p.slug === currentSlug;
              const idx = String(i + 1).padStart(2, '0');
              return (
                <TransitionLink
                  key={p.slug}
                  to={`/cases/${p.slug}`}
                  className={isActive ? 'is-active' : ''}
                  title={p.codename ?? p.slug}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="nav-case-label">{t.ui.navCases}</span>
                  <span className="nav-case-num">{idx}</span>
                </TransitionLink>
              );
            })}
          </nav>
          <NavControls />
        </div>
      </header>
    );
  }

  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="nav-agent-notice" href={`/${llmsFile}`}>
          /{llmsFile}
        </a>
        <nav className="nav-links" aria-label="primary">
          {N.links.map((l) => {
            const id = l.href.slice(1);
            const isActive = activeId === id;
            return (
              <a
                key={l.href}
                href={l.href}
                data-section-id={id}
                className={isActive ? 'is-active' : ''}
                style={isActive ? progressStyle : undefined}
              >
                {l.label}
              </a>
            );
          })}
        </nav>
        <NavControls />
      </div>
    </header>
  );
}
