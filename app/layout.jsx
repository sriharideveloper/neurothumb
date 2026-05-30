/* app/layout.jsx */
import { Analytics } from '@vercel/analytics/next';
import './globals.scss';
import Providers from './providers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://croissant.ai';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Croissant - Meta Frontier Neuro Thumbnail Intelligence',
    template: '%s | Croissant',
  },
  description:
    "Croissant makes Meta's frontier neuro model usable for creators, studios, agencies, and brand teams. Upload a thumbnail and get attention maps, cognitive metrics, and Croissant's AI Assistant in minutes.",
  applicationName: 'Croissant',
  keywords: [
    'Croissant',
    'thumbnail analysis',
    "Meta frontier neuro model",
    'YouTube CTR',
    'attention heatmap',
    'neuroscience marketing',
    'creator analytics',
    'brand creative testing',
  ],
  authors: [{ name: 'Croissant Technologies' }],
  creator: 'Croissant Technologies',
  publisher: 'Croissant Technologies',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Croissant - Frontier attention modeling for thumbnails',
    description:
      "Run Meta frontier neuro thumbnail analysis from a polished browser workflow. Attention maps, cognitive metrics, Croissant's AI Assistant, and saved analysis history.",
    url: '/',
    siteName: 'Croissant',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Croissant thumbnail intelligence dashboard preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Croissant - Meta Frontier Neuro Thumbnail Intelligence',
    description:
      "Attention maps and Croissant's AI Assistant for YouTube thumbnails, built for creators, studios, agencies, and brand teams.",
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
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
