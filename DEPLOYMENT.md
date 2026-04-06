# Deployment Guide

This repo is set up for fully automated cloud deployment:
- **Frontend** → Netlify (auto-deploys on push to `main`)
- **Backend** → Fly.io (auto-deploys on push to `main`, always-on free tier)

Push to `main` = live update. No manual steps needed after initial setup.

---

## Architecture

```
GitHub (main branch)
    │
    ├── push to backend/** → GitHub Actions → Fly.io (always-on, free)
    │
    └── push to frontend/** → GitHub Actions → Netlify (CDN, free)

Fly.io Backend (https://wb-alerts-api.fly.dev)
    ├── FastAPI on port 8080
    ├── Persistent volume at /data (SQLite + session file)
    └── Telegram monitoring loop

Netlify Frontend (https://yourapp.netlify.app)
    ├── React PWA, static files
    └── Calls backend API over HTTPS/WSS
```

## Why Fly.io (not Render free tier)

Render free tier spins down after 15 minutes of inactivity. This kills the Telegram
monitoring loop. Fly.io's free tier keeps the process running 24/7 with:

- 3 shared VMs included free (256MB each)
- 3GB persistent volume storage
- No cold starts (auto_stop_machines = false)
- Amsterdam region (closest free region to West Bank)
- WebSocket support

---

## First-Time Setup

### Step 1: Create a GitHub repository

Push this repo to GitHub:

```bash
git remote add origin https://github.com/YOUR_USERNAME/westbank-alerts.git
git branch -M main
git push -u origin main
```

### Step 2: Set up Fly.io backend

#### 2a. Install flyctl

```bash
# Linux/Mac
curl -L https://fly.io/install.sh | sh

# Or via Homebrew (Mac)
brew install flyctl

# Windows
pwsh -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://fly.io/install.ps1'))"
```

#### 2b. Sign in / Create free account

```bash
flyctl auth signup    # new account
# OR
flyctl auth login     # existing account
```

Go to https://fly.io — free account, no credit card required.

#### 2c. Create the Fly.io app

```bash
cd backend

# Create the app (choose a unique name, e.g. wb-alerts-api-zaid)
flyctl apps create wb-alerts-api

# Create persistent volume (1GB, stores SQLite + session)
flyctl volumes create wb_data --size 1 --region ams
```

> If `wb-alerts-api` is taken, pick a unique name and update `app = "..."` in `backend/fly.toml`.

#### 2d. Generate Telegram StringSession

This is required because Fly.io containers can't do interactive Telegram login.
Run this **once locally**:

```bash
cd backend
python generate_session.py
```

You'll be prompted to log in with your Telegram account. The script outputs a
long session string. Copy it — you'll need it in the next step.

> The session string authenticates your account. Treat it like a password.
> Never commit it to git.

#### 2e. Set secrets in Fly.io

```bash
flyctl secrets set \
  TELEGRAM_API_ID="your_api_id" \
  TELEGRAM_API_HASH="your_api_hash" \
  TELEGRAM_PHONE="+970XXXXXXXXX" \
  TELEGRAM_SESSION_STRING="paste_session_string_here" \
  TELEGRAM_CHANNELS="QudsN,wafanews,palinfo" \
  CHECKPOINT_CHANNELS="your_checkpoint_channel" \
  API_SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_hex(32))')" \
  CORS_ORIGINS="https://your-netlify-url.netlify.app"
```

> Run this from the `backend/` directory, or add `--app wb-alerts-api`.

#### 2f. Deploy backend manually (first time)

```bash
cd backend
flyctl deploy
```

Wait for the deployment to complete. Verify it's running:

```bash
curl https://wb-alerts-api.fly.dev/health
# → {"status": "healthy"}
```

Your backend is now live 24/7 at `https://wb-alerts-api.fly.dev`.

#### 2g. Add FLY_API_TOKEN to GitHub Secrets

So GitHub Actions can deploy automatically on every push:

```bash
# Get your Fly.io token
flyctl tokens create deploy -x 999999h
```

Copy the token, then add it to your GitHub repo:

GitHub → Settings → Secrets and variables → Actions → New repository secret:
- Name: `FLY_API_TOKEN`
- Value: paste the token

### Step 3: Set up Netlify frontend

#### Option A: Auto-deploy via GitHub (recommended)

1. Go to https://netlify.com → "Add new site" → "Import from Git"
2. Connect GitHub, select this repository
3. Build settings:
   - Base directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `frontend/dist`
4. Add environment variables:
   - `VITE_API_URL` = `https://wb-alerts-api.fly.dev`
   - `VITE_API_WSS_URL` = `wss://wb-alerts-api.fly.dev`
5. Deploy

#### Option B: GitHub Actions deploy (more control)

