# Environment Configuration Guide

This guide explains how to set up your BYOK (Bring Your Own Key) credentials for Neurothumb.

## Quick Setup

1. Copy the template:
```bash
cp .env.example .env.local
```

2. Fill in your credentials (see sections below)

3. Start the development server:
```bash
pnpm dev
```

## Modal Configuration

Modal provides serverless GPU compute for running the TRIBE v2 model.

### Step 1: Create Modal Account

1. Go to [modal.com](https://modal.com)
2. Sign up for a free account
3. Verify your email

### Step 2: Deploy Backend

```bash
# Install Modal CLI
pip install modal

# Authenticate
modal token new

# Deploy the backend
cd modal_backend
modal deploy backend.py
```

### Step 3: Copy Endpoints

After deployment, Modal will output:
```
Deployment complete! 🎉
Endpoint: https://your-username--croissant-analyze.modal.run
Channel Endpoint: https://your-username--croissant-analyze-channel.modal.run
```

Add these to `.env.local`:
```env
MODAL_ENDPOINT_URL=https://your-username--croissant-analyze.modal.run
MODAL_CHANNEL_ENDPOINT_URL=https://your-username--croissant-analyze-channel.modal.run
```

### Optional: Modal Credentials

For programmatic deployment via scripts:

1. Go to [Modal Account → Tokens](https://modal.com/account/tokens)
2. Create a new token
3. Copy Token ID and Secret
4. Add to `.env.local`:
```env
MODAL_TOKEN_ID=your-token-id
MODAL_TOKEN_SECRET=your-token-secret
```

## Supabase Configuration

Supabase provides PostgreSQL database and user authentication.

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Choose a region (closer to your users = better performance)
5. Set a strong database password

### Step 2: Get Credentials

1. Go to Project Settings → API
2. Copy the **Project URL** → Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy the **anon public key** → Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy the **service_role secret key** → Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Run Database Migrations

1. Go to SQL Editor in Supabase dashboard
2. Create a new query
3. Copy contents of `supabase_schema.sql`
4. Paste into the editor and run

Or use Supabase CLI:
```bash
supabase db push
```

### Step 4: Enable Row Level Security (RLS)

1. Go to Authentication → Policies
2. Enable RLS on all tables
3. Create policies for your use case

## Gemini Configuration (Optional)

Google Gemini API enables enhanced text analysis and recommendations.

### Step 1: Get API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

### Step 2: Add to Environment

```env
GEMINI_API_KEY=your-api-key-here
NEXT_PUBLIC_GEMINI_API_KEY=your-api-key-here
```

### Features Enabled with Gemini

- YouTube Strategist Audit summaries
- Content recommendations
- Narrative analysis of channel patterns

## Validation

To verify your configuration is correct:

```bash
# Frontend validation
node -e "require('./lib/byok-config.js').validateByokConfig()"

# Server-side validation
node -e "require('./lib/byok-server.js').validateServerByokConfig()"
```

## Troubleshooting

### "MODAL_ENDPOINT_URL is not configured"

Make sure you:
1. Deployed the backend: `modal deploy modal_backend/backend.py`
2. Copied the endpoint to `.env.local`
3. Restarted the dev server: `pnpm dev`

### "Supabase is not configured"

Make sure you:
1. Created a Supabase project
2. Copied the project URL and anon key
3. Added them to `.env.local` with correct variable names
4. Restarted the dev server

### Modal endpoint returns 404

This means the backend wasn't deployed successfully. Try:
```bash
cd modal_backend
modal deploy backend.py --force
```

### Supabase connection errors

1. Check your database password is correct
2. Verify RLS policies aren't blocking connections
3. Check IP whitelist in Supabase settings

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` for a reason
2. **Use service role key only on server** - Never expose it to frontend
3. **Rotate keys regularly** - Especially if you suspect compromise
4. **Use strong database passwords** - Supabase generates these, but make them unique
5. **Enable 2FA on all accounts** - Modal, Supabase, Google
6. **Monitor usage** - Check Modal and Supabase dashboards for unusual activity

## Environment Variables Reference

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `MODAL_ENDPOINT_URL` | Yes | Public | Single thumbnail analysis endpoint |
| `MODAL_CHANNEL_ENDPOINT_URL` | No | Public | Channel analysis endpoint (auto-derived if omitted) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server | Supabase service role key (SECRET) |
| `GEMINI_API_KEY` | No | Server | Google Gemini API key |
| `NEXT_PUBLIC_GEMINI_API_KEY` | No | Public | Gemini API key for frontend (optional) |
| `MODAL_TOKEN_ID` | No | Server | Modal token ID for deployment |
| `MODAL_TOKEN_SECRET` | No | Server | Modal token secret for deployment |

## Next Steps

1. Configure all required credentials
2. Run `pnpm install` to install dependencies
3. Run `pnpm dev` to start development server
4. Open http://localhost:3000 in your browser
5. Test with a sample YouTube thumbnail URL

For more help, see the main [README.md](README.md) or visit [GitHub Issues](https://github.com/sriharideveloper/neurothumb/issues).
