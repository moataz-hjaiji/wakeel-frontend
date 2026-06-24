import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { LANGS } from '../../i18n/translations';

/* Compact language switcher for the topbar. Globe + current language;
   opens a small menu. Mirrors correctly in RTL via logical properties. */
export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const current = LANGS.find((l) => l.code === lang);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-[13px] font-medium text-text-muted transition-colors hover:bg-surface-muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span aria-hidden>🌐</span>
        {current?.label}
      </button>

      {open && (
        <div className="absolute end-0 top-9 z-20 w-36 overflow-hidden rounded-[10px] border border-border bg-surface py-1 shadow-[var(--shadow-md)]">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              dir={l.dir}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-1.5 text-[13px] transition-colors ${
                l.code === lang
                  ? 'bg-brand-soft font-medium text-brand'
                  : 'text-text hover:bg-surface-muted'
              }`}
            >
              {l.label}
              {l.code === lang && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
