import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

/* Shared Wakeel primitives — derive everything from design tokens (index.css).
   See wakeel-design/references/components.md. Tuned for a compact density. */

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ── Button ──────────────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-medium ' +
  'transition-colors duration-150 focus-visible:outline-none ' +
  'focus-visible:ring-[3px] focus-visible:ring-brand-ring ' +
  'disabled:opacity-60 disabled:pointer-events-none active:scale-[0.98]';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary:
    'bg-surface text-text border border-border hover:bg-surface-muted',
  ghost: 'text-text-muted hover:bg-surface-muted',
  danger: 'bg-danger text-white hover:opacity-90',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-[13px]',
  md: 'h-9 px-3.5 text-[13px]',
  lg: 'h-10 px-4 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── Card ────────────────────────────────────────────────────────────────── */

export function Card({
  className,
  children,
  interactive = false,
}: {
  className?: string;
  children: ReactNode;
  interactive?: boolean;
}) {
  return (
    <div
      className={cx(
        'rounded-[14px] border border-border bg-surface p-4 shadow-[var(--shadow-sm)]',
        interactive && 'transition-shadow hover:shadow-[var(--shadow-md)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── Badge ───────────────────────────────────────────────────────────────── */

type BadgeTone = 'brand' | 'warning' | 'danger' | 'info' | 'neutral';

const badgeTones: Record<BadgeTone, string> = {
  brand: 'bg-brand-soft text-brand',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-muted text-text-muted',
};

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ── Status dot ──────────────────────────────────────────────────────────── */

export function StatusDot({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-text-muted">
      <span
        className={cx(
          'inline-block h-2 w-2 rounded-full',
          active ? 'bg-brand' : 'bg-text-subtle',
        )}
      />
      {label}
    </span>
  );
}

/* ── Stat tile ───────────────────────────────────────────────────────────── */

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1.5 text-[22px] font-semibold leading-none text-text">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-text-subtle">{hint}</p>}
    </Card>
  );
}

/* ── Form: Input, Select, Field, PageHeader ──────────────────────────────── */

const fieldBase =
  'w-full rounded-[10px] border border-border bg-surface px-3 text-[13px] text-text ' +
  'placeholder:text-text-subtle transition-colors focus-visible:outline-none ' +
  'focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand-ring ' +
  'disabled:opacity-60';

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldBase, 'h-9', className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(fieldBase, 'h-9', className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-text-muted">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-text-subtle">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-bold text-text">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
