import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_SOURCE, ar, en, ru } from './src/content';
import { LANG_CONFIG, LANGS } from './src/i18n/langConfig';
import type { Content, Project } from './src/content/types';
import { generateAgentMirrors, type MirrorFiles } from './src/lib/agentMirrors';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, 'public');
const PRIVATE_ORIGIN = process.env.PRIVATE_SITE_ORIGIN || 'https://ilyadev.xyz';
const PUBLIC_ORIGIN = process.env.PUBLIC_SITE_ORIGIN || 'https://example.com';
const IS_PRIVATE_SOURCE = CONTENT_SOURCE !== 'public';
const PRODUCTION_ORIGIN = IS_PRIVATE_SOURCE ? PRIVATE_ORIGIN : PUBLIC_ORIGIN;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
}

function absoluteUrl(path: string | undefined): string {
  if (!path) return `${PRODUCTION_ORIGIN}/og-image.png`;
  if (/^https?:\/\//.test(path)) return path;
  return `${PRODUCTION_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

function shorten(value: string, max = 180): string {
  const oneLine = value.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= max) return oneLine;
  const cut = oneLine.slice(0, max - 1);
  const boundary = cut.lastIndexOf(' ');
  return `${cut.slice(0, boundary > 120 ? boundary : cut.length).trim()}…`;
}

function injectBeforeHeadEnd(html: string, tag: string): string {
  return html.replace('</head>', `${tag}\n  </head>`);
}

function injectAfterBodyStart(html: string, tag: string): string {
  return html.replace('<body>', `<body>\n    ${tag}`);
}

function upsertTag(html: string, pattern: RegExp, tag: string): string {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return injectBeforeHeadEnd(html, `    ${tag}`);
}

function setMetaName(html: string, name: string, content: string): string {
  return upsertTag(
    html,
    new RegExp(`<meta name="${name}" content="[^"]*"\\s*/>`),
    `<meta name="${name}" content="${escapeAttr(content)}" />`,
  );
}

function setMetaProperty(html: string, property: string, content: string): string {
  return upsertTag(
    html,
    new RegExp(`<meta property="${property}" content="[^"]*"\\s*/>`),
    `<meta property="${property}" content="${escapeAttr(content)}" />`,
  );
}

function setLinkRel(html: string, rel: string, href: string): string {
  return upsertTag(
    html,
    new RegExp(`<link rel="${rel}" href="[^"]*"\\s*/>`),
    `<link rel="${rel}" href="${escapeAttr(href)}" />`,
  );
}

function setTextAlternate(html: string, lang: 'en' | 'ru' | 'ar', href: string): string {
  return upsertTag(
    html,
    new RegExp(`<link rel="alternate" type="text/plain" hreflang="${lang}" href="[^"]*"\\s*/>`),
    `<link rel="alternate" type="text/plain" hreflang="${lang}" href="${escapeAttr(href)}" />`,
  );
}

function siteName(content: Content): string {
  return IS_PRIVATE_SOURCE ? 'ilyaDev.xyz' : content.hero.name;
}

function setTitle(html: string, title: string): string {
  return html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(title)}</title>`,
  );
}

function pitch(content: Content): string {
  return content.hero.pitch.join('').replace(/\s+/g, ' ').trim();
}

function socialImage(): string {
  // Canonical home OG. public/og-image.png is the committed PUBLIC variant.
  // build:private overlays the PRIVATE variant into dist/og-image.png via
  // scripts/overlay-private-og.mjs. PNG is mandatory — LinkedIn rejects
  // SVG/WebP for og:image.
  return `${PRODUCTION_ORIGIN}/og-image.png`;
}

function cvSocialImage(): string {
  // Dedicated Open Graph image for the CV endpoint. The public variant is
  // committed at public/og/cv.png; build:private overlays the private master
  // into dist/og/cv.png via scripts/overlay-private-og.mjs.
  return `${PRODUCTION_ORIGIN}/og/cv.png`;
}

function cvPdfPath(content: Content, lang: 'en' | 'ru' | 'ar' = 'en'): string {
  return content.cv?.pdfPath ?? `/private/${LANG_CONFIG[lang].cvFile}`;
}

function contactEmail(content: Content): string | undefined {
  return content.contact.ways.find((way) => way.href?.startsWith('mailto:'))?.href;
}

function sameAs(content: Content): string[] {
  return content.contact.ways
    .map((way) => way.href)
    .filter((href): href is string => Boolean(href && /^https?:\/\//.test(href)));
}

function profileJsonLd(content: Content): Record<string, unknown> {
  const email = contactEmail(content);
  const links = sameAs(content);
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${PRODUCTION_ORIGIN}/`,
    mainEntity: {
      '@type': 'Person',
      '@id': `${PRODUCTION_ORIGIN}/#person`,
      name: content.hero.name,
      alternateName: [ru.hero.name, ar.hero.name].filter((name) => name !== content.hero.name),
      jobTitle: content.hero.role,
      url: PRODUCTION_ORIGIN,
      image: socialImage(),
      description: pitch(content),
      ...(email ? { email } : {}),
      ...(links.length ? { sameAs: links } : {}),
      knowsAbout: content.stack.flatMap((category) => category.items).slice(0, 28),
    },
  };
}

