import axios from 'axios';

export interface GSCQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCMetrics {
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
  topQueries: GSCQuery[];
  topPages: GSCPage[];
  lastUpdated: string;
}

export class GSCClient {
  private accessToken: string | null = null;
  private siteUrl: string;

  constructor(siteUrl = 'https://automatizawpp.com') {
    this.siteUrl = siteUrl;
  }

  /**
   * Obtém token de acesso do Google OAuth
   * Em produção, isso seria gerenciado via refresh token persistido no DB
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    // Para demonstração, usar token environment variable
    // Em produção: renovar via refresh token do DB
    const token = process.env.GOOGLE_GSC_ACCESS_TOKEN;
    if (!token) {
      throw new Error('GOOGLE_GSC_ACCESS_TOKEN not configured');
    }

    this.accessToken = token;
    return token;
  }

  /**
   * Busca dados de Search Console da API do Google
   */
  async fetchMetrics(days: number = 28): Promise<GSCMetrics> {
    const token = await this.getAccessToken();
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const baseUrl = 'https://www.googleapis.com/webmasters/v3/sites';

    try {
      // Buscar dados agregados
      const response = await axios.post(
        `${baseUrl}/${encodeURIComponent(this.siteUrl)}/searchAnalytics/query`,
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query'],
          rowLimit: 10,
          startRow: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const topQueries: GSCQuery[] = (response.data.rows || []).map(
        (row: any) => ({
          query: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        })
      );

      // Buscar dados por página
      const pagesResponse = await axios.post(
        `${baseUrl}/${encodeURIComponent(this.siteUrl)}/searchAnalytics/query`,
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['page'],
          rowLimit: 10,
          startRow: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const topPages: GSCPage[] = (pagesResponse.data.rows || []).map(
        (row: any) => ({
          page: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        })
      );

      // Calcular aggregados
      const totalClicks = topQueries.reduce((sum, q) => sum + q.clicks, 0);
      const totalImpressions = topQueries.reduce((sum, q) => sum + q.impressions, 0);
      const averageCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      const averagePosition =
        topQueries.length > 0
          ? topQueries.reduce((sum, q) => sum + q.position, 0) / topQueries.length
          : 0;

      return {
        totalClicks,
        totalImpressions,
        averageCTR,
        averagePosition,
        topQueries,
        topPages,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('GSC API error:', error.response?.data || error.message);
      throw new Error(`Falha ao buscar métricas GSC: ${error.message}`);
    }
  }

  /**
   * Monitora se há queda no índice
   */
  async checkIndexationStatus(): Promise<{
    isHealthy: boolean;
    indexedPages: number;
    excludedPages: number;
    errorPages: number;
    warnings: string[];
  }> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.siteUrl)}/sitemaps`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const sitemaps = response.data.sitemap || [];
      const indexedPages = sitemaps.reduce((sum: number, s: any) => sum + (s.contents?.[0]?.indexed || 0), 0);
      const excludedPages = sitemaps.reduce((sum: number, s: any) => sum + (s.contents?.[0]?.excluded || 0), 0);
      const errorPages = sitemaps.reduce((sum: number, s: any) => sum + (s.contents?.[0]?.errors || 0), 0);

      const warnings: string[] = [];
      if (errorPages > 0) warnings.push(`${errorPages} páginas com erros`);
      if (excludedPages > indexedPages / 2) warnings.push('Muitas páginas excluídas da indexação');

      return {
        isHealthy: errorPages === 0 && warnings.length === 0,
        indexedPages,
        excludedPages,
        errorPages,
        warnings,
      };
    } catch (error: any) {
      console.error('Indexation check error:', error);
      return {
        isHealthy: false,
        indexedPages: 0,
        excludedPages: 0,
        errorPages: 0,
        warnings: ['Erro ao buscar status de indexação'],
      };
    }
  }

  /**
   * Submete sitemap para indexação
   */
  async submitSitemap(sitemapUrl: string): Promise<boolean> {
    const token = await this.getAccessToken();

    try {
      await axios.post(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.siteUrl)}/sitemaps`,
        {
          feedpath: sitemapUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return true;
    } catch (error: any) {
      console.error('Sitemap submission error:', error);
      return false;
    }
  }
}

export const gscClient = new GSCClient();
