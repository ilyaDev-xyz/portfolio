import { useEffect } from 'react';
import type { Project } from '../content/types';
import { useLang } from '../i18n/LangContext';
import { LANG_CONFIG, LANGS, type Lang } from '../i18n/langConfig';

const PRODUCTION_ORIGIN = 'https://ilyadev.xyz';
const HEAD_TAG_ATTR = 'data-case-head';

function absoluteUrl(path: string | undefined): string {
  if (!path) return `${PRODUCTION_ORIGIN}/demo/case-06.svg`;
  if (/^https?:\/\//.test(path)) return path;
  return `${PRODUCTION_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

// Mirrors applyHomeHead in vite.config.ts so SPA navigation back from a case
// route restores the title / description / markdown alternates that ship in
// dist/index.html (which never get loaded again after the initial HTML).
function applyHomeDefaults(
  content: ReturnType<typeof useLang>['t'],
  activeLang: Lang,
): void {
  document.title = `${content.hero.name} — ${content.hero.role}`;
  const metaDesc = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );
  if (metaDesc) {
    metaDesc.content = content.hero.pitch.join('').replace(/\s+/g, ' ').trim();
  }

  const ensureAlt = (hreflang: Lang, href: string) => {
    const sel = `link[rel="alternate"][type="text/markdown"][hreflang="${hreflang}"]`;
    if (!document.querySelector(sel)) {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.type = 'text/markdown';
      link.hreflang = hreflang;
      link.href = href;
      document.head.appendChild(link);
    }
  };
  for (const lang of LANGS) {
    ensureAlt(lang, `${PRODUCTION_ORIGIN}/${LANG_CONFIG[lang].homeFile}`);
  }
  document.documentElement.lang = LANG_CONFIG[activeLang].htmlLang;
  document.documentElement.dir = LANG_CONFIG[activeLang].dir;
}

export function CaseHeadTags({ project }: { project: Project }) {
  const { t, lang: activeLang } = useLang();
  const authorName = t.hero.name;

  useEffect(() => {
    // Take ownership of the case-page head: strip anything tagged
    // `data-case-head` (covers static heads from a direct page load and any
    // stale client-side tags from a previous mount).
    Array.from(
      document.querySelectorAll<HTMLElement>(`[${HEAD_TAG_ATTR}]`),
    ).forEach((node) => node.remove());

    // Drop homepage markdown alternates so hreflang doesn't double up with
    // the case-specific alts we're about to install.
    Array.from(
      document.querySelectorAll<HTMLLinkElement>(
        'link[rel="alternate"][type="text/markdown"]',
      ),
    ).forEach((node) => node.remove());

    const head = document.head;
    const slug = project.slug;
    const codename = project.codename ?? slug;
    const image = absoluteUrl(project.imageSrc ?? project.thumbnail);

    for (const lang of LANGS) {
      const ext = LANG_CONFIG[lang].mdExt;
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.type = 'text/markdown';
      link.hreflang = lang;
      link.href = `${PRODUCTION_ORIGIN}/cases/${slug}${ext}`;
      link.setAttribute(HEAD_TAG_ATTR, '');
      head.appendChild(link);
    }

    const article: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: project.title,
      description: project.subtitle,
      author: {
        '@type': 'Person',
        name: authorName,
        url: PRODUCTION_ORIGIN,
      },
      url: `${PRODUCTION_ORIGIN}/cases/${slug}`,
      image,
      keywords: project.foot
        .split(/\s*·\s*/)
        .filter(Boolean),
      isPartOf: {
        '@type': 'CreativeWork',
        name: 'Case studies — ilyadev.xyz',
        url: `${PRODUCTION_ORIGIN}/#cases`,
      },
    };
    if (project.chips && project.chips.length) {
      article.about = project.chips;
    }
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.setAttribute(HEAD_TAG_ATTR, '');
    ld.textContent = JSON.stringify(article, null, 2);
    head.appendChild(ld);

    document.title = `${project.title} — ${codename} · ${authorName}`;

    const metaDesc = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (metaDesc) metaDesc.content = project.subtitle;

    return () => {
      Array.from(
        document.querySelectorAll<HTMLElement>(`[${HEAD_TAG_ATTR}]`),
      ).forEach((node) => node.remove());
      applyHomeDefaults(t, activeLang);
    };
  }, [authorName, activeLang, project, t]);

  return null;
}
