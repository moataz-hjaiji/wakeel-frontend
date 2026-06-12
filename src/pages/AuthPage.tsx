import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../lib/api';

type AuthMode = 'login' | 'signup';

export function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

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
      if (isSignup) {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
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
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-indigo-600 p-12 text-white lg:flex">
        <div>
          <span className="text-2xl font-bold tracking-tight">ChatBot</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Customer support,<br />powered by AI
          </h1>
          <p className="mt-4 text-indigo-200">
            Manage your catalog, FAQs, and chat with customers on web and WhatsApp — all from one dashboard.
          </p>
        </div>
        <p className="text-sm text-indigo-300">© 2026 ChatBot Platform</p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-50 px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="text-2xl font-bold text-indigo-600">ChatBot</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            {isSignup ? 'Create your store' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-slate-500">
            {isSignup
              ? 'Sign up to start building your chatbot'
              : 'Sign in to your store dashboard'}
          </p>

          {/* Mode tabs */}
          <div className="mt-6 flex rounded-lg bg-slate-200 p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                !isSignup
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                isSignup
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isSignup && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Store name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Store"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@store.com"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {isSignup && (
                <p className="mt-1 text-xs text-slate-500">Minimum 6 characters</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Please wait…'
                : isSignup
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Platform admin?{' '}
            <Link to="/admin/login" className="font-medium text-indigo-600 hover:underline">
              Super admin console
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
