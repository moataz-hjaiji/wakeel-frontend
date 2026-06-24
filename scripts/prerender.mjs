/* ─────────────────────────────────────────────────────────────────────────
   Static prerender for the marketing landing page.

   This app is a client-rendered SPA (BrowserRouter + browser-only APIs), so a
   crawler that doesn't run JS would otherwise see an empty <div id="root">.
   To make the landing indexable per language we:

     1. serve the freshly built dist/ with `vite preview`,
     2. drive headless Chrome to each locale URL (/, /fr, /ar),
     3. wait for React to render + <Seo> to populate <head>,
     4. snapshot the live DOM and write it as static HTML:
          dist/index.html      (en, default — overwrites the SPA shell)
          dist/fr/index.html
          dist/ar/index.html

   The snapshots keep the same <script>/<link> tags, so the page still hydrates
   into the full interactive SPA on real browsers — crawlers just get content +
   correct <title>/description/canonical/hreflang up front.

   Run via `npm run build` (which calls this after `vite build`). Set SITE_URL to
   bake absolute canonical/OG/hreflang URLs for the target domain.
   ───────────────────────────────────────────────────────────────────────── */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

const SITE_URL = (process.env.SITE_URL || 'https://wakeel.tn').replace(/\/$/, '');
const PORT = Number(process.env.PRERENDER_PORT || 4317);
const BASE = `http://localhost:${PORT}`;

// Locale → output file. "en" is the default and overwrites the root shell.
const ROUTES = [
  { path: '/', out: 'index.html', lang: 'en' },
  { path: '/fr', out: 'fr/index.html', lang: 'fr' },
  { path: '/ar', out: 'ar/index.html', lang: 'ar' },
];

const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Start `vite preview` and resolve once it's accepting connections. */
async function startPreview() {
  const proc = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PORT), '--strictPort'],
    { cwd: root, stdio: 'pipe' },
  );
  proc.stdout.on('data', () => {});
  proc.stderr.on('data', (d) => process.stderr.write(d));

  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return proc;
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  proc.kill('SIGTERM');
  throw new Error('vite preview did not start in time');
}

/** Render one URL in headless Chrome and return the serialized DOM. */
async function renderRoute(path) {
  const url = `${BASE}${path}`;
  // --dump-dom prints the post-JS-execution DOM. A short virtual-time budget
  // lets React mount, the Seo effect run, and fonts/layout settle.
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--virtual-time-budget=4000',
    '--run-all-compositor-stages-before-draw',
    '--dump-dom',
    url,
  ];
  return await new Promise((resolveDom, reject) => {
    const proc = spawn(CHROME, args, { stdio: ['ignore', 'pipe', 'ignore'] });
    let html = '';
    proc.stdout.on('data', (d) => (html += d.toString()));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0 && html.includes('id="root"')) resolveDom(html);
      else reject(new Error(`Chrome render failed for ${path} (exit ${code})`));
    });
  });
}

/** Rewrite the dev-only localhost origin in baked URLs to the real SITE_URL. */
function withSiteUrl(html) {
  return html.replaceAll(BASE, SITE_URL);
}

async function main() {
  // Sanity: dist must exist (vite build ran first).
  try {
    await readFile(resolve(dist, 'index.html'), 'utf8');
  } catch {
    throw new Error('dist/index.html missing — run `vite build` first.');
  }

  const preview = await startPreview();
  try {
    for (const route of ROUTES) {
      const dom = withSiteUrl(await renderRoute(route.path));
      const outPath = resolve(dist, route.out);
      await mkdir(dirname(outPath), { recursive: true });
      await writeFile(outPath, dom, 'utf8');
      // Quick visibility into what got baked.
      const title = (dom.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '?';
      const langAttr = (dom.match(/<html[^>]*\blang="([^"]+)"/i) || [])[1] || '?';
      console.log(
        `prerendered ${route.path.padEnd(4)} → dist/${route.out}  [lang=${langAttr}] ${title}`,
      );
    }
  } finally {
    preview.kill('SIGTERM');
  }

  await writeSeoFiles();
}

/** robots.txt + a hreflang-annotated sitemap so crawlers find every locale. */
async function writeSeoFiles() {
  const urls = ROUTES.map((r) => (r.path === '/' ? '/' : r.path));
  const abs = (p) => `${SITE_URL}${p === '/' ? '' : p}` || SITE_URL;
  const hreflang = { '/': 'en', '/fr': 'fr', '/ar': 'ar' };

  const entries = urls
    .map((p) => {
      const alts = urls
        .map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${hreflang[alt]}" href="${abs(alt)}"/>`,
        )
        .join('\n');
      const xdefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${abs('/')}"/>`;
      return `  <url>\n    <loc>${abs(p)}</loc>\n${alts}\n${xdefault}\n  </url>`;
    })
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;
  await writeFile(resolve(dist, 'sitemap.xml'), sitemap, 'utf8');

  const robots = `User-agent: *
Allow: /

# Keep app surfaces out of the index — they're auth-gated, not content.
Disallow: /auth
Disallow: /dashboard
Disallow: /admin

Sitemap: ${SITE_URL}/sitemap.xml
`;
  await writeFile(resolve(dist, 'robots.txt'), robots, 'utf8');
  console.log('wrote dist/sitemap.xml + dist/robots.txt');
}

main().catch((err) => {
  console.error('\nprerender failed:', err.message);
  process.exit(1);
});
