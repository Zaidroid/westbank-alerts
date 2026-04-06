# Repository Structure

Complete guide to the westbank-full-stack repository layout and what each directory/file does.

## Root Level

```
westbank-full-stack/
├── backend/                # FastAPI backend service
├── frontend/               # React + Vite + TailwindCSS PWA
├── README.md              # Main documentation (START HERE)
├── SETUP.md               # Quick setup for local development
├── DEPLOYMENT.md          # Production deployment guide
├── CONFIG_CHECKLIST.md    # Environment variable reference
├── BACKEND_README.md      # Detailed API documentation
├── STRUCTURE.md           # This file
├── docker-compose.yml     # Docker compose for local development
├── quickstart.sh          # Quick setup script
└── .gitignore             # Git ignore rules
```

## Backend Directory

```
backend/
├── app/
│   ├── main.py           # FastAPI app & all REST endpoints
│   ├── monitor.py        # Telegram polling loop (5s interval)
│   ├── classifier.py     # Alert classification engine
│   │                      # Two-tier: Tier 1 (missiles/sirens), Tier 2 (ops)
│   │                      # Channel-aware noise filtering
│   ├── database.py       # SQLite schemas & CRUD operations
│   │                      # - alerts table
│   │                      # - checkpoints table
│   │                      # - summaries table
│   │                      # - deduplication with word-level Jaccard
│   ├── checkpoint_parser.py  # Checkpoint status parsing from text
│   │                          # Whitelist-validated extraction
│   └── utils.py              # Shared utilities (normalization, etc.)
├── requirements.txt       # Python dependencies
├── Dockerfile            # Docker build instructions
├── .env.example          # Example environment variables
├── data/                 # SQLite database files (created at runtime)
│   ├── alerts.db         # All alerts, incidents, summaries
│   └── checkpoints.db    # Checkpoint statuses and metadata
└── session/              # Telegram session (created at first login)
    └── wb_alerts.session # Persistent login token
```

### Key Backend Files

**main.py** - The core FastAPI application
- 50+ REST endpoints for alerts, checkpoints, routes, etc.
- WebSocket endpoint at `/ws` for real-time streaming
- CORS configuration
- Health check at `/health`
- Swagger documentation at `/docs`

**monitor.py** - Telegram monitoring loop
- Polls configured channels every 5 seconds
- Extracts messages from Telegram
- Passes to classifier for processing
- Stores in database via database.py

**classifier.py** - Alert classification
- Tier 1: Missile alerts, siren alerts (security/threat)
- Tier 2: Military operations, raids, arrests (conflict activity)
- Channel-aware noise filtering (relaxed for news channels)
- Uses Arabic NLP with normalization

**database.py** - Data persistence layer
- SQLite schema definitions
- CRUD operations for all tables
- Content deduplication (24-hour window, 0.6 Jaccard similarity)
- Query functions for filtering/sorting

**checkpoint_parser.py** - Extract checkpoint updates
- Whitelist-validated checkpoint extraction
- Regex patterns for status keywords
- Coordinate parsing if present
- Used in monitor.py to parse status updates

## Frontend Directory

