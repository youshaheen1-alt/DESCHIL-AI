# DESCHIL — Unified AI Automation

One backend for web, Telegram, WhatsApp, and Discord. Bring your own AI providers.

## Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start v1.168 (React 19, SSR) |
| Build | Vite 8 + Nitro 3 (node-server preset) |
| Database | PostgreSQL via `pg` (any Postgres — Railway, Supabase, Neon, etc.) |
| Auth | Session-based (`deschil_sid` HTTP-only cookie, scrypt password hashing) |
| AI | Multi-provider router — OpenAI, Anthropic, Gemini, Groq, DeepSeek, Mistral, xAI, OpenRouter, Lovable |
| Integrations | Telegram Bot API · WhatsApp (Green API + Meta Cloud) · Discord HTTP interactions |
| i18n | English + Arabic (RTL) |
| Package manager | Bun (Docker build stage) → Node 22 (runtime) |

## Quick Start

```bash
# Install
bun install

# Develop
cp .env.example .env   # fill in DATABASE_URL and SESSION_SECRET at minimum
bun run dev

# Build for production
bun run build

# Run production server
bun run start           # node .output/server/index.mjs
```

## Environment Variables

See `.env.example` for the full annotated list. Minimum required for the app to start:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. Railway auto-provides this via the Postgres plugin. |
| `SESSION_SECRET` | **Yes** | Long random secret for session signing. Generate: `openssl rand -base64 48` |
| `PGSSL` | No | SSL mode: leave unset for Railway (auto `rejectUnauthorized:false`), `disable` for local, `require` for strict. |
| `DESCHIL_USER` | Recommended | Admin email — always lets you log in, creates the account if missing. |
| `DESCHIL_PASSWORD` | Recommended | Admin password (plain text, checked at login time). |
| `LOG_LEVEL` | No | `debug` / `info` / `warn` / `error` (default: `info`) |
| `DEFAULT_AI_PROVIDER` | No | Which AI provider to use first (default: first enabled provider). |
| `DEFAULT_AI_MODEL` | No | Override the provider's default model. |
| `GROQ_API_KEY` | No* | Groq API key. *Set at least one AI key to enable AI commands. |
| `SUPABASE_URL` | No | Supabase project URL (if using Supabase as Postgres host). |
| `SUPABASE_ANON_KEY` | No | Supabase anonymous key. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key. |

### Railway Postgres — SSL Note

Railway Postgres uses self-signed certificates. The app defaults to
`{ rejectUnauthorized: false }` for all non-localhost `DATABASE_URL` values.
This is correct and expected — do **not** set `PGSSL=require` on Railway unless
you have configured `NODE_EXTRA_CA_CERTS` with Railway's CA bundle.

## Authentication

### Regular users
Sign up at `/auth`. The first registered user automatically receives the `admin` role.

### Admin via environment variables
Set `DESCHIL_USER` and `DESCHIL_PASSWORD`. You can always sign in with those
credentials even on a fresh database — the account is created automatically on
first login and is always granted the `admin` role.

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Server + DB health check |
| `GET` | `/api/status` | None | Version, providers, commands |
| `POST` | `/api/command` | Session cookie | Execute a command |
| `POST` | `/api/public/telegram/webhook` | Telegram secret header | Telegram Bot updates |
| `GET/POST` | `/api/public/whatsapp/webhook` | HMAC signature | WhatsApp messages |
| `POST` | `/api/public/discord/interactions` | Ed25519 signature | Discord interactions |

## Commands

The same command runs on all platforms (web, Telegram, WhatsApp, Discord):

| Command | Aliases | Permission | Description |
|---|---|---|---|
| `help` | `h`, `?` | public | List all commands |
| `ping` | — | public | Health check |
| `version` | `v` | public | Show version |
| `status` | — | public | Runtime status, providers, platforms |
| `health` | — | public | DB health check |
| `providers` | — | public | List AI providers and their status |
| `config` | — | admin | Show AI config |
| `ai-chat` | `ai`, `chat`, `ask` | public | Chat with the AI router |

## Docker

```bash
# Build image (Bun builder → Node 22 runner)
docker build -t deschil .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host/db" \
  -e SESSION_SECRET="$(openssl rand -base64 48)" \
  -e DESCHIL_USER="admin@example.com" \
  -e DESCHIL_PASSWORD="strong-password" \
  deschil
```

## Railway Deployment

1. Create a Railway project and connect this GitHub repo
2. Add the **PostgreSQL** plugin — Railway auto-injects `DATABASE_URL`
3. Set these environment variables in the Railway dashboard:
   - `SESSION_SECRET` — `openssl rand -base64 48`
   - `DESCHIL_USER` — your admin email
   - `DESCHIL_PASSWORD` — your admin password
   - `NODE_ENV=production`
   - *(optional)* any AI provider keys
4. Railway detects the `Dockerfile` from `railway.json` and deploys automatically
5. On first boot the app creates all database tables automatically

The `railway.json` sets:
- Builder: `DOCKERFILE`
- Start command: `node .output/server/index.mjs`
- Restart policy: on failure (max 10 retries)

## Architecture

```
src/
├── routes/
│   ├── __root.tsx              Root layout, i18n, error boundaries
│   ├── index.tsx               Landing page
│   ├── auth.tsx                Sign-in / sign-up form
│   ├── _authenticated/
│   │   ├── route.tsx           Auth guard + nav layout
│   │   ├── dashboard.tsx       User dashboard
│   │   └── console.tsx         Command console UI
│   └── api/
│       ├── health.ts           GET /api/health
│       ├── status.ts           GET /api/status
│       ├── command.ts          POST /api/command
│       └── public/             Webhook endpoints (no session required)
│           ├── telegram/
│           ├── whatsapp/
│           └── discord/
├── lib/
│   ├── ai/
│   │   ├── providers.ts        Provider catalog (14 providers)
│   │   └── router.ts           Chat router with fallback
│   ├── auth/
│   │   ├── functions.ts        signUp, signIn, signOut, getCurrentUser
│   │   ├── session.ts          Session CRUD (PostgreSQL backed)
│   │   └── password.ts         scrypt hashing
│   ├── commands/
│   │   ├── bus.ts              Registry, dispatch, middleware, audit
│   │   ├── core.ts             Built-in commands
│   │   ├── types.ts            TypeScript interfaces
│   │   └── index.ts            Public re-exports
│   ├── db/
│   │   ├── client.ts           pg Pool with Railway-compatible SSL
│   │   └── bootstrap.ts        Schema auto-creation (CREATE TABLE IF NOT EXISTS)
│   ├── integrations/
│   │   ├── telegram.ts         Bot API + webhook verification
│   │   ├── whatsapp.ts         Green API + Meta Cloud
│   │   └── discord.ts          Ed25519 interaction verification
│   └── i18n/                   English + Arabic translations
└── server.ts                   SSR entry wrapper
```