function replaceFirstJsonLd(html: string, json: Record<string, unknown>): string {
  const tag = `<script type="application/ld+json">\n${escapeJsonForScript(json)}\n    </script>`;
  if (/<script type="application\/ld\+json">[\s\S]*?<\/script>/.test(html)) {
    return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, tag);
  }
  return injectBeforeHeadEnd(html, `    ${tag}`);
}

function applyHomeHead(html: string, content: Content): string {
  const title = `${content.hero.name} — ${content.hero.role}`;
  const description = pitch(content);
  const image = socialImage();
  let next = setTitle(html, title);
  next = setMetaName(next, 'description', description);
  next = setLinkRel(next, 'canonical', `${PRODUCTION_ORIGIN}/`);
  next = setMetaProperty(next, 'og:type', 'website');
  next = setMetaProperty(next, 'og:site_name', siteName(content));
  next = setMetaProperty(next, 'og:url', `${PRODUCTION_ORIGIN}/`);
  next = setMetaProperty(next, 'og:title', title);
  next = setMetaProperty(next, 'og:description', description);
  next = setMetaProperty(next, 'og:image', image);
  next = setMetaProperty(next, 'og:image:width', '1200');
  next = setMetaProperty(next, 'og:image:height', '630');
  next = setMetaProperty(next, 'og:image:type', 'image/png');
  next = setMetaProperty(next, 'og:image:alt', `${content.hero.name} — ${content.hero.role}`);
  next = setMetaName(next, 'twitter:title', title);
  next = setMetaName(next, 'twitter:description', description);
  next = setMetaName(next, 'twitter:image', image);
  for (const lang of LANGS) {
    next = setTextAlternate(next, lang, `${PRODUCTION_ORIGIN}/${LANG_CONFIG[lang].homeFile}`);
  }
  next = replaceFirstJsonLd(next, profileJsonLd(content));
  return next;
}

function cvJsonLd(content: Content): Record<string, unknown> {
  const pdfUrl = absoluteUrl(cvPdfPath(content));
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${PRODUCTION_ORIGIN}/cv`,
    name: `CV — ${content.hero.name}`,
    image: cvSocialImage(),
    mainEntity: {
      '@type': 'Person',
      '@id': `${PRODUCTION_ORIGIN}/#person`,
      name: content.hero.name,
      jobTitle: content.hero.role,
      url: PRODUCTION_ORIGIN,
      image: cvSocialImage(),
      description: content.cv?.summary ?? pitch(content),
      sameAs: sameAs(content),
      subjectOf: {
        '@type': 'DigitalDocument',
        name: `${content.hero.name} CV`,
        encodingFormat: 'application/pdf',
        url: pdfUrl,
      },
    },
  };
}

