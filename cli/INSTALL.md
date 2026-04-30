# Deploy AutomatizaWPP - Installation Guide

## Installation Methods

### Method 1: Global NPM Installation (Recommended)

```bash
npm install -g deploy-automatizawpp
```

Then use anywhere:
```bash
deploy-automatizawpp
deploy-automatizawpp --verbose
deploy-automatizawpp --platform docker --env production
```

### Method 2: NPX (No Installation Required)

```bash
npx deploy-automatizawpp
npx deploy-automatizawpp --verbose
npx deploy-automatizawpp --platform vercel
```

### Method 3: Local Installation (Project-specific)

```bash
npm install --save-dev deploy-automatizawpp
```

Then use with npm scripts:
```json
{
  "scripts": {
    "deploy": "deploy-automatizawpp",
    "deploy:prod": "deploy-automatizawpp --env production",
    "deploy:docker": "deploy-automatizawpp --platform docker"
  }
}
```

Or run directly:
```bash
npx deploy-automatizawpp
```

## Requirements

- Node.js >= 18.0.0
- npm or yarn package manager

### Platform-Specific Requirements

**For Vercel Deployment:**
- Vercel CLI: `npm install -g vercel`
- Vercel API token: `export VERCEL_TOKEN=your_token`

**For Docker Deployment:**
- Docker: https://www.docker.com/products/docker-desktop
- docker-compose.yml in project root
- Docker daemon running

**For Google Search Console Integration:**
- Google credentials file or environment variable
- Either: `export GOOGLE_CREDENTIALS_FILE=/path/to/credentials.json`
- Or: `export GOOGLE_CREDENTIALS_JSON='{"client_id":"...","client_secret":"..."}'`

## Quick Start

1. **Install globally:**
   ```bash
   npm install -g deploy-automatizawpp
   ```

2. **Set required environment variables:**
   ```bash
   export VERCEL_TOKEN=your_vercel_token
   export GOOGLE_CREDENTIALS_FILE=./google-creds.json
   ```

3. **Run deployment:**
   ```bash
   deploy-automatizawpp --verbose
   ```

## Environment Variables

```bash
# Deployment platform (auto, vercel, docker, aws)
export DEPLOY_PLATFORM=auto

# Node environment
export NODE_ENV=production

# Vercel deployment
export VERCEL_TOKEN=your_token

# Google Search Console
export GOOGLE_CREDENTIALS_FILE=/path/to/credentials.json
# OR
export GOOGLE_CREDENTIALS_JSON='{"client_id":"...","client_secret":"..."}'

# Service host and port (for Docker)
export SERVICE_HOST=localhost
export SERVICE_PORT=3000

# Debug mode
export DEBUG=true
```

## Troubleshooting

### "Vercel CLI not found"
```bash
npm install -g vercel
vercel login
```

### "Docker not found"
Install Docker Desktop from https://www.docker.com/products/docker-desktop

### "Google credentials not found"
Set up Google Cloud credentials:
1. Go to Google Cloud Console
2. Create service account
3. Download JSON credentials
4. Set environment variable: `export GOOGLE_CREDENTIALS_FILE=/path/to/creds.json`

### Deployment timeout
Increase timeout or check service logs:
```bash
deploy-automatizawpp --verbose
export DEBUG=true
deploy-automatizawpp
```

## Configuration

### Global Configuration File (Optional)

Create `.deploy-automatizawpprc.json`:
```json
{
  "platform": "vercel",
  "env": "production",
  "vercelToken": "your_token",
  "googleCredentialsFile": "./google-creds.json",
  "serviceHost": "localhost",
  "servicePort": 3000,
  "timeout": 30000,
  "verbose": true
}
```

## Uninstallation

```bash
# Global uninstall
npm uninstall -g deploy-automatizawpp

# Project uninstall
npm uninstall deploy-automatizawpp
```

## Support

For issues or questions:
- Check logs with `--verbose` flag
- Set `DEBUG=true` for detailed output
- Review deployment report JSON file
