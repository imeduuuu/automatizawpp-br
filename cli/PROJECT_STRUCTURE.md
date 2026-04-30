# Deploy AutomatizaWPP - Project Structure

## Directory Layout

```
cli/
├── bin/
│   └── cli.js                      # Entry point (executable)
├── lib/
│   ├── logger.js                   # Logging utilities
│   ├── args.js                     # CLI argument parsing
│   ├── deployer.js                 # Main orchestrator
│   ├── platform-detector.js        # Auto-detect platform
│   ├── deploy-vercel.js            # Vercel deployment
│   ├── deploy-docker.js            # Docker deployment
│   ├── meta-tag-validator.js       # SEO meta tag validation
│   └── google-search-console.js    # GSC integration
├── package.json                    # NPM package configuration
├── .npmignore                      # Files to exclude from npm package
├── .env.example                    # Environment variables template
├── README.md                       # Main documentation
├── QUICK_START.md                  # 5-minute setup guide
├── INSTALL.md                      # Installation methods
├── SETUP.md                        # Complete setup guide
├── EXAMPLES.md                     # Usage examples and CI/CD
├── test-deploy.sh                  # Test script
└── PROJECT_STRUCTURE.md            # This file
```

## File Descriptions

### bin/cli.js (755 bytes)
**Entry point for the CLI tool**
- Parses command-line arguments
- Initializes logger with verbose/debug modes
- Orchestrates deployment flow
- Handles errors and exit codes
- Made executable with `#!/usr/bin/env node` shebang

**Key responsibilities:**
- Load and parse CLI args
- Create Deployer instance
- Execute deploy() method
- Handle success/failure

### lib/logger.js (712 bytes)
**Logging and output formatting**
- Colored output (green, yellow, red, cyan)
- Info, success, warn, error, debug methods
- Progress step counter `[1/5]` format
- Timestamps on all messages
- Verbose mode control

### lib/args.js (1626 bytes)
**CLI argument parser**
- Parses flags: `--verbose`, `--help`, `--version`
- Supports options: `--platform <name>`, `--env <env>`
- Falls back to environment variables
- Shows help and version information
- Default values for all arguments

### lib/deployer.js (3279 bytes)
**Main orchestration engine**
- Coordinates 5-step deployment process:
  1. Detect platform
  2. Execute platform-specific deploy
  3. Validate meta tags
  4. Register with Google Search Console
  5. Generate deployment report
- Error handling and recovery
- Report generation and saving

### lib/platform-detector.js (2969 bytes)
**Auto-detects deployment platform**
- Checks environment variable first
- Auto-detects based on project files:
  - Vercel: `vercel.json`, `next.config.js`
  - Docker: `Dockerfile`, `docker-compose.yml`
  - AWS: `.aws/config`, AWS env variables
- Returns platform configuration with:
  - type, name, command, URL pattern
- Fallback to Vercel if no match

### lib/deploy-vercel.js (1578 bytes)
**Vercel deployment handler**
- Verifies Vercel CLI is installed
- Executes `vercel deploy --prod`
- Extracts deployment URL from output
- Implements rollback capability
- Requires VERCEL_TOKEN environment variable

### lib/deploy-docker.js (2727 bytes)
**Docker deployment handler**
- Verifies Docker is installed
- Builds image: `docker-compose build --no-cache`
- Manages containers: `docker-compose up/down`
- Waits for service health check
- Polls health endpoint until ready
- Implements rollback capability

### lib/meta-tag-validator.js (2029 bytes)
**SEO meta tag validation**
- Fetches deployed site
- Checks for required meta tags:
  - charset
  - viewport
  - description
  - og:title, og:description, og:url
- Returns found/missing tags
- Logs validation results

### lib/google-search-console.js (3864 bytes)
**Google Search Console integration**
- Loads credentials from:
  - `GOOGLE_CREDENTIALS_FILE` (path to JSON)
  - `GOOGLE_CREDENTIALS_JSON` (inline JSON)
- Obtains OAuth2 access token
- Registers site with GSC
- Submits sitemap (optional)
- Handles 409 (already registered) gracefully

### package.json (485 bytes)
**NPM package manifest**
- Package name: `deploy-automatizawpp`
- Version: 1.0.0
- Bin entry: `deploy-automatizawpp` → `./bin/cli.js`
- Files: only includes `bin/` and `lib/` directories
- Zero external dependencies
- Node.js 18+ requirement

