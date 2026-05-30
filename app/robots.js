export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://croissant.ai';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
