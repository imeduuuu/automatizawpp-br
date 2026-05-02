import { MetadataRoute } from 'next';

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{
    url: string;
    title?: string;
  }>;
  videos?: Array<{
    contentUrl: string;
    description: string;
    title?: string;
    thumbnailUrl?: string;
  }>;
}

/**
 * Gera sitemap dinâmico com todas as rotas da aplicação
 */
export class SitemapGenerator {
  private baseUrl: string;
  private today: string;

  constructor(baseUrl: string = 'https://automatizawpp.com') {
    this.baseUrl = baseUrl;
    this.today = new Date().toISOString().split('T')[0];
  }

  /**
   * Gera array de entrada do sitemap para todas as rotas
   */
  async generateSitemap(): Promise<MetadataRoute.Sitemap> {
    const entries: MetadataRoute.Sitemap = [];

    // Páginas estáticas principais
    const staticPages = [
      { path: '/', priority: 1, changeFrequency: 'weekly' as const },
      { path: '/automacao-whatsapp', priority: 1, changeFrequency: 'weekly' as const },
      { path: '/automacao-vendas', priority: 1, changeFrequency: 'weekly' as const },
      { path: '/automacao-atendimento', priority: 0.9, changeFrequency: 'weekly' as const },
      { path: '/casos-sucesso', priority: 0.9, changeFrequency: 'monthly' as const },
      { path: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
      { path: '/dashboard', priority: 0.7, changeFrequency: 'daily' as const },
      { path: '/politica-privacidade', priority: 0.5, changeFrequency: 'yearly' as const },
      { path: '/termos-servico', priority: 0.5, changeFrequency: 'yearly' as const },
      { path: '/contato', priority: 0.6, changeFrequency: 'monthly' as const },
    ];

    for (const page of staticPages) {
      entries.push({
        url: `${this.baseUrl}${page.path}`,
        lastModified: this.today,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }

    // Blog posts dinâmicos (seria obtido do DB em produção)
    const blogPosts = await this.getBlogPosts();
    for (const post of blogPosts) {
      entries.push({
        url: `${this.baseUrl}/blog/${post.slug}`,
        lastModified: post.lastModified || this.today,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    // Páginas de categorias/tags
    const categories = ['automatizar-vendas', 'whatsapp-marketing', 'crm', 'email-automation'];
    for (const category of categories) {
      entries.push({
        url: `${this.baseUrl}/blog/categoria/${category}`,
        lastModified: this.today,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }

    return entries;
  }

  /**
   * Retorna lista de blog posts (em produção, seria do DB)
   */
  private async getBlogPosts(): Promise<
    Array<{
      slug: string;
      lastModified?: string;
    }>
  > {
    // Em produção, buscar do DB via Prisma
    // Para agora, retornar posts de exemplo
    return [
      { slug: 'como-automatizar-whatsapp', lastModified: this.today },
      { slug: 'guia-automacao-vendas', lastModified: this.today },
      { slug: 'email-marketing-automatizado', lastModified: this.today },
      { slug: '10-dicas-crm', lastModified: this.today },
    ];
  }

  /**
   * Formata sitemap para XML
   */
  async generateXML(): Promise<string> {
    const entries = await this.generateSitemap();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '         xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
    xml += '         xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';

    for (const entry of entries) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXML(entry.url)}</loc>\n`;

      if (entry.lastModified) {
        xml += `    <lastmod>${entry.lastModified}</lastmod>\n`;
      }

      if (entry.changeFrequency) {
        xml += `    <changefreq>${entry.changeFrequency}</changefreq>\n`;
      }

      if (entry.priority !== undefined) {
        xml += `    <priority>${entry.priority}</priority>\n`;
      }

      // Imagens
      if (entry.images && entry.images.length > 0) {
        for (const image of entry.images) {
          xml += '    <image:image>\n';
          xml += `      <image:loc>${this.escapeXML(image.url)}</image:loc>\n`;
          if (image.title) {
            xml += `      <image:title>${this.escapeXML(image.title)}</image:title>\n`;
          }
          xml += '    </image:image>\n';
        }
      }

      // Vídeos
      if (entry.videos && entry.videos.length > 0) {
        for (const video of entry.videos) {
          xml += '    <video:video>\n';
          xml += `      <video:content_loc>${this.escapeXML(video.contentUrl)}</video:content_loc>\n`;
          xml += `      <video:title>${this.escapeXML(video.title || '')}</video:title>\n`;
          xml += `      <video:description>${this.escapeXML(video.description)}</video:description>\n`;
          if (video.thumbnailUrl) {
            xml += `      <video:thumbnail_loc>${this.escapeXML(video.thumbnailUrl)}</video:thumbnail_loc>\n`;
          }
          xml += '    </video:video>\n';
        }
      }

      xml += '  </url>\n';
    }

    xml += '</urlset>';

    return xml;
  }

  /**
   * Escapa caracteres especiais para XML
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const sitemapGenerator = new SitemapGenerator();
