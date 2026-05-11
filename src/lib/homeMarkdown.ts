import type { Content } from '../content/types';
import { LANG_CONFIG, type Lang, type MarkdownLabels } from '../i18n/langConfig';
import { escapeTableCell } from './markdownUtils';
import { projectStatusLabel } from './projectStatus';

export type HomeMdOptions = {
  /** Text mirror extension for sibling case links — '.txt' for EN, '.ru.txt' for RU. */
  mirrorExt: string;
  /** Filename of the language-specific llms.txt index. */
  indexFile: string;
  labels?: MarkdownLabels;
};

/**
 * Serialize the entire home page (Hero · About · Stack · Projects · Experience
 * · Contact) into recruiter-friendly Markdown. Pure function — no DOM, no React.
 *
 * Project entries link to per-case text mirrors (in the same language) so the
 * resulting document is a self-contained "card index" of the site.
 */
export function homeToMarkdown(
  content: Content,
  origin: string,
  opts: HomeMdOptions,
): string {
  const lines: string[] = [];
  const labels = opts.labels ?? LANG_CONFIG.en.markdown;
  const { hero, about, stack, projects, experience, contact, ui } = content;
  const stackPreface = content.stackPreface;

  // ---- Header / Hero -----------------------------------------------------
  lines.push(`# ${hero.name}`, '');
  lines.push('`' + hero.role + '`', '');
  lines.push(hero.pitch.join(''), '');

  const meta: string[] = [];
  if (hero.location) meta.push(`**${hero.metaLabels.location}:** ${hero.location}`);
  if (hero.hours) meta.push(`**${hero.metaLabels.hours}:** ${hero.hours}`);
  if (hero.availability) meta.push(`**${hero.metaLabels.availability}:** ${hero.availability}`);
  if (meta.length) lines.push(meta.join('  \n'), '');

  if (hero.chips.length) {
    lines.push('| | |', '|---|---|');
    hero.chips.forEach((c) => {
      lines.push(c.k ? `| **${c.k}** | ${escapeTableCell(c.v)} |` : `| ${escapeTableCell(c.v)} | |`);
    });
    lines.push('');
  }

  // ---- About -------------------------------------------------------------
  lines.push('---', '', `## ${labels.about}`, '');
  if (about.pullQuote && about.pullQuote.length === 3) {
    lines.push(`> ${about.pullQuote.join('').replace(/\s+/g, ' ').trim()}`, '');
  }
  about.paragraphs.forEach((p) => lines.push(p, ''));
  if (about.bestFit) {
    lines.push(`### ${about.bestFit.title}`, '');
    about.bestFit.items.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }
  if (about.howWork) {
    lines.push(`### ${about.howWork.title}`, '');
    about.howWork.items.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  // ---- Stack -------------------------------------------------------------
  lines.push('---', '', `## ${labels.stack}`, '');
  if (stackPreface) lines.push(stackPreface, '');
  stack.forEach((cat) => {
    lines.push(`**${cat.label}.** ${cat.items.join(' · ')}`, '');
  });

  // ---- Projects ----------------------------------------------------------
  lines.push('---', '', `## ${labels.cases}`, '');
  projects.forEach((p) => {
    const codename = p.codename ?? p.slug;
    const link = `${origin}/cases/${p.slug}${opts.mirrorExt}`;
    lines.push(`### ${p.idx} — ${p.title}`, '');
    lines.push(
      '`' +
        [p.idx, codename, projectStatusLabel(ui, p.status)].filter(Boolean).join(' · ') +
        '`',
      '',
    );
    if (p.subtitle) lines.push(p.subtitle, '');
    const projMeta: string[] = [];
    if (p.scope) projMeta.push(`**${labels.scope}:** ${p.scope}`);
    if (p.proof) projMeta.push(`**${labels.proof}:** ${p.proof}`);
    if (p.production) projMeta.push(`**${labels.surface}:** ${p.production}`);
    if (p.foot) projMeta.push(`**${labels.stack}:** ${p.foot}`);
    if (projMeta.length) lines.push(projMeta.join('  \n'), '');
    lines.push(`${labels.readFullCase} → ${link}`, '');
  });

  // ---- Experience --------------------------------------------------------
  if (experience && experience.length) {
    lines.push('---', '', `## ${labels.timeline}`, '');
    experience.forEach((row) => {
      lines.push(`### ${row.when} — ${row.title}`, '');
      if (row.tag) lines.push('`' + row.tag + '`', '');
      if (row.body) lines.push(row.body, '');
    });
  }

  // ---- Contact -----------------------------------------------------------
  lines.push('---', '', `## ${labels.contact}`, '');
  if (contact.title && contact.title.length === 3) {
    lines.push(`> ${contact.title.join('').replace(/\s+/g, ' ').trim()}`, '');
  }
  if (contact.sub) lines.push(contact.sub, '');
  if (contact.ways && contact.ways.length) {
    contact.ways.forEach((w) => {
      lines.push(`- **${w.k}** — ${w.v}`);
    });
    lines.push('');
  }

  // ---- Footer ------------------------------------------------------------
  lines.push('---', '');
  lines.push(`${labels.source}: ${origin}/ (HTML)`);
  lines.push(`${labels.index}: ${origin}/${opts.indexFile} — ${labels.caseStudyList}`);
  lines.push('');

  return lines.join('\n');
}

export function homeMarkdownOptionsForLang(lang: Lang): HomeMdOptions {
  const cfg = LANG_CONFIG[lang];
  return {
    mirrorExt: cfg.mirrorExt,
    indexFile: cfg.llmsFile,
    labels: cfg.markdown,
  };
}
