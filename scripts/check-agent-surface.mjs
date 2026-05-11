import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const caddyfile = readFileSync(resolve(root, 'deploy/Caddyfile.example'), 'utf8');

const requiredDistFiles = [
  'dist/llms.txt',
  'dist/llms-ru.txt',
  'dist/llms-ar.txt',
  'dist/llms-full.txt',
  'dist/index.txt',
  'dist/index.ru.txt',
  'dist/index.ar.txt',
  'dist/cases/ai-crm.txt',
  'dist/cases/ai-crm.ru.txt',
  'dist/cases/ai-crm.ar.txt',
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`);
}

function assertNotIncludes(haystack, needle, label) {
  if (haystack.includes(needle)) fail(`${label} must not contain ${needle}`);
}

for (const rel of requiredDistFiles) {
  const path = resolve(root, rel);
  if (!existsSync(path)) {
    fail(`missing ${rel}`);
    continue;
  }
  if (!statSync(path).isFile() || statSync(path).size === 0) {
    fail(`empty or non-file ${rel}`);
  }
}

assertIncludes(caddyfile, '@llms path /llms.txt /llms-ru.txt /llms-ar.txt /llms-full.txt', 'Caddy llms matcher');
assertIncludes(caddyfile, 'encode gzip', 'Caddy compression');
assertIncludes(caddyfile, 'Content-Type "text/plain; charset=utf-8"', 'Caddy agent content type');
assertIncludes(caddyfile, '-X-Robots-Tag', 'Caddy llms robots removal');
assertIncludes(caddyfile, '@mirrors path /index.txt /index.ru.txt /index.ar.txt /cases/*.txt', 'Caddy mirror matcher');
assertIncludes(caddyfile, '@legacyCaseMd path_regexp legacyCaseMd', 'Caddy legacy md redirect');
assertIncludes(caddyfile, '@assets path /assets/*', 'Caddy immutable asset matcher');
assertIncludes(caddyfile, 'Link `</llms.txt>; rel="llms-txt", </llms-full.txt>; rel="llms-full-txt"`', 'Caddy llms Link header');

assertNotIncludes(caddyfile, 'X-Robots-Tag "noindex, nofollow"', 'Caddy robots');
assertNotIncludes(caddyfile, '@markdown path *.md /llms.txt', 'Caddy markdown matcher');
assertNotIncludes(caddyfile, '@markdown path *.md', 'Caddy markdown matcher');
assertNotIncludes(caddyfile, '@static file', 'Caddy static matcher');
assertNotIncludes(caddyfile, 'encode zstd', 'Caddy compression');

const llmsBlock = caddyfile.match(/@llms[\s\S]*?\n\t}\n/)?.[0] ?? '';
const mirrorsBlock = caddyfile.match(/@mirrors[\s\S]*?\n\t}\n/)?.[0] ?? '';
assertNotIncludes(llmsBlock, 'Link `</llms.txt>', 'Caddy llms block');
assertNotIncludes(mirrorsBlock, 'Link `</llms.txt>', 'Caddy mirrors block');

const llms = readFileSync(resolve(root, 'dist/llms.txt'), 'utf8');
const sitemap = readFileSync(resolve(root, 'dist/sitemap.xml'), 'utf8');
const indexHtml = readFileSync(resolve(root, 'dist/index.html'), 'utf8');
const expectedOrigin =
  process.env.AGENT_SURFACE_ORIGIN ??
  (llms.includes('https://ilyadev.xyz/') ? 'https://ilyadev.xyz' : 'https://example.com');
assertIncludes(llms, `${expectedOrigin}/llms-full.txt`, 'dist llms full corpus link');
assertIncludes(llms, `${expectedOrigin}/cases/ai-crm.txt`, 'dist llms case mirror link');
assertNotIncludes(llms, `${expectedOrigin}/cases/ai-crm.md`, 'dist llms stale md link');
assertIncludes(sitemap, `${expectedOrigin}/index.txt`, 'dist sitemap home mirror');
assertIncludes(sitemap, `${expectedOrigin}/cases/ai-crm.txt`, 'dist sitemap case mirror');
assertNotIncludes(sitemap, '.md</loc>', 'dist sitemap stale md mirror');
assertIncludes(indexHtml, 'type="text/plain"', 'dist html text alternates');
assertIncludes(indexHtml, `${expectedOrigin}/index.txt`, 'dist html home mirror alternate');
assertNotIncludes(indexHtml, 'type="text/markdown"', 'dist html stale markdown alternate');

if (!process.exitCode) {
  console.log('agent surface contract OK');
}
