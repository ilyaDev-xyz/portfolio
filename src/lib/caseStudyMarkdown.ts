import type { Project, Ui } from '../content/types';
import { LANG_CONFIG, type MarkdownLabels } from '../i18n/langConfig';
import { escapeTableCell } from './markdownUtils';
import { projectStatusLabel } from './projectStatus';

export type CaseNav = {
  prev?: { slug: string; title: string; idx: string };
  next?: { slug: string; title: string; idx: string };
  /** Text mirror extension for sibling links — '.txt' for EN, '.ru.txt' for RU. */
  mirrorExt: string;
  /** Filename of the language-specific llms.txt index. */
  indexFile: string;
  /** Filename of the home mirror in the same language. */
  homeFile: string;
  /** Active author label for public/private content. */
  authorName: string;
  labels?: MarkdownLabels;
};

/**
 * Serialize a case-study Project into a clean, recruiter-friendly Markdown
 * document. Pure function — no DOM, no React, no side effects.
 *
 * Image src values starting with "/" are absolutized against `origin`
 * so the markdown stays portable when shared outside the site.
 *
 * If `nav` is provided, the footer includes prev/next case links pointing at
 * sibling text mirror files plus an index link — used by both the clipboard copy
 * (where origin is set so links land on production) and the build-time mirror.
 */
export function caseStudyToMarkdown(
  project: Project,
  ui: Ui,
  origin: string,
  nav?: CaseNav,
): string {
  const lines: string[] = [];
  const cs = project.caseStudy;
  const labels = nav?.labels ?? LANG_CONFIG.en.markdown;

  // ---- Header ------------------------------------------------------------
  lines.push(`# ${project.title}`, '');
  lines.push(
    '`' +
      [project.idx, project.codename ?? project.slug, projectStatusLabel(ui, project.status)]
        .filter(Boolean)
        .join(' · ') +
      '`',
    '',
  );
  if (project.subtitle) lines.push(project.subtitle, '');

  const meta: string[] = [];
  if (project.scope) meta.push(`**${labels.scope}:** ${project.scope}`);
  if (project.role) meta.push(`**${labels.role}:** ${project.role}`);
  if (meta.length) lines.push(meta.join('  \n'), '');

  const videoLinks: string[] = [];
  if (project.videoId) {
    videoLinks.push(
      `[YouTube](https://www.youtube.com/watch?v=${project.videoId})`,
    );
  }
  if (project.videoMirrorUrl) {
    videoLinks.push(`[RuTube](${project.videoMirrorUrl})`);
  }
  if (videoLinks.length) {
    lines.push(`**${labels.video}:** ${videoLinks.join(' · ')}`, '');
  }

  if (project.videoTranscript) {
    lines.push(`## ${labels.videoWalkthrough}`, '');
    lines.push(project.videoTranscript.synopsis, '');
    project.videoTranscript.fullText.split(/\n\n+/).forEach((para) => {
      const trimmed = para.trim();
      if (trimmed) lines.push(trimmed, '');
    });
  }

  if (!cs) {
    if (project.body) lines.push(project.body, '');
    lines.push('---', '');
    appendFooter(lines, project, origin, nav);
    return lines.join('\n');
  }

  // ---- Context -----------------------------------------------------------
  lines.push('---', '', `## ${ui.caseSectionContext}`, '');
  if (cs.contextPull) {
    const pullText = Array.isArray(cs.contextPull)
      ? cs.contextPull.join('').replace(/\s+/g, ' ').trim()
      : cs.contextPull.replace(/\s+/g, ' ').trim();
    lines.push(`> ${pullText}`, '');
  }
  cs.context.forEach((p) => {
    lines.push(p, '');
  });

  // ---- heroFacts (after Context — recruiter spec sheet) -----------------
  if (cs.heroFacts && cs.heroFacts.length > 0) {
    lines.push(`## ${ui.caseHeroFacts}`, '');
    lines.push('| | |', '|---|---|');
    cs.heroFacts.forEach((f) => {
      lines.push(`| **${f.k}** | ${escapeTableCell(f.v)} |`);
    });
    lines.push('');
  }

  // ---- Architecture ------------------------------------------------------
  if (cs.diagrams && cs.diagrams.length > 0) {
    lines.push(`## ${ui.caseSectionArchitecture}`, '');
    cs.diagrams.forEach((d) => {
      lines.push(`### ${d.title}`, '');
      const isImage = d.images && d.images.length > 0;
      if (isImage) {
        d.images!.forEach((im) => {
          const src = absolutizeUrl(im.src, origin);
          lines.push(`![${im.alt}](${src})`);
          if (im.caption) lines.push('', `*${im.caption}*`);
          lines.push('');
        });
      } else if (d.ascii) {
        lines.push('```text', d.ascii, '```', '');
      }
      if (d.notes && d.notes.length > 0) {
        d.notes.forEach((n) => {
          lines.push(`**${n.k}.** ${n.v}`, '');
        });
      }
    });
  }

  // ---- Decisions ---------------------------------------------------------
  if (cs.decisions.length > 0) {
    lines.push(`## ${ui.caseSectionDecisions}`, '');
    cs.decisions.forEach((d, i) => {
      const num = String(i + 1).padStart(2, '0');
      lines.push(`### ${num} · ${d.title}`, '');
      lines.push(`**${ui.caseDecision}.** ${d.decision}`, '');
      lines.push(`**${ui.caseWhy}.** ${d.why}`, '');
      lines.push(`**${ui.caseCost}.** ${d.cost}`, '');
    });
  }

  // ---- Stack -------------------------------------------------------------
  if (cs.stackTable.length > 0) {
    lines.push(`## ${ui.caseSectionStack}`, '');
    lines.push('| | |', '|---|---|');
    cs.stackTable.forEach((row) => {
      lines.push(`| **${row.k}** | ${escapeTableCell(row.v)} |`);
    });
    lines.push('');
  }

  // ---- Lessons -----------------------------------------------------------
  lines.push(`## ${ui.caseSectionLessons}`, '');
  if (cs.lessonsKeep && cs.lessonsKeep.length > 0) {
    lines.push(`### ${ui.caseLessonsKeep}`, '');
    cs.lessonsKeep.forEach((l) => lines.push(`- ${l}`));
    lines.push('');
  }
  if (cs.lessons.length > 0) {
    lines.push(`### ${ui.caseLessonsChange}`, '');
    cs.lessons.forEach((l) => lines.push(`- ${l}`));
    lines.push('');
  }
  if (cs.statusNote) {
    lines.push(cs.statusNote, '');
  }

  // ---- Footer ------------------------------------------------------------
  lines.push('---', '');
  appendFooter(lines, project, origin, nav);

  return lines.join('\n');
}

