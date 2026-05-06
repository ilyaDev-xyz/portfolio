import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(root, '../src/content');
const privateEntry = resolve(contentDir, '.private/index.ts');
const activeFile = resolve(contentDir, 'active.ts');
const hasPrivate = existsSync(privateEntry);
const requestedSource = process.env.CONTENT_SOURCE;

if (!requestedSource) {
  console.error('CONTENT_SOURCE is required. Use "public" or "private".');
  process.exit(1);
}

if (!['public', 'private'].includes(requestedSource)) {
  console.error('CONTENT_SOURCE must be "public" or "private".');
  process.exit(1);
}

const source = requestedSource === 'public' ? 'public' : '.private';

if (source === '.private' && !hasPrivate) {
  console.error('content: private requested, but src/content/.private/index.ts missing');
  process.exit(1);
}

const isPublic = source === 'public';

const body = `export { en, ru, ar } from './${source}';\nexport const CONTENT_SOURCE = '${source}' as const;\nexport const IS_SANITIZED = ${isPublic ? 'true' : 'false'} as const;\n`;

writeFileSync(activeFile, body, 'utf8');
console.log(`content: ${isPublic ? 'public' : 'private'}`);
