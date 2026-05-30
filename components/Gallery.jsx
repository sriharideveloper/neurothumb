'use client';

import { useState, useEffect } from 'react';
import { supabase, useAuth } from '@/app/AuthContext';
import styles from './Gallery.module.scss';

export default function Gallery({ onSelectGeneration }) {
  const { user, session } = useAuth();
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGenerations = async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw new Error(fetchError.message || 'Failed to fetch generations');

      const rows = data || [];
      setGenerations(rows);

      const pendingRows = rows.filter((gen) => {
        const status = gen.raw_metrics?.status;
        return gen.session_id && ['starting_modal', 'processing', 'finalizing_gemini'].includes(status);
      });

      if (pendingRows.length > 0) {
        const headers = session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {};

        await Promise.allSettled(
          pendingRows.map((gen) =>
            fetch(`/api/analyze?action=check-status&sessionId=${encodeURIComponent(gen.session_id)}`, {
              headers,
            }),
          ),
        );

        const { data: refreshed, error: refreshError } = await supabase
          .from('generations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!refreshError) {
          setGenerations(refreshed || rows);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load your analyses');
      setGenerations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchGenerations();
    } else if (!user?.id && supabase) {
      setLoading(false);
      setGenerations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, supabase]);

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Sign In to View Your Analyses</h2>
          <p>Create an account to save and track all your thumbnail analyses</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading your analyses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error Loading Analyses</h3>
          <p>{error}</p>
          <button onClick={fetchGenerations} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>No Analyses Yet</h2>
          <p>Start by uploading your first thumbnail to get instant neuroscience-powered insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Your Analyses</h2>
        <p className={styles.headerSub}>{generations.length} thumbnail{generations.length !== 1 ? 's' : ''} analyzed - Click any to view full results</p>
      </div>
      <div className={styles.grid}>
        {generations.map((gen) => (
          <div
            key={gen.id}
            className={styles.card}
            data-generation-id={gen.id}
            onClick={() => onSelectGeneration && onSelectGeneration(gen)}
            role="button"
            tabIndex={0}
            aria-label={`Generation from ${new Date(gen.created_at).toLocaleDateString()} - Score: ${gen.raw_metrics?.peak_top_roi_score?.toFixed(3) || 'N/A'}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectGeneration && onSelectGeneration(gen);
              }
            }}
          >
            <div className={styles.imageWrapper}>
              <img 
                src={gen.image_url} 
                alt={`Thumbnail analyzed on ${new Date(gen.created_at).toLocaleDateString()}`}
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e0e0e0" width="100" height="100"/%3E%3C/svg%3E';
                }}
              />
              <div className={styles.overlay}>
                <span className={styles.viewBtn}>View</span>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.score}>
                {gen.raw_metrics?.peak_top_roi_score 
                  ? gen.raw_metrics.peak_top_roi_score.toFixed(3) 
                  : 'N/A'}
              </div>
              <div className={styles.date}>
                {new Date(gen.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
