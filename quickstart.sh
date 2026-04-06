#!/bin/bash

# West Bank Alerts - Quick Start Script
# This script sets up the project for local development

set -e

echo "🚀 West Bank Alerts - Quick Start Setup"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v python3 &> /dev/null; then
    echo "${RED}❌ Python 3 not found. Please install Python 3.10+${NC}"
    exit 1
fi
echo "${GREEN}✓ Python 3${NC}"

if ! command -v node &> /dev/null; then
    echo "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo "${GREEN}✓ Node.js${NC}"

echo ""
echo "${BLUE}📁 Setting up backend...${NC}"

# Backend setup
cd backend

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Add your Telegram credentials here
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_PHONE=
CHECKPOINT_CHANNEL_ID=
ALERT_CHANNEL_ID=

# Server config (can leave as-is)
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
MONITOR_INTERVAL=5
DEDUP_WINDOW_HOURS=24
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
EOF
    echo "${YELLOW}⚠️  Created .env - please fill in Telegram credentials${NC}"
    echo "   Edit backend/.env and add your API ID, Hash, Phone, and Channel IDs"
else
    echo "${GREEN}✓ .env already exists${NC}"
fi

cd ..

echo ""
echo "${BLUE}📁 Setting up frontend...${NC}"

# Frontend setup
cd frontend

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install -q
else
    echo "${GREEN}✓ Dependencies already installed${NC}"
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:8000
VITE_API_WSS_URL=ws://localhost:8000
EOF
    echo "${GREEN}✓ Created .env.local${NC}"
else
    echo "${GREEN}✓ .env.local already exists${NC}"
fi

cd ..

echo ""
echo "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "${BLUE}📚 Next steps:${NC}"
echo ""
echo "1. ${YELLOW}Get Telegram credentials${NC}"
echo "   Visit: https://my.telegram.org"
echo "   Get your API ID and Hash"
echo ""
echo "2. ${YELLOW}Configure backend${NC}"
echo "   Edit: backend/.env"
echo "   Add: TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_PHONE"
echo "   Add: CHECKPOINT_CHANNEL_ID, ALERT_CHANNEL_ID"
echo ""
echo "3. ${YELLOW}Start services${NC}"
echo "   Terminal 1 (Backend):"
echo "   $ cd backend && source venv/bin/activate && python -m app.main"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   $ cd frontend && npm run dev"
echo ""
echo "4. ${YELLOW}Verify setup${NC}"
echo "   Backend: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Frontend: http://localhost:5173"
echo ""
echo "For detailed setup, see: SETUP.md"
echo ""
