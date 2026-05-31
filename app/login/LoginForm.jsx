'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/app/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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
        setMessage('Check your email for the confirmation link.');
        setMode('signin');
        event.currentTarget.reset();
      } else {
        await signIn(email, password);
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logoMark}>🥐</span>
            <span>Crossaint Labs</span>
          </Link>
          <Link href="/" className={styles.backLink}>Back to Analyzer</Link>
        </div>
      </nav>

      <section className={styles.shell}>
        <motion.div 
          className={styles.copy}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={styles.kicker}>Account Access</span>
          <h1>Save your analysis history.</h1>
          <p>
            Sign in to keep long-running analyses recoverable and build a clean history for your production reviews.
          </p>
        </motion.div>

        <motion.div 
          className={styles.formCard}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.tabs}>
            <button
              type="button"
              className={mode === 'signin' ? styles.activeTab : ''}
              onClick={() => setMode('signin')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={mode === 'signup' ? styles.activeTab : ''}
              onClick={() => setMode('signup')}
            >
              Register
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div 
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={styles.inputGroup}
                >
                  <label>Full Name</label>
                  <input name="fullName" type="text" placeholder="Your name" required />
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.inputGroup}>
              <label>Email Address</label>
              <input name="email" type="email" placeholder="you@example.com" required />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <input name="password" type="password" placeholder="••••••••" required minLength={6} />
            </div>

            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.message}>{message}</p>}

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </motion.div>
      </section>
    </main>
  );
}