Add these secrets to your GitHub repo:
- `NETLIFY_AUTH_TOKEN` — from Netlify User Settings → Personal access tokens
- `NETLIFY_SITE_ID` — from Netlify Site Configuration → Site ID
- `VITE_API_URL` = `https://wb-alerts-api.fly.dev`
- `VITE_API_WSS_URL` = `wss://wb-alerts-api.fly.dev`

GitHub Actions (`.github/workflows/deploy-frontend.yml`) handles the rest.

---

## Updating the Deployment

After setup, **all you do is push to `main`**:

```bash
git add .
git commit -m "your changes"
git push
```

- Changes to `backend/` → triggers backend deploy to Fly.io
- Changes to `frontend/` → triggers frontend deploy to Netlify
- Both workflows run independently and in parallel

---

## Configuration Changes

### Change backend environment variable

```bash
flyctl secrets set CORS_ORIGINS="https://newdomain.com"
# Fly.io auto-restarts the backend with the new value
```

### Change frontend API URL

Update in Netlify dashboard:
Site Settings → Environment Variables → `VITE_API_URL`
Then trigger a redeploy (Deploys → Trigger deploy).

### Add a new Telegram channel

```bash
flyctl secrets set TELEGRAM_CHANNELS="QudsN,wafanews,newchannel"
```

---

## Free Tier Limits

| Platform | Free Tier | Limits |
|----------|-----------|--------|
| Fly.io | 3 shared VMs, 160GB egress/month | 256MB RAM, 1 CPU core shared |
| Netlify | 100GB bandwidth/month | 300 build minutes/month |
| GitHub Actions | 2000 min/month (public repo: unlimited) | 6h per job |

**For this app:**
- Backend uses ~1 VM, ~100-150MB RAM → well within free limits
- Frontend builds take ~1-2 minutes → well within limits
- Bandwidth: likely <5GB/month for normal usage

### Staying on free tier

- Do not add more than 1 backend replica
- Keep the frontend build size under ~5MB (already under 2MB)
- Monitor with `flyctl status` and Netlify analytics

---

## Monitoring

### Backend

```bash
# View live logs
flyctl logs

# Check app status
flyctl status

# Check machine health
flyctl machine list

# SSH into the container (debugging)
flyctl ssh console
```

### Frontend

Netlify dashboard → Deploys (shows all deployments and build logs)

### API health check

```bash
curl https://wb-alerts-api.fly.dev/health
curl https://wb-alerts-api.fly.dev/incidents?limit=5
```

---

## Troubleshooting

### Backend is not running

```bash
flyctl status           # see current machines
flyctl logs             # see startup errors
flyctl machine restart  # restart the machine
```

### "Session expired" error in logs

The Telegram session string needs to be regenerated:

```bash
# Run locally
cd backend
python generate_session.py

# Copy new string and update Fly.io secret
flyctl secrets set TELEGRAM_SESSION_STRING="new_string_here"
```

### CORS error in browser

Update the `CORS_ORIGINS` secret to include your frontend domain:

```bash
flyctl secrets set CORS_ORIGINS="https://yourapp.netlify.app"
```

### Fly.io deploy fails in GitHub Actions

- Check `FLY_API_TOKEN` is set in GitHub Secrets
- Run `flyctl deploy` locally to see the full error
- Check `flyctl status` to see current app state

### Frontend build fails

Check the GitHub Actions log:
GitHub → Actions → "Deploy Frontend to Netlify" → click the failed run

---

## Scaling Up (if needed)

### Backend: more RAM

```bash
# Upgrade to 512MB (still free tier)
flyctl machine update --memory 512
```

### Backend: upgrade VM

```bash
# Upgrade to dedicated CPU (paid, ~$7/month)
flyctl scale vm shared-cpu-1x
```

### Backend: PostgreSQL (if SQLite is too slow)

1. Add Fly.io Postgres: `flyctl postgres create`
2. Set `DATABASE_URL` secret
3. Update `database.py` to use asyncpg driver

---

## Rollback

### Backend rollback

```bash
# List previous releases
flyctl releases list

# Roll back to specific version
flyctl deploy --image <previous-image-id>
```

### Frontend rollback

Netlify dashboard → Deploys → click any previous deploy → "Publish deploy"

---

## Domain Setup (optional)

### Custom domain for frontend

1. Netlify → Domain management → Add custom domain
2. Update DNS at your registrar to point to Netlify
3. SSL auto-provisioned

### Custom domain for backend

```bash
# Add domain
flyctl certs add api.yourdomain.com

# Get DNS instructions
flyctl certs show api.yourdomain.com

# Update CORS_ORIGINS to new domain
flyctl secrets set CORS_ORIGINS="https://yourdomain.com"
```
