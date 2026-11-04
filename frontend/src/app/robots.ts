import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://krupet.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/super-admin/', '/owner/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