function applyCvHead(html: string, content: Content): string {
  const pdfPath = cvPdfPath(content);
  const title = `CV — ${content.hero.name} · ${content.hero.role}`;
  const description = shorten(content.cv?.summary ?? pitch(content), 170);
  const image = cvSocialImage();
  let next = stripTextAlternates(html);
  next = setTitle(next, title);
  next = setMetaName(next, 'description', description);
  next = setLinkRel(next, 'canonical', `${PRODUCTION_ORIGIN}/cv`);
  next = setMetaProperty(next, 'og:type', 'website');
  next = setMetaProperty(next, 'og:url', `${PRODUCTION_ORIGIN}/cv`);
  next = setMetaProperty(next, 'og:title', title);
  next = setMetaProperty(next, 'og:description', description);
  next = setMetaProperty(next, 'og:image', image);
  next = setMetaProperty(next, 'og:image:width', '1200');
  next = setMetaProperty(next, 'og:image:height', '630');
  next = setMetaProperty(next, 'og:image:type', 'image/png');
  next = setMetaProperty(next, 'og:image:alt', `${content.hero.name} CV — PDF resume`);
  next = setMetaName(next, 'twitter:title', title);
  next = setMetaName(next, 'twitter:description', description);
  next = setMetaName(next, 'twitter:image', image);
  next = replaceFirstJsonLd(next, cvJsonLd(content));
  const redirect = `<script data-cv-redirect>
      window.location.replace(${JSON.stringify(pdfPath)});
    </script>`;
  const fallback = `<noscript><p><a href="${escapeAttr(pdfPath)}">Open CV PDF</a></p></noscript>`;
  return injectAfterBodyStart(next, `${redirect}\n    ${fallback}`);
}

function stripTextAlternates(html: string): string {
  return html.replace(
    /\n\s*<link rel="alternate" type="text\/(?:markdown|plain)" hreflang="(?:en|ru|ar)" href="[^"]+"\s*\/>/g,
    '',
  );
}

function articleJsonLd(project: Project, content: Content): Record<string, unknown> {
  const codename = project.codename ?? project.slug;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: project.title,
    description: project.subtitle,
    author: {
      '@type': 'Person',
      '@id': `${PRODUCTION_ORIGIN}/#person`,
      name: content.hero.name,
      url: PRODUCTION_ORIGIN,
    },
    url: `${PRODUCTION_ORIGIN}/cases/${project.slug}`,
    image: absoluteUrl(project.imageSrc ?? project.thumbnail),
    keywords: project.foot.split(/\s*·\s*/).filter(Boolean),
    about: project.chips ?? [],
    isPartOf: {
      '@type': 'CreativeWork',
      name: `Case studies — ${content.hero.name}`,
      url: `${PRODUCTION_ORIGIN}/#cases`,
    },
    identifier: codename,
  };
}

function videoObjectJsonLd(
  project: Project,
  lang: 'en' | 'ru' | 'ar',
): Record<string, unknown> | null {
  if (!project.videoId || !project.videoTranscript) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${PRODUCTION_ORIGIN}/cases/${project.slug}#video-${lang}`,
    name: project.title,
    description: project.videoTranscript.synopsis,
    thumbnailUrl: absoluteUrl(project.thumbnail ?? project.imageSrc),
    embedUrl: `https://www.youtube.com/embed/${project.videoId}`,
    contentUrl: `https://www.youtube.com/watch?v=${project.videoId}`,
    inLanguage: lang,
    transcript: project.videoTranscript.fullText,
  };
}

function findProjectBySlug(content: Content, slug: string): Project | undefined {
  return content.projects.find((p) => p.slug === slug);
}

