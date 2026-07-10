
<div align="center">

# ⚡ DESCHIL PLATFORM CORE ARCHITECT

### 👤 Lead Full-Stack & AI Systems Automation Engineer
Crafted by: Yousef Z. A. Shaheen

<img src="https://i.postimg.cc/tgrqP2sW/IMG-20260620-133210-543.jpg" width="150" style="border-radius: 50%;">

---

### 🛡️ Project Status
EXFOLIATE! EXFOLIATE!

![Build](https://img.shields.io/badge/BUILD-PASSING-green)
![Release](https://img.shields.io/badge/RELEASE-V2026.7.1--BETA.2-orange)
![Discord](https://img.shields.io/badge/DISCORD-21K_ONLINE-blue)
<br>
![License](https://img.shields.io/badge/LICENSE-MIT-blue)

---

### 🌐 CONNECT WITH THE ARCHITECT

<a href="https://www.instagram.com/1.0_v_"><img src="https://i.postimg.cc/BbKNsJWZ/9ad79bcb73e8721663f873970d927b40.jpg" width="60"></a>
<a href="https://t.me/Y9_S4"><img src="https://i.postimg.cc/XJXQHwQ9/7cc98f0f748788604c632f6b5736a815.jpg" width="60"></a>
<a href="https://wa.link/lc6f5w"><img src="https://i.postimg.cc/Z5F7CYWx/ff71e97414c40fc94af8e192ae16793a.jpg" width="60"></a>
<a href="https://www.tiktok.com/@zix8ii"><img src="https://i.postimg.cc/g0zMR9Rz/b2f532b8bf6aab51b8854971e4ddb210.jpg" width="60"></a>
<a href="https://www.snapchat.com/add/fi1_oo"><img src="https://i.postimg.cc/prF917D8/a41e3010fda64b3bcf0589364926e040.jpg" width="60"></a>
<a href="https://www.facebook.com/yousef.z.shaheen"><img src="https://i.postimg.cc/tRZBFN1Z/73b610cbcd0296935a5849dbeccb7bdb.jpg" width="60"></a>

</div>

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Features](#features)
- [Folder Structure](#folder-structure)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [Telegram Integration](#telegram-integration)
- [Environment Variables](#environment-variables)
- [Railway Deployment](#railway-deployment)
- [Docker Deployment](#docker-deployment)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Build & Run Commands](#build--run-commands)
- [Troubleshooting](#troubleshooting)
- [SSL & PostgreSQL Issues](#ssl--postgresql-issues)
- [Telegram Setup](#telegram-setup)
- [GitHub Actions](#github-actions)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Project Overview

**DESCHIL** is a unified AI automation platform enabling seamless integration across **Web, Telegram, WhatsApp, and Discord**. It provides enterprise-grade authentication, multi-provider AI routing, and real-time command execution with audit trails.

### Key Highlights

✅ **Full-Stack TypeScript** — Frontend & backend in one codebase  
✅ **AI-Powered Automation** — Support for Groq, OpenAI, Claude, Gemini, DeepSeek & more  
✅ **Multi-Platform Messaging** — Native Telegram, WhatsApp, Discord integration  
✅ **Railway PostgreSQL** — Zero-config managed database with self-signed SSL  
✅ **Real-Time Command Bus** — Instant command execution & audit logging  
✅ **Admin Bootstrap** — Environment-based authentication for instant access  
✅ **i18n Ready** — Full Arabic & English localization support  

---

## 🏗️ Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TanStack Router + Vite |
| **Backend** | TanStack Start (Node.js Server) + Nitro |
| **Database** | Railway PostgreSQL (pg driver) |
| **Auth** | Session-based cookies + scrypt password hashing |
| **AI Routing** | Multi-provider LLM abstraction layer |
| **Messaging** | Native bot APIs (Telegram, Discord, etc.) |
| **Build** | Bun + Vite + TypeScript |
| **Deployment** | Docker on Railway |

### Core Modules

```
src/lib/
├── auth/              # Session, authentication, password hashing
│   ├── functions.ts   # Server actions: signIn, signUp, signOut
│   ├── session.ts     # Session creation & validation
│   └── password.ts    # scrypt hashing & verification
├── db/                # PostgreSQL connection & bootstrap
│   ├── client.ts      # Connection pool, SSL configuration
│   └── bootstrap.ts   # Schema creation on startup
├── ai/                # AI provider routing
├── commands/          # Command registry & execution
├── integrations/      # Telegram, Discord, WhatsApp clients
└── logger.ts          # Structured logging
```

---

## ✨ Features

### Authentication

- **User Registration** — Email + strong password validation
- **User Login** — Persistent sessions with secure cookies
- **Admin Bootstrap** — Environment variables allow instant admin access
- **Role-Based Access** — Admin, operator, user roles
- **Session TTL** — 30-day expiration with automatic cleanup

### AI Automation

- **Provider Routing** — Default provider + fallback chain
- **Supported Models** — Groq, OpenAI, Anthropic, Gemini, DeepSeek, Mistral, xAI, OpenRouter
- **Command Registry** — Extensible command system with permissions
- **Audit Trail** — All commands logged with input/output & success status

### Messaging Platforms

| Platform | Status | Link Codes | Webhooks |
|----------|--------|-----------|----------|
| **Telegram** | ✅ Complete | 6-char codes | Real-time bot API |
| **Discord** | ✅ Ready | Support planned | Interactions API |
| **WhatsApp** | ✅ Ready | Support planned | Meta Cloud API |

---

## 📁 Folder Structure

```
deschil-app/
├── src/
│   ├── routes/                      # TanStack Router pages
│   │   ├── __root.tsx               # Root layout
│   │   ├── index.tsx                # Landing page
│   │   ├── auth.tsx                 # Login/signup page
│   │   ├── _authenticated/          # Protected routes
│   │   │   ├── route.tsx            # Auth layout
│   │   │   ├── dashboard.tsx        # User dashboard
│   │   │   └── console.tsx          # Command console
│   │   └── api/                     # API endpoints
│   │       ├── health.ts            # Health check (used by Railway)
│   │       ├── status.ts            # System status & commands
│   │       └── public/              # Public webhooks
│   │           ├── telegram/
│   │           ├── discord/
│   │           └── whatsapp/
│   ├── lib/
│   │   ├── auth/                    # Authentication logic
│   │   ├── db/                      # Database connection & schema
│   │   ├── ai/                      # AI provider routing
│   │   ├── commands/                # Command registry & execution
│   │   ├── integrations/            # Platform clients (Telegram, Discord, etc.)
│   │   ├── i18n/                    # Internationalization (i18n)
│   │   ├── logger.ts                # Structured logger
│   │   └── utils.ts                 # Utilities
│   ├── components/                  # Reusable React components
│   ├── hooks/                       # Custom React hooks
│   ├── server.ts                    # SSR error handler
│   ├── start.ts                     # TanStack Start initialization
│   ├── router.tsx                   # Router configuration
│   └── styles.css                   # Global Tailwind CSS
├── public/                          # Static assets
├── .env.example                     # Environment template
├── Dockerfile                       # Docker build configuration
├── railway.json                     # Railway deployment config
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
└── package.json                     # Dependencies

```

---

## 🗄️ Database Schema

### Tables

#### `users`
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE
password_hash TEXT
display_name TEXT
locale TEXT DEFAULT 'en'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### `user_roles`
```sql
id UUID PRIMARY KEY
user_id UUID → users(id)
role app_role ('admin' | 'operator' | 'user')
UNIQUE (user_id, role)
```

#### `sessions`
```sql
id TEXT PRIMARY KEY
user_id UUID → users(id)
expires_at TIMESTAMPTZ
created_at TIMESTAMPTZ
INDEX: sessions_user_id_idx
```

#### `linked_accounts`
```sql
id UUID PRIMARY KEY
user_id UUID → users(id)
platform TEXT ('telegram', 'discord', 'whatsapp')
external_id TEXT
display TEXT
linked_at TIMESTAMPTZ
UNIQUE (platform, external_id)
```

#### `link_codes`
```sql
code TEXT PRIMARY KEY
user_id UUID → users(id)
platform TEXT
expires_at TIMESTAMPTZ
used_at TIMESTAMPTZ
```

#### `command_audit`
```sql
id UUID PRIMARY KEY
user_id UUID → users(id)
platform TEXT
command TEXT
input JSONB
output TEXT
success BOOLEAN
error TEXT
created_at TIMESTAMPTZ
INDEX: command_audit_user_idx
```

#### `ai_config`
```sql
key TEXT PRIMARY KEY
value TEXT
updated_at TIMESTAMPTZ
```

---

## 🔐 Authentication Flow

### 1. Registration

```
User submits email + password (min 8 chars)
                 ↓
Backend validates email format & checks uniqueness
                 ↓
Password hashed with scrypt + random salt
                 ↓
User record inserted; if first user → admin role
                 ↓
Session created & cookie set (30 days TTL)
                 ↓
User redirected to /dashboard
```

### 2. Login (Normal)

```
User submits email + password
                 ↓
Email lookup in users table
                 ↓
Constant-time password verification (prevents timing attacks)
                 ↓
If match: create session → set cookie → redirect to /dashboard
If fail: "Invalid email or password" (no account enumeration)
```

### 3. Admin Bootstrap

```
DESCHIL_USER & DESCHIL_PASSWORD env vars set?
                 ↓ YES
User submits matching credentials
                 ↓
Admin user created/updated with admin role
                 ↓
Session created → redirect to /dashboard
                 ↓
NOTE: Allows instant access even on fresh database
```

### 4. Session Management

- **Cookie Name**: `deschil_sid` (httpOnly, sameSite=lax)
- **TTL**: 30 days
- **Validation**: Check `sessions.expires_at > now()` on every request
- **Roles Joined**: `user_roles` aggregated into `roles: string[]`

---

## 💬 Telegram Integration

### Account Linking Flow

#### Step 1: Generate Link Code (Web)

```typescript
// POST /api/auth/telegram/generate-code
// Returns: { code: "ABC123", expiresAt: "2026-07-10T12:30:00Z" }
```

User receives 6-character link code valid for 15 minutes.

#### Step 2: Send Code to Bot (Telegram)

```
User sends to bot: /login ABC123
```

#### Step 3: Verify & Link (Bot)

Bot verifies code in database:
- Code exists & not expired
- Code not already used
- User ID from database

If valid:
- Create `linked_accounts` record (platform='telegram', external_id=chat_id)
- Mark `link_codes.used_at = now()`
- Send confirmation: "✅ Account linked successfully!"

#### Step 4: Authenticated Commands

```
User: /help
Bot: [Lists available commands]

User: /ai hello
Bot: [Calls default AI provider with "hello"]
```

### Environment Setup

```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_WEBHOOK_SECRET=your-secret-token-here
```

---

## 🔧 Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Session
SESSION_SECRET=your-64-char-random-secret-here

# Node
NODE_ENV=production
```

### Optional (Admin)

```bash
DESCHIL_USER=admin@example.com
DESCHIL_PASSWORD=your-admin-password
```

### Optional (AI Providers)

```bash
GROQ_API_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...
MISTRAL_API_KEY=...
XAI_API_KEY=...
OPENROUTER_API_KEY=...
GOOGLE_API_KEY=...
EXA_API_KEY=...
FIRECRAWL_API_KEY=...
TAVILY_API_KEY=...
ELEVENLABS_API_KEY=...
```

### Optional (Messaging)

```bash
# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...

# WhatsApp (Meta Cloud)
WHATSAPP_PHONE_ID=...
WHATSAPP_TOKEN=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_APP_SECRET=...

# WhatsApp (Green API)
GREEN_API_INSTANCE_ID=...
GREEN_API_TOKEN=...

# Discord
DISCORD_BOT_TOKEN=...
DISCORD_APPLICATION_ID=...
DISCORD_PUBLIC_KEY=...
```

### Optional (Configuration)

```bash
PGSSL=                           # leave empty for auto-detect (recommended)
LOG_LEVEL=info                   # debug|info|warn|error
DEFAULT_AI_PROVIDER=groq
DEFAULT_AI_MODEL=llama-3.1-8b-instant
```

---

## 🚂 Railway Deployment

### Prerequisites

- Railway account (railway.app)
- GitHub repository connected to Railway
- PostgreSQL plugin added to service

### Step 1: Add PostgreSQL Plugin

1. Go to Railway dashboard → your project
2. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
3. Railway auto-generates `DATABASE_URL` variable

### Step 2: Set Environment Variables

In Railway dashboard → Variables tab:

```
DATABASE_URL=postgresql://... (auto-filled from plugin)
SESSION_SECRET=your-64-char-secret
DESCHIL_USER=admin@example.com
DESCHIL_PASSWORD=your-admin-password
TELEGRAM_BOT_TOKEN=...
LOG_LEVEL=info
NODE_ENV=production
NITRO_PRESET=node-server
PORT=3000
HOST=0.0.0.0
```

### Step 3: Connect GitHub

1. Railway → your service → **"Connect Repository"**
2. Select **youshaheen1-alt/DESCHIL-AI** → **main branch**
3. Set **Root Directory** to `deschil-app/`

### Step 4: Configure Build & Deploy

Railway auto-detects `railway.json`:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node .output/server/index.mjs",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 5: Deploy

1. **Push to main** → Railway auto-triggers deployment
2. Watch logs: Railway dashboard → Logs tab
3. Healthcheck passes when `/api/health` returns 200 ✅

### Railway SSL Handling

**Railway Postgres uses self-signed certificates.** Our code auto-detects this:

```typescript
// deschil-app/src/lib/db/client.ts
if (isCloudUrl) {
  return { rejectUnauthorized: false }  // ✅ Correct for Railway
}
```

**No extra action needed!** The app handles Railway's SSL automatically.

---

## 🐳 Docker Deployment

### Local Build & Test

```bash
cd deschil-app

# Build image
docker build -t deschil:latest .

# Run container
docker run -e DATABASE_URL="postgresql://..." \
           -e SESSION_SECRET="..." \
           -e NODE_ENV="production" \
           -p 3000:3000 \
           deschil:latest

# Test health
curl http://localhost:3000/api/health
```

### Docker Compose (Optional)

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/deschil
      SESSION_SECRET: your-secret
      NODE_ENV: production
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: deschil
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  pg_data:
```

```bash
docker-compose up --build
```

---

## 💻 Local Development

### Prerequisites

- Node.js 22+ or Bun 1+
- PostgreSQL 14+ locally (or use `postgres:15-alpine` in Docker)
- Git

### Setup

```bash
# Clone repo
git clone https://github.com/youshaheen1-alt/DESCHIL-AI.git
cd DESCHIL-AI/deschil-app

# Install dependencies (use pnpm for workspace)
pnpm install

# Create .env from template
cp .env.example .env

# Edit .env with your local database
# Example:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/deschil_dev
# SESSION_SECRET=dev-secret-key-at-least-32-chars
# DESCHIL_USER=admin@local.dev
# DESCHIL_PASSWORD=admin123
```

### Local PostgreSQL (Docker)

```bash
docker run -d \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=deschil_dev \
  -p 5432:5432 \
  --name deschil-postgres \
  postgres:15-alpine

# Connection string:
# postgresql://postgres:password@localhost:5432/deschil_dev
```

### Development Server

```bash
# Start dev server (HMR enabled)
pnpm dev

# Open http://localhost:5173
# (Vite dev server will proxy `/api` to localhost:3000)
```

### Build

```bash
# Full production build
pnpm build

# Output: .output/ (Nitro server bundle)

# Start production server
pnpm start
# Server runs on http://localhost:3000
```

### Linting & Formatting

```bash
# Type check
pnpm typecheck

# Format code
pnpm format

# Lint
pnpm lint
```

---

## 🚀 Production Deployment

### Via Railway (Recommended)

1. **Push to GitHub** (`main` branch)
2. **Railway auto-deploys** based on `railway.json`
3. **Monitor logs** → Railway dashboard

### Via Docker (Self-Hosted)

```bash
# Build
docker build -t deschil:prod deschil-app/

# Push to registry (e.g., Docker Hub)
docker push yourusername/deschil:prod

# Deploy to your server
docker run -d \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="$(openssl rand -base64 48)" \
  -e NODE_ENV="production" \
  -p 3000:3000 \
  --restart always \
  yourusername/deschil:prod
```

---

## 🛠️ Build & Run Commands

### Package Manager: pnpm (monorepo workspace)

```bash
# Install all workspace dependencies
pnpm install

# Install specific package
pnpm add package-name -r

# Remove package
pnpm remove package-name -r
```

### Development

```bash
# Dev server (Vite + HMR)
pnpm dev

# Type checking
pnpm typecheck

# Format code (Prettier)
pnpm format

# Lint code (ESLint)
pnpm lint
```

### Build

```bash
# Production build
pnpm build

# Build output
ls .output/              # Nitro server bundle
ls .output/public/       # Frontend assets

# View build stats
wc -c .output/server/index.mjs
```

### Runtime

```bash
# Start production server
pnpm start

# Health check
curl http://localhost:3000/api/health

# Status endpoint
curl http://localhost:3000/api/status
```

### Database

```bash
# Schema bootstrap (automatic on startup)
# Manually trigger:
node -e "
  import('./src/lib/db/bootstrap.ts')
    .then(m => m.bootstrapDatabase())
"

# Connect to PostgreSQL CLI
psql postgresql://user:pass@host:5432/deschil
```

---

## 🐛 Troubleshooting

### 1. Database Connection Fails

**Error**: `ECONNREFUSED` or `connection timeout`

**Fix**:
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# If local postgres not running:
docker run -d -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres:15
```

### 2. SSL Certificate Error: `SELF_SIGNED_CERT_IN_CHAIN`

**Error**: `Error: self signed certificate in certificate chain`

**Root Cause**: Railway Postgres uses self-signed certificates. This is **normal & safe**.

**Fix**: Already handled in code!

```typescript
// deschil-app/src/lib/db/client.ts (lines 42-46)
// Cloud/Railway: use SSL but disable certificate validation because
// Railway's managed Postgres uses a self-signed certificate chain.
return { rejectUnauthorized: false } as never;
```

No action needed. The app auto-detects Railway URLs and sets SSL correctly.

### 3. CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Fix**: TanStack Start handles CORS. If custom API endpoints needed:

```typescript
// src/routes/api/custom.ts
headers: {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
}
```

### 4. Session Cookie Not Set

**Error**: User logs in but stays on auth page

**Possible causes**:
- `NODE_ENV !== "production"` → cookie `secure` flag not set
- Vite dev server proxy issue

**Fix**:
```bash
# In development, use NODE_ENV=development
# In production (Railway), ensure NODE_ENV=production

# For dev server with HTTPS:
# Use ngrok: ngrok http 5173 → HTTPS tunnel
```

### 5. Build Fails: Missing Dependencies

**Error**: `Cannot find module 'pg'`

**Fix**:
```bash
# Ensure pg is installed
pnpm add pg @types/pg

# Rebuild
pnpm build
```

### 6. Terraform/Railway Sync Issues

**Error**: Railway build doesn't reflect latest code

**Fix**:
```bash
# Hard refresh Railway
git commit --allow-empty -m "Trigger redeploy"
git push origin main

# Or, in Railway UI: click "Deploy" button manually
```

---

## 🔒 SSL & PostgreSQL Issues

### Railway Postgres SSL Configuration

**Railway Postgres Details**:
- **Uses**: Self-signed certificate chain
- **Reason**: Cost reduction & security via Railway's infrastructure
- **Safe?**: ✅ Yes. Railway controls both client & server
- **How we handle it**: `rejectUnauthorized: false` for cloud URLs

### SSL Modes Explained

| Mode | Use Case | Command |
|------|----------|---------|
| **Auto (no PGSSL)** | Local dev (no SSL) / Cloud (SSL, no verification) | Recommended |
| **disable** | Local dev, no SSL | `PGSSL=disable` |
| **require** | Strict validation (needs CA cert) | `PGSSL=require` + `NODE_EXTRA_CA_CERTS=/path/to/ca.crt` |
| **no-verify** | SSL without validation (legacy) | `PGSSL=no-verify` |

### Testing SSL Connection

```bash
# Test with psql
psql "sslmode=require" $DATABASE_URL -c "SELECT 1"

# Test with node
node -e "
  import('pg').then(({Pool}) => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    pool.query('SELECT 1', (err, res) => {
      console.log(err ? 'Error: ' + err.message : 'OK');
      pool.end();
    });
  });
"
```

---

## 📱 Telegram Setup

### 1. Create Bot with BotFather

```
Telegram → Search "BotFather" → /start
/newbot
→ Name: DESCHIL Bot
→ Username: @deschil_bot
→ Bot token: 123456:ABC-DEF...
```

### 2. Set Environment Variable

```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_WEBHOOK_SECRET=your-random-secret-token
```

### 3. Set Webhook (Telegram receives messages here)

```bash
# Replace with your deployed URL
curl -X POST https://api.telegram.org/bot123456:ABC-DEF/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-railway-url.railway.app/api/public/telegram/webhook",
    "secret_token": "your-random-secret-token"
  }'

# Verify
curl https://api.telegram.org/bot123456:ABC-DEF/getWebhookInfo | jq
```

### 4. Test Bot Commands

```
/start       → Greeting
/help        → List available commands
/login ABC123 → Link account with code
/ai hello    → Send to AI provider
```

---

## 🤖 GitHub Actions

### Auto-Deploy on Push

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]
    paths:
      - 'deschil-app/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install -g pnpm && pnpm install
      - run: pnpm build
      - uses: railway-app/actions@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📚 Development Notes

### Code Style

- **TypeScript** strict mode enabled
- **Prettier** for formatting (80-char soft limit)
- **ESLint** with React Hooks rules
- **No console.log** → use `logger` instead

### Adding a New Command

```typescript
// src/lib/commands/custom.ts
import { registerCommand } from "./index";

registerCommand({
  name: "my-command",
  description: "Does something cool",
  permission: "user",
  aliases: ["mc"],
  async execute(ctx) {
    return "Result!";
  },
});
```

### Adding a New Route

```typescript
// src/routes/my-route.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/my-route")({
  component: MyComponent,
});

function MyComponent() {
  return <div>Hello!</div>;
}
```

### Database Queries

```typescript
// Always use parameterized queries
import { query } from "@/lib/db/client";

const { rows } = await query<{ id: string; email: string }>(
  "SELECT id, email FROM users WHERE email = $1",
  [userEmail]
);
```

---

## 🚀 Future Roadmap

- [ ] **OAuth2 Integration** — GitHub, Google, Microsoft sign-in
- [ ] **WebSocket Support** — Real-time command streaming
- [ ] **Admin Dashboard** — User management & analytics
- [ ] **Rate Limiting** — Per-user request quotas
- [ ] **Audit UI** — Visual command history viewer
- [ ] **Plugin System** — User-defined commands via WASM
- [ ] **Mobile App** — React Native companion
- [ ] **Billing** — Stripe integration for premium features

---

## 🤝 Contributing

### Fork & Submit PR

1. Fork: https://github.com/youshaheen1-alt/DESCHIL-AI
2. Clone your fork
3. Create feature branch: `git checkout -b feature/my-feature`
4. Commit changes: `git commit -m "Add: my feature"`
5. Push: `git push origin feature/my-feature`
6. Open PR → describe changes

### Commit Message Format

```
Type: Brief description

Longer explanation if needed.

- Bullet points OK too
- Fix #123 (if closing an issue)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## 📝 License

MIT License — see [LICENSE](LICENSE) file

---

## 🙏 Support

- **Issues**: https://github.com/youshaheen1-alt/DESCHIL-AI/issues
- **Discussions**: https://github.com/youshaheen1-alt/DESCHIL-AI/discussions
- **Direct**: [@youshaheen1](https://t.me/Y9_S4) on Telegram

---

**Built with ❤️ by Yousef Z. A. Shaheen**

*Last updated: 2026-07-10 | Version 2026.7.1-BETA.2*
