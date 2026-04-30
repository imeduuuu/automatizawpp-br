export const parseArgs = (argv) => {
  const args = {
    verbose: false,
    help: false,
    version: false,
    platform: process.env.DEPLOY_PLATFORM || 'auto',
    env: process.env.NODE_ENV || 'production',
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--verbose':
      case '-v':
        args.verbose = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--version':
        args.version = true;
        break;
      case '--platform':
        args.platform = argv[i + 1];
        i++;
        break;
      case '--env':
        args.env = argv[i + 1];
        i++;
        break;
    }
  }

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args.version) {
    showVersion();
    process.exit(0);
  }

  return args;
};

const showHelp = () => {
  console.log(`
AutomatizaWPP Deploy CLI

Usage: npx deploy-automatizawpp [options]

Options:
  -v, --verbose         Show detailed output
  -h, --help            Show this help message
  --version             Show version number
  --platform <name>     Set platform (vercel, docker, aws, auto)
  --env <env>           Set environment (production, staging, development)

Examples:
  npx deploy-automatizawpp
  npx deploy-automatizawpp --verbose
  npx deploy-automatizawpp --platform vercel --env production
  deploy-automatizawpp --platform docker

For global installation:
  npm install -g deploy-automatizawpp
  deploy-automatizawpp
`);
};

const showVersion = () => {
  const version = '1.0.0';
  console.log(`deploy-automatizawpp version ${version}`);
};
