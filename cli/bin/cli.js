#!/usr/bin/env node

import { Deployer } from '../lib/deployer.js';
import { Logger } from '../lib/logger.js';
import { parseArgs } from '../lib/args.js';

const main = async () => {
  try {
    const args = parseArgs(process.argv.slice(2));
    const logger = new Logger(args.verbose);
    
    logger.info('Starting AutomatizaWPP Deploy CLI');
    logger.info(`Environment: ${process.env.NODE_ENV || 'production'}`);

    const deployer = new Deployer(logger);
    await deployer.deploy();

    logger.success('Deployment completed successfully!');
    process.exit(0);
  } catch (error) {
    Logger.error(`Deployment failed: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
};

main();
