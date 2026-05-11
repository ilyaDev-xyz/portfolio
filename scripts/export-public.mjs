import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const out = resolve(process.env.PUBLIC_EXPORT_DIR || resolve(repo, '..', 'portfolio-engine-public'));
const force = process.env.EXPORT_FORCE === '1';

const excludedDirs = new Set([
  'scripts/cv/out',
  'scripts/og/out',
  'server/data',
  'src/content/.private',
  'public/private',
]);

const excludedDirNames = new Set(['.git', 'node_modules', 'dist', 'dist-ssr', '.vite']);

const excludedFiles = new Set([
  'src/content/active.ts',
  'public/index.md',
  'public/index.ru.md',
  'public/index.ar.md',
  'public/index.txt',
  'public/index.ru.txt',
  'public/index.ar.txt',
  'public/llms.txt',
  'public/llms-ru.txt',
  'public/llms-ar.txt',
  'public/llms-full.txt',
]);

function norm(path) {
  return path.split('\\').join('/');
}

function isExcluded(rel) {
  const p = norm(rel);
  const name = basename(p);
  if (p.split('/').some((part) => excludedDirNames.has(part))) return true;
  if (excludedDirs.has(p) || excludedFiles.has(p)) return true;
  if (p.startsWith('public/cases/') && (p.endsWith('.md') || p.endsWith('.txt'))) return true;
  if (name.startsWith('.env') && name !== '.env.example') return true;
  if (/\.(db|sqlite|sqlite3)(-(wal|shm))?$/.test(name)) return true;
  return false;
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const from = join(src, name);
    const rel = relative(repo, from);
    if (isExcluded(rel)) continue;
    const to = join(dest, name);
    const st = statSync(from);
    if (st.isDirectory()) {
      copyDir(from, to);
    } else if (st.isFile()) {
      cpSync(from, to);
    }
  }
}

if (out === repo || out.startsWith(repo + '/')) {
  console.error(`export: refusing to write inside repo: ${out}`);
  process.exit(1);
}

if (existsSync(out)) {
  if (!force) {
    console.error(`export: output already exists: ${out}`);
    console.error('export: choose PUBLIC_EXPORT_DIR, remove the directory yourself,');
    console.error('export: or rerun with EXPORT_FORCE=1 to wipe contents in place');
    console.error('export: while preserving the existing .git history + remote.');
    process.exit(1);
  }
  for (const name of readdirSync(out)) {
    if (name === '.git') continue;
    rmSync(join(out, name), { recursive: true, force: true });
  }
  console.log(`export: wiped existing contents at ${out} (preserved .git)`);
}

copyDir(repo, out);

console.log(`export: wrote ${out}`);
console.log(force
  ? 'export: existing repo at target — review diff + commit there.'
  : 'export: publish from that directory with a fresh git init.');
