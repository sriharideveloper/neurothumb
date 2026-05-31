/* app/page.jsx */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ChannelAnalyzer from '@/components/ChannelAnalyzer';
import Dropzone from '@/components/Dropzone';
import Gallery from '@/components/Gallery';
import Results from '@/components/Results';
import { useAuth } from '@/app/AuthContext';
import styles from './page.module.scss';

const differentiators = [
  {
    title: 'Visual Salience',
    body: 'Ground your feedback in objective cognitive data. We measure attention control and ROI peak response instead of generic critique.',
  },
  {
    title: 'Frontier Intelligence',
    body: "Powered by TRIBE v2. Our pipeline handles neuro-model inference and heatmap rendering with cinematic precision.",
  },
  {
    title: 'Account History',
    body: 'Durable jobs. Every analysis is tied to your account, saved to history, and recoverable even if you close the tab.',
  },
  {
    title: 'Zero Lock-in',
    body: 'Fully open-source. Deploy on your own infrastructure with Modal, Supabase, and Gemini credentials.',
  },
];

const workflow = [
  'Upload a thumbnail or initiate a channel scan.',
  'Durable processing starts. Your data is secured and history is preserved.',
  "Frontier neuro-models map visual attention into high-fidelity heatmaps.",
  "AI Strategy Audit provides actionable creative decisions for your next upload.",
];

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [mode, setMode] = useState('thumbnail');
  const { user, signOut } = useAuth();

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get('view');
    if (view === 'gallery') setShowGallery(true);
  }, []);

  const handleAnalysisComplete = (data) => setAnalysisResult(data);

  const handleSelectGeneration = (gen) => {
    setAnalysisResult({
      imageUrl: gen.image_url,
      heatmap: gen.heatmap_base64,
      metrics: gen.raw_metrics,
      advice: gen.gemini_analysis,
    });
    setShowGallery(false);
  };

  if (showGallery && user) {
    return (
      <div className={styles.galleryPage}>
        <nav className={styles.nav}>
          <div className={styles.navContent}>
            <button className={styles.brand} onClick={() => setShowGallery(false)}>
              <span className={styles.logoMark}>🥐</span>
              <span>Crossaint Labs</span>
            </button>
            <button className={styles.secondaryBtn} onClick={() => setShowGallery(false)}>
              Back to Analyzer
            </button>
          </div>
        </nav>
        <Gallery onSelectGeneration={handleSelectGeneration} />
      </div>
    );
  }

  if (analysisResult) {
    return <Results data={analysisResult} onReset={() => setAnalysisResult(null)} />;
  }

  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.brand}>
            <span className={styles.logoMark}>🥐</span>
            <span>Crossaint Labs</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#analyzer">Analyzer</a>
            <a href="#features">Features</a>
            <a href="https://github.com/sriharideveloper/neurothumb" target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <div className={styles.navActions}>
            {user ? (
              <>
                <button className={styles.secondaryBtn} onClick={() => setShowGallery(true)}>History</button>
                <button className={styles.primaryBtn} onClick={signOut}>Sign Out</button>
              </>
            ) : (
              <Link href="/login" className={styles.primaryBtn}>Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      <header className={styles.hero}>
        <motion.div 
          className={styles.heroContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className={styles.kicker}>Neuroscience-Powered Intelligence</span>
          <h1>Creative decisions, <br/>backed by science.</h1>
          <p>
            Crossaint Labs makes frontier thumbnail analysis accessible. 
            Get neural heatmaps, cognitive metrics, and AI-driven CTR strategy in seconds.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryBtn} onClick={() => document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth' })}>
              Start Free Analysis
            </button>
            <a href="https://github.com/sriharideveloper/neurothumb" target="_blank" rel="noreferrer" className={styles.secondaryBtn}>
              View Source
            </a>
          </div>
        </motion.div>
      </header>

      <section className={styles.analyzerSection} id="analyzer">
        <div className={styles.container}>
          <div className={styles.analyzerHeader}>
            <h2>The Laboratory</h2>
            <p>Select your analysis mode to begin.</p>
          </div>
          
          <div className={styles.analyzerTabs}>
            <button className={mode === 'thumbnail' ? styles.active : ''} onClick={() => setMode('thumbnail')}>
              Single Thumbnail
            </button>
            <button className={mode === 'channel' ? styles.active : ''} onClick={() => setMode('channel')}>
              Channel Audit
            </button>
          </div>

          <div className={styles.analyzerWrapper}>
            {mode === 'thumbnail' ? (
              <Dropzone onAnalysisComplete={handleAnalysisComplete} showAuthPrompt={() => window.location.href = '/login'} />
            ) : (
              <ChannelAnalyzer />
            )}
          </div>
        </div>
      </section>

      <section className={styles.featuresSection} id="features">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.kicker}>The Difference</span>
            <h2>Measurable Attention</h2>
          </div>
          <div className={styles.featuresGrid}>
            {differentiators.map((feat, i) => (
              <motion.div 
                className={styles.featureCard} 
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h3>{feat.title}</h3>
                <p>{feat.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.workflowSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.kicker}>The Workflow</span>
            <h2>Simple & Sophisticated</h2>
          </div>
          <div className={styles.workflowGrid}>
            {workflow.map((step, i) => (
              <div className={styles.workflowStep} key={i}>
                <span className={styles.stepNum}>{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.brand}>
                <span className={styles.logoMark}>🥐</span>
                <span>Crossaint Labs</span>
              </div>
              <p>Meta frontier neuro thumbnail intelligence for the next generation of creators.</p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.linkGroup}>
                <h4>Product</h4>
                <a href="#analyzer">Analyzer</a>
                <a href="https://github.com/sriharideveloper/neurothumb" target="_blank" rel="noreferrer">GitHub</a>
              </div>
              <div className={styles.linkGroup}>
                <h4>Legal</h4>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2026 Crossaint Labs. Built by Srihari Muralikrishnan.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
