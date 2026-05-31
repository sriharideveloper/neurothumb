/* components/ChannelAnalyzer.jsx */
'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ChannelAnalyzer.module.scss';

function imgSrc(base64) {
  if (!base64) return '';
  return base64.startsWith('data:image') ? base64 : `data:image/png;base64,${base64}`;
}

export default function ChannelAnalyzer() {
  const [channelHandle, setChannelHandle] = useState('');
  const [totalVideos, setTotalVideos] = useState(10);
  const [daysOldMin, setDaysOldMin] = useState(14);
  const [minDurationSec, setMinDurationSec] = useState(180);
  const [playlistEnd, setPlaylistEnd] = useState(80);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const metricCards = useMemo(() => ([
    { name: 'Visual Cortex', key: 'visual_mean', max: 1.5 },
    { name: 'Attention Control', key: 'attention_control_mean', max: 1.5 },
    { name: 'Peak Cortical', key: 'peak_top_roi_score', max: 2.0 },
    { name: 'Language', key: 'language_semantic_mean', max: 1.0 },
  ]), []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLoadingStep("Fetching channel data...");

    try {
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_handle: channelHandle,
          total_videos: totalVideos,
          days_old_min: daysOldMin,
          min_duration_sec: minDurationSec,
          playlist_end: playlistEnd,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || 'Failed to analyze channel');
      setLoadingStep('Finalizing report...');
      setResult(data);
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  if (result) {
    return (
      <div className={styles.resultsWrap}>
        <div className={styles.resultsTop}>
          <div className={styles.resultsHeader}>
            <span className={styles.kicker}>YouTube Audit</span>
            <h2>{result.channel_handle || channelHandle}</h2>
            <p className={styles.resultsMeta}>{result?.results?.length || 0} videos processed</p>
          </div>
          <button className={styles.secondaryBtn} onClick={() => setResult(null)}>
            Reset
          </button>
        </div>

        {result?.correlations && (
          <motion.div 
            className={styles.corrCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.corrTitle}>Cognitive Correlations</div>
            <div className={styles.corrGrid}>
              {Object.entries(result.correlations || {}).map(([k, v]) => (
                <div key={k} className={styles.corrItem}>
                  <div className={styles.corrKey}>{k.replace(/_/g, ' ')}</div>
                  <div className={styles.corrVal}>{typeof v === 'number' ? v.toFixed(3) : '—'}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className={styles.videoGrid}>
          {(result.results || []).map((item, i) => {
            const m = item.metrics || {};
            return (
              <motion.div 
                className={styles.videoCard} 
                key={item.video_id || item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={styles.videoHeader}>
                  <div className={styles.videoTitle}>{item.title}</div>
                  <div className={styles.videoMeta}>
                    {item.selection_bucket && <span className={styles.badge}>{item.selection_bucket}</span>}
                    {typeof item.view_count === 'number' && <span>{item.view_count.toLocaleString()} views</span>}
                  </div>
                </div>

                <div className={styles.mediaRow}>
                  <div className={styles.mediaCol}>
                    <div className={styles.mediaLabel}>Thumbnail</div>
                    <div className={styles.mediaWrap}>
                      <img src={item.thumbnail_url} alt="thumbnail" />
                    </div>
                  </div>
                  <div className={styles.mediaCol}>
                    <div className={styles.mediaLabel}>Heatmap</div>
                    <div className={styles.mediaWrap}>
                      <img src={imgSrc(item.heatmap_base64)} alt="heatmap" />
                    </div>
                  </div>
                </div>

                <div className={styles.metricsGrid}>
                  {metricCards.map((mc) => {
                    const rawVal = m[mc.key] || 0;
                    const pct = Math.min(100, Math.max(5, (rawVal / mc.max) * 100));
                    return (
                      <div className={styles.metric} key={mc.key}>
                        <div className={styles.metricHeader}>
                          <span className={styles.metricName}>{mc.name}</span>
                          <span className={styles.metricVal}>{rawVal.toFixed(3)}</span>
                        </div>
                        <div className={styles.bar}>
                          <motion.div 
                            className={styles.barFill} 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3>Channel Intelligence</h3>
        <p>Audit an entire channel to discover cognitive patterns in high-performing uploads.</p>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.inputGroup}>
          <label>Channel Handle</label>
          <input
            placeholder="@veritasium"
            value={channelHandle}
            onChange={(e) => setChannelHandle(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className={styles.settingsGrid}>
          <div className={styles.inputGroup}>
            <label>Videos</label>
            <input
              type="number"
              min={1}
              max={30}
              value={totalVideos}
              onChange={(e) => setTotalVideos(Number(e.target.value))}
              disabled={isLoading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Scan Depth</label>
            <input
              type="number"
              min={10}
              max={200}
              value={playlistEnd}
              onChange={(e) => setPlaylistEnd(Number(e.target.value))}
              disabled={isLoading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Min Age (Days)</label>
            <input
              type="number"
              min={0}
              value={daysOldMin}
              onChange={(e) => setDaysOldMin(Number(e.target.value))}
              disabled={isLoading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Min Duration (Sec)</label>
            <input
              type="number"
              min={0}
              value={minDurationSec}
              onChange={(e) => setMinDurationSec(Number(e.target.value))}
              disabled={isLoading}
            />
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.primaryBtn} type="submit" disabled={isLoading}>
          {isLoading ? 'Analyzing Pipeline...' : 'Run Channel Audit'}
        </button>

        <AnimatePresence>
          {isLoading && (
            <motion.p 
              className={styles.loadingStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {loadingStep}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
