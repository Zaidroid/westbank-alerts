# Configuration Checklist

Quick reference for all settings that need to be configured for different environments.

## Local Development

### Backend (`backend/.env`)

```bash
# Required
TELEGRAM_API_ID=123456789
TELEGRAM_API_HASH=abcdefg1234567890
TELEGRAM_PHONE=+1234567890
CHECKPOINT_CHANNEL_ID=-1001234567890
ALERT_CHANNEL_ID=-1001234567891

# Default values (optional to change)
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
MONITOR_INTERVAL=5
DEDUP_WINDOW_HOURS=24
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend (`frontend/.env.local`)

```bash
VITE_API_URL=http://localhost:8000
VITE_API_WSS_URL=ws://localhost:8000
```

**No other configuration needed for local development.**

---

## Production Deployment (Netlify + Render)

### Frontend (Netlify)

**Environment Variables** → Site Settings → Environment:

| Name | Value | Example |
|------|-------|---------|
| `VITE_API_URL` | Backend API URL | `https://westbank-api.onrender.com` |
| `VITE_API_WSS_URL` | WebSocket URL | `wss://westbank-api.onrender.com` |

**Build Settings:**

| Setting | Value |
|---------|-------|
| Base directory | `.` (root) |
| Build command | `cd frontend && npm install && npm run build` |
| Publish directory | `frontend/dist` |

**Post-Deployment:**

After backend is deployed, update these environment variables with correct URLs.

### Backend (Render)

**Environment Variables** → Environment:

| Name | Value | Notes |
|------|-------|-------|
| `TELEGRAM_API_ID` | Your ID | From https://my.telegram.org |
| `TELEGRAM_API_HASH` | Your hash | From https://my.telegram.org |
| `TELEGRAM_PHONE` | Your phone | +1234567890 format |
| `CHECKPOINT_CHANNEL_ID` | -100... | Telegram channel ID |
| `ALERT_CHANNEL_ID` | -100... | Telegram channel ID |
| `HOST` | `0.0.0.0` | Required for Render |
| `PORT` | `8000` | Required |
| `LOG_LEVEL` | `INFO` | Or `DEBUG` for troubleshooting |
| `MONITOR_INTERVAL` | `5` | Seconds between polls |
| `DEDUP_WINDOW_HOURS` | `24` | Hours to check for duplicates |
| `CORS_ORIGINS` | Your domain | `https://yourdomain.com` |

**Build & Deploy:**

| Setting | Value |
|---------|-------|
| Build Command | `pip install -r backend/requirements.txt` |
| Start Command | `cd backend && gunicorn -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 app.main:app` |

---

## Domain Changes

If you change your frontend domain (e.g., from `yourdomain.com` to `newdomain.com`):

### 1. Update Backend CORS

**Render → Environment:**

```
CORS_ORIGINS=https://newdomain.com,https://www.newdomain.com
```

Redeploy backend.

### 2. Verify WebSocket

Test WebSocket connects after domain change:

```bash
# Should return 101 Switching Protocols
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://your-api-domain.com/ws
```

### 3. Update Frontend API URL

**Netlify → Environment:**

```
VITE_API_URL=https://westbank-api.onrender.com
VITE_API_WSS_URL=wss://westbank-api.onrender.com
```

Netlify auto-redeploys.

---

## Optional: Push Notifications

If enabling Firebase push notifications:

### 1. Create Firebase Project

1. Go to https://firebase.google.com
2. Create new project
3. Get Web API Key

### 2. Backend Configuration

**Render → Environment:**

```
FIREBASE_KEY=your_firebase_web_api_key
```

### 3. Frontend Configuration

**Netlify → Environment:**

```
VITE_FIREBASE_CONFIG={"apiKey":"...", "projectId":"..."}
```

See `frontend/.env.example` for full Firebase config.

---

## Optional: PostgreSQL Database

To upgrade from SQLite to PostgreSQL:

### 1. Add Database to Render

**Render → Add-on → PostgreSQL**

- Render auto-provides `DATABASE_URL`

### 2. Update Backend

**Render → Environment:**

Add (Render auto-provides):
```
DATABASE_URL=postgres://user:pass@host:5432/dbname
```

Update code to use PostgreSQL driver.

### 3. Verify Connection

Backend logs should show successful database connection.

---

## API Endpoint Configuration

All endpoints are configurable via environment:

### Channel IDs

