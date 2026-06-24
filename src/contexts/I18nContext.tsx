import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  dirFor,
  translations,
  type Lang,
} from '../i18n/translations';

const STORAGE_KEY = 'wakeel.lang';

interface I18nValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Lang) => void;
  /** Translate a key; interpolates {name}-style slots from `vars`. */
  t: (key: string, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function isLang(v: string | null): v is Lang {
  return v === 'fr' || v === 'en' || v === 'ar';
}

/** Read a leading locale segment from the URL path, e.g. /fr, /ar (landing). */
function langFromPath(): Lang | null {
  const seg = window.location.pathname.split('/')[1]?.toLowerCase() ?? '';
  return isLang(seg) ? seg : null;
}

function detectInitial(): Lang {
  // 1) Path locale wins on the marketing site (/fr, /ar) — it's the canonical URL.
  const fromPath = langFromPath();
  if (fromPath) return fromPath;

  // 2) ?lang= override — handy for shareable links and QA.
  const param = new URLSearchParams(window.location.search).get('lang');
  if (isLang(param)) return param;

  // 3) Returning visitor's stored choice.
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isLang(stored)) return stored;

  // 4) Browser preference, else English (landing default).
  const nav = navigator.language.slice(0, 2).toLowerCase();
  if (nav === 'ar') return 'ar';
  if (nav === 'fr') return 'fr';
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitial);

  // Drive document direction + language off the active language.
  useEffect(() => {
    const dir = dirFor(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      const dict = translations[lang];
      let str = dict[key] ?? translations.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, v);
        }
      }
      return str;
    },
    [lang],
  );

  const value = useMemo<I18nValue>(
    () => ({ lang, dir: dirFor(lang), setLang, t }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
