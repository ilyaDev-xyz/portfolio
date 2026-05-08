import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const defaultOut = resolve(repo, 'scripts', 'og', 'out', 'case_og_data.json');
const outPath = resolve(process.env.CASE_OG_DATA_OUT || defaultOut);
const privateFactsPath = process.env.CASE_OG_PRIVATE_FACTS_PATH
  ? resolve(process.env.CASE_OG_PRIVATE_FACTS_PATH)
  : '';

function pullText(value) {
  if (!value) return '';
  if (Array.isArray(value)) return value.join('');
  return String(value);
}

function oneLine(value) {
  return pullText(value).replace(/\s+/g, ' ').trim();
}

function normalizeFact(fact) {
  if (Array.isArray(fact)) {
    return { k: oneLine(fact[0]), v: oneLine(fact[1]) };
  }
  return { k: oneLine(fact?.k), v: oneLine(fact?.v) };
}

function normalizeFacts(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeFact)
    .filter((fact) => fact.k && fact.v)
    .slice(0, 3);
}

function readPrivateFactsBySlug() {
  if (!privateFactsPath) return {};
  if (!existsSync(privateFactsPath)) {
    throw new Error(`CASE_OG_PRIVATE_FACTS_PATH not found: ${privateFactsPath}`);
  }
  return JSON.parse(readFileSync(privateFactsPath, 'utf8'));
}

function selectFacts(project, explicitFacts) {
  const normalizedExplicitFacts = normalizeFacts(explicitFacts);
  if (normalizedExplicitFacts.length) {
    return normalizedExplicitFacts;
  }

  const heroFacts = Array.isArray(project.caseStudy?.heroFacts)
    ? project.caseStudy.heroFacts
    : [];
  return normalizeFacts(heroFacts);
}

function projectToOg(project, privateFactsBySlug = {}) {
  return {
    slug: project.slug,
    status: project.status,
    title: oneLine(project.title),
    claim: oneLine(project.caseStudy?.contextPull || project.subtitle),
    facts: selectFacts(project, privateFactsBySlug[project.slug]),
    url: `ilyadev.xyz/cases/${project.slug}`,
  };
}

function projectToPublicPlaceholder(project) {
  return {
    slug: project.slug,
    status: '',
    title: `Case ${project.idx}`,
    claim: '',
    facts: [],
    url: '',
  };
}

console.log('case-og-data: starting Vite SSR loader...');
const privateFactsBySlug = readPrivateFactsBySlug();
const server = await createServer({
  root: repo,
  configFile: resolve(repo, 'vite.config.ts'),
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'silent',
});

let exitCode = 0;
try {
  const publicMod = await server.ssrLoadModule('/src/content/public/index.ts');
  const payload = {
    public: publicMod.en.projects.map(projectToPublicPlaceholder),
  };

  const privateEntry = resolve(repo, 'src/content/.private/index.ts');
  if (existsSync(privateEntry)) {
    const privateMod = await server.ssrLoadModule('/src/content/.private/index.ts');
    payload.private = privateMod.en.projects.map((project) => projectToOg(project, privateFactsBySlug));
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`case-og-data: wrote ${outPath}`);
} catch (error) {
  console.error('case-og-data: failed', error);
  exitCode = 1;
} finally {
  await server.close();
}

process.exit(exitCode);
