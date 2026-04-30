import { readFileSync } from 'fs';
import { existsSync } from 'fs';

export class GoogleSearchConsole {
  constructor(logger) {
    this.logger = logger;
    this.apiEndpoint = 'https://www.googleapis.com/webmasters/v3/sites';
  }

  async register(url) {
    this.logger.info(`Registering ${url} with Google Search Console...`);

    try {
      const credentials = this.loadCredentials();
      if (!credentials) {
        throw new Error(
          'Google credentials not found. Set GOOGLE_CREDENTIALS_FILE or GOOGLE_CREDENTIALS_JSON'
        );
      }

      const accessToken = await this.getAccessToken(credentials);
      await this.addSiteToGSC(url, accessToken);

      this.logger.info('Site registered with Google Search Console');
      return true;
    } catch (error) {
      this.logger.warn(`GSC registration failed: ${error.message}`);
      throw error;
    }
  }

  loadCredentials() {
    // Try to load from file
    const credFile = process.env.GOOGLE_CREDENTIALS_FILE;
    if (credFile && existsSync(credFile)) {
      const content = readFileSync(credFile, 'utf-8');
      return JSON.parse(content);
    }

    // Try to load from env variable
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      return JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    }

    return null;
  }

  async getAccessToken(credentials) {
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';

    const params = new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: credentials.refresh_token || credentials.private_key,
      grant_type: 'refresh_token',
    });

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        body: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      this.logger.error(`Failed to obtain Google access token: ${error.message}`);
      throw error;
    }
  }

  async addSiteToGSC(url, accessToken) {
    const siteUrl = `sc-domain:${new URL(url).hostname}`;

    try {
      const response = await fetch(`${this.apiEndpoint}/${encodeURIComponent(siteUrl)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteUrl }),
        timeout: 10000,
      });

      if (!response.ok && response.status !== 409) {
        // 409 means site already added
        throw new Error(`Failed to add site: ${response.statusText}`);
      }

      this.logger.info(`Site ${siteUrl} added to GSC`);
      return true;
    } catch (error) {
      this.logger.warn(`Failed to add site to GSC: ${error.message}`);
      throw error;
    }
  }

  async submitSitemap(url, accessToken) {
    const siteUrl = `sc-domain:${new URL(url).hostname}`;
    const sitemapUrl = `${url}/sitemap.xml`;

    try {
      const response = await fetch(
        `${this.apiEndpoint}/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (!response.ok) {
        this.logger.warn(`Failed to submit sitemap: ${response.statusText}`);
        return false;
      }

      this.logger.info('Sitemap submitted to Google Search Console');
      return true;
    } catch (error) {
      this.logger.warn(`Failed to submit sitemap: ${error.message}`);
      return false;
    }
  }
}
