export class Logger {
  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  }

  success(message) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${new Date().toISOString()} - ${message}`);
  }

  warn(message) {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${new Date().toISOString()} - ${message}`);
  }

  static error(message) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${new Date().toISOString()} - ${message}`);
  }

  debug(message) {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  step(step, total, message) {
    console.log(`\x1b[36m[${step}/${total}]\x1b[0m ${message}`);
  }
}
