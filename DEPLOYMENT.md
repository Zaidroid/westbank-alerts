# Deployment Guide

Complete setup instructions for deploying West Bank Alerts to production with Netlify (frontend) and Render or Railway (backend).

## Architecture

```
┌──────────────────────┐
│  Netlify (Frontend)  │  (React PWA)
│  https://domain.com  │
└─────────┬────────────┘
          │ REST + WebSocket
          ▼
┌──────────────────────────┐
│  Render/Railway (Backend)│  (FastAPI)
│  https://api.domain.com  │
└─────────┬────────────────┘
          │ Telegram API
          ▼
     Telegram Channels
```

## Frontend Deployment (Netlify)

### Step 1: Connect GitHub Repository

1. Go to https://netlify.app
2. Click "New site from Git"
3. Select GitHub and authorize
4. Choose the repository containing this code
5. Set build command: `cd frontend && npm install && npm run build`
6. Set publish directory: `frontend/dist`
7. Click "Deploy site"

### Step 2: Configure Environment Variables

In Netlify UI → Site Settings → Environment:

```
VITE_API_URL=https://westbank-api.onrender.com
VITE_API_WSS_URL=wss://westbank-api.onrender.com
```

Update these with your actual backend domain once it's deployed.

### Step 3: Verify PWA Installation

1. Visit deployed URL
2. Check DevTools → Application → Service Workers
3. Service worker should be registered
4. Should see "Install app" prompt or button
5. Test offline capability: DevTools → Network → Offline, then reload

### Step 4: Set Up Custom Domain (Optional)

In Netlify UI → Domain Management:

1. Add custom domain: `yourdomain.com`
2. Netlify auto-provisions SSL certificate
3. Update environment variables if domain changes

**Important:** If you change the domain, update `VITE_API_URL` and `CORS_ORIGINS` in backend.

### Netlify Build Logs

If deployment fails:
1. Go to Netlify → Deploys → View Log
2. Common issues:
   - Node version mismatch: Set `NODE_VERSION=18` in environment
   - Dependency issues: Clear cache in Build & Deploy → Cache
   - Type errors: Run `npm run build` locally first

## Backend Deployment (Render)

### Step 1: Connect GitHub Repository

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub account and select repository

### Step 2: Configure Web Service

| Setting | Value |
|---------|-------|
| Name | `westbank-api` |
| Environment | `Python 3` |
| Build Command | `pip install -r backend/requirements.txt` |
| Start Command | `cd backend && gunicorn -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 app.main:app` |
| Instance Type | Starter ($7/month) or Standard |

### Step 3: Add Environment Variables

In Render → Environment:

```
# Telegram Credentials
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_PHONE=+1234567890
TELEGRAM_SESSION=wb_alerts

# Channels to Monitor
CHECKPOINT_CHANNEL_ID=-1001234567890
ALERT_CHANNEL_ID=-1001234567891

# Server Config
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO

# CORS (update with your Netlify domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Push Notifications
FIREBASE_KEY=your_firebase_key
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will start deployment
3. View logs in Render dashboard
4. Once deployed, get the service URL: `https://westbank-api.onrender.com`

### Step 5: Initialize Telegram Session

For first-time deployment, you need an active Telegram session:

1. Open Render → Logs
2. Look for: `Session file not found. Please authenticate...`
3. Cannot do interactive login in hosted environment
4. **Solution:** Generate session locally first

**Generate Session Locally:**

```bash
cd backend
python3 << 'EOF'
from telethon.sync import TelegramClient

api_id = YOUR_API_ID
api_hash = "YOUR_API_HASH"
phone = "+1234567890"

with TelegramClient('wb_alerts', api_id, api_hash) as client:
    print("Session authenticated!")
EOF
```

This creates `backend/session/wb_alerts.session`. Then:

1. Copy the session file to Render via:
   - Render Shell (if available): Upload via web UI
   - Or commit to repo in `.gitignored` path and load at startup

**Recommended: Store Session in Render's Persistent Disk**

1. In Render → Service Settings → Persistent Disk
2. Add disk at `/app/session` with 1GB size
3. Deploy with session file included
4. Render will persist it across restarts

### Step 6: Verify Deployment

```bash
# Test API
curl https://westbank-api.onrender.com/incidents

# Check logs
# In Render UI → Logs tab
```

## Backend Deployment (Railway Alternative)

If using Railway instead of Render:

### Step 1: Connect GitHub

1. Go to https://railway.app
2. Create new project → GitHub
3. Select repository

### Step 2: Configure

1. Add environment variables (same as Render)
2. Set start command:
   ```
   cd backend && pip install -r requirements.txt && gunicorn -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT app.main:app
   ```

### Step 3: Deploy

1. Railway auto-detects Python and deploys
2. View logs in Railway dashboard
3. Public URL auto-generated

## Post-Deployment Setup

### Step 1: Update Frontend Environment

1. Get backend domain: `https://westbank-api.onrender.com` (or Railway URL)
2. In Netlify → Site Settings → Environment:
   - `VITE_API_URL=https://westbank-api.onrender.com`
   - `VITE_API_WSS_URL=wss://westbank-api.onrender.com`
3. Trigger redeployment

### Step 2: Test Real-time Connection

1. Open deployed frontend in browser
2. Open DevTools → Network tab
3. Filter for "WS" (WebSocket)
4. Should see WebSocket connection to backend
5. If connection fails, check CORS_ORIGINS in backend

