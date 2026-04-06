# West Bank Alerts - Full Stack

A real-time monitoring system for West Bank checkpoints, alerts, and safe routes. Combines a React/Vite frontend PWA with a FastAPI backend service.

## Project Structure

```
westbank-full-stack/
├── frontend/                 # React + Vite + TailwindCSS PWA
│   ├── src/
│   │   ├── pages/           # Main app pages (MobileApp, etc.)
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and helpers
│   │   └── index.tsx
│   ├── public/              # Static assets
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.local          # Create from .env.example
│
├── backend/                 # FastAPI + SQLite
│   ├── app/
│   │   ├── main.py         # FastAPI app, all endpoints
│   │   ├── monitor.py      # Telegram monitoring loop
│   │   ├── classifier.py   # Alert classification engine
│   │   ├── database.py     # SQLite schemas & queries
│   │   ├── checkpoint_parser.py  # Checkpoint parsing
│   │   └── utils.py        # Shared utilities
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example        # Copy to .env
│   └── data/               # SQLite databases
│
├── docker-compose.yml       # Optional local development
├── DEPLOYMENT.md            # Deployment instructions
└── README.md               # This file
```

## Deployment (TL;DR)

Push to `main` branch — both services deploy automatically:

- **Frontend** → Netlify (free, CDN)
- **Backend** → Fly.io (free, always-on, no cold starts)

See `DEPLOYMENT.md` for one-time initial setup (~15 minutes).

---

## Quick Start (Local Development)

### Prerequisites

- **Frontend:** Node.js 18+
- **Backend:** Python 3.10+
- **Telegram Session:** Active Telegram account for message monitoring

### Local Development

#### Backend

```bash
cd backend

# Create Python environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your Telegram credentials, API keys, etc.

# Run development server
python -m app.main
```

Backend runs on `http://localhost:8000`

**API Documentation:** `http://localhost:8000/docs` (Swagger UI)

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with backend API URL

# Run development server
npm run dev
```

Frontend runs on `http://localhost:5173`

### Docker (Full Stack)

```bash
# Build and run both services
docker-compose up --build

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## Configuration

### Frontend Environment (`.env.local`)

```
VITE_API_URL=http://localhost:8000        # Backend API base URL
VITE_API_WSS_URL=ws://localhost:8000      # WebSocket URL for real-time updates
VITE_FIREBASE_CONFIG=...                  # Optional: push notifications
```

For production (Netlify):
```
VITE_API_URL=https://your-api-domain.com
VITE_API_WSS_URL=wss://your-api-domain.com
```

### Backend Environment (`.env`)

```
# Telegram
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_PHONE=+1234567890
TELEGRAM_SESSION=wb_alerts

# Monitoring
CHECKPOINT_CHANNEL_ID=-1001234567890
ALERT_CHANNEL_ID=-1001234567891
MONITOR_INTERVAL=5
DEDUP_WINDOW_HOURS=24

# Server
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO

# Optional
FIREBASE_KEY=...                  # For push notifications
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

See `BACKEND_README.md` for detailed API documentation.

## Deployment

See `DEPLOYMENT.md` for:
- **Frontend:** Netlify, Vercel, GitHub Pages
- **Backend:** Render, Railway, AWS, Docker
- **Database:** SQLite (included), or PostgreSQL migration guide
- **Real-time:** WebSocket setup, SSL/TLS configuration

## Key Features

### Backend

- **Real-time Monitoring:** 5-second polling from Telegram channels
- **Two-tier Classification:** Tier 1 (Missiles/Sirens), Tier 2 (Ground Operations)
- **Content Deduplication:** Word-level Jaccard similarity detection
- **Checkpoint Parsing:** Whitelist-validated extraction from text
- **REST API:** 50+ endpoints with filtering, pagination, real-time WebSocket
- **Database:** SQLite with multi-table schema for alerts, checkpoints, summaries

### Frontend

- **Progressive Web App:** Installable, offline-capable
- **Real-time Updates:** WebSocket + TanStack Query
- **4 Main Screens:** Live Map, Routes, Checkpoints, Alerts
- **Onboarding Flow:** 8-step guided walkthrough with animations
- **Arabic/RTL Support:** Full RTL layout, Arabic localization
- **Route Planning:** 15 pre-defined routes with geolocation-aware alternatives
- **Push Notifications:** Browser-native and service worker

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Frontend (React PWA)                           │
│  - MobileApp.tsx (4-tab shell)                  │
│  - HomeScreen, RouteScreen, CheckpointsScreen   │
│  - AlertsScreen (categorized feed)              │
│  - MapView, DetailPanel, OnboardingFlow         │
└──────────────────┬──────────────────────────────┘
                   │ REST + WebSocket
                   ▼
