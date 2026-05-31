import Link from 'next/link';
import styles from '../privacy/privacy.module.scss';

export const metadata = {
  title: 'Terms and Conditions',
  description:
    'Crossaint Labs terms for using thumbnail analysis, account history, and generated attention artifacts.',
  alternates: {
    canonical: '/terms',
  },
};

const sections = [
  {
    title: 'Using Crossaint Labs',
    body: [
      "Crossaint Labs provides thumbnail intelligence, attention maps, and cognitive metrics for creative decision support. The service is not a guarantee of platform performance.",
      "You are responsible for the thumbnails and materials you upload. Only upload content you own or are authorized to evaluate.",
    ],
  },
  {
    title: 'Accounts and Ownership',
    body: [
      "Signed-in analyses are associated with your authenticated account. Do not attempt to access or claim another user's data.",
      "You are responsible for account security. Crossaint Labs may restrict access for abuse, scraping, or unsafe use.",
    ],
  },
  {
    title: 'Analysis Artifacts',
    body: [
      'Uploaded thumbnails, generated attention maps, and metrics are product analysis artifacts. Crossaint Labs may use these for research and product improvement.',
      'Do not upload sensitive personal information or confidential client assets unless you are comfortable with processing under these terms.',
    ],
  },
  {
    title: 'Availability and Results',
    body: [
      "Crossaint Labs depends on AI and inference infrastructure. We strive for durability but do not promise uninterrupted service or perfect outputs.",
      "Creative recommendations are informational. Apply professional judgment before making brand decisions.",
    ],
  },
  {
    title: 'Commercial Terms',
    body: [
      'Pricing and free trials may change as the product evolves. Paid plans are governed by checkout terms.',
      'Crossaint Labs may update these terms. Continued use means you accept the revised terms.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logoMark}>🥐</span>
            <span>Crossaint Labs</span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="/privacy" className={styles.secondaryBtn}>Privacy</Link>
            <Link href="/" className={styles.secondaryBtn}>Back to Analyzer</Link>
          </div>
        </div>
      </nav>

      <header className={styles.hero}>
        <span className={styles.kicker}>Terms and conditions</span>
        <h1>Rules for creative analysis.</h1>
        <p>
          These terms explain how Crossaint Labs should be used, what you are responsible for,
          and how generated analysis artifacts help improve the product.
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
