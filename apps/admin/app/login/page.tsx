'use client';

import { useState, useEffect, Suspense, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../src/context/auth-context';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = searchParams.get('from') || '/dashboard';

  useEffect(() => {
    if (status === 'authenticated' && user) {
      router.replace(redirectTarget);
    }
  }, [status, user, router, redirectTarget]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: trimmedEmail, password });
      router.replace(redirectTarget);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please verify your credentials and try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <p role="status">Checking authentication session...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: '420px',
        margin: '4rem auto',
        padding: '2rem',
        border: '1px solid #ccc',
        borderRadius: '6px',
        fontFamily: 'sans-serif',
      }}
    >
      <header style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1>CodedDevs Admin</h1>
        <p>Sign in to manage company website content.</p>
      </header>

      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '4px',
            fontSize: '0.9rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate={false}>
        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="admin-email"
            style={{
              display: 'block',
              marginBottom: '0.25rem',
              fontWeight: 600,
            }}
          >
            Email Address
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
            autoComplete="email"
            autoFocus
            style={{
              width: '100%',
              padding: '0.5rem',
              boxSizing: 'border-box',
              fontSize: '1rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="admin-password"
            style={{
              display: 'block',
              marginBottom: '0.25rem',
              fontWeight: 600,
            }}
          >
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '0.5rem',
              boxSizing: 'border-box',
              fontSize: '1rem',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '2rem', textAlign: 'center' }}>
          <p role="status">Loading login screen...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