```
frontend/
├── src/
│   ├── pages/
│   │   └── MobileApp.tsx      # Main 4-tab app shell
│   │                          # Home | Route | Checkpoints | Alerts
│   │                          # + Fullscreen map overlay
│   ├── components/
│   │   ├── mobile/
│   │   │   ├── HomeScreen.tsx        # Live map + quick stats
│   │   │   ├── RouteScreen.tsx       # Route planning + alternatives
│   │   │   ├── CheckpointsScreen.tsx # Checkpoint list with filters
│   │   │   ├── AlertsScreen.tsx      # Categorized incident feed
│   │   │   ├── OnboardingFlow.tsx    # 8-step walkthrough (NEW)
│   │   │   ├── MobileHeader.tsx      # Top status bar + settings
│   │   │   ├── SplashScreen.tsx      # Loading screen
│   │   │   ├── SettingsSheet.tsx     # Settings & saved routes
│   │   │   ├── KpiDetailSheet.tsx    # Detailed KPI view
│   │   │   └── CheckpointCard.tsx    # Reusable checkpoint component
│   │   ├── MapView.tsx               # Leaflet-based interactive map
│   │   ├── DetailPanel.tsx           # Expandable incident details
│   │   ├── ErrorBoundary.tsx         # Error handling wrapper
│   │   └── PwaInstallPrompt.tsx      # "Install app" prompt
│   ├── hooks/
│   │   ├── useRealtime.ts            # WebSocket + TanStack Query
│   │   ├── useCheckpoints.ts         # Checkpoint polling
│   │   ├── useActiveRoute.ts         # Current route state
│   │   ├── useSavedRoutes.ts         # localStorage for saved routes
│   │   ├── usePushNotifications.ts   # Browser notifications
│   │   └── useGeolocation.ts         # Device location
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts            # Axios + error handling
│   │   │   └── types.ts             # TypeScript interfaces
│   │   ├── i18n.ts                  # Arabic/English translations
│   │   ├── routes.ts                # 15 pre-defined routes + geolocation
│   │   ├── utils.ts                 # Shared utilities
│   │   └── constants.ts             # Theme colors, status mappings
│   ├── index.tsx                    # React root
│   └── App.tsx                      # App wrapper
├── public/
│   ├── manifest.json                # PWA manifest
│   └── ... (icons, assets)
├── vite.config.ts                   # Vite build config
├── tailwind.config.js               # TailwindCSS theme
├── tsconfig.json                    # TypeScript config
├── package.json                     # Node dependencies
├── .env.local                       # Environment (created by setup)
└── dist/                            # Build output (created by npm run build)
```

### Key Frontend Files

**MobileApp.tsx** - Main app shell
- 4 tabs: Home, Route, Checkpoints, Alerts
- Manages state for all screens
- Integrates onboarding flow
- Handles bottom navigation

**OnboardingFlow.tsx** - First-time user walkthrough (NEW)
- 8 steps: Welcome, Dashboard, Checkpoints, Routes, Alerts, Map, Permissions, Ready
- Animated SVG illustrations (no external assets)
- Swipe navigation with spring transitions
- Inline permission requests
- localStorage persistence (`wb-onboarding-done`)

**AlertsScreen.tsx** - Categorized incident feed
- Filter tabs: All, Missiles and Sirens, Military Operations, Attacks, On Your Route
- Sorted by severity (critical → high → medium → low), then timestamp
- Uses AlertExpandCard for all incidents
- Maps to category/type from backend

**HomeScreen.tsx** - Live dashboard
- Real-time map with checkpoints and alerts
- KPI pills: Critical alerts count, Route issues, Checkpoint closures
- Quick filters to navigate to other screens
- Shows active route if selected

**RouteScreen.tsx** - Route planning
- 15 pre-defined routes (Ramallah, Bethlehem, Nablus, etc.)
- Custom route builder
- Geolocation-aware alternatives
- Safety assessment (blocked checkpoints, alerts on route)

**CheckpointsScreen.tsx** - Checkpoint list
- Filter by status: All, Closed, Military, Congested
- Sortable: by name, region, status
- Live updates stream
- Tap to view details

**MapView.tsx** - Interactive map
- Leaflet-based mapping
- Checkpoint markers with status colors
- Alert markers with severity indicators
- User location pin
- Active route overlay
- Click to expand details

**useRealtime.ts** - Real-time data sync
- WebSocket connection to `/ws`
- TanStack Query for caching
- Auto-reconnect on disconnect
- Parses alert and checkpoint updates

**useCheckpoints.ts** - Checkpoint data
- Periodic polling of `/checkpoints`
- TanStack Query background refresh
- Filters by status/region
- Cached locally

**useActiveRoute.ts** - Route state management
- Current selected route
- Navigation state
- Clear route action

**useSavedRoutes.ts** - localStorage persistence
- Save/load favorite routes
- localStorage key: `wb-saved-routes`
- Add/remove operations

## Configuration Files

### docker-compose.yml
Defines both services for local Docker development:
- Backend service on port 8000
- Frontend service on port 3000
- Shared network for inter-service communication
- Volumes for data persistence

### Dockerfile locations
- `backend/Dockerfile` - Python 3.10, FastAPI, Gunicorn
- Frontend uses Vite default build (no Dockerfile here, uses Netlify)

## Documentation Files

