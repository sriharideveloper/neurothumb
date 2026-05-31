/* components/Results.jsx */
'use client';

import { useAuth } from '@/app/AuthContext';
import { motion } from 'framer-motion';
import styles from './Results.module.scss';

export default function Results({ data, onReset }) {
  const { imageUrl, heatmap, metrics, advice } = data;
  const { user } = useAuth();

  const heatmapSrc = typeof heatmap === 'string'
    ? (heatmap.startsWith('data:image') ? heatmap : `data:image/png;base64,${heatmap}`)
    : '';

  const metricCards = [
    {
      name: 'Visual Cortex Mean',
      key: 'visual_mean',
      max: 1.5,
      desc: 'Average stimulus response in the primary visual mapping system (V1-V4).'
    },
    {
      name: 'Attention Control',
      key: 'attention_control_mean',
      max: 1.5,
      desc: 'Activation in attention networks (FEF, LIP). Higher indicates heavy capture.'
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
      desc: 'Activation in reading & semantic comprehension nodes.'
    }
  ];

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <button className={styles.brand} onClick={onReset}>
            <span className={styles.logoMark}>🥐</span>
            <span>Crossaint Labs</span>
          </button>
          <div className={styles.navActions}>
            {user && (
              <button 
                onClick={() => window.location.href = '/?view=gallery'}
                className={styles.secondaryBtn}
              >
                History
              </button>
            )}
            <button className={styles.primaryBtn} onClick={onReset}>
              Analyze Another
            </button>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <motion.div 
          className={styles.adviceSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.adviceHeader}>
            <span className={styles.kicker}>AI Strategy Audit</span>
            <h2>Creative Recommendations</h2>
          </div>
          <div className={styles.adviceContent}>
            <p>{advice}</p>
          </div>
        </motion.div>

        <div className={styles.visualGrid}>
          <motion.div 
            className={styles.mediaCard}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.cardHeader}>
              <span className={styles.label}>Original Thumbnail</span>
            </div>
            <div className={styles.imageWrapper}>
              <img src={imageUrl} alt="Original" />
            </div>
          </motion.div>

          <motion.div 
            className={styles.mediaCard}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.cardHeader}>
              <span className={styles.label}>Attention Heatmap</span>
            </div>
            <div className={styles.imageWrapper}>
              {heatmapSrc ? (
                <img src={heatmapSrc} alt="Heatmap" />
              ) : (
                <div className={styles.emptyState}>Heatmap processing...</div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.section 
          className={styles.metricsSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.kicker}>Neuroscience Data</span>
            <h2>Cognitive Metrics</h2>
          </div>
          <div className={styles.metricsGrid}>
            {metricCards.map((m, i) => {
              const rawVal = metrics[m.key] || 0;
              const percentage = Math.min(100, Math.max(5, (rawVal / m.max) * 100));

              return (
                <div className={styles.metricCard} key={m.name}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricName}>{m.name}</span>
                    <span className={styles.metricValue}>{rawVal.toFixed(3)}</span>
                  </div>
                  <div className={styles.progressContainer}>
                    <motion.div 
                      className={styles.progressBar} 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <p className={styles.metricDesc}>{m.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.section>
      </main>
    </div>
  );
}
