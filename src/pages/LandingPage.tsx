import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { Seo } from '../components/Seo';
import {
  LANGS,
  isLandingLang,
  pathForLang,
  type Lang,
} from '../i18n/translations';
import logoMark from '../assets/brand/logo-mark.svg';
import heroBackdrop from '../assets/brand/hero-backdrop.webp';
import heroShop from '../assets/brand/hero-shop.webp';
import ucOrders from '../assets/brand/uc-orders.webp';
import ucBookings from '../assets/brand/uc-bookings.webp';
import ucFaq from '../assets/brand/uc-faq.webp';

/* ─────────────────────────────────────────────────────────────────────────
   Wakeel marketing landing page. Per wakeel-design/references/landing.md:
   the hero IS the bilingual self-answering WhatsApp thread; trust/control is
   the buying reason; honest pricing; plain regional copy. Fully multilingual
   (FR/EN/AR) and RTL-safe via logical properties. One orchestrated motion
   moment (the hero thread); gentle scroll reveals elsewhere.
   ───────────────────────────────────────────────────────────────────────── */

/* Keep the I18n language in sync with the URL locale segment (/fr, /ar, …).
   The landing is path-based for SEO, so the path is the source of truth here —
   navigating between locale URLs (or landing on one) sets the active language. */
function useLocaleFromPath(): Lang {
  const { pathname } = useLocation();
  const { lang, setLang } = useI18n();
  const seg = pathname.split('/')[1]?.toLowerCase() ?? '';
  const routeLang: Lang = isLandingLang(seg) ? seg : 'en'; // "/" → English

  useEffect(() => {
    if (routeLang !== lang) setLang(routeLang);
  }, [routeLang, lang, setLang]);

  return routeLang;
}

/* Small wordmark: the recolored mark + the name in the display face.
   Links to the current locale's landing root. */
function Wordmark({ home }: { home: string }) {
  return (
    <Link to={home} className="flex items-center gap-2.5 text-text" aria-label="Wakeel">
      <img src={logoMark} alt="" className="h-7 w-7 text-brand" />
      <span className="font-display text-[20px] font-bold tracking-tight">Wakeel</span>
    </Link>
  );
}

/* Path-based language switcher for the landing header. Unlike the dashboard
   switcher (localStorage), this navigates to the locale's URL so each language
   is a real, shareable, crawlable page. Mirrors correctly in RTL. */
