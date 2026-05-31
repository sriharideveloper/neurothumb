import Link from 'next/link';
import styles from './privacy.module.scss';

export const metadata = {
  title: 'Privacy Policy',
  description:
    "How Crossaint Labs handles account data, uploaded thumbnails, and product analytics.",
  alternates: {
    canonical: '/privacy',
  },
};

const sections = [
  {
    title: 'What Crossaint Labs Processes',
    body: [
      'When you use Crossaint Labs, we process account details such as your email address, authentication identifiers, uploaded thumbnails, generated attention maps, and neuro-model metrics.',
      'We use this information to run analyses, preserve your history, and understand product reliability for creators and agencies.',
    ],
  },
  {
    title: 'Analysis Artifacts',
    body: [
      'Uploaded thumbnails, generated brain maps, and numerical metrics are product analysis artifacts. We do not treat those artifacts as personal data unless linked to your account or required by law.',
      'Crossaint Labs may use analysis artifacts for research, quality evaluation, and product improvement. Do not upload content you do not have rights to evaluate.',
    ],
  },
  {
    title: 'Data Protection',
    body: [
      'We use access controls, authenticated storage, and service-side ownership checks to keep saved analyses associated with the correct account. Production credentials are never exposed to the browser.',
      'No system is perfectly secure, so Crossaint Labs is designed to minimize what is collected and store analysis data only for product purposes.',
    ],
  },
  {
    title: 'Third-Party Services',
    body: [
      'Crossaint Labs uses infrastructure and AI services to deliver the product, including hosting, storage, and neuro-model inference. These providers process data only as needed to operate the service.',
      'Vercel Analytics may collect usage information to help us understand site performance.',
    ],
  },
  {
    title: 'Your Choices',
    body: [
      'You can choose not to create an account, but signed-in accounts make it possible to save analyses. You can request deletion of account-linked analysis records where required by law.',
      'If a thumbnail contains sensitive material, upload it only when you are authorized to do so.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logoMark}>🥐</span>
            <span>Crossaint Labs</span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="/terms" className={styles.secondaryBtn}>Terms</Link>
            <Link href="/" className={styles.secondaryBtn}>Back to Analyzer</Link>
          </div>
        </div>
      </nav>

      <header className={styles.hero}>
        <span className={styles.kicker}>Privacy and data use</span>
        <h1>Clear data boundaries.</h1>
        <p>
          Crossaint Labs turns thumbnails into attention maps, metrics, and recommendations.
          This policy explains how those artifacts are handled.
        </p>
      </header>

      <section className={styles.content}>
        {sections.map((section) => (
          <article className={styles.section} key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
      </section>

      <footer className={styles.footer}>
        <p>Last updated May 28, 2026.</p>
        <p>© 2026 Crossaint Labs.</p>
      </footer>
    </main>
  );
}
