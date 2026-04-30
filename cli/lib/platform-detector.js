import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';

export class PlatformDetector {
  constructor(logger) {
    this.logger = logger;
  }

  async detect() {
    // Check environment variable first
    const envPlatform = process.env.DEPLOY_PLATFORM;
    if (envPlatform && envPlatform !== 'auto') {
      return this.getPlatformConfig(envPlatform);
    }

    // Auto-detect based on available files and tools
    if (this.isVercelProject()) {
      return this.getPlatformConfig('vercel');
    }

    if (this.isDockerProject()) {
      return this.getPlatformConfig('docker');
    }

    if (this.hasAwsConfig()) {
      return this.getPlatformConfig('aws');
    }

    // Default fallback
    this.logger.warn('Could not auto-detect platform, defaulting to Vercel');
    return this.getPlatformConfig('vercel');
  }

  isVercelProject() {
    // Check for vercel.json config
    if (existsSync('./vercel.json')) {
      this.logger.debug('Found vercel.json');
      return true;
    }

    // Check for Next.js with potential Vercel deployment
    if (existsSync('./next.config.js') || existsSync('./next.config.ts')) {
      this.logger.debug('Found Next.js config');
      return true;
    }

    return false;
  }

  isDockerProject() {
    if (existsSync('./Dockerfile')) {
      this.logger.debug('Found Dockerfile');
      return true;
    }

    if (existsSync('./docker-compose.yml') || existsSync('./docker-compose.yaml')) {
      this.logger.debug('Found docker-compose.yml');
      return true;
    }

    return false;
  }

  hasAwsConfig() {
    if (existsSync('./.aws/config') || existsSync('./.env.aws')) {
      this.logger.debug('Found AWS config');
      return true;
    }

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.logger.debug('Found AWS credentials in environment');
      return true;
    }

    return false;
  }

  getPlatformConfig(platform) {
    const configs = {
      vercel: {
        type: 'vercel',
        name: 'Vercel',
        command: 'vercel deploy --prod',
        urlPattern: /https:\/\/[a-z0-9-]+\.vercel\.app/,
      },
      docker: {
        type: 'docker',
        name: 'Docker',
        command: 'docker-compose up -d',
        urlPattern: /http:\/\/localhost:\d+/,
      },
      aws: {
        type: 'aws',
        name: 'AWS',
        command: 'aws deploy push --application-name AutomatizaWPP',
        urlPattern: /https:\/\/[a-z0-9-]+\.elasticbeanstalk\.com/,
      },
    };

    if (!configs[platform]) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    return configs[platform];
  }

  getDeploymentInfo() {
    const osType = process.platform; // 'darwin', 'linux', 'win32'
    const nodeVersion = process.version;
    const timestamp = new Date().toISOString();

    return {
      os: osType,
      nodeVersion,
      timestamp,
      workingDirectory: process.cwd(),
    };
  }
}
