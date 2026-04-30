# Deploy AutomatizaWPP CLI

Zero-dependency Node.js CLI tool for automated deployment of AutomatizaWPP platform with automatic platform detection, meta tag validation, and Google Search Console registration.

## Features

- **Auto Platform Detection**: Automatically detects Vercel, Docker, or AWS based on project files
- **One Command Deployment**: `npx deploy-automatizawpp` handles everything
- **Meta Tag Validation**: Verifies OpenGraph and SEO meta tags post-deployment
- **Google Search Console Integration**: Auto-registers site with GSC
- **Zero Dependencies**: No external npm packages required
- **Global Installation**: Install once, use everywhere with `npx`
- **Cross-Platform**: Works on macOS, Linux, and Windows

## Quick Start

### Using NPX (No Installation)
```bash
npx deploy-automatizawpp
```

### Global Installation
```bash
npm install -g deploy-automatizawpp
deploy-automatizawpp
```

### With Verbose Output
```bash
npx deploy-automatizawpp --verbose
```

## Usage

### Basic Deployment
```bash
# Auto-detect platform and deploy
npx deploy-automatizawpp

# Specify platform explicitly
npx deploy-automatizawpp --platform vercel
npx deploy-automatizawpp --platform docker

# Production environment
npx deploy-automatizawpp --env production
```

### Options
```
-v, --verbose              Show detailed output and debug info
-h, --help                 Show help message
--version                  Show version number
--platform <name>          Set platform (vercel, docker, aws, auto)
--env <env>                Set environment (production, staging, development)
```

### Examples
```bash
# Verbose Vercel deployment
npx deploy-automatizawpp --platform vercel --verbose

# Docker deployment with production env
deploy-automatizawpp --platform docker --env production

# After global installation
deploy-automatizawpp --verbose --env production
```

## Supported Platforms

### Vercel
- Requires: Vercel CLI + VERCEL_TOKEN
- Auto-detected: `vercel.json` or `next.config.js`
- Command: `vercel deploy --prod`

### Docker
- Requires: Docker + docker-compose.yml
- Auto-detected: `Dockerfile` or `docker-compose.yml`
- Command: `docker-compose up -d`

### AWS (Coming Soon)
- Requires: AWS CLI + credentials
- Auto-detected: `.aws/config` or AWS env vars

## Deployment Flow

The CLI executes these steps automatically:

1. **Detect Platform** - Analyzes project structure
2. **Deploy Application** - Executes platform-specific deployment
3. **Validate Meta Tags** - Checks OpenGraph and SEO tags
4. **Register with GSC** - Submits site to Google Search Console
5. **Generate Report** - Creates deployment report JSON

## Environment Variables

```bash
# Set deployment platform
export DEPLOY_PLATFORM=vercel          # or: docker, aws, auto

# Production environment
export NODE_ENV=production

# Vercel deployment
export VERCEL_TOKEN=your_token_here

# Google Search Console (choose one)
export GOOGLE_CREDENTIALS_FILE=/path/to/credentials.json
export GOOGLE_CREDENTIALS_JSON='{"client_id":"...","client_secret":"..."}'

# Docker service config
export SERVICE_HOST=localhost
export SERVICE_PORT=3000

# Debug output
export DEBUG=true
```

## Output Example

```
[INFO] 2026-04-30T10:15:23.456Z - Starting AutomatizaWPP Deploy CLI
[INFO] 2026-04-30T10:15:23.456Z - Environment: production
[1/5] Detecting platform...
[INFO] 2026-04-30T10:15:23.567Z - Detected platform: Vercel (vercel)
[2/5] Deploying to Vercel...
[INFO] 2026-04-30T10:15:45.234Z - Deployment URL: https://automatizawpp.vercel.app
[3/5] Validating meta tags...
[INFO] 2026-04-30T10:15:47.123Z - Meta tags validated successfully
[4/5] Registering with Google Search Console...
[INFO] 2026-04-30T10:15:48.456Z - Registered with Google Search Console
[5/5] Finalizing deployment...
[SUCCESS] 2026-04-30T10:15:48.789Z - Deployment completed successfully!
```

## Meta Tag Validation

The CLI checks for:
- `<meta charset="utf-8">`
- `<meta name="viewport">`
- `<meta name="description">`
- `<meta property="og:title">`
- `<meta property="og:description">`
- `<meta property="og:url">`

## Google Search Console Integration

Requires Google credentials with `webmasters` API access:

1. Create Google Cloud Project
2. Enable Google Search Console API
3. Create Service Account
4. Download JSON key
5. Set `GOOGLE_CREDENTIALS_FILE` environment variable

Alternatively, pass credentials via `GOOGLE_CREDENTIALS_JSON`:
```bash
export GOOGLE_CREDENTIALS_JSON='{"type":"service_account","project_id":"...","private_key":"..."}'
```

## Troubleshooting

### Vercel Deployment Fails
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Set token
export VERCEL_TOKEN=$(vercel token list | grep token)
```

### Docker Deployment Fails
```bash
# Ensure Docker is running
docker ps

# Check docker-compose.yml exists
ls -la docker-compose.yml

# Test docker-compose manually
docker-compose build
docker-compose up -d
```

### Meta Tags Not Found
```bash
# Run with verbose to see HTTP response
npx deploy-automatizawpp --verbose

# Check your HTML template has proper meta tags
grep -E '<meta\s+(name|property)' pages/index.html
```

### GSC Registration Fails
```bash
# Debug credentials
export GOOGLE_CREDENTIALS_FILE=/path/to/creds.json
export DEBUG=true
npx deploy-automatizawpp --verbose
```

## Installation

### Global (Recommended)
```bash
npm install -g deploy-automatizawpp
```

### Project-local
```bash
npm install --save-dev deploy-automatizawpp
npx deploy-automatizawpp
```

### From NPX (Zero Install)
```bash
npx deploy-automatizawpp
```

## Requirements

- **Node.js** >= 18.0.0
- **npm** or **yarn**

### Platform Requirements
- **Vercel**: Vercel CLI + API token
- **Docker**: Docker Desktop + docker-compose.yml
- **Google Search Console**: OAuth2 credentials

## Project Structure

```
cli/
├── bin/
│   └── cli.js                    # Entry point
├── lib/
│   ├── args.js                   # CLI argument parsing
│   ├── deployer.js               # Main deployment orchestrator
│   ├── deploy-vercel.js          # Vercel deployment
│   ├── deploy-docker.js          # Docker deployment
│   ├── platform-detector.js      # Platform auto-detection
│   ├── meta-tag-validator.js    # Meta tag validation
│   ├── google-search-console.js # GSC integration
│   └── logger.js                 # Logging utilities
├── package.json
├── README.md
└── INSTALL.md
```

## No External Dependencies

This CLI uses only Node.js built-in modules:
- `child_process` - Execute commands
- `fs` / `fs/promises` - File operations
- `url` - URL parsing
- Native `fetch` - HTTP requests (Node.js 18+)

## License

MIT

## Author

Eduardo Silva - Antigravity / AutomatizaWPP
