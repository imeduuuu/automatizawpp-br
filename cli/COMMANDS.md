# Deploy AutomatizaWPP - Command Reference

## Installation Commands

```bash
# Global installation
npm install -g deploy-automatizawpp

# Local project installation
npm install --save-dev deploy-automatizawpp

# Install from GitHub
npm install -g https://github.com/user/deploy-automatizawpp

# Update to latest
npm install -g deploy-automatizawpp@latest

# View installed version
deploy-automatizawpp --version

# Uninstall
npm uninstall -g deploy-automatizawpp
```

## Basic Usage

```bash
# Simple deployment (auto-detect platform)
deploy-automatizawpp

# With verbose output
deploy-automatizawpp --verbose

# Show help
deploy-automatizawpp --help

# Show version
deploy-automatizawpp --version
```

## Platform Selection

```bash
# Auto-detect (default)
deploy-automatizawpp --platform auto

# Vercel
deploy-automatizawpp --platform vercel

# Docker
deploy-automatizawpp --platform docker

# AWS
deploy-automatizawpp --platform aws
```

## Environment Configuration

```bash
# Production
NODE_ENV=production deploy-automatizawpp

# Staging
NODE_ENV=staging deploy-automatizawpp

# Development
NODE_ENV=development deploy-automatizawpp

# Set platform via environment
DEPLOY_PLATFORM=vercel deploy-automatizawpp
```

## Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Create API token
vercel token create

# Set token
export VERCEL_TOKEN=your_token_here

# Deploy with Vercel
deploy-automatizawpp --platform vercel --verbose

# Check Vercel deployments
vercel ls

# Rollback Vercel deployment
vercel rollback
```

## Docker Deployment

```bash
# Build and deploy
deploy-automatizawpp --platform docker

# View running containers
docker ps

# Check logs
docker-compose logs -f

# Stop containers
docker-compose down

# Start containers
docker-compose up -d

# Rebuild and deploy
docker-compose build --no-cache && docker-compose up -d
```

## Google Search Console Setup

```bash
# View credentials
cat ./google-creds.json | jq .

# Test credentials
curl -X POST https://oauth2.googleapis.com/token \
  -d @credentials.json

# Deploy with GSC
GOOGLE_CREDENTIALS_FILE=./google-creds.json deploy-automatizawpp
```

## Environment Variables

```bash
# Set single variable
export VERCEL_TOKEN=your_token

# Set from .env file
source .env
deploy-automatizawpp

# Load and deploy in one command
VERCEL_TOKEN=xyz deploy-automatizawpp

# Debug mode
DEBUG=true deploy-automatizawpp

# Verbose with debug
DEBUG=true deploy-automatizawpp --verbose
```

## Meta Tag Validation

```bash
# Deploy and check meta tags
deploy-automatizawpp --verbose

# Manually check deployment
curl https://your-deployment-url | grep '<meta'

# Validate specific meta tag
curl https://your-deployment-url | grep 'og:title'
```

## Deployment Reports

```bash
# List all reports
ls -lh deployment-report-*.json

# View latest report
cat deployment-report-$(ls -t deployment-report-*.json | head -1 | sed 's/.*-\(.*\)\.json/\1/').json

# View report in JSON format
cat deployment-report-*.json | jq .

# Check deployment URL from report
cat deployment-report-*.json | jq '.url'
```

## CI/CD Integration

### GitHub Actions
```bash
# Create workflow file
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'YAMLEOF'
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm install -g deploy-automatizawpp
      - run: deploy-automatizawpp --verbose
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
YAMLEOF
```

### GitLab CI
```bash
# Create CI/CD file
cat > .gitlab-ci.yml << 'YAMLEOF'
deploy:
  image: node:18
  script:
    - npm ci
    - npm run build
    - npm install -g deploy-automatizawpp
    - deploy-automatizawpp --verbose
  only:
    - main
YAMLEOF
```

## Testing

```bash
# Test syntax
node -c bin/cli.js

# Test help
deploy-automatizawpp --help

# Test version
deploy-automatizawpp --version

