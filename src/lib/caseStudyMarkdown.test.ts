import { describe, it, expect } from 'vitest';
import { caseStudyToMarkdown, type CaseNav } from './caseStudyMarkdown';
import { en } from '../content/public/en';
import { ru } from '../content/public/ru';

const ORIGIN = 'https://ilyadev.xyz';

function navFor(content: typeof en, index: number, mirrorExt: string, indexFile: string, homeFile: string): CaseNav {
  const projects = content.projects;
  const prev = index > 0 ? projects[index - 1] : undefined;
  const next = index < projects.length - 1 ? projects[index + 1] : undefined;
  return {
    prev: prev ? { slug: prev.slug, title: prev.title, idx: prev.idx } : undefined,
    next: next ? { slug: next.slug, title: next.title, idx: next.idx } : undefined,
    mirrorExt,
    indexFile,
    homeFile,
    authorName: content.hero.name,
  };
}

describe('caseStudyToMarkdown — snapshots', () => {
  en.projects.forEach((project, i) => {
    it(`EN · ${project.slug}`, () => {
      const nav = navFor(en, i, '.txt', 'llms.txt', 'index.txt');
      expect(caseStudyToMarkdown(project, en.ui, ORIGIN, nav)).toMatchSnapshot();
    });
  });

  ru.projects.forEach((project, i) => {
    it(`RU · ${project.slug}`, () => {
      const nav = navFor(ru, i, '.ru.txt', 'llms-ru.txt', 'index.ru.txt');
      expect(caseStudyToMarkdown(project, ru.ui, ORIGIN, nav)).toMatchSnapshot();
    });
  });
});

describe('caseStudyToMarkdown — invariants', () => {
  it('first case has no Previous link', () => {
    const nav = navFor(en, 0, '.txt', 'llms.txt', 'index.txt');
    const md = caseStudyToMarkdown(en.projects[0], en.ui, ORIGIN, nav);
    expect(md).not.toMatch(/^Previous:/m);
    expect(md).toMatch(/^Up next:/m);
  });

  it('last case has no Up-next link', () => {
    const last = en.projects.length - 1;
    const nav = navFor(en, last, '.txt', 'llms.txt', 'index.txt');
    const md = caseStudyToMarkdown(en.projects[last], en.ui, ORIGIN, nav);
    expect(md).toMatch(/^Previous:/m);
    expect(md).not.toMatch(/^Up next:/m);
  });

  it('starts with H1 of project title', () => {
    const md = caseStudyToMarkdown(en.projects[0], en.ui, ORIGIN);
    expect(md.split('\n')[0]).toBe(`# ${en.projects[0].title}`);
  });

  it('absolutises root-relative image src against origin and leaves http(s) URLs untouched', () => {
    // Synthetic fixture — guarantees the assertion runs regardless of what
    // the current public content tree happens to carry.
    const base = en.projects[0];
    const project = {
      ...base,
      caseStudy: {
        ...(base.caseStudy ?? { metrics: [], context: [], decisions: [], stackTable: [], lessons: [] }),
        diagrams: [
          {
            title: 'Synthetic diagram',
            images: [
              { src: '/demo/relative.png', alt: 'relative' },
              { src: 'https://cdn.example.com/abs.png', alt: 'absolute' },
              { src: '//cdn.example.com/proto-rel.png', alt: 'proto-rel' },
            ],
          },
        ],
      },
    };
    const md = caseStudyToMarkdown(project, en.ui, ORIGIN);
    expect(md).toContain(`![relative](${ORIGIN}/demo/relative.png)`);
    expect(md).toContain('![absolute](https://cdn.example.com/abs.png)');
    // Protocol-relative URL must promote to https — never collapse into the
    // root-relative branch (which would emit `${ORIGIN}//cdn...`).
    expect(md).toContain('![proto-rel](https://cdn.example.com/proto-rel.png)');
    expect(md).not.toContain(`${ORIGIN}//cdn.example.com`);
  });

  it('falls back to a minimal stub when caseStudy is absent', () => {
    // Strip both caseStudy AND videoTranscript so the stub really is minimal —
    // videoTranscript renders its own `## Video walkthrough` section, which
    // is independent of caseStudy and would defeat the "no section heads"
    // invariant if left intact.
    const stub = { ...en.projects[0], caseStudy: undefined, videoTranscript: undefined };
    const md = caseStudyToMarkdown(stub, en.ui, ORIGIN);
    expect(md).toContain(`# ${stub.title}`);
    expect(md).not.toMatch(/^## /m);
  });
});
