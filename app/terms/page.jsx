import Link from 'next/link';
import styles from '../privacy/privacy.module.scss';

export const metadata = {
  title: 'Terms and Conditions',
  description:
    'Croissant terms for using thumbnail analysis, account history, Croissant AI Assistant outputs, and generated attention artifacts.',
  alternates: {
    canonical: '/terms',
  },
};

const sections = [
  {
    title: 'Using Croissant',
    body: [
      "Croissant provides thumbnail intelligence, attention maps, cognitive metrics, and Croissant AI Assistant outputs for creative decision support. The service is not a guarantee of views, revenue, platform ranking, or campaign performance.",
      "You are responsible for the thumbnails, channel information, and other materials you upload or submit. Only upload content you own, control, or are authorized to evaluate.",
    ],
  },
  {
    title: 'Accounts and Ownership',
    body: [
      "Signed-in analyses are associated with the authenticated user id returned by the platform's auth system. Do not attempt to access, modify, or claim another user's analyses.",
      "You are responsible for keeping your sign-in methods secure. Croissant may restrict or suspend access for abuse, attempted bypassing, automated scraping, or unsafe use.",
    ],
  },
  {
    title: 'Analysis Artifacts and Study Use',
    body: [
      'Uploaded thumbnails, generated attention maps, brain maps, metrics, derived labels, and model outputs are product analysis artifacts. Croissant may use these artifacts in a privacy-conscious way for research, benchmarking, product improvement, abuse prevention, and model training or evaluation.',
      'Do not upload sensitive personal information, confidential client assets, unreleased campaign material, or third-party content unless you have permission and are comfortable with processing under these terms and the privacy policy.',
    ],
  },
  {
    title: 'Availability and Results',
    body: [
      "Croissant depends on hosting, storage, AI, and inference infrastructure. We work to make processing durable and recoverable, but we do not promise uninterrupted service or perfect outputs.",
      "Creative recommendations are informational. Your team should apply professional judgment before publishing, spending media budget, or making brand decisions.",
    ],
  },
  {
    title: 'Commercial Terms',
    body: [
      'Free trials, credits, and pricing may change as Croissant evolves. Paid plans, if enabled, are governed by the checkout terms shown at purchase and any applicable subscription rules.',
      'Croissant may update these terms as the product matures. Continued use after updates means you accept the revised terms.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>Croissant</Link>
        <div className={styles.navLinks}>
          <Link href="/privacy" className={styles.backLink}>Privacy</Link>
          <Link href="/" className={styles.backLink}>Back to analyzer</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <p className={styles.kicker}>Terms and conditions</p>
        <h1>Clear rules for frontier creative analysis.</h1>
        <p>
          These terms explain how Croissant should be used, what you are responsible for,
          and how generated analysis artifacts may help improve the product.
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
        <Link href="/privacy">Privacy policy</Link>
      </footer>
    </main>
  );
}
