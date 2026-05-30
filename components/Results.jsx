/* components/Results.jsx */
'use client';

import { useAuth } from '@/app/AuthContext';
import styles from './Results.module.scss';

export default function Results({ data, onReset }) {
  const { imageUrl, heatmap, metrics, advice } = data;
  const { user } = useAuth();

  // Format base64 properly
  const heatmapSrc = typeof heatmap === 'string'
    ? (heatmap.startsWith('data:image') ? heatmap : `data:image/png;base64,${heatmap}`)
    : '';

  // Metrics configurations
  const metricCards = [
    {
      name: 'Visual Cortex Mean',
      key: 'visual_mean',
      max: 1.5,
      desc: 'Average stimulus response in the primary visual mapping system (V1-V4). Higher indicates dense visual features.'
    },
    {
      name: 'Attention Control Index',
      key: 'attention_control_mean',
      max: 1.5,
      desc: 'Activation in attention networks (FEF, LIP). Higher indicates heavy eye-tracking capture.'
    },
    {
      name: 'Peak Cortical Score',
      key: 'peak_top_roi_score',
      max: 2.0,
      desc: 'Highest single ROI trigger. Measures peak focal concentration level.'
    },
    {
      name: 'Language Processing',
      key: 'language_semantic_mean',
      max: 1.0,
      desc: 'Activation in reading & semantic comprehension nodes. High values signify readable text triggers.'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.brand}>Croissant.</div>
        <div className={styles.headerRight}>
          {user && (
            <button 
              onClick={() => window.location.href = '/?view=gallery'}
              className={styles.galleryLink}
            >
              Your Analyses
            </button>
          )}
          <button className={styles.resetBtn} onClick={onReset}>
            Analyze Another
          </button>
        </div>
      </div>

      <div className={styles.strategicAdvice}>
        <h3 className={styles.adviceHeading}>YouTube Strategist Audit</h3>
        <p className={styles.adviceText}>{advice}</p>
      </div>

      <div className={styles.visualGrid}>
        <div className={styles.mediaCard}>
          <span className={styles.label}>Uploaded Thumbnail</span>
          <div className={styles.imageWrapper}>
            <img src={imageUrl} alt="Uploaded thumbnail" />
          </div>
        </div>

        <div className={styles.mediaCard}>
          <span className={styles.label}>Meta Frontier Neuro Attention Map</span>
          <div className={styles.imageWrapper}>
            {heatmapSrc ? (
              <img src={heatmapSrc} alt="Meta frontier neuro attention map" />
            ) : (
              <div className={styles.missingHeatmap}>Heatmap unavailable.</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.metricsSection}>
        <h3 className={styles.sectionTitle}>Cognitive Metrics</h3>
        <div className={styles.metricsGrid}>
          {metricCards.map((m) => {
            const rawVal = metrics[m.key] || 0;
            // Calculate a nice looking visual percentage for the loading bar
            const percentage = Math.min(100, Math.max(5, (rawVal / m.max) * 100));

            return (
              <div className={styles.metricCard} key={m.name}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricName}>{m.name}</span>
                </div>
                <div className={styles.metricValue}>{rawVal.toFixed(3)}</div>
                <div className={styles.progressBarContainer}>
                  <div 
                    className={styles.progressBar} 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className={styles.metricDesc}>{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