### Step 3: Verify All Features

- [ ] Home screen loads with map
- [ ] Alerts tab shows incidents
- [ ] Checkpoints display with status colors
- [ ] Routes screen loads with 15 routes
- [ ] Real-time updates appear (check WebSocket in DevTools)
- [ ] Push notifications can be enabled
- [ ] Onboarding appears for first-time users
- [ ] App can be installed as PWA

### Step 4: Set Up Monitoring

**Render:**
- Enable error notifications: Service → Settings → Alerts
- View logs: Service → Logs (tail in real-time)

**Netlify:**
- Enable build notifications: Site → Build & Deploy → Notifications
- View deployment logs: Deploys → [Deployment] → View Log

## Upgrading Backend Storage

Default setup uses SQLite. For production scale, consider PostgreSQL:

### Option 1: Render PostgreSQL Add-on

1. Render Service → Add-on → PostgreSQL
2. Automatic connection string: `DATABASE_URL`
3. Update `backend/app/database.py`:
   ```python
   import os
   DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./alerts.db")
   # Change engine initialization to support PostgreSQL
   ```

### Option 2: Managed PostgreSQL

1. Use managed service: AWS RDS, Render, Railway, etc.
2. Get connection string
3. Set as `DATABASE_URL` environment variable
4. Update database driver: `pip install psycopg2`

### Migration from SQLite

```bash
# Export SQLite data
sqlite3 backend/data/alerts.db ".dump" > dump.sql

# Load into PostgreSQL
psql -U user -d database < dump.sql
```

## Scaling Considerations

### Frontend

- Netlify free tier: unlimited deployments, 100GB/month bandwidth
- Custom domain: $12/month
- No additional scaling needed for typical traffic

### Backend

**Starter Plan Issues:**
- Spins down after 15 min inactivity (cold start delay)
- Limited to 1 worker

**Solutions:**
1. **Render Standard Plan:** $12/month, always-on, dedicated instance
2. **Keep-Alive Service:** Ping backend every 14 minutes to prevent sleep
3. **Upgrade Worker Count:** In Render settings, increase to 2-4 workers

**Keep-Alive Cron Job:**

```bash
# Create a background job in Render
# Every 14 minutes, call /health
curl -X GET https://westbank-api.onrender.com/health
```

Or use: https://kaffeine.herokuapp.com (registers your URL)

### Database

If seeing slow queries:
1. Monitor in Render logs
2. Consider indexes on frequently filtered columns
3. Pagination: `/incidents?limit=20&offset=0`

## Security Checklist

- [ ] Backend `CORS_ORIGINS` set to your Netlify domain only
- [ ] API keys (Telegram, Firebase) stored in environment variables, not committed
- [ ] `.env` file is in `.gitignore`
- [ ] HTTPS enabled (both Netlify and Render auto-enable)
- [ ] Session file not committed to repository
- [ ] Database backups enabled (Render auto-backups)
- [ ] Log level set to `INFO` in production (not `DEBUG`)

## Monitoring & Alerts

### Key Metrics to Monitor

1. **WebSocket Connections:** Check in backend logs for "Connection closed"
2. **API Response Times:** Monitor in Render logs
3. **Database Size:** SQLite should stay under 100MB
4. **Telegram Authentication:** Errors in logs = session expired

### Enable Render Alerts

1. Service → Settings → Alerts
2. Set on: CPU >80%, Memory >80%, Build failures
3. Get notifications via Slack or email

### Debugging Production Issues

**Frontend not loading:**
1. Check Netlify build logs
2. Verify `VITE_API_URL` is set correctly
3. Check browser console for errors

**No real-time updates:**
1. Check WebSocket connection in DevTools Network tab
2. Look for CORS errors
3. Verify `wss://` protocol (HTTPS → WebSocket Secure)

**Backend errors:**
1. `LOG_LEVEL=DEBUG` in environment
2. Restart service to apply
3. View expanded logs in Render
4. Check for Telegram API errors: connection, rate limits

**Session expired:**
1. Generate new session locally (see above)
2. Upload to Render persistent disk
3. Restart service

## Costs Estimation (Monthly)

| Component | Plan | Cost |
|-----------|------|------|
| Netlify Frontend | Starter (free) | $0 |
| Netlify Domain | Custom domain | $12 |
| Render Backend | Starter | $7 |
| Render PostgreSQL | Optional | $15 |
| **Total** | | **$34/month** |

*Starter backend has slow cold starts. Upgrade to Standard ($12) for better performance.*

## Rollback & Recovery

### Frontend (Netlify)

1. Go to Deploys tab
2. Click on previous deployment
3. "Publish deploy"
4. Automatic rollback to previous version

### Backend (Render)

1. Go to Logs
2. Find last known working deployment
3. Service → Settings → Restart
4. Or revert commit and re-push to trigger new deployment

## Useful Commands

```bash
# Test backend health
curl https://westbank-api.onrender.com/health

# Check API with filter
curl "https://westbank-api.onrender.com/incidents?category=missiles"

# View backend logs (if using render CLI)
render logs -s westbank-api

# Test WebSocket connection
wscat -c wss://westbank-api.onrender.com/ws
```

## Next Steps

1. Deploy frontend to Netlify
2. Deploy backend to Render
3. Generate/upload Telegram session
4. Update environment variables in both
5. Test real-time connections
6. Monitor logs for errors
7. Share deployed URL with users
