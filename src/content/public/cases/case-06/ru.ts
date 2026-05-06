import type { Project } from '../../../types';

export const case06Ru: Project = {
  slug: 'portfolio-site',
  idx: '06',
  status: 'Open engine',
  codename: 'portfolio-site',
  title: 'Portfolio Engine · Public repo case',
  subtitle:
    'Реальный architecture case для этого repo: typed bilingual content, route-aware case pages, Markdown mirrors for agents и privacy-first analytics.',
  scope: 'Production engine · public demo content',
  proof: 'GitHub-ready codebase',
  production: 'Live deployment uses private content',
  role: 'Frontend architecture, content system, telemetry и static publishing',
  body: 'Этот case остаётся близко к real project, потому что описывает open engine itself. Public repo заменяет private copy и media на demo content, но сохраняет architecture, tooling и publishing behavior.',
  chips: ['Typed content', 'Agent mirrors', 'Privacy analytics'],
  foot: 'React · TypeScript · Vite · CSS tokens · Node analytics',
  cta: { label: 'Читать кейс', href: '/cases/portfolio-site' },
  placeholder: '[ portfolio engine / 16:9 ]',
  cls: 'p-portfolio',
  imageSrc: '/demo/case-06.svg',
  caseStudy: {
    metrics: [{ v: '6 case routes' }, { v: '3 typed locales' }, { v: 'agent-readable mirrors' }],
    contextPull: ['Portfolio как resume слабее.\nPortfolio как ', 'auditable system', ' сильнее.'],
    context: [
      'Проект начался как portfolio page и стал small publishing engine. Это intentional: site одновременно resume surface и proof artifact, который другой engineer может clone, inspect и reason about.',
      'Public version commits sanitized demo content by default. Private content и private media живут в ignored trees, selected only by explicit public/private scripts that generate the active barrel before dev, typecheck and build.',
    ],
    heroFacts: [
      { k: 'Content', v: 'Typed EN/RU/AR structures, not string-key resources' },
      { k: 'Publishing', v: 'SPA routes plus generated per-case static heads' },
      { k: 'Agents', v: 'Markdown mirrors and llms.txt generated at build time' },
      { k: 'Telemetry', v: 'Same-origin endpoint, no third-party tracker' },
    ],
    diagrams: [
      {
        title: 'Public/private content selection',
        ascii: `npm script -> CONTENT_SOURCE -> select-content.mjs
                         | public/private |
                         v                v
              public demo exports      .private exports
                         \\              /
                          src/content/active.ts`,
        notes: [
          { k: 'Default', v: 'Plain dev/build fail until public или private script chosen.' },
          { k: 'Private', v: 'Local ignored tree overrides copy and media only through explicit private scripts.' },
        ],
      },
      {
        title: 'Build outputs',
        ascii: `typed content -> React UI
             -> public/*.md + llms.txt
             -> dist/cases/<slug>/index.html with case head`,
        notes: [
          { k: 'Humans', v: 'SPA stays fast and route-aware.' },
          { k: 'Agents', v: 'Markdown mirrors expose same case structure without UI scraping.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'Typed content over i18n runtime',
        decision: 'Site keeps custom typed content object вместо i18next.',
        why: 'Project needs structure, autocomplete and compile-time locale parity more than plural rules or translation-management workflows.',
        cost: 'Third locale later means another typed content tree.',
      },
      {
        title: 'Generated active barrel',
        decision: 'Explicit public/private scripts write src/content/active.ts pointing at selected content tree.',
        why: 'TypeScript, Vite config and build-time generators see one import path without runtime alias tricks.',
        cost: 'Generated file must stay gitignored and created before typecheck/build; plain build/dev intentionally fail instead of guessing.',
      },
      {
        title: 'Static head copies for case routes',
        decision: 'Build writes dist/cases/<slug>/index.html with case-specific title, description, alternate Markdown links and JSON-LD.',
        why: 'Social scrapers and many bots do not run client JavaScript; client-only head updates are insufficient.',
        cost: 'Small Vite plugin owns index.html injection.',
      },
    ],
    stackTable: [
      { k: 'Frontend', v: 'React · TypeScript · Vite 7' },
      { k: 'Design', v: 'CSS custom properties · route-aware case styling' },
      { k: 'Content', v: 'Generated active barrel · public/private trees' },
      { k: 'Agents', v: 'Markdown mirrors · llms.txt · per-case alternates' },
      { k: 'Analytics', v: 'Node ingest · SQLite · same-origin proxy' },
      { k: 'CI', v: 'Lint · unit tests · typecheck · build · audit · leakage guards' },
    ],
    lessonsKeep: [
      'Portfolio can be proof artifact, not only brochure.',
      'Typed content gives better refactor safety than string keys here.',
      'Agent-readable mirrors make work inspectable without UI scraping.',
      'Pure helpers exported from both modules become natural test surface — Markdown serializers, payload validators, dwell classifier.',
    ],
    lessons: [
      'Sanitization must include media, not only text.',
      'Static metadata should be generated before publication.',
      'CI should guard leakage patterns from first public push.',
      'Public proof needs executable checks around mirrors, telemetry validation, and content parity — type signatures alone do not catch array-length drift between EN and RU trees.',
    ],
    statusNote: 'Real architecture case with sanitized author-facing copy.',
  },
};
