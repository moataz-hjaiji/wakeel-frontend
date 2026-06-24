import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { ApiError } from '../lib/api';
import { Button, Field, Input } from '../components/ui/primitives';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';

type AuthMode = 'login' | 'signup';

export function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { t } = useI18n();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isSignup) await register({ name, email, password });
      else await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setError('');
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Left panel — branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-brand p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-white/15 text-sm font-bold">
            و
          </span>
          <span className="font-display text-lg font-bold">Wakeel</span>
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight">
            Your WhatsApp
            <br />
            answers itself.
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/80">
            Connect your number and your agent replies to customers in their own
            language — and hands off to you when needed.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[13px] text-white/75">
            <span className="rounded-full bg-white/10 px-2.5 py-1">Derja</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1">Français</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1">العربية</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1">English</span>
          </div>
        </div>
        <p className="text-[13px] text-white/60">© 2026 Wakeel</p>
      </div>

      {/* Right panel — form */}
      <div className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="absolute end-6 top-6">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-xs font-bold text-white">
              و
            </span>
            <span className="font-display text-base font-bold text-text">Wakeel</span>
          </div>

          <h2 className="font-display text-xl font-bold text-text">
            {isSignup ? t('auth.createAccount') : t('auth.welcomeBack')}
          </h2>
          <p className="mt-1 text-[13px] text-text-muted">
            {isSignup
              ? 'Set up your business and connect WhatsApp.'
              : 'Sign in to your agent dashboard.'}
          </p>

          {/* Mode tabs */}
          <div className="mt-5 flex rounded-[10px] bg-surface-muted p-1">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-md py-1.5 text-[13px] font-medium transition-colors ${
                  mode === m
                    ? 'bg-surface text-text shadow-[var(--shadow-sm)]'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {m === 'login' ? t('auth.signIn') : t('auth.signUp')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            {isSignup && (
              <Field label={t('auth.businessName')} htmlFor="name">
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Store"
                />
              </Field>
            )}

            <Field label={t('auth.email')} htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@store.com"
              />
            </Field>

            <Field
              label={t('auth.password')}
              htmlFor="password"
              hint={isSignup ? 'Minimum 6 characters' : undefined}
            >
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <div className="rounded-[10px] bg-danger-soft px-3 py-2 text-[13px] text-danger">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? 'Please wait…'
                : isSignup
                  ? t('auth.createAccount')
                  : t('auth.signIn')}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-text-subtle">
            Platform admin?{' '}
            <Link to="/admin/login" className="font-medium text-brand hover:underline">
              Admin console
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
