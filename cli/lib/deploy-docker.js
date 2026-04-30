import { execSync } from 'child_process';
import { existsSync } from 'fs';

export class DeployDocker {
  constructor(logger) {
    this.logger = logger;
  }

  async deploy() {
    this.logger.info('Starting Docker deployment...');

    try {
      // Check if docker is installed
      this.logger.debug('Checking for Docker...');
      try {
        execSync('docker --version', { stdio: 'pipe' });
      } catch {
        throw new Error('Docker not found. Install from: https://www.docker.com/products/docker-desktop');
      }

      // Check for docker-compose
      const hasCompose = existsSync('./docker-compose.yml') || existsSync('./docker-compose.yaml');
      
      if (!hasCompose) {
        throw new Error('docker-compose.yml not found in project root');
      }

      // Build image
      this.logger.info('Building Docker image...');
      execSync('docker-compose build --no-cache', { stdio: 'inherit' });

      // Stop running containers
      this.logger.info('Stopping existing containers...');
      try {
        execSync('docker-compose down', { stdio: 'inherit' });
      } catch {
        // Container might not be running
      }

      // Start containers
      this.logger.info('Starting Docker containers...');
      execSync('docker-compose up -d', { stdio: 'inherit' });

      // Wait for service to be ready
      this.logger.info('Waiting for service to be ready...');
      await this.waitForService();

      const url = this.getServiceURL();
      this.logger.info(`Docker deployment successful: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(`Docker deployment failed: ${error.message}`);
      throw error;
    }
  }

  async waitForService(maxAttempts = 30, delayMs = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch('http://localhost:3000/api/health', { timeout: 5000 });
        if (response.ok) {
          this.logger.info('Service is healthy');
          return true;
        }
      } catch {
        // Service not ready yet
      }

      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    this.logger.warn('Service health check timed out');
    return false;
  }

  getServiceURL() {
    const host = process.env.SERVICE_HOST || 'localhost';
    const port = process.env.SERVICE_PORT || '3000';
    return `http://${host}:${port}`;
  }

  async rollback() {
    this.logger.warn('Rolling back Docker deployment...');
    try {
      execSync('docker-compose down', { stdio: 'inherit' });
      this.logger.info('Rollback completed');
    } catch (error) {
      this.logger.error(`Rollback failed: ${error.message}`);
    }
  }
}
