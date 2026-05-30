# ⚡ Neurothumb - 5 Minute Quick Start

Get Neurothumb running in 5 minutes with this streamlined setup guide.

## Prerequisites (1 min)

- Node.js 18+ ([download](https://nodejs.org))
- Python 3.11+ ([download](https://www.python.org/downloads))
- Accounts: [Modal](https://modal.com), [Supabase](https://supabase.com), [Google Gemini](https://aistudio.google.com)

## Step 1: Clone & Install (1 min)

```bash
git clone https://github.com/sriharideveloper/neurothumb.git
cd neurothumb
pnpm install
```

## Step 2: Get Your API Keys (2 mins)

### A. Modal Endpoint

```bash
# Install Modal CLI
pip install modal

# Authenticate
modal token new

# Deploy backend (takes ~3-5 mins, do this while getting other keys)
cd modal_backend
modal deploy backend.py
```

After deployment, you'll see:
```
Endpoint: https://your-username--croissant-analyze.modal.run
Channel Endpoint: https://your-username--croissant-analyze-channel.modal.run
```

**Copy these URLs** ✓

### B. Supabase Credentials

1. Go to [supabase.com](https://supabase.com) → Create Project
2. Go to Settings → API
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

**Copy these values** ✓

### C. Gemini API Key (Optional)

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key → `GEMINI_API_KEY`

**Copy this value** ✓

## Step 3: Create .env.local (1 min)

Create `.env.local` in project root with your keys:

```env
# Modal (from Step 2A)
MODAL_ENDPOINT_URL=https://your-username--croissant-analyze.modal.run
MODAL_CHANNEL_ENDPOINT_URL=https://your-username--croissant-analyze-channel.modal.run

# Supabase (from Step 2B)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Gemini (from Step 2C - optional)
GEMINI_API_KEY=your-gemini-key-here
```

## Step 4: Setup Database (Optional but Recommended)

```bash
# In Supabase dashboard → SQL Editor:
# Paste contents of supabase_schema.sql and run
```

Or use Supabase CLI:
```bash
supabase db push
```

## Step 5: Run! (1 min)

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🎯 You're Done!

Try it out:
1. Enter a YouTube thumbnail URL
2. Click "Analyze"
3. See brain activation heatmap!

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "MODAL_ENDPOINT_URL not found" | Make sure `.env.local` is in project root, not subdirectory |
| Modal endpoint returns 404 | Run `modal deploy modal_backend/backend.py` again |
| Supabase connection error | Check credentials in `.env.local` match Supabase dashboard |
| "Cannot find module" | Run `pnpm install` again |

## What's Next?

- **Deploy Frontend**: Push to GitHub, connect to [Vercel](https://vercel.com)
- **Customize**: Edit `app/page.jsx` to change UI
- **Scale**: Increase Modal concurrency in `modal_backend/backend.py`
- **Learn More**: Read [README.md](README.md) for detailed docs

## Need Help?

- Check [ENV_SETUP.md](ENV_SETUP.md) for detailed environment setup
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Open an [issue on GitHub](https://github.com/sriharideveloper/neurothumb/issues)

---

**That's it!** You now have a fully functional Neurothumb instance. 🥐
