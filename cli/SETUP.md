# Deploy AutomatizaWPP - Setup Guide

## Step 1: Install Globally

```bash
npm install -g deploy-automatizawpp
```

Verify installation:
```bash
deploy-automatizawpp --version
deploy-automatizawpp --help
```

## Step 2: Configure Environment Variables

Create `.env` or `.env.production` in your project root:

```bash
# Platform configuration
DEPLOY_PLATFORM=auto                    # auto-detect or: vercel, docker, aws
NODE_ENV=production

# Vercel (if using Vercel deployment)
VERCEL_TOKEN=your_vercel_api_token_here

# Google Search Console
# Option A: Path to credentials file
GOOGLE_CREDENTIALS_FILE=./google-creds.json

# Option B: JSON credentials directly
GOOGLE_CREDENTIALS_JSON='{"type":"service_account","project_id":"...","private_key":"..."}'

# Docker settings (if using Docker)
SERVICE_HOST=localhost
SERVICE_PORT=3000

# Debug output
DEBUG=true              # Enable for detailed logs
```

Load environment variables:
```bash
# On macOS/Linux
export $(cat .env | xargs)

# Or manually
export VERCEL_TOKEN="your_token"
export GOOGLE_CREDENTIALS_FILE="./google-creds.json"
```

## Step 3: Setup Vercel (if applicable)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Get your API token:
```bash
vercel token create
```

4. Set token:
```bash
export VERCEL_TOKEN=your_token
```

## Step 4: Setup Google Search Console Access

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Create a new project:
   - Project name: "AutomatizaWPP Deploy"
   - Click "Create"

3. Enable Google Search Console API:
   - Search for "Google Search Console API"
   - Click "Enable"

4. Create Service Account:
   - Go to "Service Accounts"
   - Click "Create Service Account"
   - Name: "deploy-service"
   - Create and continue
   - Grant role: "Editor"
   - Create key: JSON format
   - Download JSON file

5. Save credentials:
```bash
# Copy downloaded JSON to your project
cp ~/Downloads/project-xxxxx.json ./google-creds.json

# Or set environment variable with JSON content
export GOOGLE_CREDENTIALS_FILE=./google-creds.json
```

6. Share site access with service account:
   - In Google Search Console
   - Site settings → Users and permissions
   - Add service account email (from JSON)
   - Grant "Verify" permission

## Step 5: Setup Docker (if applicable)

1. Install Docker Desktop:
   - macOS: https://docs.docker.com/desktop/install/mac-install/
   - Linux: https://docs.docker.com/engine/install/
   - Windows: https://docs.docker.com/desktop/install/windows-install/

2. Verify Docker:
```bash
docker --version
docker-compose --version
docker ps                   # Check daemon is running
```

3. Create docker-compose.yml:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  data:
    driver: local
```

4. Create Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## Step 6: Setup Meta Tags

Ensure your HTML has required meta tags in `<head>`:

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Your app description">
  <meta property="og:title" content="Your App Title">
  <meta property="og:description" content="Your app description">
  <meta property="og:url" content="https://yourdomain.com">
  <meta property="og:image" content="https://yourdomain.com/og-image.png">
</head>
```

For Next.js, use Head component:
```jsx
import Head from 'next/head';

export default function Home() {
  return (
    <Head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content="Your description" />
      <meta property="og:title" content="Title" />
      <meta property="og:description" content="Description" />
      <meta property="og:url" content="https://yourdomain.com" />
    </Head>
  );
}
```

## Step 7: Test Deployment

Run with verbose mode to see all steps:
```bash
deploy-automatizawpp --verbose
```

Expected output:
```
[INFO] Starting AutomatizaWPP Deploy CLI
[1/5] Detecting platform...
[2/5] Deploying to <Platform>...
[3/5] Validating meta tags...
[4/5] Registering with Google Search Console...
[5/5] Finalizing deployment...
[SUCCESS] Deployment completed successfully!
```

Check deployment report:
```bash
ls -la deployment-report-*.json
cat deployment-report-1234567890.json
```

## Step 8: Add to CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main, production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          GOOGLE_CREDENTIALS_FILE: ${{ secrets.GOOGLE_CREDS_JSON }}
        run: |
          npm install -g deploy-automatizawpp
          deploy-automatizawpp --verbose
```

### GitLab CI

Create `.gitlab-ci.yml`:
```yaml
deploy:
  image: node:18
  stage: deploy
  script:
    - npm ci
    - npm run build
    - npm install -g deploy-automatizawpp
    - deploy-automatizawpp --verbose
  environment:
    name: production
  only:
    - main
```

## Step 9: Verify in Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Check "Properties" - should see your domain
3. Wait 24-48 hours for indexing
4. Check "Coverage" report for URL status

## Troubleshooting

### Token/Credentials Not Found
```bash
# Verify environment variables are set
env | grep -E "VERCEL_TOKEN|GOOGLE_CREDENTIALS"

# Check file exists
ls -la ./google-creds.json

# Test credentials
cat ./google-creds.json | jq .
```

### Service Not Starting
```bash
# Check Docker logs
docker-compose logs -f

# Test service manually
curl http://localhost:3000/api/health

# Debug with verbose
DEBUG=true deploy-automatizawpp --verbose
```

### Meta Tags Missing
```bash
# Fetch and check HTML
curl https://your-deployment-url | grep '<meta'

# Validate with verbose
deploy-automatizawpp --verbose
```

## Next Steps

1. **Schedule regular deployments:**
   ```bash
   # Via cron
   0 2 * * * /usr/local/bin/deploy-automatizawpp >> /var/log/deploy.log 2>&1
   ```

2. **Monitor deployments:**
   - Review `deployment-report-*.json` files
   - Check Google Search Console coverage
   - Monitor application logs

3. **Setup rollback:**
   ```bash
   # For Vercel
   vercel rollback
   
   # For Docker
   docker-compose down && docker-compose up -d
   ```

4. **Configure alerts:**
   - Add deployment notifications to Slack/Discord
   - Monitor error logs
   - Setup uptime monitoring
