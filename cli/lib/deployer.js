import { PlatformDetector } from './platform-detector.js';
import { DeployVercel } from './deploy-vercel.js';
import { DeployDocker } from './deploy-docker.js';
import { MetaTagValidator } from './meta-tag-validator.js';
import { GoogleSearchConsole } from './google-search-console.js';

export class Deployer {
  constructor(logger) {
    this.logger = logger;
    this.platform = null;
    this.deploymentURL = null;
  }

  async deploy() {
    this.logger.step(1, 5, 'Detecting platform...');
    this.platform = await this.detectPlatform();

    this.logger.step(2, 5, `Deploying to ${this.platform.name}...`);
    this.deploymentURL = await this.executeDeploy();

    this.logger.step(3, 5, 'Validating meta tags...');
    await this.validateMetaTags();

    this.logger.step(4, 5, 'Registering with Google Search Console...');
    await this.registerWithGSC();

    this.logger.step(5, 5, 'Finalizing deployment...');
    await this.finalize();
  }

  async detectPlatform() {
    const detector = new PlatformDetector(this.logger);
    const platform = await detector.detect();
    this.logger.info(`Detected platform: ${platform.name} (${platform.type})`);
    this.logger.debug(`Platform details: ${JSON.stringify(platform)}`);
    return platform;
  }

  async executeDeploy() {
    let deployer;
    
    switch (this.platform.type) {
      case 'vercel':
        deployer = new DeployVercel(this.logger);
        break;
      case 'docker':
        deployer = new DeployDocker(this.logger);
        break;
      default:
        throw new Error(`Unsupported platform: ${this.platform.type}`);
    }

    const url = await deployer.deploy();
    this.logger.info(`Deployment URL: ${url}`);
    return url;
  }

  async validateMetaTags() {
    const validator = new MetaTagValidator(this.logger);
    const result = await validator.validate(this.deploymentURL);
    
    if (result.valid) {
      this.logger.info('Meta tags validated successfully');
      this.logger.debug(`Found ${result.tags.length} meta tags`);
    } else {
      this.logger.warn('Some meta tags are missing or invalid');
      result.missing.forEach(tag => {
        this.logger.warn(`  Missing: ${tag}`);
      });
    }
  }

  async registerWithGSC() {
    try {
      const gsc = new GoogleSearchConsole(this.logger);
      await gsc.register(this.deploymentURL);
      this.logger.info('Registered with Google Search Console');
    } catch (error) {
      this.logger.warn(`GSC registration failed: ${error.message}`);
      this.logger.info('You may need to manually verify the site in Search Console');
    }
  }

  async finalize() {
    this.logger.info('Generating deployment report...');
    const report = {
      timestamp: new Date().toISOString(),
      platform: this.platform,
      url: this.deploymentURL,
      status: 'deployed',
    };

    this.logger.info(`Deployment report: ${JSON.stringify(report, null, 2)}`);
    
    // Save report to file
    const reportPath = `./deployment-report-${Date.now()}.json`;
    await this.saveReport(reportPath, report);
    this.logger.info(`Report saved to ${reportPath}`);
  }

  async saveReport(path, data) {
    const fs = await import('fs/promises');
    await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
  }
}
