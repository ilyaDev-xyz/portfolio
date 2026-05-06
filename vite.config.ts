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
const PRODUCTION_ORIGIN = 'https://ilyadev.xyz';

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

function injectBeforeHeadEnd(html: string, tag: string): string {
  return html.replace('</head>', `${tag}\n  </head>`);
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
  // SVG/WebP for og:image. Generator: _workspace/.archive/temp_scripts/.
  return `${PRODUCTION_ORIGIN}/og-image.png`;
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
  next = setMetaProperty(next, 'og:site_name', 'ilyaDev.xyz');
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
  next = replaceFirstJsonLd(next, profileJsonLd(content));
  return next;
}

function stripMarkdownAlternates(html: string): string {
  return html.replace(
    /\n\s*<link rel="alternate" type="text\/markdown" hreflang="(?:en|ru|ar)" href="[^"]+"\s*\/>/g,
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
  let next = stripMarkdownAlternates(html);
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
  const markdownLinks = LANGS.map((lang) => {
    const cfg = LANG_CONFIG[lang];
    return `<link rel="alternate" type="text/markdown" hreflang="${lang}" href="${url}${cfg.mdExt}" data-case-head />`;
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
  return injectBeforeHeadEnd(next, `    ${markdownLinks}\n    ${jsonLd}${videoBlock}`);
}

function writeMirrorFiles(files: MirrorFiles): void {
  // Slug renames leave orphan mirrors in public/cases/ — both the old and
  // new file get served, splitting agent traffic across stale URLs. Sweep
  // anything not in the canonical set before writing.
  const casesDir = resolve(PUBLIC_DIR, 'cases');
  if (existsSync(casesDir)) {
    const expected = new Set(
      Object.keys(files)
        .filter((p) => p.startsWith('cases/'))
        .map((p) => p.slice('cases/'.length)),
    );
    for (const name of readdirSync(casesDir)) {
      if (name.endsWith('.md') && !expected.has(name)) {
        unlinkSync(resolve(casesDir, name));
      }
    }
  }

  for (const [relPath, body] of Object.entries(files)) {
    const fullPath = resolve(PUBLIC_DIR, relPath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, body, 'utf8');
  }
}

/**
 * Build-time agent-mirror generator. Walks src/content/{en,ru,ar}.ts, serialises
 * every page into Markdown, writes into public/ so Caddy and Vite's static
 * server hand them out alongside the SPA.
 *   public/index.md             public/index.ru.md          public/index.ar.md
 *   public/cases/<slug>.md      public/cases/<slug>.ru.md   public/cases/<slug>.ar.md
 *   public/llms.txt             public/llms-ru.txt          public/llms-ar.txt
 *   public/llms-full.txt
 */
function agentMirrorsPlugin(): Plugin {
  // Direct-serve middleware for .md / .txt files in publicDir. Bypasses Vite's
  // static handler — needed because Vite 5.x routes .txt requests through the
  // SPA fallback (returns index.html instead of the file). Also pins
  // Content-Type with charset=utf-8 so browsers don't fall back to Windows-1252
  // and mangle Cyrillic.
  const directServe: Plugin['configureServer'] = (server) => {
    server.middlewares.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      const url = (req.url || '').split('?')[0];
      const isMd = url.endsWith('.md');
      const isTxt = url.endsWith('.txt');
      if (!isMd && !isTxt) return next();

      const filePath = resolve(PUBLIC_DIR, url.replace(/^\/+/, ''));
      // Path-traversal guard — reject anything that escapes publicDir.
      if (!filePath.startsWith(PUBLIC_DIR + '/') && filePath !== PUBLIC_DIR) {
        return next();
      }
      if (!existsSync(filePath)) return next();
      const st = statSync(filePath);
      if (!st.isFile()) return next();

      res.setHeader(
        'Content-Type',
        `text/${isMd ? 'markdown' : 'plain'}; charset=utf-8`,
      );
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
      writeMirrorFiles(generateAgentMirrors({ en, ru, ar }, PRODUCTION_ORIGIN));
    },
    configureServer(server) {
      writeMirrorFiles(generateAgentMirrors({ en, ru, ar }, PRODUCTION_ORIGIN));
      directServe(server);
    },
    configurePreviewServer(server) {
      directServe(server);
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
      if (CONTENT_SOURCE !== 'public') return;
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

export default defineConfig({
  plugins: [
    react(),
    homeHeadPlugin(),
    agentMirrorsPlugin(),
    staticCaseHeadsPlugin(),
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
