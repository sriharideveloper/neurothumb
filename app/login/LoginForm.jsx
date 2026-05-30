'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/app/AuthContext';
import styles from './login.module.scss';

export default function LoginForm() {
  const [mode, setMode] = useState('signin');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    const fullName = String(formData.get('fullName') || '').trim();

    try {
      if (mode === 'signup') {
        await signUp(email, password, fullName);
        setMessage('Check your email for the confirmation link, then sign in to save analyses.');
        setMode('signin');
        event.currentTarget.reset();
      } else {
        await signIn(email, password);
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <span>C.</span>
          Croissant
        </Link>
        <Link href="/" className={styles.backLink}>Back to analyzer</Link>
      </nav>

      <section className={styles.shell}>
        <div className={styles.copy}>
          <p className={styles.kicker}>Account-safe analysis</p>
          <h1>Save every thumbnail run to the right workspace.</h1>
          <p>
            Sign in to keep long-running analyses recoverable, attach Croissant AI Assistant recommendations to your user id,
            and build a clean analysis history for client and production reviews.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.tabs} role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={mode === 'signin' ? styles.activeTab : ''}
              onClick={() => {
                setMode('signin');
                setError('');
                setMessage('');
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'signup' ? styles.activeTab : ''}
              onClick={() => {
                setMode('signup');
                setError('');
                setMessage('');
              }}
            >
              Create account
            </button>
          </div>

          {mode === 'signup' && (
            <label>
              Full name
              <input name="fullName" type="text" autoComplete="name" placeholder="Your name" required />
            </label>
          )}

          <label>
            Email
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </label>

          <label>
            Password
            <input name="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="Password" required minLength={6} />
          </label>

          {error && <p className={styles.error} role="alert">{error}</p>}
          {message && <p className={styles.message} role="status">{message}</p>}

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create free account'}
          </button>
        </form>
      </section>
    </main>
  );
}
