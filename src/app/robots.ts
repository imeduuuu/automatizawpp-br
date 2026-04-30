import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/automacao-whatsapp',
          '/automacao-vendas',
          '/automacao-atendimento',
          '/casos-sucesso',
          '/blog',
          '/api/public/',
        ],
        disallow: [
          '/admin',
          '/settings',
          '/auth',
          '/login',
          '/signup',
          '/reset-password',
          '/api/private',
        ],
      },
    ],
    sitemap: 'https://automatizawpp.com/sitemap.xml',
  };
}
