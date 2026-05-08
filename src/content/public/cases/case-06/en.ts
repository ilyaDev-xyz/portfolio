import type { Project } from '../../../types';

export const case06En: Project = {
  slug: 'portfolio-site',
  idx: '06',
  status: 'Open engine',
  codename: 'portfolio-site',
  title: 'Portfolio Engine · Public repo case',
  subtitle:
    'The real architecture case for this repository: typed bilingual content, route-aware case pages, Markdown mirrors for agents, and privacy-first analytics.',
  scope: 'Production engine · public demo content',
  proof: 'GitHub-ready codebase',
  production: 'Live deployment uses private content',
  role: 'Frontend architecture, content system, telemetry, and static publishing',
  body: 'This case stays close to the real project because it describes the open engine itself. The public repo swaps private copy and media for demo content while keeping architecture, tooling, and publishing behavior intact.',
  chips: ['Typed content', 'Agent mirrors', 'Privacy analytics'],
  foot: 'React · TypeScript · Vite · CSS tokens · Node analytics',
  cta: { label: 'Read case study', href: '/cases/portfolio-site' },
  placeholder: '[ portfolio engine / 16:9 ]',
  cls: 'p-portfolio',
  imageSrc: '/demo/case-06.svg',
  caseStudy: {
    metrics: [{ v: '6 case routes' }, { v: '3 typed locales' }, { v: 'agent-readable mirrors' }],
    contextPull: ['Portfolio as resume is weak.\nPortfolio as ', 'auditable system', ' is stronger.'],
    context: [
      'The project started as a portfolio page and became a small publishing engine. That is intentional: the site is both a resume surface and a proof artifact that another engineer can clone, inspect, and reason about.',
      'The public version commits sanitized demo content by default. Private content and private media live in ignored trees, selected only by explicit public/private scripts that generate the active barrel before dev, typecheck, and build.',
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
          { k: 'Default', v: 'Plain dev/build fail until a public or private script is chosen.' },
          { k: 'Private', v: 'Local ignored tree can override copy and media only through explicit private scripts.' },
        ],
      },
      {
        title: 'Build outputs',
        ascii: `typed content -> React UI
             -> public/dev mirrors or private dist mirrors
             -> llms.txt + per-page Markdown twins
             -> dist/cases/<slug>/index.html with case head`,
        notes: [
          { k: 'Humans', v: 'SPA stays fast and route-aware.' },
          { k: 'Agents', v: 'Markdown mirrors expose the same case structure without scraping UI.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'Typed content over i18n runtime',
        decision: 'The site keeps a custom typed content object instead of moving to i18next.',
        why: 'The project needs structure, autocomplete, and compile-time locale parity more than plural rules or translation-management workflows.',
        cost: 'Adding a third locale later would require another typed content tree.',
      },
      {
        title: 'Generated active barrel',
        decision: 'Explicit public/private scripts write src/content/active.ts to point at the selected content tree.',
        why: 'TypeScript, Vite config, and build-time generators all see the same import path without runtime alias tricks.',
        cost: 'The generated file must stay gitignored and created before typecheck/build; plain build/dev intentionally fail instead of guessing.',
      },
      {
        title: 'Static head copies for case routes',
        decision: 'The build writes dist/cases/<slug>/index.html with case-specific title, description, alternate Markdown links, and JSON-LD.',
        why: 'Social scrapers and many bots do not run client JavaScript, so client-only head updates are not enough.',
        cost: 'A small Vite plugin owns index.html injection.',
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
      'A portfolio can be a proof artifact, not only a brochure.',
      'Typed content gives better refactor safety than string keys here.',
      'Agent-readable mirrors make the work inspectable without UI scraping.',
      'Pure helpers exported from both modules become the natural test surface — Markdown serializers, payload validators, dwell classifier.',
    ],
    lessons: [
      'Sanitization must include media, not only text.',
      'Static metadata should be generated before publication.',
      'CI should guard leakage patterns from the first public push.',
      'Public proof needs executable checks around mirrors, telemetry validation, and content parity — type signatures alone do not catch array-length drift between EN and RU trees.',
    ],
    statusNote: 'Real architecture case with sanitized author-facing copy.',
  },
};
