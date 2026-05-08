import type { Content } from '../content/types';
import { LANG_CONFIG, LANGS, type Lang } from '../i18n/langConfig';
import { caseStudyToMarkdown, type CaseNav } from './caseStudyMarkdown';
import { homeToMarkdown } from './homeMarkdown';

export type LangVariant = {
  /** Language code — used for hreflang and llms-{lang}.txt naming. */
  lang: Lang;
  /** File extension applied to per-page mirrors (`.md` or `.ru.md`). */
  mdExt: string;
  /** Filename of the curated llms.txt index. */
  llmsFile: string;
  /** Filename of the home mirror. */
  homeFile: string;
};

const VARIANTS: Record<Lang, LangVariant> = Object.fromEntries(
  LANGS.map((lang) => [
    lang,
    {
      lang,
      mdExt: LANG_CONFIG[lang].mdExt,
      llmsFile: LANG_CONFIG[lang].llmsFile,
      homeFile: LANG_CONFIG[lang].homeFile,
    },
  ]),
) as Record<Lang, LangVariant>;

/** Path-keyed map of generated files (path is relative to the chosen output root). */
export type MirrorFiles = Record<string, string>;

/** Size annotation used to warn agents before they fetch llms-full.txt. */
type SizeStats = { chars: string; kb: number };

function sizeStats(s: string): SizeStats {
  return {
    chars: `${Math.round(s.length / 1000)}k`,
    kb: Math.round(new TextEncoder().encode(s).length / 1024),
  };
}

/**
 * Generate every agent-readable mirror file for all configured languages.
 * Returns a map of `{relative-path: body}` — the Vite plugin decides whether
 * to write it into `public/`, write it into `dist/`, or serve it from memory.
 *
 * - `index.md` / `index.ru.md` / `index.ar.md` — home page mirrors
 * - `cases/<slug>.md` / `.ru.md` / `.ar.md` — per-case mirrors (×6)
 * - `llms.txt` / `llms-ru.txt` / `llms-ar.txt` — curated indexes
 * - `llms-full.txt` — concatenated EN corpus (single-fetch convenience)
 */
export function generateAgentMirrors(
  contents: Record<Lang, Content>,
  origin: string,
): MirrorFiles {
  const files: MirrorFiles = {};

  const langs = LANGS.map((lang) => ({
    variant: VARIANTS[lang],
    content: contents[lang],
  }));

  // llms-full.txt first — its size annotation goes into every language
  // indexes so agents can budget context before fetching.
  const full = buildLlmsFull(contents.en, origin);
  files['llms-full.txt'] = full.body;

  // CV PDF links per language. content.cv.pdfPath wins (public demo override),
  // else fall back to /private/<cvFile> — the path served from the private build.
  const cvLinks: { lang: Lang; href: string }[] = LANGS.map((lang) => {
    const c = contents[lang];
    const cfg = LANG_CONFIG[lang];
    const path = c.cv?.pdfPath ?? `/private/${cfg.cvFile}`;
    return { lang, href: `${origin}${path}` };
  });

  // Build date — emitted into the footer of every llms*.txt so agents can
  // gauge freshness without a HEAD request.
  const updated = new Date().toISOString().slice(0, 10);

  for (const { variant, content } of langs) {
    // Home mirror.
    files[variant.homeFile] = homeToMarkdown(content, origin, {
      mdExt: variant.mdExt,
      indexFile: variant.llmsFile,
      labels: LANG_CONFIG[variant.lang].markdown,
    });

    // Per-case mirrors.
    content.projects.forEach((project, index) => {
      const nav = buildCaseNav(content, index, variant);
      const md = caseStudyToMarkdown(project, content.ui, origin, nav);
      files[`cases/${project.slug}${variant.mdExt}`] = md;
    });

    // llms.txt — curated index.
    files[variant.llmsFile] = buildLlmsIndex(
      content,
      variant,
      origin,
      full.stats,
      cvLinks,
      updated,
    );
  }

  return files;
}

