# Deploy AutomatizaWPP - Quick Start (5 minutes)

## 1. Install (30 seconds)

```bash
npm install -g deploy-automatizawpp
```

Verify:
```bash
deploy-automatizawpp --version
# Output: deploy-automatizawpp version 1.0.0
```

## 2. Setup Environment (1 minute)

Copy the example config:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
nano .env
```

Or set environment variables directly:
```bash
export VERCEL_TOKEN="your_token"
export DEPLOY_PLATFORM="vercel"
```

## 3. Deploy (30 seconds)

```bash
deploy-automatizawpp --verbose
```

Expected output:
```
[INFO] Starting AutomatizaWPP Deploy CLI
[1/5] Detecting platform...
[INFO] Detected platform: Vercel (vercel)
[2/5] Deploying to Vercel...
[INFO] Deployment URL: https://automatizawpp.vercel.app
[3/5] Validating meta tags...
[INFO] Meta tags validated successfully
[4/5] Registering with Google Search Console...
[INFO] Registered with Google Search Console
[5/5] Finalizing deployment...
[SUCCESS] Deployment completed successfully!
```

## Platform Setup (Choose One)

### For Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Get token
vercel token create

# 4. Set token
export VERCEL_TOKEN=your_token

# 5. Deploy
deploy-automatizawpp
```

### For Docker

```bash
# 1. Install Docker Desktop
# https://www.docker.com/products/docker-desktop

# 2. Create docker-compose.yml
cat > docker-compose.yml << 'YAMEOF'
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
YAMEOF

# 3. Deploy
deploy-automatizawpp --platform docker
```

## Google Search Console (Optional)

```bash
# 1. Get credentials from Google Cloud Console
# https://console.cloud.google.com

# 2. Download JSON file, save to ./google-creds.json

# 3. Set environment variable
export GOOGLE_CREDENTIALS_FILE=./google-creds.json

# 4. Deploy (automatic GSC registration)
deploy-automatizawpp
```

## Common Commands

```bash
# Help
deploy-automatizawpp --help

# Verbose output
deploy-automatizawpp --verbose

# Specific platform
deploy-automatizawpp --platform vercel
deploy-automatizawpp --platform docker

# Production environment
NODE_ENV=production deploy-automatizawpp

# Dry run / test
DEBUG=true deploy-automatizawpp
```

## Troubleshooting

### "Vercel CLI not found"
```bash
npm install -g vercel
```

### "Docker not found"
Install Docker Desktop from https://www.docker.com/products/docker-desktop

### "Google credentials not found"
```bash
# Either set file path
export GOOGLE_CREDENTIALS_FILE=./google-creds.json

# Or set inline JSON
export GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'
```

## Next Steps

1. Read full documentation: `cat README.md`
2. Review setup guide: `cat SETUP.md`
3. See more examples: `cat EXAMPLES.md`
4. Install instructions: `cat INSTALL.md`

## For CI/CD Integration

### GitHub Actions

Add to `.github/workflows/deploy.yml`:
```yaml
- name: Deploy
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
  run: |
    npm install -g deploy-automatizawpp
    deploy-automatizawpp --verbose
```

### GitLab CI

Add to `.gitlab-ci.yml`:
```yaml
deploy:
  script:
    - npm install -g deploy-automatizawpp
    - deploy-automatizawpp --verbose
```

---

**That's it!** You now have automated deployment with platform detection, meta tag validation, and Google Search Console registration.
