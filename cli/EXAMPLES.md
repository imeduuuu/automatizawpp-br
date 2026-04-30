# Deploy AutomatizaWPP - Usage Examples

## Basic Usage

### Simplest: Just Deploy
```bash
npx deploy-automatizawpp
```

### Global Installation Then Deploy
```bash
npm install -g deploy-automatizawpp
deploy-automatizawpp
```

### Verbose Output to See All Steps
```bash
deploy-automatizawpp --verbose
```

### Show Help
```bash
deploy-automatizawpp --help
```

### Show Version
```bash
deploy-automatizawpp --version
```

## Platform-Specific Examples

### Vercel Deployment

```bash
# Auto-detect and deploy to Vercel
deploy-automatizawpp

# Explicitly specify Vercel with verbose output
deploy-automatizawpp --platform vercel --verbose

# Set Vercel token via environment
export VERCEL_TOKEN=your_token
deploy-automatizawpp --platform vercel

# Deploy to staging environment
NODE_ENV=staging deploy-automatizawpp --platform vercel
```

### Docker Deployment

```bash
# Deploy using Docker
deploy-automatizawpp --platform docker

# Docker with verbose logging
deploy-automatizawpp --platform docker --verbose

# Docker with custom service configuration
SERVICE_HOST=myserver.com SERVICE_PORT=8080 deploy-automatizawpp --platform docker
```

### AWS Deployment (Coming Soon)

```bash
# Deploy to AWS
export AWS_PROFILE=production
deploy-automatizawpp --platform aws --verbose
```

## Environment-Specific Deployments

### Production Deployment

```bash
# Using environment variable
NODE_ENV=production deploy-automatizawpp --verbose

# Or set before running
export NODE_ENV=production
export DEPLOY_PLATFORM=vercel
export VERCEL_TOKEN=your_prod_token
deploy-automatizawpp --verbose
```

### Staging Deployment

```bash
NODE_ENV=staging deploy-automatizawpp --platform vercel --verbose
```

### Development Deployment

```bash
NODE_ENV=development deploy-automatizawpp --platform docker --verbose
```

## With Environment Files

### Load from .env file

```bash
# Create .env file
cat > .env << 'ENVEOF'
DEPLOY_PLATFORM=vercel
NODE_ENV=production
VERCEL_TOKEN=your_token
GOOGLE_CREDENTIALS_FILE=./google-creds.json
DEBUG=true
ENVEOF

# Load and deploy
source .env
deploy-automatizawpp --verbose
```

### Load from different env files

```bash
# Production
source .env.production
deploy-automatizawpp --verbose

# Staging
source .env.staging
deploy-automatizawpp --verbose

# Development
source .env.development
deploy-automatizawpp --verbose
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy AutomatizaWPP

on:
  push:
    branches: [main, production]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install project dependencies
        run: npm ci
      
      - name: Build project
        run: npm run build
      
      - name: Install deploy CLI
        run: npm install -g deploy-automatizawpp
      
      - name: Deploy to production
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          GOOGLE_CREDENTIALS_JSON: ${{ secrets.GOOGLE_CREDS_JSON }}
        run: deploy-automatizawpp --verbose
      
      - name: Notify Slack on success
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"Deployment successful!"}'
```

### GitLab CI Example

```yaml
deploy:
  image: node:18-alpine
  stage: deploy
  script:
    - npm ci
    - npm run build
    - npm install -g deploy-automatizawpp
    - deploy-automatizawpp --verbose
  environment:
    name: production
    url: https://automatizawpp.vercel.app
  only:
    - main
  artifacts:
    paths:
      - deployment-report-*.json
    expire_in: 30 days
```

### GitLab CI with Multiple Environments

```yaml
deploy_staging:
  image: node:18-alpine
  stage: deploy
  script:
    - npm ci
    - npm run build
    - npm install -g deploy-automatizawpp
    - NODE_ENV=staging deploy-automatizawpp --verbose
  environment:
    name: staging
  only:
    - develop

deploy_production:
  image: node:18-alpine
  stage: deploy
  script:
    - npm ci
    - npm run build
    - npm install -g deploy-automatizawpp
    - NODE_ENV=production deploy-automatizawpp --verbose
  environment:
    name: production
  only:
    - main
```

## Docker Compose Example

### With docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  logs:
    driver: local
```

```bash
# Deploy with Docker
deploy-automatizawpp --platform docker --verbose
```

## Advanced Examples

### Deploy with Google Search Console Registration

```bash
# With credentials file
export GOOGLE_CREDENTIALS_FILE=./google-creds.json
export VERCEL_TOKEN=your_token
deploy-automatizawpp --verbose