function LandingLanguageSwitcher({ current }: { current: Lang }) {
  const navigate = useNavigate();
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

  const label = LANGS.find((l) => l.code === current)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-[10px] border border-border bg-surface px-2.5 text-[13px] font-medium text-text-muted transition-colors hover:bg-surface-muted"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Language"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3C9.5 5.5 9.5 18.5 12 21" />
        </svg>
        {label}
      </button>

      {open && (
        <div className="absolute end-0 top-11 z-40 w-40 overflow-hidden rounded-[12px] border border-border bg-surface py-1 shadow-[var(--shadow-md)]">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              dir={l.dir}
              onClick={() => {
                navigate(pathForLang(l.code));
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-[13px] transition-colors ${
                l.code === current
                  ? 'bg-brand-soft font-medium text-brand'
                  : 'text-text hover:bg-surface-muted'
              }`}
            >
              {l.label}
              {l.code === current && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Scroll-reveal wrapper — adds .is-visible when the element scrolls into view. */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`lp-reveal${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={visible ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  subtitle,
  center = true,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-brand">
        {kicker}
      </p>
      <h2 className="mt-2 font-display text-[30px] font-bold leading-tight text-text sm:text-[38px]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-[16px] leading-relaxed text-text-muted">{subtitle}</p>
      )}
    </div>
  );
}

/* ── Reusable little chat bubble used in hero + multilingual proof ────────── */
function Bubble({
  from,
  children,
  dir,
  className,
  style,
}: {
  from: 'customer' | 'agent';
  children: ReactNode;
  dir?: 'ltr' | 'rtl';
  className?: string;
  style?: CSSProperties;
}) {
  const isAgent = from === 'agent';
  return (
    <div
      className={`flex ${isAgent ? 'justify-end' : 'justify-start'} ${className ?? ''}`}
    >
      <div
        dir={dir}
        className={[
          'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-[var(--shadow-sm)]',
          isAgent
            ? 'rounded-ee-md bg-brand text-white'
            : 'rounded-es-md bg-surface-muted text-text',
        ].join(' ')}
        style={style}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Hero phone-style chat preview ────────────────────────────────────────── */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function HeroThread() {
  const { t } = useI18n();
  // Replay the typing→reply beat periodically so a returning glance still sees
  // the "answers itself" idea. Restarts by remounting via a key. Reduced-motion
  // users skip straight to the answered state (no typing beat, no loop).
  const reduce = prefersReducedMotion();
  const [cycle, setCycle] = useState(0);
  const [showReply, setShowReply] = useState(reduce);

  useEffect(() => {
    if (reduce) return;
    const reveal = setTimeout(() => setShowReply(true), 1900);
    // New cycle: hide the reply again so the typing→answer beat replays.
    const loop = setTimeout(() => {
      setShowReply(false);
      setCycle((c) => c + 1);
    }, 8000);
    return () => {
      clearTimeout(reveal);
      clearTimeout(loop);
    };
  }, [cycle, reduce]);

  return (
    <div
      key={cycle}
      className="w-[300px] rounded-[20px] border border-white/60 bg-white/80 p-3.5 shadow-[var(--shadow-lg)] backdrop-blur-md sm:w-[340px]"
    >
      {/* chat header */}
      <div className="flex items-center gap-2.5 pb-3">
        <span className="relative inline-flex">
          <img src={logoMark} alt="" className="h-9 w-9 rounded-full bg-brand-soft p-1.5" />
          <span className="lp-presence absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-text">Wakeel</p>
          <p className="truncate text-[11px] text-brand">{t('lp.hero.replyTime')}</p>
        </div>
      </div>

      {/* thread */}
      <div className="space-y-2.5">
        <Bubble from="customer" className="lp-bubble" style={{ animationDelay: '300ms' }}>
          {t('lp.hero.threadCustomer')}
        </Bubble>

        {!showReply ? (
          <div className="flex justify-end">
            <div
              className="lp-bubble inline-flex items-center gap-1 rounded-2xl rounded-ee-md bg-brand px-3.5 py-3"
              style={{ animationDelay: '900ms' }}
              aria-label={t('lp.hero.typing')}
            >
              <span className="lp-dot h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: '0ms' }} />
              <span className="lp-dot h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: '200ms' }} />
              <span className="lp-dot h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        ) : (
          <Bubble from="agent" className="lp-bubble" style={{ animationDelay: '0ms' }}>
            {t('lp.hero.threadAgent')}
          </Bubble>
        )}
      </div>
    </div>
  );
}

/* ── Icon set (inline, brand-colored) for trust + steps ───────────────────── */
const icons: Record<string, ReactNode> = {
  shield: (
    <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z M9.5 12l1.8 1.8L15 10" />
  ),
  handoff: (
    <path d="M4 11h11M11 7l4 4-4 4M20 5v14" />
  ),
  globe: (
    <path d="M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3C9.5 5.5 9.5 18.5 12 21" />
  ),
  eye: (
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 9a3 3 0 100 6 3 3 0 000-6z" />
  ),
};

function TrustCard({
  icon,
  title,
  body,
}: {
  icon: keyof typeof icons;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[16px] border border-border bg-surface p-6 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-brand-soft text-brand">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          aria-hidden
        >
          {icons[icon]}
        </svg>
      </span>
      <h3 className="mt-4 text-[16px] font-semibold text-text">{title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-text-muted">{body}</p>
    </div>
  );
}

export function LandingPage() {
  const { t, dir } = useI18n();
  const currentLang = useLocaleFromPath();
  const home = pathForLang(currentLang);
  const authHref = '/auth';

  const nav = [
    { id: 'how', label: t('lp.nav.how') },
    { id: 'trust', label: t('lp.nav.trust') },
    { id: 'use-cases', label: t('lp.nav.useCases') },
    { id: 'pricing', label: t('lp.nav.pricing') },
    { id: 'faq', label: t('lp.nav.faq') },
  ];

  return (
    <div dir={dir} className="min-h-screen bg-bg text-text">
      <Seo />
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Wordmark home={home} />
          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="text-[14px] font-medium text-text-muted transition-colors hover:text-text"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LandingLanguageSwitcher current={currentLang} />
            <Link
              to={authHref}
              className="hidden h-9 items-center rounded-[10px] px-3 text-[14px] font-medium text-text-muted transition-colors hover:bg-surface-muted sm:inline-flex"
            >
              {t('lp.nav.signIn')}
            </Link>
            <Link
              to={authHref}
              className="inline-flex h-9 items-center rounded-[10px] bg-brand px-3.5 text-[14px] font-medium text-white transition-colors hover:bg-brand-hover"
            >
              {t('lp.nav.cta')}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Bold brand backdrop — anchored to the visual side, fading into the page. */}
          <img
            src={heroBackdrop}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -top-24 end-[-10%] hidden h-[140%] w-[70%] object-cover opacity-90 lg:block"
            style={{
              maskImage:
                'radial-gradient(120% 80% at 80% 30%, #000 35%, transparent 75%)',
              WebkitMaskImage:
                'radial-gradient(120% 80% at 80% 30%, #000 35%, transparent 75%)',
            }}
          />
          {/* soft brand wash on small screens where the backdrop image is hidden */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_90%_0%,var(--color-brand-soft),transparent_60%)] lg:hidden" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 sm:pb-24 sm:pt-20 lg:grid-cols-[1fr_1.05fr]">
            {/* Left — message */}
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-[13px] font-medium text-text-muted shadow-[var(--shadow-sm)] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {t('lp.hero.badge')}
              </span>
              <h1 className="mt-5 font-display text-[40px] font-bold leading-[1.05] tracking-tight text-text sm:text-[56px]">
                {t('lp.hero.title')}
              </h1>
              <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-text-muted">
                {t('lp.hero.subtitle')}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to={authHref}
                  className="inline-flex h-12 items-center rounded-[12px] bg-brand px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(31,138,112,0.28)] transition-all hover:bg-brand-hover hover:shadow-[0_10px_28px_rgba(31,138,112,0.34)]"
                >
                  {t('lp.hero.ctaPrimary')}
                </Link>
                <a
                  href="#how"
                  className="inline-flex h-12 items-center gap-2 rounded-[12px] border border-border bg-surface px-5 text-[15px] font-medium text-text transition-colors hover:bg-surface-muted"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-brand" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {t('lp.hero.ctaSecondary')}
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
                {[t('lp.hero.trustLangs'), t('lp.hero.trustControl')].map((line) => (
                  <li key={line} className="flex items-center gap-2 text-[13.5px] text-text-muted">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0 text-brand"
                      aria-hidden
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — layered visual: real shop photo + floating live chat card + trust chip */}
            <div className="relative z-10">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-[460px]">
                {/* photo */}
                <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/50 shadow-[0_24px_60px_rgba(15,26,36,0.18)]">
                  <img
                    src={heroShop}
                    alt="A shop owner reading WhatsApp replies sent by Wakeel"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(15,26,36,0.18)] to-transparent" />
                </div>

                {/* floating live chat card */}
                <div className="absolute -bottom-6 -start-6 sm:-start-10">
                  <HeroThread />
                </div>

                {/* trust chip */}
                <div className="absolute -end-3 top-6 flex items-center gap-2 rounded-full border border-white/60 bg-white/85 px-3 py-1.5 text-[12px] font-semibold text-text shadow-[var(--shadow-md)] backdrop-blur">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {t('lp.hero.handledChip')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section id="how" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal>
              <SectionHeader
                kicker={t('lp.how.kicker')}
                title={t('lp.how.title')}
                subtitle={t('lp.how.subtitle')}
              />
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { n: '1', title: t('lp.how.s1.title'), body: t('lp.how.s1.body') },
                { n: '2', title: t('lp.how.s2.title'), body: t('lp.how.s2.body') },
                { n: '3', title: t('lp.how.s3.title'), body: t('lp.how.s3.body') },
              ].map((step, i) => (
                <Reveal key={step.n} delay={i * 90}>
                  <div className="relative rounded-[16px] border border-border bg-surface p-6 shadow-[var(--shadow-sm)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[15px] font-bold text-white">
                      {step.n}
                    </span>
                    <h3 className="mt-4 text-[17px] font-semibold text-text">{step.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-text-muted">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust & control ───────────────────────────────────────────── */}
        <section id="trust" className="border-t border-border bg-surface-muted/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal>
              <SectionHeader
                kicker={t('lp.trust.kicker')}
                title={t('lp.trust.title')}
                subtitle={t('lp.trust.subtitle')}
              />
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: 'shield', title: t('lp.trust.c1.title'), body: t('lp.trust.c1.body') },
                { icon: 'handoff', title: t('lp.trust.c2.title'), body: t('lp.trust.c2.body') },
                { icon: 'globe', title: t('lp.trust.c3.title'), body: t('lp.trust.c3.body') },
                { icon: 'eye', title: t('lp.trust.c4.title'), body: t('lp.trust.c4.body') },
              ].map((c, i) => (
                <Reveal key={c.title} delay={i * 80}>
                  <TrustCard
                    icon={c.icon as keyof typeof icons}
                    title={c.title}
                    body={c.body}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Use cases ─────────────────────────────────────────────────── */}
        <section id="use-cases" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal>
              <SectionHeader kicker={t('lp.uc.kicker')} title={t('lp.uc.title')} />
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { img: ucOrders, title: t('lp.uc.c1.title'), body: t('lp.uc.c1.body') },
                { img: ucBookings, title: t('lp.uc.c2.title'), body: t('lp.uc.c2.body') },
                { img: ucFaq, title: t('lp.uc.c3.title'), body: t('lp.uc.c3.body') },
              ].map((c, i) => (
                <Reveal key={c.title} delay={i * 90}>
                  <div className="group overflow-hidden rounded-[20px] border border-border bg-surface shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
                    <div className="flex h-44 items-center justify-center bg-[radial-gradient(120%_120%_at_50%_0%,var(--color-brand-soft),var(--color-surface))]">
                      <img
                        src={c.img}
                        alt=""
                        className="h-36 w-auto object-contain drop-shadow-[0_12px_24px_rgba(15,26,36,0.12)] transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-[17px] font-semibold text-text">{c.title}</h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-text-muted">{c.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Multilingual proof ────────────────────────────────────────── */}
        <section className="border-t border-border bg-surface-muted/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal>
              <SectionHeader
                kicker={t('lp.ml.kicker')}
                title={t('lp.ml.title')}
                subtitle={t('lp.ml.subtitle')}
              />
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { label: 'Derja', q: t('lp.ml.derja.q'), a: t('lp.ml.derja.a'), bdir: 'ltr' as const },
                { label: 'Français', q: t('lp.ml.fr.q'), a: t('lp.ml.fr.a'), bdir: 'ltr' as const },
                { label: 'العربية', q: t('lp.ml.ar.q'), a: t('lp.ml.ar.a'), bdir: 'rtl' as const },
              ].map((m, i) => (
                <Reveal key={m.label} delay={i * 90}>
                  <div className="rounded-[16px] border border-border bg-surface p-5 shadow-[var(--shadow-sm)]">
                    <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-[12px] font-medium text-text-muted">
                      {m.label}
                    </span>
                    <div className="mt-4 space-y-2.5">
                      <Bubble from="customer" dir={m.bdir}>
                        {m.q}
                      </Bubble>
                      <Bubble from="agent" dir={m.bdir}>
                        {m.a}
                      </Bubble>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <section id="pricing" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal>
              <SectionHeader
                kicker={t('lp.pricing.kicker')}
                title={t('lp.pricing.title')}
                subtitle={t('lp.pricing.subtitle')}
              />
            </Reveal>
            <div className="mt-12 grid items-start gap-6 md:grid-cols-3">
              {[
                {
                  name: t('lp.pricing.p1.name'),
                  price: t('lp.pricing.p1.price'),
                  perMonth: true,
                  desc: t('lp.pricing.p1.desc'),
                  features: [t('lp.pricing.p1.f1'), t('lp.pricing.p1.f2'), t('lp.pricing.p1.f3')],
                  cta: t('lp.pricing.p1.cta'),
                  featured: false,
                },
                {
                  name: t('lp.pricing.p2.name'),
                  price: t('lp.pricing.p2.price'),
                  perMonth: true,
                  desc: t('lp.pricing.p2.desc'),
                  features: [
                    t('lp.pricing.p2.f1'),
                    t('lp.pricing.p2.f2'),
                    t('lp.pricing.p2.f3'),
                    t('lp.pricing.p2.f4'),
                  ],
                  cta: t('lp.pricing.p2.cta'),
                  featured: true,
                },
                {
                  name: t('lp.pricing.p3.name'),
                  price: t('lp.pricing.p3.price'),
                  perMonth: false,
                  desc: t('lp.pricing.p3.desc'),
                  features: [t('lp.pricing.p3.f1'), t('lp.pricing.p3.f2'), t('lp.pricing.p3.f3')],
                  cta: t('lp.pricing.p3.cta'),
                  featured: false,
                },
              ].map((p, i) => (
                <Reveal key={p.name} delay={i * 90}>
                  <div
                    className={[
                      'relative flex h-full flex-col rounded-[16px] border bg-surface p-6',
                      p.featured
                        ? 'border-brand shadow-[var(--shadow-md)]'
                        : 'border-border shadow-[var(--shadow-sm)]',
                    ].join(' ')}
                  >
                    {p.featured && (
                      <span className="absolute -top-3 start-6 inline-flex items-center rounded-full bg-brand px-2.5 py-0.5 text-[12px] font-semibold text-white">
                        {t('lp.pricing.popular')}
                      </span>
                    )}
                    <h3 className="text-[15px] font-semibold text-text">{p.name}</h3>
                    <p className="mt-1 text-[13px] text-text-muted">{p.desc}</p>
                    <p className="mt-4 flex items-baseline gap-1.5">
                      <span className="font-display text-[32px] font-bold text-text">{p.price}</span>
                      {p.perMonth && (
                        <span className="text-[13px] text-text-subtle">{t('lp.pricing.perMonth')}</span>
                      )}
                    </p>
                    <ul className="mt-5 space-y-2.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-[14px] text-text">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                            aria-hidden
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={authHref}
                      className={[
                        'mt-6 inline-flex h-10 items-center justify-center rounded-[10px] px-4 text-[14px] font-semibold transition-colors',
                        p.featured
                          ? 'bg-brand text-white hover:bg-brand-hover'
                          : 'border border-border bg-surface text-text hover:bg-surface-muted',
                      ].join(' ')}
                    >
                      {p.cta}
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section id="faq" className="border-t border-border bg-surface-muted/40">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <Reveal>
              <SectionHeader kicker={t('lp.faq.kicker')} title={t('lp.faq.title')} />
            </Reveal>
            <div className="mt-10 divide-y divide-border overflow-hidden rounded-[16px] border border-border bg-surface">
              {[
                { q: t('lp.faq.q1'), a: t('lp.faq.a1') },
                { q: t('lp.faq.q2'), a: t('lp.faq.a2') },
                { q: t('lp.faq.q3'), a: t('lp.faq.a3') },
                { q: t('lp.faq.q4'), a: t('lp.faq.a4') },
              ].map((f, i) => (
                <details key={i} className="group px-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-text [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0 text-text-subtle transition-transform duration-150 group-open:rotate-180"
                      aria-hidden
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="pb-4 text-[14px] leading-relaxed text-text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer CTA ────────────────────────────────────────────────── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal>
              <div className="overflow-hidden rounded-[20px] border border-border bg-brand px-8 py-12 text-center shadow-[var(--shadow-md)] sm:px-12">
                <h2 className="mx-auto max-w-2xl font-display text-[28px] font-bold leading-tight text-white sm:text-[34px]">
                  {t('lp.footer.title')}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-white/85">
                  {t('lp.footer.subtitle')}
                </p>
                <Link
                  to={authHref}
                  className="mt-7 inline-flex h-11 items-center rounded-[10px] bg-white px-6 text-[15px] font-semibold text-brand transition-colors hover:bg-white/90"
                >
                  {t('lp.footer.cta')}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5 text-text">
            <img src={logoMark} alt="" className="h-6 w-6 text-brand" />
            <span className="font-display text-[16px] font-bold">Wakeel</span>
            <span className="text-[13px] text-text-subtle">— {t('lp.footer.tagline')}</span>
          </div>
          <p className="text-[13px] text-text-subtle">
            © 2026 Wakeel. {t('lp.footer.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
}
