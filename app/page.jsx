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

const proofPoints = [
  { value: '4', label: 'Core attention signals' },
  { value: '1', label: 'Free thumbnail analysis' },
  { value: '24/7', label: 'Saved processing recovery' },
];

const differentiators = [
  {
    title: 'Not another design opinion',
    body: 'Croissant grounds feedback in visual salience, attention control, language semantics, and ROI peak response instead of generic critique.',
  },
  {
    title: 'Frontier tech, no lab required',
    body: "Upload a thumbnail and the pipeline handles storage, neuro-model inference, heatmap rendering, and Croissant's AI Assistant.",
  },
  {
    title: 'Built for accountable teams',
    body: 'Every signed-in analysis is tied to the right account, saved to history, and recoverable if a tab closes mid-run.',
  },
];

const caseStudies = [
  {
    title: 'Launch trailer thumbnail',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=900',
    tag: 'Entertainment',
    score: '0.942',
    insight: 'High ROI peak with a clear focal face and strong contrast path.',
  },
  {
    title: 'Studio product reveal',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=900',
    tag: 'Brand',
    score: '0.816',
    insight: 'Balanced language semantics and visual salience for premium positioning.',
  },
  {
    title: 'Creator growth experiment',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=900',
    tag: 'Creator',
    score: '0.867',
    insight: 'Readable headline zone with a stronger emotional trigger opportunity.',
  },
];

const workflow = [
  'Upload a thumbnail or run a channel scan.',
  'Croissant starts a durable analysis job and saves the record.',
  "Meta's frontier neuro model turns attention into heatmaps and cognitive signals.",
  "Croissant's AI Assistant turns the signals into a practical creative decision.",
];

