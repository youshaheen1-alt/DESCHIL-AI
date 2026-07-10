# 🚂 DESCHIL Deployment Guide

Complete step-by-step guide for deploying DESCHIL on Railway, Docker, or local machines.

---

## 📚 Table of Contents

1. [Railway Deployment (Recommended)](#railway-deployment-recommended)
2. [Docker Deployment](#docker-deployment)
3. [Local Development](#local-development)
4. [SSL & PostgreSQL Troubleshooting](#ssl--postgresql-troubleshooting)
5. [Environment Configuration](#environment-configuration)
6. [Monitoring & Logs](#monitoring--logs)
7. [Rollback & Scaling](#rollback--scaling)

---

## 🚂 Railway Deployment (Recommended)

### Prerequisites

- Railway account (free tier available at [railway.app](https://railway.app))
- GitHub repository (public or connected to Railway)
- Domain name (optional, Railway provides free `.railway.app` subdomain)

### Step 1: Create Railway Project

```bash
# Option A: Via Railway Dashboard
1. Go to railway.app → "New Project"
2. Click "Create Project"

# Option B: Via Railway CLI
brew install railway  # macOS
choco install railway # Windows

railway login
railway init
```

### Step 2: Add PostgreSQL Database

```bash
# Via Dashboard:
1. Your Project → "+ New" → "Database" → "PostgreSQL"
2. Railway auto-generates DATABASE_URL

# Via CLI:
railway add
# Select "PostgreSQL"
```

### Step 3: Connect GitHub Repository

```bash
# Via Dashboard:
1. Your Project → "+ New" → "GitHub Repository"
2. Search "youshaheen1-alt/DESCHIL-AI"
3. Select repository → branch: "main"
4. Railway detects Dockerfile & railway.json automatically

# Via CLI:
railway connect  # Will prompt for repository
```

### Step 4: Configure Environment Variables

**In Railway Dashboard → Variables:**

```
# Database (auto-filled from PostgreSQL plugin)
DATABASE_URL=postgresql://...

# Session security (REQUIRED)
SESSION_SECRET=<64-char-random-string>
# Generate: openssl rand -base64 48

# Admin bootstrap (recommended)
DESCHIL_USER=admin@example.com
DESCHIL_PASSWORD=your-secure-password

# Telegram (if using)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret

# AI providers (at least one required for AI commands)
GROQ_API_KEY=your-groq-key
# or
OPENAI_API_KEY=your-openai-key

# Configuration
NODE_ENV=production
NITRO_PRESET=node-server
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
DEFAULT_AI_PROVIDER=groq
DEFAULT_AI_MODEL=llama-3.1-8b-instant
```

### Step 5: Configure Deployment Settings

**In Railway Dashboard → Deployment:**

```
Root Directory: deschil-app/
Build Command: (auto-detected from Dockerfile)
Start Command: node .output/server/index.mjs (auto-detected from railway.json)
Restart Policy: ON_FAILURE with max 10 retries
```

### Step 6: Deploy

```bash
# Option 1: Auto-deploy on GitHub push
git push origin main
# Railway automatically triggers deployment

# Option 2: Manual deploy via Dashboard
1. Your Project → Service → "Deploy" button

# Option 3: Via CLI
railway up
```

### Step 7: Monitor Deployment

```bash
# View logs
railway logs

# Check status
railway status

# Get deployment URL
railway domains
# Or check Dashboard → "Generate Domain"
```

### Step 8: Set Telegram Webhook (if using Telegram)

```bash
# Get your Railway domain
RAILWAY_URL="https://your-project.railway.app"

# Set webhook
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'${RAILWAY_URL}'/api/public/telegram/webhook",
    "secret_token": "'${TELEGRAM_WEBHOOK_SECRET}'"
  }'

# Verify
curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo | jq
```

### Step 9: Test Application

```bash
# Health check
curl https://your-project.railway.app/api/health
# Should return: {"status":"healthy","checks":{"server":"ok","database":"ok"},"ts":"..."}

# Status endpoint
curl https://your-project.railway.app/api/status
# Should return app version, commands, providers

# Web UI
Open https://your-project.railway.app in browser
```

### ✅ Railway Deployment Complete!

Your app is now live and auto-updates on every `git push main`.

---

## 🐳 Docker Deployment

### Build Locally

```bash
cd deschil-app

# Build image
docker build -t deschil:latest .

# View image size
docker images deschil
```

### Run Locally

```bash
# Start PostgreSQL
docker run -d \
  --name deschil-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=deschil \
  -p 5432:5432 \
  postgres:15-alpine

# Run app
docker run -d \
  --name deschil-app \
  -e DATABASE_URL="postgresql://postgres:password@host.docker.internal:5432/deschil" \
  -e SESSION_SECRET="$(openssl rand -base64 48)" \
  -e NODE_ENV=production \
  -e DESCHIL_USER=admin@local.dev \
  -e DESCHIL_PASSWORD=admin123 \
  -p 3000:3000 \
  deschil:latest

# Test
curl http://localhost:3000/api/health

# View logs
docker logs deschil-app

# Stop
docker stop deschil-app deschil-postgres
docker rm deschil-app deschil-postgres
```

### Docker Compose

```yaml
# docker-compose.yml (create in deschil-app/ directory)
version: '3.8'

services:
  app:
    build: .
    container_name: deschil-app
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/deschil
      SESSION_SECRET: ${SESSION_SECRET:-dev-secret-key-at-least-32-chars}
      NODE_ENV: production
      DESCHIL_USER: admin@local.dev
      DESCHIL_PASSWORD: admin123
      LOG_LEVEL: info
    depends_on:
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

  postgres:
    image: postgres:15-alpine
    container_name: deschil-postgres
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: deschil
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:

networks:
  default:
    name: deschil-network
```

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Test
curl http://localhost:3000/api/health

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Push to Docker Hub

```bash
# Login
docker login

# Tag image
docker tag deschil:latest yourusername/deschil:latest
docker tag deschil:latest yourusername/deschil:v1.0

# Push
docker push yourusername/deschil:latest
docker push yourusername/deschil:v1.0

# Pull on another machine
docker pull yourusername/deschil:latest
```

### Deploy to VPS/Self-Hosted

```bash
# SSH to VPS
ssh user@vps.example.com

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone repository
git clone https://github.com/youshaheen1-alt/DESCHIL-AI.git
cd DESCHIL-AI/deschil-app

# Create .env
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@postgres:5432/deschil
SESSION_SECRET=$(openssl rand -base64 48)
DESCHIL_USER=admin@example.com
DESCHIL_PASSWORD=your-secure-password
NODE_ENV=production
EOF

# Start with Docker Compose
docker-compose up -d

# Verify
curl http://localhost:3000/api/health

# Setup reverse proxy with Nginx (optional)
# sudo apt-get install nginx
# Configure /etc/nginx/sites-available/deschil
# Point to http://localhost:3000
```

---

## 💻 Local Development

### Prerequisites

```bash
# Node.js 22+
node --version  # v22.x.x

# Bun (optional, faster)
bun --version   # v1.x.x

# PostgreSQL 14+ or Docker
psql --version
docker --version
```

### Setup

```bash
# Clone repo
git clone https://github.com/youshaheen1-alt/DESCHIL-AI.git
cd DESCHIL-AI/deschil-app

# Install dependencies (uses pnpm workspace)
pnpm install
# or
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your local settings
nano .env  # or use your editor
```

### Local PostgreSQL

**Option 1: Docker (Recommended)**

```bash
docker run -d \
  --name deschil-dev-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=deschil_dev \
  -p 5432:5432 \
  postgres:15-alpine

# Connection string for .env:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/deschil_dev
```

**Option 2: Homebrew (macOS)**

```bash
brew install postgresql
brew services start postgresql

createdb deschil_dev
# Connection string:
# DATABASE_URL=postgresql://postgres@localhost/deschil_dev
```

**Option 3: Native Windows**

```powershell
# Download from https://www.postgresql.org/download/windows/
# Run installer, remember password
# Connection string:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/deschil_dev
```

### Development Server

```bash
# Terminal 1: Frontend + Backend Dev Server (HMR enabled)
pnpm dev

# Terminal 2: TypeScript checking (optional)
pnpm typecheck --watch
```

**Access**: http://localhost:5173 (Vite dev server)
- Frontend on port 5173
- Backend proxied to port 3000
- Hot reload on file changes

### Build & Test Production Build

```bash
# Full production build
pnpm build

# Output structure:
# .output/
# ├── server/
# │   └── index.mjs          # Main server entry
# └── public/                # Frontend assets

# Start production server
pnpm start

# Access: http://localhost:3000
```

### Code Quality

```bash
# Format code
pnpm format

# Lint (check for issues)
pnpm lint

# Type check
pnpm typecheck

# All checks
pnpm format && pnpm lint && pnpm typecheck
```

### Database Management

```bash
# Connect to local database
psql $DATABASE_URL

# View tables
\dt

# View schema
\d users

# Query example
SELECT email, created_at FROM users LIMIT 5;

# Exit
\q
```

### Debugging

```bash
# Enable debug logs
LOG_LEVEL=debug pnpm dev

# Browser DevTools
# 1. Open http://localhost:5173
# 2. F12 → Console, Network, Application tabs
# 3. Source maps enabled for TypeScript

# Server-side debugging
NODE_OPTIONS=--inspect pnpm start
# Then use Chrome DevTools: chrome://inspect
```

---

## 🔒 SSL & PostgreSQL Troubleshooting

### Issue: `SELF_SIGNED_CERT_IN_CHAIN`

**Symptoms**: Connection fails with certificate error

**Root Cause**: Railway PostgreSQL uses self-signed certificates (normal & safe)

**Solution**: Already handled in code!

```typescript
// src/lib/db/client.ts (lines 42-46)
// Cloud/Railway: use SSL but disable certificate validation
return { rejectUnauthorized: false } as never;
```

✅ No manual action needed.

### Issue: `ECONNREFUSED`

**Symptoms**: Cannot connect to database at all

**Fix**:
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# If local postgres not running:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=pass postgres:15
```

### Issue: Connection Timeout

**Symptoms**: Connection hangs for 10+ seconds then fails

**Fix**:
```bash
# Check if port 5432 is accessible
nc -zv localhost 5432

# For Railway: verify firewall allows outbound connections
# Railway provides DATABASE_URL automatically; if not set, check:
# 1. PostgreSQL plugin added to service?
# 2. Service linked to PostgreSQL?
# 3. Variables tab showing DATABASE_URL?
```

### SSL Configuration Reference

| Mode | Use | Env Var | Example |
|------|-----|---------|---------|
| **Auto (recommended)** | Local dev (no SSL) / Cloud (SSL, no verify) | (unset) | Leave blank |
| **disable** | Local dev, no SSL | `PGSSL=disable` | `PGSSL=disable` |
| **require** | Strict validation (needs CA cert) | `PGSSL=require` | `NODE_EXTRA_CA_CERTS=/path/to/ca.crt` + `PGSSL=require` |
| **no-verify** | SSL without validation | `PGSSL=no-verify` | `PGSSL=no-verify` |

---

## 🔧 Environment Configuration

### Required Variables

```bash
# Must be set for application to start
DATABASE_URL=postgresql://user:pass@host:5432/db
SESSION_SECRET=<openssl rand -base64 48>
```

### Recommended Variables

```bash
# Admin bootstrap (allows instant access)
DESCHIL_USER=admin@example.com
DESCHIL_PASSWORD=your-secure-password

# At least one AI provider
GROQ_API_KEY=your-api-key
# or OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.
```

### Optional Variables

```bash
# Configuration
NODE_ENV=production
NITRO_PRESET=node-server
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
DEFAULT_AI_PROVIDER=groq
DEFAULT_AI_MODEL=llama-3.1-8b-instant
PGSSL=                    # leave empty for auto-detect

# Messaging
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
DISCORD_BOT_TOKEN=...
WHATSAPP_TOKEN=...
```

### Generate SESSION_SECRET

```bash
# macOS / Linux
openssl rand -base64 48

# Windows PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object {Get-Random -Maximum 256}))

# Node.js (any platform)
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## 📊 Monitoring & Logs

### Railway Logs

```bash
# View recent logs
railway logs

# Stream live logs
railway logs --tail

# Filter logs
railway logs --search "error"
railway logs --search "database"

# Export logs
railway logs > logs.txt
```

### Docker Logs

```bash
# View logs
docker logs deschil-app

# Stream live
docker logs -f deschil-app

# Last 100 lines
docker logs --tail 100 deschil-app

# With timestamps
docker logs -t deschil-app
```

### Application Logs Format

Logs are JSON for easy parsing:

```json
{
  "ts": "2026-07-10T12:00:00.000Z",
  "level": "info",
  "msg": "server.boot",
  "version": "1.0.0",
  "dbConfigured": true,
  "adminConfigured": true
}
```

### Health Checks

```bash
# Application health
curl https://your-app.railway.app/api/health

# Response (healthy):
{
  "status": "healthy",
  "checks": {
    "server": "ok",
    "database": "ok"
  },
  "ts": "2026-07-10T12:00:00.000Z"
}

# Status endpoint
curl https://your-app.railway.app/api/status

# Response (includes version, commands, providers)
{
  "name": "DESCHIL SERVER",
  "version": "1.0.0",
  "uptime": 12345,
  "env": "production",
  "providers": { ... },
  "commands": [ ... ]
}
```

---

## 🔄 Rollback & Scaling

### Railway Rollback

```bash
# View deployment history
railway logs  # Shows all deployments

# Redeploy previous version
# Via Dashboard:
# 1. Deployments tab
# 2. Select previous deployment
# 3. Click "Redeploy"

# Via CLI:
railway redeploy  # Prompts for deployment to revert to
```

### Railway Scaling

```bash
# View current resources
railway status

# Scale up (via Dashboard):
# 1. Settings → Resources
# 2. Increase CPU/Memory
# 3. Save & redeploy

# Or via env variables:
# RAILWAY_PRESET=performance (or standard, economy)
```

### Docker Scaling

```bash
# Run multiple instances behind load balancer (Nginx)
docker run -d -p 3001:3000 deschil:latest
docker run -d -p 3002:3000 deschil:latest
docker run -d -p 3003:3000 deschil:latest

# Nginx config: round-robin across 3001, 3002, 3003
```

---

## 🔐 Security Best Practices

1. **Never commit `.env`** — use `.env.example` as template
2. **Rotate SESSION_SECRET** periodically (updates all sessions)
3. **Use HTTPS** — Railway & Docker reverse proxies enforce SSL
4. **Secure admin credentials** — use strong passwords
5. **Monitor logs** for unauthorized access attempts
6. **Keep dependencies updated** — `pnpm update` monthly
7. **Use Railway secrets** for sensitive credentials (not in code)

---

## 📞 Support

- **Issues**: https://github.com/youshaheen1-alt/DESCHIL-AI/issues
- **Discussions**: https://github.com/youshaheen1-alt/DESCHIL-AI/discussions
- **Telegram**: [@youshaheen1](https://t.me/Y9_S4)

---

**Last Updated**: 2026-07-10 | Version 2026.7.1-BETA.2