# With inline credentials
export GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'
deploy-automatizawpp --verbose
```

### Deploy with Debug Logging

```bash
# Full debug output
DEBUG=true deploy-automatizawpp --verbose

# Check what platform would be detected
DEBUG=true deploy-automatizawpp --help
```

### Deploy and Save Report

```bash
# Run deployment
deploy-automatizawpp --verbose

# Reports are automatically saved to deployment-report-TIMESTAMP.json
ls -la deployment-report-*.json

# View latest report
cat deployment-report-$(ls -t deployment-report-*.json | head -1 | sed 's/.*-\(.*\)\.json/\1/').json
```

### Conditional Deployment

```bash
#!/bin/bash
# deploy-conditional.sh

# Only deploy if tests pass
npm run test || exit 1

# Only deploy from main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "Not on main branch, skipping deployment"
  exit 0
fi

# Deploy
deploy-automatizawpp --verbose

# On success, notify
if [ $? -eq 0 ]; then
  echo "Deployment successful!"
  # Send notification, etc.
fi
```

### Deploy with Health Check

```bash
#!/bin/bash
# deploy-with-healthcheck.sh

echo "Starting deployment..."
deploy-automatizawpp --verbose

if [ $? -ne 0 ]; then
  echo "Deployment failed!"
  exit 1
fi

echo "Deployment successful, checking health..."

# Wait for service to be ready
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "Service is healthy!"
    exit 0
  fi
  
  echo "Waiting for service... (attempt $((ATTEMPT+1))/$MAX_ATTEMPTS)"
  sleep 2
  ATTEMPT=$((ATTEMPT+1))
done

echo "Service health check failed!"
exit 1
```

### Deploy with Rollback on Failure

```bash
#!/bin/bash
# deploy-with-rollback.sh

CURRENT_DEPLOYMENT=$(vercel ls | head -1)
echo "Current deployment: $CURRENT_DEPLOYMENT"

# Attempt deployment
deploy-automatizawpp --verbose

if [ $? -ne 0 ]; then
  echo "Deployment failed, rolling back..."
  vercel rollback
  exit 1
fi

echo "Deployment successful!"
```

## Monitoring and Logging

### Log All Deployments

```bash
#!/bin/bash
# log-deployment.sh

LOG_FILE="./deployment-logs.txt"
REPORT_DIR="./deployment-reports"

mkdir -p "$REPORT_DIR"

{
  echo "=== Deployment at $(date) ==="
  deploy-automatizawpp --verbose
  RESULT=$?
  echo "=== Result: $RESULT ==="
  
  # Copy report
  if [ -f deployment-report-*.json ]; then
    cp deployment-report-*.json "$REPORT_DIR/"
  fi
  
  echo ""
} | tee -a "$LOG_FILE"
```

### Email Notification After Deployment

```bash
#!/bin/bash
# deploy-and-notify.sh

EMAIL="admin@automatizawpp.com"
SUBJECT="AutomatizaWPP Deployment Report"

# Run deployment
deploy-automatizawpp --verbose > deployment.log 2>&1
RESULT=$?

# Create email body
{
  echo "Deployment completed with status: $RESULT"
  echo ""
  echo "=== Deployment Log ===" 
  cat deployment.log
  echo ""
  echo "=== Latest Report ==="
  cat deployment-report-*.json | tail -1
} | mail -s "$SUBJECT" "$EMAIL"
```

## Troubleshooting Examples

### Check if Platform is Detected Correctly

```bash
# Enable debug mode
DEBUG=true deploy-automatizawpp --verbose

# Check what platform would be used
cat << 'JSEOF' | node
import { PlatformDetector } from './node_modules/deploy-automatizawpp/lib/platform-detector.js';
const detector = new PlatformDetector({ debug: console.log });
const platform = await detector.detect();
console.log('Detected platform:', platform);
JSEOF
```

### Verify Meta Tags

```bash
# Deploy and check meta tags specifically
deploy-automatizawpp --verbose 2>&1 | grep -A5 "meta tag"

# Manually check deployed site
curl -s https://your-deployment.vercel.app | grep '<meta'
```

### Debug Google Search Console Registration

```bash
# Check credentials file
cat ./google-creds.json | jq .

# Test with full debug
DEBUG=true GOOGLE_CREDENTIALS_FILE=./google-creds.json deploy-automatizawpp --verbose
```

## Reference Commands

```bash
# Help and version
deploy-automatizawpp --help
deploy-automatizawpp --version

# List environment
env | grep -E "DEPLOY|VERCEL|GOOGLE"

# Check Node.js version
node --version

# Verify npm package
npm list -g deploy-automatizawpp

# Update to latest version
npm install -g deploy-automatizawpp@latest

# Uninstall
npm uninstall -g deploy-automatizawpp
```
