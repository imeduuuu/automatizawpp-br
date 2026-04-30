import { execSync } from 'child_process';

export class DeployVercel {
  constructor(logger) {
    this.logger = logger;
  }

  async deploy() {
    this.logger.info('Starting Vercel deployment...');

    try {
      // Check if vercel CLI is installed
      this.logger.debug('Checking for Vercel CLI...');
      try {
        execSync('vercel --version', { stdio: 'pipe' });
      } catch {
        throw new Error('Vercel CLI not found. Install with: npm install -g vercel');
      }

      // Deploy to production
      this.logger.info('Deploying to Vercel production...');
      const output = execSync('vercel deploy --prod --token=$VERCEL_TOKEN 2>&1', {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });

      this.logger.debug(`Vercel output: ${output}`);

      // Extract deployment URL
      const urlMatch = output.match(/(https:\/\/[a-z0-9-]+\.vercel\.app)/);
      const url = urlMatch ? urlMatch[1] : null;

      if (!url) {
        throw new Error('Could not extract deployment URL from Vercel output');
      }

      this.logger.info(`Vercel deployment successful: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(`Vercel deployment failed: ${error.message}`);
      throw error;
    }
  }

  async rollback() {
    this.logger.warn('Rolling back Vercel deployment...');
    try {
      execSync('vercel rollback --token=$VERCEL_TOKEN 2>&1', { encoding: 'utf-8' });
      this.logger.info('Rollback completed');
    } catch (error) {
      this.logger.error(`Rollback failed: ${error.message}`);
    }
  }
}