function applyCaseHead(
  html: string,
  project: Project,
  content: Content,
  langContents: Record<'en' | 'ru' | 'ar', Content>,
): string {
  const codename = project.codename ?? project.slug;
  const title = `${project.title} — ${codename} · ${content.hero.name}`;
  const url = `${PRODUCTION_ORIGIN}/cases/${project.slug}`;
  // Per-case OG. public/og/cases/<slug>.png is the committed PUBLIC variant.
  // build:private overlays PRIVATE variants into dist/og/cases/ via
  // scripts/overlay-private-og.mjs. PNG mandatory — LinkedIn rejects SVG/WebP.
  const image = `${PRODUCTION_ORIGIN}/og/cases/${project.slug}.png`;
  let next = stripTextAlternates(html);
  next = setTitle(next, title);
  next = setMetaName(next, 'description', project.subtitle);
  next = setLinkRel(next, 'canonical', url);
  next = setMetaProperty(next, 'og:type', 'article');
  next = setMetaProperty(next, 'og:url', url);
  next = setMetaProperty(next, 'og:title', title);
  next = setMetaProperty(next, 'og:description', project.subtitle);
  next = setMetaProperty(next, 'og:image', image);
  next = setMetaProperty(next, 'og:image:width', '1200');
  next = setMetaProperty(next, 'og:image:height', '630');
  next = setMetaProperty(next, 'og:image:type', 'image/png');
  next = setMetaProperty(next, 'og:image:alt', `${project.title} — ${project.subtitle}`);
  next = setMetaName(next, 'twitter:title', title);
  next = setMetaName(next, 'twitter:description', project.subtitle);
  next = setMetaName(next, 'twitter:image', image);
  // data-case-head ties these to CaseHeadTags client-side ownership: when
  // the React component mounts on a direct-loaded case page, it strips every
  // `[data-case-head]` node and reinstalls a fresh set, avoiding both
  // duplicate Article JSON-LD and stale alternates leaking onto Home after
  // SPA navigation.
  const mirrorLinks = LANGS.map((lang) => {
    const cfg = LANG_CONFIG[lang];
    return `<link rel="alternate" type="text/plain" hreflang="${lang}" href="${url}${cfg.mirrorExt}" data-case-head />`;
  }).join('\n    ');
  const jsonLd = `<script type="application/ld+json" data-case-head>\n${escapeJsonForScript(articleJsonLd(project, content))}\n    </script>`;
  // Emit one VideoObject per language that actually has a transcript and a
  // distinct video cut (each lang has its own videoId / mirror because the
  // narration is recorded separately).
  const videoTags = LANGS.flatMap((lang) => {
    const langProject = findProjectBySlug(langContents[lang], project.slug);
    if (!langProject) return [];
    const ld = videoObjectJsonLd(langProject, lang);
    if (!ld) return [];
    return [
      `<script type="application/ld+json" data-case-head>\n${escapeJsonForScript(ld)}\n    </script>`,
    ];
  });
  const videoBlock = videoTags.length
    ? `\n    ${videoTags.join('\n    ')}`
    : '';
  return injectBeforeHeadEnd(next, `    ${mirrorLinks}\n    ${jsonLd}${videoBlock}`);
}

function writeMirrorFiles(files: MirrorFiles, baseDir = PUBLIC_DIR): void {
  // Slug or mirror-suffix changes leave orphan mirrors in public/ and
  // public/cases/ — both the old and new file get served, splitting agent
  // traffic across stale URLs. Sweep generated legacy mirrors before writing.
  const expectedRoot = new Set(
    Object.keys(files).filter((p) => !p.includes('/')),
  );
  if (existsSync(baseDir)) {
    for (const name of readdirSync(baseDir)) {
      const generatedRootMirror =
        /^index(?:\.(?:ru|ar))?\.(?:md|txt)$/.test(name) ||
        /^llms(?:-(?:ru|ar)|-full)?\.txt$/.test(name);
      if (generatedRootMirror && !expectedRoot.has(name)) {
        unlinkSync(resolve(baseDir, name));
      }
    }
  }

  const casesDir = resolve(baseDir, 'cases');
  if (existsSync(casesDir)) {
    const expected = new Set(
      Object.keys(files)
        .filter((p) => p.startsWith('cases/'))
        .map((p) => p.slice('cases/'.length)),
    );
    for (const name of readdirSync(casesDir)) {
      const generatedCaseMirror =
        /\.(?:md|txt)$/.test(name) ||
        /\.(?:ru|ar)\.(?:md|txt)$/.test(name) ||
        name.endsWith('undefined');
      if (generatedCaseMirror && !expected.has(name)) {
        unlinkSync(resolve(casesDir, name));
      }
    }
  }

  for (const [relPath, body] of Object.entries(files)) {
    const fullPath = resolve(baseDir, relPath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, body, 'utf8');
  }
}

/**
 * Build-time agent-mirror generator. Walks src/content/{en,ru,ar}.ts, serialises
 * every page into Markdown-flavoured text, writes into public/ so Caddy and Vite's static
 * server hand them out alongside the SPA.
 *   public/index.txt            public/index.ru.txt         public/index.ar.txt
 *   public/cases/<slug>.txt     public/cases/<slug>.ru.txt  public/cases/<slug>.ar.txt
 *   public/llms.txt             public/llms-ru.txt          public/llms-ar.txt
 *   public/llms-full.txt
 */
