# Phase 5E Quick Start Guide

## What Was Built

Phase 5E adds complete **SEO automation + growth automation** to automatizawppBR:

### 1. Google Search Console Integration
- Real-time metrics fetch (clicks, impressions, CTR, position)
- Indexation status monitoring
- Auto sitemap submission
- Alert system for ranking drops

### 2. Dynamic Sitemap Generation
- Auto-generates sitemap from all routes
- Updates when new pages/blog posts added
- Includes images, videos, lastModified
- Submittable to GSC via API

### 3. Automated Blog Content
- Daily post generation via Claude API
- SEO-optimized (keywords, meta tags, slug)
- 5+ pre-configured topics
- Auto-calculates read time

### 4. Growth Automation
- Newsletter signup with welcome email
- Lead magnet delivery tracking
- Referral program with tracking
- ROI calculation for campaigns

### 5. SEO Dashboard
- Visual dashboard at `/seo-dashboard`
- Real-time metrics from GSC
- Organic traffic analytics
- Competitor analysis
- Health score (1-100)

---

## How to Deploy

### Step 1: Add Environment Variables

In DigitalOcean app settings, add:

```bash
# Required for GSC
GOOGLE_GSC_ACCESS_TOKEN=your_gsc_oauth_token

# Required for API security
API_TOKEN=generate_secure_token_here
CRON_SECRET=generate_cron_secret_here

# Optional but recommended
GOOGLE_ANALYTICS_ID=GA-XXXXXXX
```

### Step 2: Test Endpoints

```bash
# Test newsletter signup (public, no auth)
curl -X POST https://automatizawpp.com/api/growth/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test"}'

# Test sitemap generation (public, no auth)
curl https://automatizawpp.com/api/seo/sitemap

# Test dashboard (requires API_TOKEN)
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
  https://automatizawpp.com/api/seo/dashboard

# Test monitoring (cron endpoint, requires CRON_SECRET)
curl -X POST https://automatizawpp.com/api/seo/monitor \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

### Step 3: Setup Daily Cron Jobs

Use **Vercel Cron** or **n8n** to call:

**Daily Blog Generation (every day at 9 AM UTC):**
```
POST https://automatizawpp.com/api/blog/generate
Header: x-cron-secret: YOUR_CRON_SECRET
```

**Daily SEO Monitoring (every day at 10 AM UTC):**
```
POST https://automatizawpp.com/api/seo/monitor
Header: x-cron-secret: YOUR_CRON_SECRET
```

**Weekly Sitemap Submission (every Monday at 8 AM UTC):**
```
POST https://automatizawpp.com/api/seo/sitemap/submit
Header: Authorization: Bearer YOUR_API_TOKEN
```

### Step 4: Setup Google Search Console Access

1. Create Google OAuth app
2. Get GSC API access
3. Generate access token
4. Set `GOOGLE_GSC_ACCESS_TOKEN` in env
5. Test with `GET /api/seo/metrics`

---

## API Reference

### Public Endpoints (no auth)

**Newsletter Signup:**
```
POST /api/growth/newsletter
Content-Type: application/json

{
  "email": "customer@example.com",
  "name": "John Doe",
  "source": "website"
}
```

**Get Sitemap:**
```
GET /api/seo/sitemap
→ Returns JSON array of all site URLs
```

**Generate Referral Link:**
```
POST /api/growth/referrals
Content-Type: application/json

{
  "userId": "user123"
}
```

**Track Referral:**
```
GET /api/growth/referrals?ref=REF_CODE&email=converted@example.com
```

### Protected Endpoints (require `Authorization: Bearer API_TOKEN`)

**Get SEO Metrics:**
```
GET /api/seo/metrics
→ GSC data (clicks, impressions, CTR, position)
```

**Get Full Dashboard:**
```
GET /api/seo/dashboard
→ Complete SEO analysis + organic traffic + competitors
```

**Get Growth Analytics:**
```
GET /api/growth/analytics?days=30
→ ROI, conversions, cost per lead, etc
```

**Submit Sitemap:**
```
POST /api/seo/sitemap/submit
→ Submits sitemap.xml to Google Search Console
```

### Cron Endpoints (require `x-cron-secret` header)

**Generate Blog Post:**
```
POST /api/blog/generate
Header: x-cron-secret: YOUR_CRON_SECRET
```

**Monitor SEO & Alerts:**
```
POST /api/seo/monitor
Header: x-cron-secret: YOUR_CRON_SECRET
→ Returns metrics + alerts + topQueries
```

---

## Dashboard Access

**URL:** `https://automatizawpp.com/seo-dashboard`

Requires browser to have `api_token` in localStorage:
```javascript
localStorage.setItem('api_token', 'YOUR_API_TOKEN');
```

Or set `NEXT_PUBLIC_API_TOKEN` env var (less secure, only for non-sensitive tokens).

---

## Key Features

### 1. Blog Generation
- **Schedule:** Daily at 9 AM
- **Topics:** Automatizar vendas, WhatsApp, CRM, Email, Atendimento
- **Output:** Markdown content + SEO meta tags
- **Storage:** JSON file (can be extended to DB)

### 2. SEO Monitoring
- **Schedule:** Daily at 10 AM
- **Checks:** CTR, ranking, indexation, traffic trends
- **Alerts:** Automatic for drops > 20%
- **Export:** JSON (extensible to email/Slack)

### 3. Newsletter
- **Signup:** Public form at `/api/growth/newsletter`
- **Welcome:** Automatic email sent
- **Tracking:** Subscriber stats available
- **Segmentation:** Tags (source, category, etc)

### 4. Growth Analytics
- **Tracks:** Leads, conversions, referrals
- **Calculates:** ROI, LTV, cost per lead
- **Period:** Configurable (30, 60, 90 days)
- **Export:** JSON ready for charts

---

## Files Created

```
src/lib/gsc/client.ts
src/lib/seo/sitemap-generator.ts
src/lib/seo/blog-generator.ts
src/lib/seo/tracker.ts
src/lib/growth/automation.ts

src/app/api/seo/metrics/route.ts
src/app/api/seo/dashboard/route.ts
src/app/api/seo/sitemap/route.ts
src/app/api/seo/monitor/route.ts

src/app/api/growth/newsletter/route.ts
src/app/api/growth/referrals/route.ts
src/app/api/growth/analytics/route.ts

src/app/seo-dashboard/page.tsx
```

---

## Testing Checklist

- [ ] Newsletter signup works (POST /api/growth/newsletter)
- [ ] Welcome email sent on signup
- [ ] Sitemap JSON endpoint returns valid data
- [ ] Dashboard loads with API token
- [ ] Blog generation cron callable
- [ ] SEO monitor cron callable
- [ ] Referral generation works
- [ ] Referral tracking records conversion
- [ ] Growth analytics calculates ROI

---

## Next Steps

1. ✅ Code deployed
2. ⏳ Configure env vars in DigitalOcean
3. ⏳ Test all endpoints with curl
4. ⏳ Setup cron jobs (Vercel/n8n)
5. ⏳ Verify GSC receives sitemap
6. ⏳ Monitor first 7 days of data
7. ⏳ Adjust alerts thresholds if needed

---

**Documentation:** See `PHASE_5E_SEO_GROWTH_AUTOMATION.md` for full specs