# Test import
node -e "import('./lib/deployer.js')"

# Run test script
bash test-deploy.sh

# Test with dry-run
DEBUG=true deploy-automatizawpp
```

## Debugging

```bash
# Enable debug output
DEBUG=true deploy-automatizawpp --verbose

# Check environment variables
env | grep -E "DEPLOY|VERCEL|GOOGLE"

# List Node.js modules
node -e "console.log(require.resolve('path'))"

# Check platform detection
DEBUG=true deploy-automatizawpp --platform auto

# View detailed logs
deploy-automatizawpp --verbose 2>&1 | tee deployment.log
```

## Package Management

```bash
# Install locally for development
npm install

# Link for local testing
npm link

# Test linked package
deploy-automatizawpp

# Unlink package
npm unlink

# Install for production
npm install --production

# List installed packages
npm list -g deploy-automatizawpp
```

## Configuration Files

```bash
# Create .env file
cp .env.example .env

# Edit configuration
nano .env

# Load environment
source .env

# Verify variables
echo $VERCEL_TOKEN
echo $GOOGLE_CREDENTIALS_FILE
```

## NPM Registry

```bash
# View package on npm
npm view deploy-automatizawpp

# Search npm
npm search deploy-automatizawpp

# Show download stats
npm stats deploy-automatizawpp

# List versions
npm view deploy-automatizawpp versions

# Install specific version
npm install -g deploy-automatizawpp@1.0.0
```

## Error Handling

```bash
# Run with error output
deploy-automatizawpp 2>&1

# Capture errors to file
deploy-automatizawpp > deploy.log 2>&1

# Check exit code
deploy-automatizawpp
echo $?  # 0 = success, 1 = failure

# Continue on error
deploy-automatizawpp || true
```

## Monitoring

```bash
# Watch deployment logs
tail -f deployment.log

# Monitor in real-time
watch 'ls -lh deployment-report-*.json'

# Check service health
curl http://localhost:3000/api/health

# Monitor with interval
while true; do
  deploy-automatizawpp --verbose
  sleep 3600  # Hourly
done
```

## Cleanup

```bash
# Remove old reports
rm deployment-report-*.json

# Clean Docker
docker system prune -a

# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules
npm install
```

## Chaining Commands

```bash
# Install and deploy
npm install -g deploy-automatizawpp && deploy-automatizawpp

# Build then deploy
npm run build && deploy-automatizawpp --verbose

# Test then deploy
npm test && deploy-automatizawpp

# Deploy with notification
deploy-automatizawpp && echo "Success!" || echo "Failed!"
```

## Shell Scripts

```bash
#!/bin/bash
# deploy.sh

# Set variables
export VERCEL_TOKEN=your_token
export NODE_ENV=production

# Run deployment
deploy-automatizawpp --verbose

# Check result
if [ $? -eq 0 ]; then
  echo "Deployment successful!"
  # Send notification
else
  echo "Deployment failed!"
  exit 1
fi
```

## One-Liners

```bash
# Deploy with timestamp
deploy-automatizawpp --verbose | sed 's/^/[$(date)] /'

# Deploy and save report
deploy-automatizawpp && cat deployment-report-*.json

# Deploy all platforms
for p in vercel docker; do deploy-automatizawpp --platform $p; done

# Deploy with retry
for i in {1..3}; do deploy-automatizawpp && break || sleep 10; done
```

## Reference

| Command | Purpose |
|---------|---------|
| `deploy-automatizawpp` | Basic deployment |
| `deploy-automatizawpp --verbose` | With detailed output |
| `deploy-automatizawpp --help` | Show help |
| `deploy-automatizawpp --version` | Show version |
| `deploy-automatizawpp --platform vercel` | Vercel deployment |
| `deploy-automatizawpp --platform docker` | Docker deployment |
| `NODE_ENV=production deploy-automatizawpp` | Production mode |
| `DEBUG=true deploy-automatizawpp` | Debug mode |

---

For more information, see:
- README.md - Full documentation
- QUICK_START.md - 5-minute setup
- EXAMPLES.md - Usage examples