┌─────────────────────────────────────────────────┐
│  Backend (FastAPI)                              │
│  - /incidents (categorized feed)                │
│  - /checkpoints (with live updates)             │
│  - /routes (pre-defined + custom)               │
│  - /ws (real-time streaming)                    │
└──────────────────┬──────────────────────────────┘
                   │ Telegram API
                   ▼
┌─────────────────────────────────────────────────┐
│  Telegram Channels                              │
│  - Security checkpoint updates                  │
│  - Missile/siren alerts                         │
│  - News & incident reports                      │
└─────────────────────────────────────────────────┘
                   │ Data
                   ▼
┌─────────────────────────────────────────────────┐
│  SQLite Databases                               │
│  - alerts.db (incidents, dedup, summaries)      │
│  - checkpoints.db (status, coordinates, types)  │
└─────────────────────────────────────────────────┘
```

## API Endpoints

**Live Data:**
- `GET /incidents` - Categorized incident feed with filters
- `GET /incidents/summary` - Dashboard KPIs and threat levels
- `GET /checkpoints` - All checkpoints with current status
- `WS /ws` - Real-time stream (alerts, checkpoint updates)

**Routes:**
- `GET /routes` - All 15 pre-defined routes
- `POST /routes/check` - Check route safety
- `GET /routes/{id}` - Route details with checkpoint statuses

**Alerts:**
- `GET /alerts` - Historical alerts with filters
- `GET /alerts/{id}` - Alert details

**Checkpoints:**
- `GET /checkpoints/{key}` - Specific checkpoint status
- `GET /checkpoints/region/{region}` - Checkpoints in region

See `BACKEND_README.md` for complete API reference.

## Development

### Adding New Screens

1. Create component in `frontend/src/components/mobile/`
2. Add to navigation in `frontend/src/pages/MobileApp.tsx`
3. Use hooks: `useRealtime()`, `useCheckpoints()`, `useActiveRoute()`

### Adding New Alert Types

1. Define type in `frontend/src/lib/api/types.ts`
2. Add category in `classifier.py` (backend)
3. Add filter tab in `frontend/src/components/mobile/AlertsScreen.tsx`

### Extending Checkpoint Parser

1. Update patterns in `backend/app/checkpoint_parser.py`
2. Test with test cases in parser
3. Run checkpoint validation: `python -m app.checkpoint_parser`

## Monitoring & Debugging

**Backend Logs:**
```bash
tail -f data/alerts.db.log
# or if running with docker
docker-compose logs -f backend
```

**Frontend Performance:**
- Lighthouse: `npm run build && npm run preview`
- DevTools Network tab for WebSocket connections
- React DevTools extension for component profiling

**Database Inspection:**
```bash
sqlite3 data/alerts.db
SELECT COUNT(*) FROM alerts;
SELECT * FROM checkpoints WHERE status='closed';
```

## Common Tasks

### Update API Endpoint

1. Edit `backend/app/main.py`
2. Update type in `backend/app/database.py` if needed
3. Frontend: update `frontend/src/lib/api/` client calls
4. Test with: `curl http://localhost:8000/incidents`

### Deploy New Version

**Frontend (Netlify):**
1. Push to GitHub
2. Netlify auto-deploys from `main` branch
3. Verify environment variables in Netlify UI

**Backend (Render/Railway):**
1. Push to GitHub
2. Connected service auto-deploys
3. Check logs in hosting dashboard
4. Verify environment variables are set

### Handle Deployment Settings Changes

- **API URL:** Update `VITE_API_URL` in hosting platform environment variables
- **WebSocket URL:** Update `VITE_API_WSS_URL` (must use `wss://` for HTTPS)
- **CORS:** Update `CORS_ORIGINS` in backend `.env`
- **Database:** Can upgrade from SQLite to PostgreSQL (see `DEPLOYMENT.md`)

## Troubleshooting

**Frontend not connecting to backend:**
- Check `VITE_API_URL` in `.env.local`
- Verify backend is running and accessible
- Check browser console for CORS errors
- Ensure WebSocket URL uses correct protocol (`ws://` or `wss://`)

**No real-time updates:**
- Check `/ws` endpoint: `curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:8000/ws`
- Verify TanStack Query cache invalidation is working
- Check browser DevTools Network > WS tab

**Telegram session expired:**
- Delete `backend/session/wb_alerts.session*`
- Re-run backend, follow interactive login prompt
- Verify account has access to all monitored channels

**Database locked:**
- Ensure only one backend instance is running
- Check for stale `sqlite3` processes: `ps aux | grep sqlite`
- Restart backend service

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes (frontend and/or backend)
3. Test locally with both services running
4. Push and create PR with description
5. CI/CD will run tests and deploy to staging

## License

Proprietary - West Bank Alerts Project

## Support

For issues, feature requests, or questions:
1. Check existing GitHub issues
2. Review `BACKEND_README.md` for API details
3. Check deployment logs in hosting platform
4. Enable debug logging: `LOG_LEVEL=DEBUG` in backend `.env`
