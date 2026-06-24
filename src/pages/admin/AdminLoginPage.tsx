import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSuperAdminAuth } from '../../contexts/SuperAdminAuthContext';
import { ApiError } from '../../lib/api';
import { Button, Card, Field, Input } from '../../components/ui/primitives';

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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-xs font-bold text-white">
            و
          </span>
          <span className="font-display text-base font-bold text-text">Wakeel</span>
          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning">
            Admin
          </span>
        </div>
        <h1 className="mt-4 font-display text-xl font-bold text-text">Admin console</h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Sign in to view all stores and their token usage.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && (
            <p className="rounded-[10px] bg-danger-soft px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-text-subtle">
          Store owner?{' '}
          <Link to="/auth" className="font-medium text-brand hover:underline">
            Go to store dashboard
          </Link>
        </p>
      </Card>
    </div>
  );
}
