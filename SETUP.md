# Initial Setup Guide

Quick setup instructions for getting West Bank Alerts running locally.

## Prerequisites

- **Node.js:** 18+ ([download](https://nodejs.org))
- **Python:** 3.10+ ([download](https://www.python.org))
- **Git:** ([download](https://git-scm.com))
- **Active Telegram Account:** For monitoring channels

## Step 1: Telegram API Credentials

### Get API ID and Hash

1. Go to https://my.telegram.org
2. Log in with your phone number
3. Click "API development tools"
4. Create a new application:
   - App name: "West Bank Alerts"
   - Short name: "wb-alerts"
5. Copy your **API ID** and **API Hash**
6. Get your **Phone Number** (with country code)

### Find Channel IDs

Telegram channel IDs start with `-100`. To find them:

```bash
# Option 1: Using Python
python3 << 'EOF'
from telethon.sync import TelegramClient

api_id = YOUR_API_ID
api_hash = "YOUR_API_HASH"
phone = "+1234567890"

with TelegramClient('test_session', api_id, api_hash) as client:
    # List all dialogs (chats/channels)
    for dialog in client.get_dialogs():
        if "checkpoint" in dialog.name.lower() or "alert" in dialog.name.lower():
            print(f"{dialog.name}: {dialog.id}")
EOF

# Option 2: Forward a message from the channel
# The channel ID is in the forward header
```

## Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
# Telegram Credentials
TELEGRAM_API_ID=YOUR_API_ID
TELEGRAM_API_HASH=YOUR_API_HASH
TELEGRAM_PHONE=+1234567890
TELEGRAM_SESSION=wb_alerts

# Channels to Monitor (get from step above)
CHECKPOINT_CHANNEL_ID=-1001234567890
ALERT_CHANNEL_ID=-1001234567891

# Server
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO

# Monitoring
MONITOR_INTERVAL=5
DEDUP_WINDOW_HOURS=24

# CORS (for frontend)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
EOF

# Edit .env with your actual credentials
# nano .env
```

### Authenticate with Telegram

First-time setup requires interactive login:

```bash
python -m app.main
```

You'll see:
```
Session file not found. Please authenticate.
Please enter your phone number (including country code): +1234567890
Please enter the code you received: 12345
```

Once authenticated, the session is saved to `session/wb_alerts.session`.

**Important:** Keep this session file safe. Do not commit to GitHub!

## Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:8000
VITE_API_WSS_URL=ws://localhost:8000
EOF
```

## Step 4: Run Locally

### Option A: Run Both Services (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python -m app.main
```

Backend runs on: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Option B: Docker

Ensure both `.env` files are configured, then:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## Step 5: Verify Setup

1. **Backend is running:**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status": "healthy"}
   ```

2. **Frontend loads:**
   - Open `http://localhost:5173` in browser
   - Should see app shell with 4 tabs

3. **Real-time connection:**
   - Open DevTools → Network → WS filter
   - Should see WebSocket connection to backend
   - Should show status: "Connected" or "101 Switching Protocols"

4. **Alerts appearing:**
   - Check `/incidents` endpoint: `curl http://localhost:8000/incidents`
   - Should return JSON array of incidents
   - Check frontend Alerts tab

## Common Issues

### "Session file not found" error

**Fix:**
```bash
# Delete old session
rm -f backend/session/wb_alerts.session*

# Re-run backend and authenticate
python -m app.main
```

### "Dial timeout" - Can't connect to Telegram

**Causes:**
- VPN/proxy issues
- Telegram API rate limiting
- Network firewall

**Fix:**
```bash
# Try with IPv6 disabled
export TELETHON_DISABLE_IPV6=1
python -m app.main
```

### Frontend can't reach backend

**Causes:**
- Backend not running on port 8000
- CORS issue
- Wrong `VITE_API_URL`

**Fix:**
```bash
# Check backend is running
netstat -an | grep 8000  # Should show LISTEN

# Check CORS_ORIGINS includes frontend URL
# Edit backend/.env and verify

# Verify frontend .env.local
cat frontend/.env.local

# Check browser console for errors
# DevTools → Console tab
```

### WebSocket connection failing

**Causes:**
- Backend not accepting WebSocket upgrades
- CORS blocking upgrade headers

**Fix:**
```bash
# Test WebSocket directly
wscat -c ws://localhost:8000/ws

# Check backend logs for upgrade errors
```

### "Address already in use" error

**Solution:**
```bash
# Find what's using the port
lsof -i :8000        # Backend port
lsof -i :5173        # Frontend port

# Kill the process
kill -9 <PID>

# Or use different ports
# Edit backend/.env and frontend vite.config.ts
```

## Development Tips

### Enable Debug Logging

```bash
# backend/.env
LOG_LEVEL=DEBUG

# Frontend devtools
# Open DevTools → Console, check Network XHR/WS
```

### Inspect Database

```bash
# SQLite CLI
sqlite3 backend/data/alerts.db

# List tables
.tables

# Check alerts
SELECT * FROM alerts LIMIT 5;

# Check checkpoints
SELECT * FROM checkpoints WHERE status='closed';

# Exit
.quit
```

### Test API Endpoints

```bash
# Get all incidents
curl http://localhost:8000/incidents

# With filters
curl "http://localhost:8000/incidents?category=missiles&severity=high"

# Get checkpoints
curl http://localhost:8000/checkpoints

# Get routes
curl http://localhost:8000/routes

# See all endpoints
curl http://localhost:8000/docs
```

### Hot Reload

**Frontend:** Changes to `.tsx`/`.ts` files auto-reload (Vite)

**Backend:** Changes require server restart
```bash
# Stop (Ctrl+C) and restart
python -m app.main
```

## Next Steps

1. Verify both services are running
2. Check `/incidents` endpoint has data
3. Visit frontend and see live map
4. Try the onboarding flow
5. Enable push notifications
6. Install as PWA (desktop/mobile)

For deployment, see `DEPLOYMENT.md`.