### README.md
Main overview covering:
- Project structure
- Quick start (local dev)
- Configuration reference
- Key features
- Architecture diagram
- API endpoints

### SETUP.md
Step-by-step setup for local development:
- Telegram API credential setup
- Backend configuration
- Frontend configuration
- Running both services
- Verification steps
- Troubleshooting

### DEPLOYMENT.md
Production deployment guide:
- Netlify frontend setup
- Render backend setup
- Railway alternative
- Environment variables
- Post-deployment verification
- Monitoring setup
- Cost estimation
- Troubleshooting

### CONFIG_CHECKLIST.md
Quick reference for all environment variables:
- By environment (local, production)
- All supported variables with descriptions
- Common mistakes and fixes
- Deployment sequence

### BACKEND_README.md
Detailed API documentation:
- Schema definitions
- All 50+ endpoints with examples
- Real-time WebSocket format
- Alert categorization
- Checkpoint parsing

## File Purposes Quick Reference

| File | Purpose | Who Edits It |
|------|---------|--------------|
| README.md | Main docs | Occasionally |
| SETUP.md | Local setup guide | Rarely |
| DEPLOYMENT.md | Production guide | Rarely |
| CONFIG_CHECKLIST.md | Env vars reference | When adding new config |
| BACKEND_README.md | API docs | When changing API |
| STRUCTURE.md | This file | Rarely |
| main.py | REST endpoints | When adding features |
| classifier.py | Alert logic | When tuning detection |
| monitor.py | Telegram polling | When changing polling |
| database.py | Data persistence | When changing schema |
| MobileApp.tsx | App shell | When changing navigation |
| AlertsScreen.tsx | Incident feed | When changing display |
| HomeScreen.tsx | Dashboard | When changing home |
| OnboardingFlow.tsx | Onboarding | When changing flow |

## Development Workflow

### Adding a New Feature

1. **Backend:** Edit relevant file in `backend/app/`
2. **Frontend:** Edit component in `frontend/src/components/`
3. **Test:** Run both services locally
4. **Commit:** Push to GitHub
5. **Deploy:** Services auto-deploy from GitHub

### Adding a New Endpoint

1. Create function in `backend/app/main.py`
2. Add TypeScript interface in `frontend/src/lib/api/types.ts`
3. Create API client function in `frontend/src/lib/api/client.ts`
4. Use in component via custom hook
5. Test with `/docs` Swagger UI

### Adding a New Filter/Category

1. Define in `backend/app/database.py` (schema/enum)
2. Update classifier in `backend/app/classifier.py`
3. Add UI tab in `frontend/src/components/mobile/AlertsScreen.tsx`
4. Test filtering works

## Environment Setup

See SETUP.md for full walkthrough, but briefly:

1. Copy `backend/.env.example` to `backend/.env`
2. Add Telegram credentials
3. Copy frontend setup (auto-created by quickstart.sh)
4. Run `./quickstart.sh` to automate setup

## Database Schema

SQLite databases auto-created at startup:

**alerts.db:**
- `alerts` table (incidents)
- `summaries` table (KPI data)
- `checkpoint_updates` table (recent changes)

**checkpoints.db:**
- `checkpoints` table (status, coords, metadata)

See BACKEND_README.md for full schema.

## Build & Deployment

### Frontend Build
```bash
cd frontend && npm run build
# Output: frontend/dist/ (static files)
# Deploy to Netlify
```

### Backend Build
```bash
cd backend && docker build -t westbank-api .
# Or: pip install -r requirements.txt
# Run: gunicorn -k uvicorn.workers.UvicornWorker app.main:app
# Deploy to Render/Railway
```

## Git Ignore

Excluded from version control:
- `/backend/.env` - Credentials
- `/backend/data/` - SQLite databases
- `/backend/session/` - Telegram session
- `/frontend/.env.local` - Frontend secrets
- `/frontend/node_modules/` - Dependencies
- `/frontend/dist/` - Build output

See `.gitignore` for complete list.

## Next Steps

1. **Local Setup:** Run `./quickstart.sh`
2. **Local Dev:** See SETUP.md
3. **Production:** See DEPLOYMENT.md
4. **API Details:** See BACKEND_README.md
5. **Config:** See CONFIG_CHECKLIST.md
