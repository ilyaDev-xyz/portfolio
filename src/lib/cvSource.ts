import type { Content, Cv, ExperienceRow, Project } from '../content/types';
import { LANG_CONFIG, type Lang } from '../i18n/langConfig';

const TYPST_META = /([\\#*_~`<>@$=[\]])/g;
function esc(s: string): string {
  if (!s) return '';
  return s.replace(TYPST_META, '\\$1');
}

function escMulti(s: string): string {
  return esc(s).replace(/\n+/g, '\n\n');
}

function pickProject(projects: Project[], slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

function emitFeaturedProject(p: Project, bullets: string[] | undefined): string {
  const head = `=== ${esc(p.title)} #h(1fr) #text(fill: gray.darken(20%), weight: "regular", size: 8pt)[${esc(p.scope)}]`;
  const subtitle = `#text(fill: gray.darken(30%), size: 9pt)[${esc(p.subtitle)}]`;
  const stack = `#text(fill: gray.darken(40%), font: ("JetBrains Mono", "Inter"), size: 7.5pt)[STACK · ${esc(p.foot)}]`;
  const lines = [head, '', subtitle, '', stack];
  if (bullets && bullets.length) {
    lines.push('');
    for (const b of bullets) {
      lines.push(`- ${esc(b)}`);
    }
  }
  return lines.join('\n');
}

function emitExperienceRow(row: ExperienceRow, bullets: string[] | undefined): string {
  const head = `=== ${esc(row.when)} #h(1fr) #text(fill: gray.darken(20%), weight: "regular", size: 8pt)[${esc(row.tag)}]`;
  const title = `*${esc(row.title)}*`;
  const lines = [head, '', title];
  if (bullets && bullets.length) {
    lines.push('');
    for (const b of bullets) {
      lines.push(`- ${esc(b)}`);
    }
  } else if (row.body) {
    lines.push('');
    lines.push(escMulti(row.body));
  }
  return lines.join('\n');
}

function emitStack(content: Content): string {
  return content.stack
    .map((cat) => `*${esc(cat.label)}.* ${cat.items.map(esc).join(' · ')}`)
    .join('\n\n');
}

function emitEducation(cv: Cv): string {
  return cv.education
    .map((e) => {
      const status = e.status ? ` · ${esc(e.status)}` : '';
      return `*${esc(e.when)}* — ${esc(e.institution)} · ${esc(e.program)}${status}`;
    })
    .join('\n\n');
}

function emitLanguages(cv: Cv): string {
  return cv.languages.map((l) => `*${esc(l.name)}* — ${esc(l.level)}`).join(' · ');
}

function emitContact(content: Content): string {
  const parts: string[] = [];
  for (const w of content.contact.ways) {
    const label = esc(w.k);
    const value = esc(w.v);
    if (w.href) {
      parts.push(`*${label}* #link("${w.href.replace(/"/g, '\\"')}")[${value}]`);
    } else {
      parts.push(`*${label}* ${value}`);
    }
  }
  return parts.join(' · ');
}

export function generateCvTypst(content: Content, lang: Lang): string {
  const cv = content.cv;
  if (!cv) {
    throw new Error('Content.cv is required to generate CV');
  }

  const cfg = LANG_CONFIG[lang];
  const langTag = cfg.htmlLang;
  const dir = cfg.dir;
  const fontPrimary = lang === 'ar'
    ? '"Noto Sans Arabic", "Arial", "Inter", "Noto Sans"'
    : '"Inter", "PT Sans", "Noto Sans"';
  const fontMono = '"JetBrains Mono", "PT Mono", "Menlo"';

  const featured = cv.featuredSlugs
    .map((slug) => {
      const p = pickProject(content.projects, slug);
      if (!p) return null;
      return emitFeaturedProject(p, cv.featuredBullets?.[slug]);
    })
    .filter((s): s is string => s !== null)
    .join('\n\n');

  const experience = content.experience
    .map((row) => emitExperienceRow(row, cv.experienceBullets?.[row.when]))
    .join('\n\n');

  const stack = emitStack(content);
  const education = emitEducation(cv);
  const languages = emitLanguages(cv);
  const contact = emitContact(content);

  const sectionLabels: Record<Lang, {
    summary: string;
    experience: string;
    featured: string;
    stack: string;
    education: string;
    languages: string;
    contact: string;
  }> = {
    en: {
      summary: 'Summary',
      experience: 'Experience',
      featured: 'Featured projects',
      stack: 'Stack',
      education: 'Education',
      languages: 'Languages',
      contact: 'Contact',
    },
    ru: {
        summary: 'Кратко',
        experience: 'Опыт',
        featured: 'Избранные проекты',
        stack: 'Стек',
        education: 'Образование',
        languages: 'Языки',
        contact: 'Контакты',
    },
    ar: {
      summary: 'ملخص',
      experience: 'الخبرة',
      featured: 'مشاريع مختارة',
      stack: 'التقنيات',
      education: 'التعليم',
      languages: 'اللغات',
      contact: 'التواصل',
    },
  };
  const labels = sectionLabels[lang];

  const moreCasesText = esc(cv.moreCasesNote).replace(
    /ilyadev\\\.xyz\\\/cases/,
    `#link("${cv.moreCasesUrl}")[ilyadev.xyz/cases]`,
  );

  return `// Auto-generated CV. Do not edit by hand.
// Source: src/content/active.ts → cv (lang: ${langTag})

#set document(date: none)

#set page(
  paper: "a4",
  margin: (x: 1.5cm, y: 1.3cm),
)

#set text(
  font: (${fontPrimary}),
  size: 9.5pt,
  lang: "${langTag}",
  dir: ${dir},
  hyphenate: false,
)

#show heading.where(level: 1): it => {
  block(below: 0.4em)[
    #text(size: 18pt, weight: "bold", tracking: -0.02em)[#it.body]
  ]
}

#show heading.where(level: 2): it => {
  block(above: 1.1em, below: 0.5em)[
    #text(size: 11pt, weight: "bold", tracking: 0.05em)[#upper(it.body)]
    #v(-0.4em)
    #line(length: 100%, stroke: 0.6pt + black)
  ]
}

#show heading.where(level: 3): it => {
  block(above: 1.4em, below: 0.4em)[
    #text(size: 10pt, weight: "bold")[#it.body]
  ]
}

#show link: it => {
  text(fill: rgb("#1f3a8a"))[#underline(it)]
}

#set list(indent: 0.6em, body-indent: 0.4em, marker: text(fill: gray.darken(30%))[•])

#set par(justify: false, leading: 0.55em)

= ${esc(content.hero.name)}

#text(size: 9.5pt, fill: gray.darken(20%))[${esc(cv.brand)}]

#v(0.2em)

#text(size: 8.5pt, fill: gray.darken(30%), font: (${fontMono}))[${esc(content.hero.location)} · ${esc(content.hero.hours)} · ${esc(content.hero.availability)}]

#v(0.6em)

#text(size: 9.5pt)[${escMulti(cv.summary)}]

== ${esc(labels.experience)}

${experience}

== ${esc(labels.featured)}

${featured}

#v(0.3em)

#text(size: 8.5pt, fill: gray.darken(30%), style: "italic")[${moreCasesText}]

== ${esc(labels.stack)}

${stack}

== ${esc(labels.education)}

${education}

== ${esc(labels.languages)}

${languages}

== ${esc(labels.contact)}

${contact}
`;
}
