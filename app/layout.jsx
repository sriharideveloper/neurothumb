/* app/layout.jsx */
import { Analytics } from '@vercel/analytics/next';
import './globals.scss';
import Providers from './providers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://crossaint.ai';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Crossaint Labs - Neuro-Thumbnail Intelligence',
    template: '%s | Crossaint Labs',
  },
  description:
    "Crossaint Labs makes frontier neuro models usable for creators, studios, and agencies. Get attention maps, cognitive metrics, and AI-driven CTR strategy in minutes.",
  applicationName: 'Crossaint Labs',
  keywords: [
    'Crossaint Labs',
    'thumbnail analysis',
    'YouTube CTR',
    'attention heatmap',
    'neuroscience marketing',
    'creator analytics',
  ],
  authors: [{ name: 'Crossaint Labs' }],
  creator: 'Crossaint Labs',
  publisher: 'Crossaint Labs',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Crossaint Labs - Frontier attention modeling for thumbnails',
    description:
      "Run frontier neuro thumbnail analysis. Attention maps, cognitive metrics, AI strategy, and saved history.",
    url: '/',
    siteName: 'Crossaint Labs',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Crossaint Labs thumbnail intelligence dashboard preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crossaint Labs - Neuro-Thumbnail Intelligence',
    description:
      "Attention maps and AI strategy for YouTube thumbnails, built for creators and agencies.",
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