function buildCaseNav(
  content: Content,
  index: number,
  variant: LangVariant,
): CaseNav {
  const projects = content.projects;
  const prev = index > 0 ? projects[index - 1] : undefined;
  const next = index < projects.length - 1 ? projects[index + 1] : undefined;
  return {
    prev: prev
      ? { slug: prev.slug, title: prev.title, idx: prev.idx }
      : undefined,
    next: next
      ? { slug: next.slug, title: next.title, idx: next.idx }
      : undefined,
    mdExt: variant.mdExt,
    indexFile: variant.llmsFile,
    homeFile: variant.homeFile,
    authorName: content.hero.name,
    labels: LANG_CONFIG[variant.lang].markdown,
  };
}

function buildLlmsIndex(
  content: Content,
  variant: LangVariant,
  origin: string,
  fullStats: SizeStats,
  cvLinks: { lang: Lang; href: string }[],
  updated: string,
): string {
  const { hero, projects, contact } = content;
  const labels = LANG_CONFIG[variant.lang].markdown;
  const lines: string[] = [];

  lines.push(`# ${hero.name}`, '');
  lines.push(`> ${hero.role}. ${hero.pitch.join('').trim()}`, '');
  lines.push(labels.markdownMirrorIntro, '');

  // Languages — alternates kept out of `## Optional` (which is the first
  // section trimmed at context-budget time per the spec).
  lines.push(`## ${labels.languages}`, '');
  lines.push(
    `- [${LANG_CONFIG[variant.lang].label} (${labels.thisFile})](${origin}/${variant.llmsFile})`,
  );
  for (const lang of LANGS.filter((l) => l !== variant.lang)) {
    const other = VARIANTS[lang];
    lines.push(
      `- [${LANG_CONFIG[lang].label}](${origin}/${other.llmsFile})`,
    );
  }
  lines.push('');

  // About
  lines.push(`## ${labels.about}`, '');
  lines.push(
    `- [Home — ${hero.name}](${origin}/${variant.homeFile}): ${hero.pitch
      .join('')
      .trim()}`,
  );
  lines.push('');

  // Cases
  lines.push(`## ${labels.cases}`, '');
  projects.forEach((p) => {
    const codename = p.codename ?? p.slug;
    const desc = p.subtitle.replace(/\s+/g, ' ').trim();
    lines.push(
      `- [Case ${p.idx} — ${p.title} (${codename})](${origin}/cases/${p.slug}${variant.mdExt}): ${desc}`,
    );
  });
  lines.push('');

  // Contact (dedicated H2 — single source for retrievers that index by section).
  if (contact?.ways?.length) {
    lines.push(`## ${labels.contact}`, '');
    contact.ways.forEach((w) => {
      lines.push(w.href ? `- ${w.k}: <${w.href}>` : `- ${w.k}: ${w.v}`);
    });
    lines.push('');
  }

  // Resume — CV PDF in every language so recruiters and agents can grab
  // the right file without guessing a path.
  if (cvLinks.length) {
    lines.push(`## ${labels.resume}`, '');
    cvLinks.forEach(({ lang, href }) => {
      lines.push(`- [${LANG_CONFIG[lang].label} CV (PDF)](${href})`);
    });
    lines.push('');
  }

  // Optional — kept for the corpus-fetch convenience link only.
  lines.push(`## ${labels.optional}`, '');
  lines.push(
    `- [${labels.fullCorpus}](${origin}/llms-full.txt): EN · ~${fullStats.chars} chars · ~${fullStats.kb} KB`,
  );
  lines.push('');

  // Footer date — agents read it before deciding whether to refetch.
  lines.push(`${labels.lastUpdated} ${updated}.`, '');

  return lines.join('\n');
}

function buildLlmsFull(
  content: Content,
  origin: string,
): { body: string; stats: SizeStats } {
  const variant = VARIANTS.en;
  const parts: string[] = [];

  parts.push(
    homeToMarkdown(content, origin, {
      mdExt: variant.mdExt,
      indexFile: variant.llmsFile,
      labels: LANG_CONFIG[variant.lang].markdown,
    }),
  );

  content.projects.forEach((project, index) => {
    const nav = buildCaseNav(content, index, variant);
    parts.push(caseStudyToMarkdown(project, content.ui, origin, nav));
  });

  const corpus = parts.join('\n\n');
  const stats = sizeStats(corpus);
  // Markdown HTML-comment so renderers strip it but raw-text agents can
  // read the size off line 1 before consuming the rest.
  const header = `<!-- llms-full.txt · concat of EN home + 6 cases · ~${stats.chars} chars · ~${stats.kb} KB -->\n`;
  return { body: header + corpus, stats };
}
