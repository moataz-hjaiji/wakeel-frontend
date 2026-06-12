import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdminAuth } from '../../contexts/SuperAdminAuthContext';
import { ApiError } from '../../lib/api';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useSuperAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
          Super Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">Platform Console</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to view all stores and their token consumption.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Store owner?{' '}
          <a href="/auth" className="text-violet-400 hover:underline">
            Go to store dashboard
          </a>
        </p>
      </div>
    </div>
  );
}
