import { describe, it, expect } from 'vitest';
import { homeToMarkdown } from './homeMarkdown';
import { en } from '../content/public/en';
import { ru } from '../content/public/ru';

// Snapshots are taken against the COMMITTED public content tree, not the
// active barrel — this keeps tests stable regardless of CONTENT_SOURCE
// (private overrides change the active tree but never these snapshots).
const ORIGIN = 'https://ilyadev.xyz';

describe('homeToMarkdown', () => {
  it('serialises EN home page (snapshot)', () => {
    expect(
      homeToMarkdown(en, ORIGIN, { mirrorExt: '.txt', indexFile: 'llms.txt' }),
    ).toMatchSnapshot();
  });

  it('serialises RU home page (snapshot)', () => {
    expect(
      homeToMarkdown(ru, ORIGIN, { mirrorExt: '.ru.txt', indexFile: 'llms-ru.txt' }),
    ).toMatchSnapshot();
  });

  it('starts with H1 of the hero name', () => {
    const md = homeToMarkdown(en, ORIGIN, { mirrorExt: '.txt', indexFile: 'llms.txt' });
    expect(md.split('\n')[0]).toBe(`# ${en.hero.name}`);
  });

  it('emits one Read-full-case link per project', () => {
    const md = homeToMarkdown(en, ORIGIN, { mirrorExt: '.txt', indexFile: 'llms.txt' });
    const matches = md.match(/Read full case study →/g) ?? [];
    expect(matches.length).toBe(en.projects.length);
  });

  it('honours mirrorExt for sibling case links', () => {
    const md = homeToMarkdown(ru, ORIGIN, { mirrorExt: '.ru.txt', indexFile: 'llms-ru.txt' });
    expect(md).toContain(`${ORIGIN}/cases/${ru.projects[0].slug}.ru.txt`);
    expect(md).not.toContain(`${ORIGIN}/cases/${ru.projects[0].slug}.txt\n`);
  });

  it('embeds the language-specific llms index in the footer', () => {
    const md = homeToMarkdown(en, ORIGIN, { mirrorExt: '.txt', indexFile: 'llms.txt' });
    expect(md).toContain(`${ORIGIN}/llms.txt`);
  });
});