function agentMirrorsPlugin(): Plugin {
  // Direct-serve middleware for generated text files. Bypasses Vite's
  // static handler — needed because Vite 5.x routes .txt requests through the
  // SPA fallback (returns index.html instead of the file). Also pins
  // Content-Type with charset=utf-8 so browsers don't fall back to Windows-1252
  // and mangle Cyrillic.
  const directServe = (
    server: Parameters<NonNullable<Plugin['configureServer']>>[0],
    baseDir: string,
    memoryFiles?: MirrorFiles,
  ) => {
    server.middlewares.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      const url = (req.url || '').split('?')[0];
      const legacyMirror =
        url === '/index.md' ? '/index.txt' :
        url === '/index.ru.md' ? '/index.ru.txt' :
        url === '/index.ar.md' ? '/index.ar.txt' :
        url.match(/^\/cases\/([^/]+)\.md$/)?.[1] ? url.replace(/\.md$/, '.txt') :
        url.match(/^\/cases\/([^/]+)\.ru\.md$/)?.[1] ? url.replace(/\.ru\.md$/, '.ru.txt') :
        url.match(/^\/cases\/([^/]+)\.ar\.md$/)?.[1] ? url.replace(/\.ar\.md$/, '.ar.txt') :
        undefined;
      if (legacyMirror) {
        res.statusCode = 308;
        res.setHeader('Location', legacyMirror);
        return res.end();
      }
      const isTxt = url.endsWith('.txt');
      if (!isTxt) return next();

      const relPath = url.replace(/^\/+/, '');
      const memoryBody = memoryFiles?.[relPath];
      if (memoryBody !== undefined) {
        const body = Buffer.from(memoryBody, 'utf8');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Length', String(body.byteLength));
        res.setHeader('Cache-Control', 'no-cache');
        res.statusCode = 200;
        if (req.method === 'HEAD') return res.end();
        return res.end(body);
      }

      const filePath = resolve(baseDir, relPath);
      // Path-traversal guard — reject anything that escapes the static root.
      if (!filePath.startsWith(baseDir + '/') && filePath !== baseDir) {
        return next();
      }
      if (!existsSync(filePath)) return next();
      const st = statSync(filePath);
      if (!st.isFile()) return next();

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Length', String(st.size));
      res.setHeader('Cache-Control', 'no-cache');
      res.statusCode = 200;
      if (req.method === 'HEAD') return res.end();
      res.end(readFileSync(filePath));
    });
  };

  return {
    name: 'agent-mirrors',
    buildStart() {
      if (CONTENT_SOURCE === 'public') {
        writeMirrorFiles(generateAgentMirrors({ en, ru, ar }, PRODUCTION_ORIGIN));
      }
    },
    closeBundle() {
      if (IS_PRIVATE_SOURCE) {
        writeMirrorFiles(
          generateAgentMirrors({ en, ru, ar }, PRODUCTION_ORIGIN),
          resolve(__dirname, 'dist'),
        );
      }
    },
    configureServer(server) {
      const memoryFiles = IS_PRIVATE_SOURCE
        ? generateAgentMirrors({ en, ru, ar }, PRODUCTION_ORIGIN)
        : undefined;
      if (!IS_PRIVATE_SOURCE) {
        writeMirrorFiles(generateAgentMirrors({ en, ru, ar }, PRODUCTION_ORIGIN));
      }
      directServe(server, PUBLIC_DIR, memoryFiles);
    },
    configurePreviewServer(server) {
      directServe(server, resolve(__dirname, 'dist'));
    },
  };
}

function homeHeadPlugin(): Plugin {
  return {
    name: 'home-head',
    transformIndexHtml(html) {
      return applyHomeHead(html, en);
    },
  };
}

/**
 * Strip private staging directory after Vite copies `public/` to `dist/`.
 *
 * `public/private/` is gitignored — it never enters the repo, but it does
 * exist on the maintainer's machine (real CV PDFs, real preview images,
 * etc.) and `vite build` copies the entire `publicDir` recursively. Without
 * this plugin, any local `npm run build:public` ships personal artefacts
 * inside `dist/private/`, which is a deploy leak the moment the directory
 * is uploaded anywhere.
 *
 * Public CV PDFs land in `public/demo/cv-<lang>.pdf` (a separate, committed
 * tree) so removing `dist/private/` does not affect the deploy-safe surface.
 */
