import Link from 'next/link';
import styles from './privacy.module.scss';

export const metadata = {
  title: 'Privacy Policy',
  description:
    "How Croissant handles account data, uploaded thumbnails, generated attention maps, Croissant AI Assistant outputs, and product analytics.",
  alternates: {
    canonical: '/privacy',
  },
};

const sections = [
  {
    title: 'What Croissant Processes',
    body: [
      'When you use Croissant, we may process account details such as your email address, authentication identifiers, uploaded thumbnails, generated attention maps, neuro-model metrics, Croissant AI Assistant outputs, usage events, and technical information needed to operate the service.',
      'We use this information to run analyses, keep your history available, protect the platform, improve product quality, and understand whether Croissant is reliable for creators, agencies, studios, and brand teams.',
    ],
  },
  {
    title: 'Analysis Artifacts',
    body: [
      'Uploaded thumbnails, generated brain maps, numerical attention metrics, and derived creative labels are product analysis artifacts. We do not treat those artifacts as account-identifying personal data unless they are linked to your account or contain information that applicable law treats as personal data.',
      'Croissant may use analysis artifacts in a privacy-conscious way for research, quality evaluation, model training, benchmarking, abuse prevention, and product improvement. Do not upload content you do not have rights to evaluate or content that includes sensitive personal information.',
    ],
  },
  {
    title: 'How We Protect Data',
    body: [
      'We use access controls, authenticated storage, row-level security, and service-side ownership checks to keep saved analyses associated with the correct account. Production credentials and service keys are never intentionally exposed to the browser.',
      'No system is perfectly secure, so Croissant is designed to minimize what is collected, store analysis data only for product purposes, and fail safely when external processing services are unavailable.',
    ],
  },
  {
    title: 'Third-Party Services',
    body: [
      'Croissant uses infrastructure and AI services to deliver the product, including hosting, storage, analytics, neuro-model inference, and Croissant AI Assistant generation. These providers process data only as needed to operate Croissant.',
      'Vercel Analytics may collect privacy-friendly usage information to help us understand site performance and adoption.',
    ],
  },
  {
    title: 'Your Choices',
    body: [
      'You can choose not to create an account, but signed-in accounts make it possible to save analyses and recover long-running work. You can contact Croissant to request deletion or export of account-linked analysis records where required by applicable law.',
      'If a thumbnail contains people, confidential campaign material, unreleased creative, or client assets, upload it only when you are authorized to do so.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>Croissant</Link>
        <div className={styles.navLinks}>
          <Link href="/terms" className={styles.backLink}>Terms</Link>
          <Link href="/" className={styles.backLink}>Back to analyzer</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <p className={styles.kicker}>Privacy and data use</p>
        <h1>Built for serious creative work, with clear data boundaries.</h1>
        <p>
          Croissant turns thumbnails into attention maps, metrics, and recommendations.
          This policy explains how those artifacts are handled.
        </p>
      </section>

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
        <Link href="/terms">Terms and conditions</Link>
      </footer>
    </main>
  );
}