const motionIn = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
};

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showGallery, setShowGallery] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('view') === 'gallery';
  });
  const [trialStatus, setTrialStatus] = useState({ canUseTrial: true, used: false });
  const [mode, setMode] = useState('thumbnail');
  const { user, signOut } = useAuth();

  const deviceFingerprint = useMemo(() => {
    if (typeof window === 'undefined') return 'server';
    return getDeviceFingerprint();
  }, []);

  const checkTrial = useCallback(async () => {
    try {
      const res = await fetch(`/api/analyze?action=check-trial&device=${encodeURIComponent(deviceFingerprint)}`);
      if (!res.ok) return;
      const data = await res.json();
      setTrialStatus(data);
    } catch (e) {
      setTrialStatus({ canUseTrial: true, used: false });
    }
  }, [deviceFingerprint]);

  useEffect(() => {
    let ignore = false;

    const loadTrial = async () => {
      try {
        const res = await fetch(`/api/analyze?action=check-trial&device=${encodeURIComponent(deviceFingerprint)}`);
        if (!res.ok || ignore) return;
        const data = await res.json();
        if (!ignore) setTrialStatus(data);
      } catch (e) {
        if (!ignore) setTrialStatus({ canUseTrial: true, used: false });
      }
    };

    loadTrial();
    return () => {
      ignore = true;
    };
  }, [deviceFingerprint]);

  const handleAnalysisComplete = (data) => {
    setAnalysisResult(data);
    checkTrial();
  };

  const handleSelectGeneration = (gen) => {
    setAnalysisResult({
      imageUrl: gen.image_url,
      heatmap: gen.heatmap_base64,
      metrics: gen.raw_metrics,
      advice: gen.gemini_analysis,
    });
    setShowGallery(false);
  };

  const scrollToAnalyzer = () => {
    document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (showGallery && user) {
    return (
      <div className={styles.galleryPage}>
        <nav className={styles.galleryNav}>
          <button className={styles.backBtn} onClick={() => setShowGallery(false)}>
            Back to analyzer
          </button>
        </nav>
        <Gallery onSelectGeneration={handleSelectGeneration} />
      </div>
    );
  }

  if (analysisResult) {
    return <Results data={analysisResult} onReset={() => setAnalysisResult(null)} />;
  }

  return (
    <>
      <input className={styles.themeSwitch} id="croissant-theme-switch" type="checkbox" aria-hidden="true" />
      <main className={styles.main}>
      <nav className={styles.topNav} aria-label="Primary navigation">
        <button className={styles.logoButton} onClick={scrollToAnalyzer} aria-label="Go to analyzer">
          <span className={styles.logoMark}>C.</span>
          <span>Croissant</span>
        </button>

        <div className={styles.navLinks}>
          <a href="#difference">Difference</a>
          <a href="#workflow">Workflow</a>
          <a href="#proof">Proof</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>

        <div className={styles.navActions}>
          <label className={styles.themeBtn} htmlFor="croissant-theme-switch" aria-label="Toggle color theme" role="button" tabIndex={0}>
            <span className={styles.lightLabel}>Light</span>
            <span className={styles.darkLabel}>Dark</span>
          </label>
          {user ? (
            <>
              <button className={styles.secondaryNavBtn} onClick={() => setShowGallery(true)}>
                Analyses
              </button>
              <button className={styles.signInBtn} onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <Link className={styles.signInBtn} href="/login">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <motion.section className={styles.hero} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.55 }}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Meta frontier neuro thumbnail intelligence</p>
          <h1>Creative decisions, backed by attention modeling.</h1>
          <p className={styles.heroText}>
            Croissant makes frontier thumbnail analysis usable for creators, production houses, agencies, and brand teams. Upload once, get a neural heatmap, cognitive metrics, and a practical CTR strategy audit.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryCta} onClick={scrollToAnalyzer}>
              Run free analysis
            </button>
            <Link className={styles.secondaryCta} href="/login">
              Save my analyses
            </Link>
          </div>
          <div className={styles.trialLine}>
            {user ? `Signed in as ${user.email}` : trialStatus.used ? 'Free trial used on this device. Sign in to keep analyzing.' : 'One free analysis. No credit card required.'}
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="Croissant analysis preview">
          <div className={styles.dither} aria-hidden="true">
            <span>░▒▓▒░</span>
            <span>▒░░▒▓</span>
            <span>▓▒░░▒</span>
          </div>
          <div className={styles.previewFrame}>
            <div className={styles.previewTop}>
              <span>Neuro-model run</span>
              <span>0.942 peak</span>
            </div>
            <div className={styles.previewImage}>
              <div className={styles.heatBlobOne} />
              <div className={styles.heatBlobTwo} />
              <div className={styles.thumbnailText}>NEW EPISODE</div>
            </div>
            <div className={styles.previewBars}>
              <span style={{ width: '88%' }} />
              <span style={{ width: '64%' }} />
              <span style={{ width: '76%' }} />
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section className={styles.proofStrip} aria-label="Croissant proof points" {...motionIn}>
        {proofPoints.map((item) => (
          <div className={styles.proofItem} key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </motion.section>

      <motion.section className={styles.analyzerSection} id="analyzer" {...motionIn}>
        <div className={styles.sectionIntro}>
          <p className={styles.kicker}>Use the lab</p>
          <h2>Run the analysis without needing a research team.</h2>
          <p>
            Croissant handles storage, Meta frontier neuro-model inference, AI Assistant recommendations, and saved history with account-safe processing.
          </p>
        </div>

        <div className={styles.modeTabs} role="tablist" aria-label="Analyzer mode">
          <button
            className={`${styles.tabBtn} ${mode === 'thumbnail' ? styles.tabActive : ''}`}
            onClick={() => setMode('thumbnail')}
            type="button"
          >
            Single thumbnail
          </button>
          <button
            className={`${styles.tabBtn} ${mode === 'channel' ? styles.tabActive : ''}`}
            onClick={() => setMode('channel')}
            type="button"
          >
            Channel scan
          </button>
        </div>

        <div className={styles.analyzerCard}>
          {mode === 'thumbnail' ? (
            <Dropzone
              onAnalysisComplete={handleAnalysisComplete}
              showAuthPrompt={() => {
                window.location.href = '/login';
              }}
              deviceFingerprint={deviceFingerprint}
            />
          ) : (
            <ChannelAnalyzer />
          )}
        </div>
      </motion.section>

      <motion.section className={styles.splitSection} id="difference" {...motionIn}>
        <div>
          <p className={styles.kicker}>Why Croissant is different</p>
          <h2>From thumbnail guesswork to measurable attention signals.</h2>
        </div>
        <div className={styles.diffGrid}>
          {differentiators.map((item) => (
            <article className={styles.diffCard} key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section className={styles.ethosSection} id="ethos" {...motionIn}>
        <div>
          <p className={styles.kicker}>Research ethos</p>
          <h2>Built around the idea that creative should be tested against cognition.</h2>
        </div>
        <div className={styles.ethosLinks}>
          <a href="https://aidemos.atmeta.com/tribev2" target="_blank" rel="noreferrer">
            Meta TRIBE v2 demo
          </a>
          <a href="https://ai.meta.com/research/publications/a-foundation-model-of-vision-audition-and-language-for-in-silico-neuroscience/" target="_blank" rel="noreferrer">
            Meta research publication
          </a>
        </div>
      </motion.section>

      <motion.section className={styles.workflowSection} id="workflow" {...motionIn}>
        <div className={styles.sectionIntro}>
          <p className={styles.kicker}>How it works</p>
          <h2>Durable, recoverable, and simple enough for daily creative review.</h2>
        </div>
        <div className={styles.workflowGrid}>
          {workflow.map((step, index) => (
            <div className={styles.workflowStep} key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section className={styles.caseSection} id="proof" {...motionIn}>
        <div className={styles.sectionIntro}>
          <p className={styles.kicker}>Creative intelligence</p>
          <h2>Made for teams that publish under pressure.</h2>
          <p>
            Croissant gives production, growth, and brand teams a common language for thumbnail quality before media spend or release-day momentum is on the line.
          </p>
        </div>
        <div className={styles.caseGrid}>
          {caseStudies.map((study) => (
            <article className={styles.caseCard} key={study.title}>
              <div className={styles.caseImage}>
                <Image src={study.image} alt={study.title} fill sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className={styles.caseBody}>
                <div className={styles.caseMeta}>
                  <span>{study.tag}</span>
                  <strong>{study.score}</strong>
                </div>
                <h3>{study.title}</h3>
                <p>{study.insight}</p>
              </div>
            </article>
          ))}
        </div>
      </motion.section>

      {user && (
        <section className={styles.userAnalysesSection}>
          <Gallery onSelectGeneration={handleSelectGeneration} />
        </section>
      )}

      <motion.section className={styles.ctaSection} {...motionIn}>
        <p className={styles.kicker}>Bring the frontier to publishing</p>
        <h2>One upload can change the creative conversation.</h2>
        <p>
          Use Croissant for pitch reviews, thumbnail variants, creator packaging, launch campaigns, and brand-safe creative iteration.
        </p>
        <div className={styles.heroActions}>
          <button className={styles.primaryCta} onClick={scrollToAnalyzer}>
            Analyze a thumbnail
          </button>
          {!user && (
            <Link className={styles.secondaryCta} href="/login">
              Create free account
            </Link>
          )}
        </div>
      </motion.section>

      <footer className={styles.footer}>
        <div>
          <strong>Croissant</strong>
          <p>Meta frontier neuro attention modeling made usable for modern creative teams.</p>
        </div>
        <div className={styles.footerLinks}>
          <a href="#analyzer">Analyzer</a>
          <a href="#difference">Difference</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </footer>
      </main>
    </>
  );
}

function getDeviceFingerprint() {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.deviceMemory || 0,
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i += 1) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash &= hash;
  }

  return Math.abs(hash).toString(16);
}
