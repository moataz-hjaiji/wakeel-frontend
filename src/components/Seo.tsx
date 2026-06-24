import { useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import {
  LANDING_LANGS,
  bcp47For,
  ogLocaleFor,
  pathForLang,
  type Lang,
} from '../i18n/translations';

/* ─────────────────────────────────────────────────────────────────────────
   <Seo> — drives the document <head> per active language for the landing page.
   A SPA ships one static index.html, so without this every language would share
   the same English <title>/description and search engines would index only one.
   Here we set, reactively on language change:
     • <title> and <meta name="description">         (per-language)
     • <link rel="canonical">                        (the active locale's URL)
     • <link rel="alternate" hreflang="…">           (every locale + x-default)
     • Open Graph / Twitter title, description, url, locale + alternates
   The prerender step (scripts/prerender) bakes the EN/FR/AR results into static
   HTML so crawlers see them without running JS.
   ───────────────────────────────────────────────────────────────────────── */

// Absolute site origin for canonical/OG/hreflang. Override per-deploy with
// VITE_SITE_URL; the placeholder is replaced at prerender time as well.
const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://wakeel.tn'
).replace(/\/$/, '');

const absUrl = (path: string) => `${SITE_URL}${path === '/' ? '' : path}` || SITE_URL;

/** Create or update a <meta>/<link> identified by a stable data-seo key. */
function upsert(
  tag: 'meta' | 'link',
  key: string,
  attrs: Record<string, string>,
) {
  let el = document.head.querySelector<HTMLElement>(`${tag}[data-seo="${key}"]`);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute('data-seo', key);
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

export function Seo() {
  const { lang, t } = useI18n();

  useEffect(() => {
    const title = t('seo.title');
    const description = t('seo.description');
    const ogTitle = t('seo.ogTitle');
    const ogDescription = t('seo.ogDescription');
    const canonical = absUrl(pathForLang(lang));
    const ogImage = absUrl('/og-card.jpg');

    document.title = title;

    upsert('meta', 'description', { name: 'description', content: description });
    upsert('link', 'canonical', { rel: 'canonical', href: canonical });

    // hreflang alternates — one per locale, plus x-default → English root.
    for (const l of LANDING_LANGS) {
      upsert('link', `alt-${l}`, {
        rel: 'alternate',
        hreflang: bcp47For(l),
        href: absUrl(pathForLang(l)),
      });
    }
    upsert('link', 'alt-xdefault', {
      rel: 'alternate',
      hreflang: 'x-default',
      href: absUrl('/'),
    });

    // Open Graph + Twitter.
    upsert('meta', 'og:title', { property: 'og:title', content: ogTitle });
    upsert('meta', 'og:description', {
      property: 'og:description',
      content: ogDescription,
    });
    upsert('meta', 'og:url', { property: 'og:url', content: canonical });
    upsert('meta', 'og:image', { property: 'og:image', content: ogImage });
    upsert('meta', 'og:locale', {
      property: 'og:locale',
      content: ogLocaleFor(lang),
    });
    for (const l of LANDING_LANGS.filter((x) => x !== lang)) {
      upsert('meta', `og:locale:alt-${l}`, {
        property: 'og:locale:alternate',
        content: ogLocaleFor(l),
      });
    }
    upsert('meta', 'tw:title', { name: 'twitter:title', content: ogTitle });
    upsert('meta', 'tw:description', {
      name: 'twitter:description',
      content: ogDescription,
    });
    upsert('meta', 'tw:image', { name: 'twitter:image', content: ogImage });

    // <html lang>/dir are handled by I18nProvider; nothing to do here.
  }, [lang, t]);

  return null;
}

/** Exposed for the prerender script so it stays in sync with the locale list. */
export type { Lang };
