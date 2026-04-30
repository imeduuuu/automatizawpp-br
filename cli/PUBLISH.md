# Deploy AutomatizaWPP - Publishing to NPM

## Prerequisites

1. **NPM Account** - Create at https://www.npmjs.com
2. **Logged in locally** - Run `npm login`
3. **Unique package name** - Check availability on npmjs.com

## Step 1: Verify Package

```bash
# Test locally
npm install .

# Test CLI works
./bin/cli.js --version
./bin/cli.js --help
```

## Step 2: Update Version

Edit `package.json`:
```json
{
  "name": "deploy-automatizawpp",
  "version": "1.0.0"
}
```

Use semantic versioning:
- **MAJOR** (1.0.0) - Breaking changes
- **MINOR** (1.1.0) - New features
- **PATCH** (1.0.1) - Bug fixes

```bash
npm version patch    # 1.0.0 -> 1.0.1
npm version minor    # 1.0.0 -> 1.1.0
npm version major    # 1.0.0 -> 2.0.0
```

## Step 3: Login to NPM

```bash
npm login

# Verify login
npm whoami
```

## Step 4: Publish

```bash
# From cli/ directory
npm publish

# Or with specific access level
npm publish --access public
```

Monitor publishing:
```bash
# Check package on npm.js
npm view deploy-automatizawpp

# See all versions
npm view deploy-automatizawpp versions

# Check download stats
npm stats deploy-automatizawpp
```

## Step 5: Verify Installation

Test installation globally:
```bash
npm install -g deploy-automatizawpp@latest

# Test command
deploy-automatizawpp --version

# Uninstall
npm uninstall -g deploy-automatizawpp
```

Test via npx:
```bash
npx deploy-automatizawpp --version

# Should work without installation
```

## Step 6: Update Documentation

After publishing, update links:

### NPM Registry Link
https://www.npmjs.com/package/deploy-automatizawpp

### Installation Command
```bash
npm install -g deploy-automatizawpp
```

### GitHub Release (Optional)

```bash
# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push to GitHub
git push origin v1.0.0

# Create release on GitHub
gh release create v1.0.0 --title "v1.0.0" --notes "See CHANGELOG.md"
```

## Future Updates

To publish new versions:

```bash
# 1. Make changes
# 2. Update version in package.json
npm version patch

# 3. Publish
npm publish

# 4. Verify
npm view deploy-automatizawpp@latest

# 5. Tag in git (if using GitHub)
git push
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
```

## NPM Package Configuration

### package.json Essential Fields

```json
{
  "name": "deploy-automatizawpp",
  "version": "1.0.0",
  "description": "CLI tool for automated deployment of AutomatizaWPP",
  "license": "MIT",
  "author": "Eduardo Silva",
  "bin": {
    "deploy-automatizawpp": "./bin/cli.js"
  },
  "files": ["bin", "lib"],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Recommended .npmrc

Create `~/.npmrc`:
```
registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=YOUR_TOKEN
```

Get token: https://www.npmjs.com/settings/~/tokens

## Distribution Methods

### Method 1: NPM Registry (Recommended)
```bash
npm install -g deploy-automatizawpp
```

### Method 2: GitHub Releases
1. Push to GitHub
2. Create release
3. Users can install from tarball:
```bash
npm install -g https://github.com/yourusername/deploy-automatizawpp/releases/download/v1.0.0/deploy-automatizawpp-1.0.0.tgz
```

### Method 3: GitHub Packages Registry
```bash
# Publish to GitHub NPM registry
npm publish --registry https://npm.pkg.github.com/
```

## Maintenance

### Monitor Package Health

```bash
# Weekly check
npm audit deploy-automatizawpp

# View downloads
npm stats deploy-automatizawpp

# Check dependencies
npm list deploy-automatizawpp

# View package info
npm info deploy-automatizawpp
```

### Update README on NPM

The README.md from package root appears on npm.js:
```bash
npm view deploy-automatizawpp readme | head -50
```

### Keywords for Discovery

Update in package.json:
```json
{
  "keywords": [
    "deploy",
    "automation",
    "whatsapp",
    "cli",
    "vercel",
    "docker",
    "google-search-console",
    "meta-tags",
    "seo"
  ]
}
```

## Unpublish (if needed)

⚠️ Can only unpublish within 72 hours:
```bash
npm unpublish deploy-automatizawpp@1.0.0
```

## Deprecate Old Versions

Instead of unpublish:
```bash
npm deprecate deploy-automatizawpp@1.0.0 "Use 2.0.0 instead"
```

## Security

### Require 2FA for Publishing

```bash
npm profile set twoFactorMode auth-and-writes
```

### Verify Signatures

```bash
npm audit
npm audit --audit-level=moderate
```

## Analytics

Monitor after publishing:

1. **NPM Downloads** - https://npm-stat.com/charts.html?package=deploy-automatizawpp
2. **Bundle Size** - https://bundlephobia.com/package/deploy-automatizawpp
3. **GitHub Stars** - Share link widely
4. **Community Feedback** - GitHub issues, discussions

## Promotion

### Share the Package

1. **GitHub**
   - Create release
   - Share link: https://github.com/yourusername/deploy-automatizawpp

2. **NPM**
   - View at: https://npmjs.com/package/deploy-automatizawpp
   - Share: `npm install -g deploy-automatizawpp`

3. **Documentation**
   - Host on docs site
   - Add to README

4. **Social Media**
   - Twitter: "New CLI tool: deploy-automatizawpp"
   - LinkedIn: Post release
   - Dev.to: Write article

## Support

Provide support channels:
- GitHub Issues: Bug reports, feature requests
- GitHub Discussions: Q&A and support
- Email: eduardo@automatizawpp.com
- Slack/Discord: Community channel

---

**Your package is now available to the world!**

Install command:
```bash
npm install -g deploy-automatizawpp
```

Or via npx:
```bash
npx deploy-automatizawpp
```