function stripPrivateFromDistPlugin(): Plugin {
  return {
    name: 'strip-private-from-dist',
    closeBundle() {
      if (IS_PRIVATE_SOURCE) return;
      const dir = resolve(__dirname, 'dist/private');
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    },
  };
}

function staticCaseHeadsPlugin(): Plugin {
  return {
    name: 'static-case-heads',
    closeBundle() {
      try {
        const indexPath = resolve(__dirname, 'dist/index.html');
        if (!existsSync(indexPath)) return;
        const baseHtml = readFileSync(indexPath, 'utf8');
        const langContents = { en, ru, ar };
        for (const project of en.projects) {
          const outputPath = resolve(__dirname, 'dist/cases', project.slug, 'index.html');
          mkdirSync(dirname(outputPath), { recursive: true });
          writeFileSync(outputPath, applyCaseHead(baseHtml, project, en, langContents), 'utf8');
        }
      } catch (error) {
        throw new Error('static-case-heads: failed to write case index.html files', {
          cause: error,
        });
      }
    },
  };
}

function staticCvHeadPlugin(): Plugin {
  const isCvRequest = (url: string | undefined): boolean => {
    const path = (url || '').split('?')[0].replace(/\/+$/, '');
    return path === '/cv';
  };

  return {
    name: 'static-cv-head',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        if (!isCvRequest(req.url)) return next();
        try {
          const baseHtml = readFileSync(resolve(__dirname, 'index.html'), 'utf8');
          const transformed = await server.transformIndexHtml('/cv', baseHtml);
          const html = applyCvHead(transformed, en);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.statusCode = 200;
          if (req.method === 'HEAD') return res.end();
          return res.end(html);
        } catch (error) {
          return next(error as Error);
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        if (!isCvRequest(req.url)) return next();
        const filePath = resolve(__dirname, 'dist/cv/index.html');
        if (!existsSync(filePath)) return next();
        const html = readFileSync(filePath);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Length', String(html.byteLength));
        res.setHeader('Cache-Control', 'no-cache');
        res.statusCode = 200;
        if (req.method === 'HEAD') return res.end();
        res.end(html);
      });
    },
    closeBundle() {
      try {
        const indexPath = resolve(__dirname, 'dist/index.html');
        if (!existsSync(indexPath)) return;
        const baseHtml = readFileSync(indexPath, 'utf8');
        const outputPath = resolve(__dirname, 'dist/cv', 'index.html');
        mkdirSync(dirname(outputPath), { recursive: true });
        writeFileSync(outputPath, applyCvHead(baseHtml, en), 'utf8');
      } catch (error) {
        throw new Error('static-cv-head: failed to write cv index.html', {
          cause: error,
        });
      }
    },
  };
}

function privateStaticMetadataPlugin(): Plugin {
  return {
    name: 'private-static-metadata',
    closeBundle() {
      if (!IS_PRIVATE_SOURCE) return;
      for (const rel of ['robots.txt', 'sitemap.xml']) {
        const filePath = resolve(__dirname, 'dist', rel);
        if (!existsSync(filePath)) continue;
        const body = readFileSync(filePath, 'utf8');
        writeFileSync(filePath, body.split(PUBLIC_ORIGIN).join(PRIVATE_ORIGIN), 'utf8');
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    homeHeadPlugin(),
    agentMirrorsPlugin(),
    staticCaseHeadsPlugin(),
    staticCvHeadPlugin(),
    privateStaticMetadataPlugin(),
    stripPrivateFromDistPlugin(),
  ],
  server: {
    port: 5173,
    open: false,
    // Leading dot = subdomain wildcard. Covers any rotating ngrok hostname
    // without needing to re-edit this file each time ngrok restarts.
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io', '.ngrok.app'],
    // /api and /admin proxy to the local analytics server (see server/).
    // In production, Caddy reverse_proxies the same paths — same-origin in both.
    proxy: {
      '/api': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
    },
  },
  // Prefer .ts/.tsx over .js/.jsx so stale shadow files never shadow real source.
  resolve: {
    extensions: ['.mjs', '.mts', '.ts', '.tsx', '.jsx', '.js', '.json'],
  },
});
