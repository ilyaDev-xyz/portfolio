import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const outDir = resolve(here, 'out');
const publicDir = resolve(repo, 'public');
const defaultPdfDir = resolve(publicDir, 'private');

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

console.log('cv: starting Vite SSR loader...');
const server = await createServer({
  root: repo,
  configFile: resolve(repo, 'vite.config.ts'),
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'silent',
});

let exitCode = 0;
try {
  const contentMod = await server.ssrLoadModule('/src/content/index.ts');
  const cvSourceMod = await server.ssrLoadModule('/src/lib/cvSource.ts');
  const { en, ru, ar } = contentMod;
  const { generateCvTypst } = cvSourceMod;

  const compiler = NodeCompiler.create({ workspace: outDir });

  for (const [lang, content] of [
    ['en', en],
    ['ru', ru],
    ['ar', ar],
  ]) {
    if (!content?.cv) {
      console.warn(`cv: skip ${lang} — content.cv missing`);
      continue;
    }
    const typstSource = generateCvTypst(content, lang);
    const typPath = resolve(outDir, `cv-${lang}.typ`);
    writeFileSync(typPath, typstSource, 'utf8');
    console.log(`cv: wrote ${typPath} (${typstSource.length} chars)`);

    const result = compiler.compile({ mainFileContent: typstSource });
    if (!result.result) {
      const diagnostics = compiler.fetchDiagnostics(result.takeDiagnostics());
      console.error(`cv: typst compile failed for ${lang}:`);
      for (const d of diagnostics) {
        console.error(' ', JSON.stringify(d, null, 2));
      }
      exitCode = 1;
      continue;
    }
    const pdfBuf = compiler.pdf(result.result);
    // Honor the content-tree's `cv.pdfPath` so the public demo lands in
    // public/demo/ (gitignored: no) and the private CV stays in
    // public/private/ (gitignored: yes). Strip leading slashes and any
    // `..` segments so a malformed pdfPath cannot escape the public dir.
    const relPath = (content.cv.pdfPath ?? `private/cv-${lang}.pdf`)
      .replace(/^\/+/, '')
      .split('/')
      .filter((seg) => seg !== '..' && seg !== '')
      .join('/');
    const pdfPath = resolve(publicDir, relPath);
    mkdirSync(dirname(pdfPath), { recursive: true });
    writeFileSync(pdfPath, pdfBuf);
    console.log(`cv: wrote ${pdfPath} (${pdfBuf.length} bytes)`);
  }
  // Keep defaultPdfDir referenced — still useful as fallback when running
  // older private content trees without explicit pdfPath.
  void defaultPdfDir;
} catch (err) {
  console.error('cv: build failed', err);
  exitCode = 1;
} finally {
  await server.close();
}

process.exit(exitCode);
