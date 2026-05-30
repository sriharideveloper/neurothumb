# Deployment Guide

This guide covers deploying Neurothumb to production environments.

## Overview

Neurothumb consists of three main components that need to be deployed:

1. **Frontend**: Next.js application (Vercel, Netlify, or self-hosted)
2. **Backend**: Modal serverless functions (Modal.com)
3. **Database**: PostgreSQL (Supabase)

## Frontend Deployment

### Option 1: Vercel (Recommended)

Vercel is the easiest option as it's optimized for Next.js.

#### Step 1: Push to GitHub

```bash
git push origin main
```

#### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your GitHub repository
4. Configure settings:
   - Framework: Next.js (auto-detected)
   - Root Directory: ./
   - Build Command: `pnpm build`
   - Output Directory: `.next`

#### Step 3: Add Environment Variables

In Vercel dashboard:

1. Go to Settings → Environment Variables
2. Add all variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MODAL_ENDPOINT_URL`
   - `NEXT_PUBLIC_MODAL_CHANNEL_ENDPOINT_URL`
   - `NEXT_PUBLIC_GEMINI_API_KEY` (optional)

3. Server-only variables:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY` (optional)

#### Step 4: Deploy

Click "Deploy" - Vercel will automatically deploy on every push to main.

### Option 2: Netlify

#### Step 1: Connect Repository

1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Select GitHub and your repository

#### Step 2: Configure Build Settings

- Build command: `pnpm build`
- Publish directory: `.next`
- Node version: 18.x or higher

#### Step 3: Add Environment Variables

In Netlify dashboard:

1. Go to Site Settings → Build & Deploy → Environment
2. Add all environment variables from `.env.local`

#### Step 4: Deploy

Click "Deploy site" - Netlify will build and deploy automatically.

### Option 3: Self-Hosted

For self-hosted deployments on your own server:

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

Use a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start "pnpm start" --name neurothumb

# Save PM2 configuration
pm2 save

# Enable startup on reboot
pm2 startup
```

## Backend Deployment

### Modal Deployment

The Modal backend is deployed separately from the frontend.

#### Initial Deployment

```bash
# Install Modal CLI
pip install modal

# Authenticate
modal token new

# Deploy backend
cd modal_backend
modal deploy backend.py
```

Modal will output endpoints:
```
Deployment complete! 🎉
Endpoint: https://your-username--croissant-analyze.modal.run
Channel Endpoint: https://your-username--croissant-analyze-channel.modal.run
```

#### Updating Backend

When you make changes to `modal_backend/backend.py`:

```bash
cd modal_backend
modal deploy backend.py
```

#### Monitoring

View deployment status and logs:

```bash
# List deployments
modal app list

# View logs
modal logs croissant-tribe-analyzer

# View app details
modal app info croissant-tribe-analyzer
```

#### Scaling

Configure concurrency and resources in `backend.py`:

```python
@app.cls(
    gpu="T4",           # GPU type
    timeout=2400,       # Timeout in seconds
    memory=4096,        # Memory in MB
)
@modal.concurrent(max_inputs=4)  # Concurrent requests
class TribeAnalyzer:
    pass
```

## Database Deployment

### Supabase Setup

Supabase is managed through their dashboard - no additional deployment needed.

#### Initial Setup

1. Create project at [supabase.com](https://supabase.com)
2. Run schema migrations:

```bash
# Using psql
psql -h your-db-host -U postgres -d postgres -f supabase_schema.sql

# Or use Supabase CLI
supabase db push
```

#### Backups

Supabase automatically backs up your database daily. To restore:

1. Go to Supabase dashboard
2. Settings → Backups
3. Select a backup and restore

#### Scaling

Supabase automatically scales based on usage. For higher performance:

1. Upgrade to a higher tier
2. Enable read replicas for read-heavy workloads
3. Optimize queries and indexes

## Environment Variables for Production

### Frontend (Public)

These are safe to expose in the frontend:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MODAL_ENDPOINT_URL=https://your-username--croissant-analyze.modal.run
NEXT_PUBLIC_MODAL_CHANNEL_ENDPOINT_URL=https://your-username--croissant-analyze-channel.modal.run
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key (optional)
```

### Backend (Secret)

These should NEVER be exposed in frontend:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key (optional)
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
      
      - name: Deploy to Vercel
        uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Performance Optimization

### Frontend

1. **Enable compression**: Vercel/Netlify do this automatically
2. **Optimize images**: Use Next.js Image component
3. **Code splitting**: Next.js does this automatically
4. **Caching**: Configure cache headers in `next.config.mjs`

### Backend

1. **Model caching**: Modal volumes cache the TRIBE v2 model
2. **Concurrent requests**: Configure `@modal.concurrent()` decorator
3. **GPU selection**: Use appropriate GPU type (T4, A100, etc.)

### Database

1. **Indexes**: Create indexes on frequently queried columns
2. **Connection pooling**: Supabase handles this automatically
3. **Query optimization**: Use EXPLAIN ANALYZE to optimize queries

## Monitoring & Logging

### Frontend Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and debugging

### Backend Monitoring

- **Modal Dashboard**: View app status and logs
- **Modal Alerts**: Set up alerts for failures
- **Custom logging**: Add logging to backend.py

### Database Monitoring

- **Supabase Dashboard**: View database metrics
- **Query performance**: Monitor slow queries
- **Backups**: Verify automatic backups are running

## Security Checklist

- [ ] All secrets are in environment variables (not in code)
- [ ] HTTPS is enabled on all endpoints
- [ ] Database backups are enabled
- [ ] Row Level Security (RLS) policies are configured
- [ ] API rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Environment variables are different for dev/prod
- [ ] Sensitive logs are not exposed
- [ ] Regular security updates are applied

## Troubleshooting

### Deployment Fails

1. Check build logs in Vercel/Netlify dashboard
2. Verify all environment variables are set
3. Test locally: `pnpm build && pnpm start`
4. Check for TypeScript errors: `pnpm tsc --noEmit`

### Modal Endpoint Returns 404

1. Verify backend is deployed: `modal app list`
2. Check endpoint URL in environment variables
3. Redeploy backend: `modal deploy modal_backend/backend.py`

### Database Connection Errors

1. Verify Supabase credentials
2. Check IP whitelist in Supabase settings
3. Verify RLS policies aren't blocking connections
4. Test connection locally

### Performance Issues

1. Check Modal logs for slow requests
2. Monitor database query performance
3. Check frontend bundle size: `pnpm build --analyze`
4. Use browser DevTools to profile frontend

## Rollback

### Frontend

**Vercel**: Go to Deployments tab and click "Redeploy" on a previous version

**Netlify**: Go to Deploys tab and click "Publish deploy" on a previous version

### Backend

```bash
# List recent deployments
modal app list

# Redeploy previous version
modal deploy modal_backend/backend.py --force
```

## Cost Estimation

### Monthly Costs (Approximate)

| Service | Free Tier | Pro Tier |
|---------|-----------|----------|
| Vercel | $0 | $20+ |
| Modal | $0 (limited) | $0.30/GPU-hour |
| Supabase | $0 | $25+ |
| **Total** | **$0** | **$45+** |

## Support

For deployment issues:

1. Check service status pages
2. Review service documentation
3. Check GitHub Issues
4. Contact service support

## Next Steps

1. Deploy frontend to Vercel/Netlify
2. Deploy backend to Modal
3. Set up monitoring and alerts
4. Configure backups and disaster recovery
5. Monitor performance and costs