```
CHECKPOINT_CHANNEL_ID    # Where to read checkpoint updates
ALERT_CHANNEL_ID         # Where to read alert messages
```

### Polling Behavior

```
MONITOR_INTERVAL=5       # Check Telegram every 5 seconds
DEDUP_WINDOW_HOURS=24    # Check last 24 hours for duplicates
```

### Server Binding

```
HOST=0.0.0.0             # Listen on all interfaces
PORT=8000                # Listen on port 8000
```

### Logging

```
LOG_LEVEL=INFO           # INFO, DEBUG, WARNING, ERROR
```

---

## Verification Checklist

- [ ] Backend environment variables all set
- [ ] Frontend environment variables all set
- [ ] CORS_ORIGINS includes frontend domain
- [ ] Telegram session authenticated
- [ ] `/health` endpoint returns 200
- [ ] WebSocket connects successfully
- [ ] `/incidents` returns data
- [ ] Frontend loads with live data
- [ ] Real-time updates appear
- [ ] Onboarding shows for first-time users
- [ ] PWA can be installed

---

## Reset/Troubleshooting

### Reset Telegram Session

```bash
# Delete old session
rm backend/session/wb_alerts.session*

# Authenticate again
python -m app.main
```

### Reset Frontend Cache

**Netlify:**
- Deploy → Logs → "Trigger deploy"
- Or Build & Deploy → Cache → "Clear cache"

**Browser:**
- Clear site data: DevTools → Application → Clear Storage

### Full Reset

```bash
# Backend
cd backend
rm -rf venv
rm -rf data/*
rm -rf session/*
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Re-authenticate with Telegram

# Frontend
cd frontend
rm -rf node_modules
rm -rf dist
npm install
npm run build
```

---

## Environment Variables Reference

Complete list of all supported environment variables:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TELEGRAM_API_ID` | int | Required | From my.telegram.org |
| `TELEGRAM_API_HASH` | str | Required | From my.telegram.org |
| `TELEGRAM_PHONE` | str | Required | Phone with country code |
| `TELEGRAM_SESSION` | str | "wb_alerts" | Session filename |
| `CHECKPOINT_CHANNEL_ID` | int | Required | Checkpoint updates channel |
| `ALERT_CHANNEL_ID` | int | Required | Alert messages channel |
| `HOST` | str | "0.0.0.0" | Server binding address |
| `PORT` | int | 8000 | Server binding port |
| `LOG_LEVEL` | str | "INFO" | Logging level |
| `MONITOR_INTERVAL` | int | 5 | Polling interval (seconds) |
| `DEDUP_WINDOW_HOURS` | int | 24 | Dedup check window (hours) |
| `CORS_ORIGINS` | str | "http://localhost:3000" | CORS allowed origins |
| `DATABASE_URL` | str | Optional | PostgreSQL connection (if used) |
| `FIREBASE_KEY` | str | Optional | Firebase API key |
| `VITE_API_URL` | str | Optional | Frontend API URL |
| `VITE_API_WSS_URL` | str | Optional | Frontend WebSocket URL |

---

## Common Configuration Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Wrong CORS_ORIGINS | CORS error in DevTools | Update to match frontend domain |
| Missing TELEGRAM_PHONE | "Phone required" error | Add phone with country code |
| Invalid CHECKPOINT_CHANNEL_ID | "Channel not found" | Verify channel ID starts with -100 |
| Frontend uses old API URL | 404 or connection timeout | Update VITE_API_URL in Netlify |
| WebSocket uses wrong protocol | "Could not establish WebSocket" | Use `wss://` for HTTPS |
| Session file committed to git | Telegram login issues | Add session to .gitignore |
| Database file committed to git | Large repo size | Add data/ to .gitignore |

---

## Deployment Sequence

For first-time production deployment:

1. **Create backend (Render)**
   - Set all Telegram environment variables
   - Deploy and verify health check
   - Get backend URL: `https://westbank-api.onrender.com`

2. **Create frontend (Netlify)**
   - Set `VITE_API_URL` = backend URL
   - Set `VITE_API_WSS_URL` = backend URL (wss://)
   - Deploy and verify loads

3. **Test real-time**
   - Open frontend
   - DevTools → Network → WS
   - Should see WebSocket to backend

4. **Enable custom domain (optional)**
   - Netlify domain management
   - Update backend CORS_ORIGINS
   - Redeploy backend

5. **Verify monitoring**
   - Check `/incidents` endpoint
   - Should have real-time data from Telegram
   - Onboarding should appear on first visit
