/**
 * Runtime parity check between localized content trees.
 *
 * The `Content` type already enforces SHAPE parity at compile time
 * (TypeScript rejects either dictionary if a key is missing). What it does
 * NOT enforce: array-LENGTH parity for projects, decisions, diagrams,
 * lessons, etc. — typical drift bug is "added a case in EN, forgot RU".
 *
 * Tests run against the COMMITTED public tree, not the active barrel,
 * so CONTENT_SOURCE never affects them.
 */

import { describe, it, expect } from 'vitest';
import { en } from './public/en';
import { ru } from './public/ru';
import { ar } from './public/ar';
import type { Content } from './types';

const localized: Array<[string, Content]> = [
  ['ru', ru],
  ['ar', ar],
];

describe('localized parity against EN (public tree)', () => {
  it('nav links length matches', () => {
    localized.forEach(([lang, content]) => {
      expect(content.nav.links.length, lang).toBe(en.nav.links.length);
    });
  });

  it('hero chips length matches', () => {
    localized.forEach(([lang, content]) => {
      expect(content.hero.chips.length, lang).toBe(en.hero.chips.length);
    });
  });

  it('about paragraphs length matches', () => {
    localized.forEach(([lang, content]) => {
      expect(content.about.paragraphs.length, lang).toBe(en.about.paragraphs.length);
    });
  });

  it('stack categories length and per-category items length match', () => {
    localized.forEach(([lang, content]) => {
      expect(content.stack.length, lang).toBe(en.stack.length);
      en.stack.forEach((cat, i) => {
        expect(content.stack[i].items.length, `${lang}:${cat.label}`).toBe(cat.items.length);
      });
    });
  });

  it('project list has the same length and identical slugs in order', () => {
    localized.forEach(([lang, content]) => {
      expect(content.projects.length, lang).toBe(en.projects.length);
      en.projects.forEach((p, i) => {
        expect(content.projects[i].slug, lang).toBe(p.slug);
        expect(content.projects[i].idx, lang).toBe(p.idx);
      });
    });
  });

  it('per-project caseStudy presence is consistent', () => {
    localized.forEach(([lang, content]) => {
      en.projects.forEach((p, i) => {
        expect(Boolean(content.projects[i].caseStudy), `${lang}:${p.slug}`).toBe(Boolean(p.caseStudy));
      });
    });
  });

  it('per-project caseStudy array lengths match (decisions, context, lessons, diagrams, stackTable, heroFacts)', () => {
    localized.forEach(([lang, content]) => {
      en.projects.forEach((p, i) => {
        const a = p.caseStudy;
        const b = content.projects[i].caseStudy;
        if (!a || !b) return;
        expect(b.decisions.length, `${lang}:${p.slug}:decisions`).toBe(a.decisions.length);
        expect(b.context.length, `${lang}:${p.slug}:context`).toBe(a.context.length);
        expect(b.lessons.length, `${lang}:${p.slug}:lessons`).toBe(a.lessons.length);
        expect(b.stackTable.length, `${lang}:${p.slug}:stackTable`).toBe(a.stackTable.length);
        expect((b.diagrams ?? []).length, `${lang}:${p.slug}:diagrams`).toBe((a.diagrams ?? []).length);
        expect((b.heroFacts ?? []).length, `${lang}:${p.slug}:heroFacts`).toBe((a.heroFacts ?? []).length);
        expect((b.lessonsKeep ?? []).length, `${lang}:${p.slug}:lessonsKeep`).toBe((a.lessonsKeep ?? []).length);
        a.diagrams?.forEach((d, di) => {
          const dr = b.diagrams?.[di];
          expect((dr?.notes ?? []).length, `${lang}:${p.slug}:diagramNotes`).toBe((d.notes ?? []).length);
          expect((dr?.images ?? []).length, `${lang}:${p.slug}:diagramImages`).toBe((d.images ?? []).length);
        });
      });
    });
  });

  it('experience timeline length matches', () => {
    localized.forEach(([lang, content]) => {
      expect(content.experience.length, lang).toBe(en.experience.length);
    });
  });

  it('contact ways length matches and href values are identical', () => {
    localized.forEach(([lang, content]) => {
      expect(content.contact.ways.length, lang).toBe(en.contact.ways.length);
      en.contact.ways.forEach((w, i) => {
        expect(content.contact.ways[i].href, lang).toBe(w.href);
      });
    });
  });
});