### .npmignore (209 bytes)
**Exclude files from npm package**
- Development: test files, shell scripts
- IDE: .vscode, .idea files
- OS: .DS_Store, Thumbs.db
- Optional: .env files, git metadata

### .env.example (959 bytes)
**Environment variables template**
- DEPLOY_PLATFORM (auto/vercel/docker/aws)
- NODE_ENV (production/staging/development)
- VERCEL_TOKEN
- GOOGLE_CREDENTIALS_FILE or JSON
- SERVICE_HOST / SERVICE_PORT (Docker)
- DATABASE_URL
- DEBUG/VERBOSE flags

### README.md (6781 bytes)
**Main documentation**
- Feature list
- Quick start examples
- Supported platforms
- Deployment flow explanation
- Meta tag validation details
- GSC integration guide
- Installation methods
- Environment variables reference
- Troubleshooting guide
- Project structure
- No dependencies statement
- License and author

### QUICK_START.md (1500 bytes)
**5-minute setup guide**
- 3-step quick installation
- Platform-specific setup (Vercel/Docker/GSC)
- Common commands
- Basic troubleshooting
- Next steps

### INSTALL.md (3516 bytes)
**Installation methods**
- Method 1: Global NPM installation
- Method 2: NPX (no install required)
- Method 3: Local project installation
- Requirements for each platform
- Quick start tutorial
- Environment variables guide
- Troubleshooting section
- Uninstallation instructions

### SETUP.md (7239 bytes)
**Complete setup guide**
- Step-by-step installation
- Environment variable configuration
- Platform-specific setup:
  - Vercel CLI + authentication
  - Google Cloud + credentials
  - Docker Desktop + docker-compose
- Meta tags in HTML
- Next.js Head component example
- CI/CD integration:
  - GitHub Actions workflow
  - GitLab CI configuration
- Verification steps
- Troubleshooting guide

### EXAMPLES.md (9476 bytes)
**Comprehensive usage examples**
- Basic usage patterns
- Platform-specific examples
- Environment-specific deployments
- CI/CD integration:
  - GitHub Actions
  - GitLab CI (simple & multi-env)
- Docker Compose examples
- Advanced examples with features
- Health checks and rollback
- Monitoring and logging
- Email notifications
- Troubleshooting commands
- Reference commands

### test-deploy.sh (5065 bytes)
**Automated test script**
- Checks Node.js version (18+)
- Verifies CLI entry point
- Checks all required modules
- Validates package.json
- Checks documentation files
- Tests CLI syntax
- Verifies version command
- Checks for external dependencies
- Syntax check all JavaScript files
- Verifies file permissions
- Tests module imports
- Complete test report

## Key Features

### Zero External Dependencies
Uses only Node.js built-in modules:
- `child_process` - Run shell commands
- `fs` / `fs/promises` - File operations
- `url` - Parse URLs
- Native `fetch` - HTTP requests

### Auto Platform Detection
Detects which platform to deploy to:
1. Check DEPLOY_PLATFORM env var
2. Look for project files (vercel.json, Dockerfile, .aws/config)
3. Check environment variables
4. Fallback to Vercel

### Complete Deployment Workflow
1. **Detect** → Identify platform
2. **Deploy** → Execute platform-specific deployment
3. **Validate** → Check meta tags
4. **Register** → Submit to Google Search Console
5. **Report** → Generate deployment report JSON

### Comprehensive Documentation
- README: Overview and quick reference
- QUICK_START: 5-minute setup
- INSTALL: Installation methods
- SETUP: Complete step-by-step guide
- EXAMPLES: Real-world usage patterns
- This file: Architecture and structure

## Installation

```bash
# Global installation (recommended)
npm install -g deploy-automatizawpp

# Or use via npx (no installation)
npx deploy-automatizawpp

# Or install locally in project
npm install --save-dev deploy-automatizawpp
```

## Usage

```bash
# Basic deployment
deploy-automatizawpp

# With verbose output
deploy-automatizawpp --verbose

# Specific platform
deploy-automatizawpp --platform vercel

# Custom environment
NODE_ENV=staging deploy-automatizawpp --verbose
```

## Total Package Size

- Uncompressed: ~50 KB
- NPM package: ~30 KB (excludes node_modules)
- No external dependencies = lean installation

## Version History

- **1.0.0** (2026-04-30) - Initial release with Vercel and Docker support

## License

MIT - Free to use and modify

## Author

Eduardo Silva - Antigravity / AutomatizaWPP