function appendFooter(
  lines: string[],
  project: Project,
  origin: string,
  nav: CaseNav | undefined,
): void {
  const slugPath = `/cases/${project.slug}`;
  const labels = nav?.labels ?? LANG_CONFIG.en.markdown;
  if (nav) {
    lines.push(
      `${labels.source}: ${origin}${slugPath} (HTML) · ${slugPath}${nav.mirrorExt} (${labels.thisFile})`,
    );
    if (nav.prev) {
      lines.push(
        `${labels.previous}: ${nav.prev.idx} — ${nav.prev.title} → ${origin}/cases/${nav.prev.slug}${nav.mirrorExt}`,
      );
    }
    if (nav.next) {
      lines.push(
        `${labels.upNext}: ${nav.next.idx} — ${nav.next.title} → ${origin}/cases/${nav.next.slug}${nav.mirrorExt}`,
      );
    }
    lines.push(
      `${labels.index}: ${origin}/${nav.indexFile} — ${labels.fullCaseStudyList}`,
      `${labels.author}: ${nav.authorName} — ${origin}/${nav.homeFile}`,
      '',
    );
  } else {
    lines.push(`${labels.source}: ${origin}${slugPath}`, '');
  }
}

function absolutizeUrl(src: string, origin: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  // Protocol-relative URLs (//cdn.example.com/...) — assume https; never
  // collapse into the root-relative branch below or we'd produce
  // `https://ilyadev.xyz//cdn.example.com/...`.
  if (src.startsWith('//')) return 'https:' + src;
  if (src.startsWith('/')) return origin.replace(/\/$/, '') + src;
  return src;
}
