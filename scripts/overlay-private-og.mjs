/**
 * Overlay private OG masters into dist/ after `vite build` for build:private.
 *
 * Why:
 *   public/og/* is committed = sanitized demo content, safe to push to the
 *   public github repo via export-public.mjs. The live ilyadev.xyz deploy
 *   needs the real-content OG variant. This postbuild step copies private
 *   masters from PRIVATE_OG_DIR directly over the matching files in `dist/og/`,
 *   leaving `public/og/` untouched.
 *
 * Inputs (under PRIVATE_OG_DIR, default ../portfolio-og-private/out):
 *   - masters/private/og-image.png
 *   - masters/private/og/cv.png
 *   - masters/private/og/cases/<slug>.png × 6
 *
 * Targets:
 *   - dist/og-image.png
 *   - dist/og/cv.png
 *   - dist/og/cases/<slug>.png × 6
 *
 * Behaviour:
 *   - If a master is missing, fail loudly. Build:private is the only caller —
 *     missing masters mean the operator forgot to run gen_og.py /
 *     gen_case_og.py. Silent fallback would leak public OG into a private
 *     deploy.
 *   - SKIP_PRIVATE_OG_OVERLAY=1 turns the overlay off (lets you run
 *     build:private without private masters present, e.g. on CI).
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const dist = resolve(repo, 'dist');
const masters = resolve(
  process.env.PRIVATE_OG_DIR || resolve(repo, '..', 'portfolio-og-private', 'out'),
);

const SLUGS = [
  'ai-crm',
  'ai-warehouse',
  'ai-video-editor',
  'roblox-game',
  'macos-vpn',
  'portfolio-site',
];

if (process.env.SKIP_PRIVATE_OG_OVERLAY === '1') {
  console.log('overlay-private-og: SKIP_PRIVATE_OG_OVERLAY=1 — leaving dist/og/* as public.');
  process.exit(0);
}

if (!existsSync(dist)) {
  console.error(`overlay-private-og: dist/ not found at ${dist}. Run vite build first.`);
  process.exit(1);
}

if (!existsSync(masters)) {
  console.error(`overlay-private-og: masters dir not found at ${masters}.`);
  console.error('Set PRIVATE_OG_DIR to the untracked private OG asset output directory.');
  process.exit(1);
}

const home = join(masters, 'masters', 'private', 'og-image.png');
if (!existsSync(home)) {
  console.error(`overlay-private-og: missing ${home}`);
  console.error('Run: python gen_og.py --source private');
  process.exit(1);
}

const cv = join(masters, 'masters', 'private', 'og', 'cv.png');
if (!existsSync(cv)) {
  console.error(`overlay-private-og: missing ${cv}`);
  console.error('Run: python gen_cv_og.py --source private');
  process.exit(1);
}

const cases = SLUGS.map((slug) => ({
  slug,
  src: join(masters, 'masters', 'private', 'og', 'cases', `${slug}.png`),
}));
const missingCases = cases.filter((c) => !existsSync(c.src));
if (missingCases.length) {
  console.error('overlay-private-og: missing case masters:');
  for (const c of missingCases) console.error(`  - ${c.src}`);
  console.error('Run: python gen_case_og.py --source private');
  process.exit(1);
}

copyFileSync(home, join(dist, 'og-image.png'));
console.log(`overlay-private-og: dist/og-image.png ← ${home}`);

const distOgDir = join(dist, 'og');
mkdirSync(distOgDir, { recursive: true });
copyFileSync(cv, join(distOgDir, 'cv.png'));
console.log(`overlay-private-og: dist/og/cv.png ← ${cv}`);

const distCasesDir = join(dist, 'og', 'cases');
mkdirSync(distCasesDir, { recursive: true });
for (const c of cases) {
  const dst = join(distCasesDir, `${c.slug}.png`);
  copyFileSync(c.src, dst);
  console.log(`overlay-private-og: dist/og/cases/${c.slug}.png ← ${c.src}`);
}

console.log('overlay-private-og: done — dist/ now holds private OG; public/og/ unchanged.');
