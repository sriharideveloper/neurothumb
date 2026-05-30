/* components/ChannelAnalyzer.jsx */
'use client';

import { useMemo, useState } from 'react';
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
    { name: 'Visual Cortex Mean', key: 'visual_mean', max: 1.5 },
    { name: 'Attention Control Index', key: 'attention_control_mean', max: 1.5 },
    { name: 'Peak Cortical Score', key: 'peak_top_roi_score', max: 2.0 },
    { name: 'Language Processing', key: 'language_semantic_mean', max: 1.0 },
  ]), []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLoadingStep("Pulling videos and running Meta's frontier neuro model over thumbnails...");

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
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to analyze channel');
      }
      if (data?.error) throw new Error(data.error);
      setLoadingStep('Rendering results...');
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
          <div>
            <div className={styles.kicker}>YouTube Channel</div>
            <h2 className={styles.resultsTitle}>{result.channel_handle || channelHandle}</h2>
            <p className={styles.resultsMeta}>Analyzed {result?.results?.length || 0} videos</p>
          </div>
          <button className={styles.secondaryBtn} onClick={() => setResult(null)}>
            Analyze Another
          </button>
        </div>

        {result?.correlations ? (
          <div className={styles.corrCard}>
            <div className={styles.corrTitle}>Correlation (log views → brain metrics)</div>
            <div className={styles.corrGrid}>
              {Object.entries(result.correlations || {}).map(([k, v]) => (
                <div key={k} className={styles.corrItem}>
                  <div className={styles.corrKey}>{k}</div>
                  <div className={styles.corrVal}>{typeof v === 'number' ? v.toFixed(3) : '—'}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className={styles.videoGrid}>
          {(result.results || []).map((item) => {
            const m = item.metrics || {};
            const videoUrl = item.video_id ? `https://www.youtube.com/watch?v=${item.video_id}` : null;
            return (
              <div className={styles.videoCard} key={item.video_id || item.title}>
                <div className={styles.videoHeader}>
                  <div>
                    <div className={styles.videoTitle}>{item.title}</div>
                    <div className={styles.videoMeta}>
                      {item.selection_bucket ? <span className={styles.badge}>{item.selection_bucket}</span> : null}
                      {typeof item.view_count === 'number' ? (
                        <span className={styles.views}>{item.view_count.toLocaleString()} views</span>
                      ) : null}
                      {videoUrl ? (
                        <a className={styles.videoLink} href={videoUrl} target="_blank" rel="noreferrer">
                          Open on YouTube
                        </a>
                      ) : null}
                    </div>
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
                    <div className={styles.mediaLabel}>Frontier Neuro Attention Map</div>
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
                        <div className={styles.metricName}>{mc.name}</div>
                        <div className={styles.metricVal}>{rawVal.toFixed(3)}</div>
                        <div className={styles.bar}>
                          <div className={styles.barFill} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Analyze a YouTube channel</h3>
      <p className={styles.subtitle}>
        Enter a channel handle and we’ll analyze a mix of high-view and low-view uploads.
      </p>

      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.label}>
          Channel handle
          <input
            className={styles.input}
            placeholder="@veritasium"
            value={channelHandle}
            onChange={(e) => setChannelHandle(e.target.value)}
            disabled={isLoading}
          />
        </label>

        <div className={styles.grid2}>
          <label className={styles.label}>
            # videos to analyze
            <input
              className={styles.input}
              type="number"
              min={1}
              max={30}
              value={totalVideos}
              onChange={(e) => setTotalVideos(Number(e.target.value || 10))}
              disabled={isLoading}
            />
          </label>

          <label className={styles.label}>
            Playlist scan size
            <input
              className={styles.input}
              type="number"
              min={10}
              max={200}
              value={playlistEnd}
              onChange={(e) => setPlaylistEnd(Number(e.target.value || 80))}
              disabled={isLoading}
            />
          </label>

          <label className={styles.label}>
            Min age (days)
            <input
              className={styles.input}
              type="number"
              min={0}
              max={3650}
              value={daysOldMin}
              onChange={(e) => setDaysOldMin(Number(e.target.value || 14))}
              disabled={isLoading}
            />
          </label>

          <label className={styles.label}>
            Min duration (sec)
            <input
              className={styles.input}
              type="number"
              min={0}
              max={7200}
              value={minDurationSec}
              onChange={(e) => setMinDurationSec(Number(e.target.value || 180))}
              disabled={isLoading}
            />
          </label>
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}

        <button className={styles.primaryBtn} type="submit" disabled={isLoading}>
          {isLoading ? 'Analyzing…' : 'Run Channel Analysis'}
        </button>

        {isLoading ? <p className={styles.loadingSub}>{loadingStep}</p> : null}
      </form>
    </div>
  );
}
