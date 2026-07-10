# DESCHIL — Unified AI Automation

One backend for web, Telegram, WhatsApp, and Discord. Bring your own AI providers.

## Stack

- **Framework**: TanStack Start (React SSR, file-based routing)
- **Build**: Vite 8 + Nitro 3 (node-server preset)
- **Database**: PostgreSQL (via `pg`)
- **Auth**: Session-based (scrypt password hashing)
- **AI**: Multi-provider router (OpenAI, Anthropic, Gemini, Groq, DeepSeek, Mistral, xAI, OpenRouter, Lovable)
- **Integrations**: Telegram Bot API, WhatsApp (Green API + Meta Cloud), Discord HTTP interactions
- **i18n**: English + Arabic (RTL support)
- **Package manager**: Bun

## Quick Start

```bash
# Install
bun install

# Develop
bun run dev

# Build for production
bun run build

# Run production server
bun run start
# or: node .output/server/index.mjs
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you need.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Random secret for session signing |
| `PORT` | No | HTTP port (default: 3000) |
| `NODE_ENV` | No | `production` or `development` |
| `NITRO_PRESET` | No | Nitro preset (default: `node-server`) |
| `DEFAULT_AI_PROVIDER` | No | Default AI provider ID |
| `DEFAULT_AI_MODEL` | No | Default AI model name |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, `error` |

### AI Providers (set at least one)

| Variable | Provider |
|---|---|
| `OPENAI_API_KEY` | OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | Google Gemini |
| `GROQ_API_KEY` | Groq |
| `OPENROUTER_API_KEY` | OpenRouter |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `MISTRAL_API_KEY` | Mistral |
| `XAI_API_KEY` | xAI Grok |
| `LOVABLE_API_KEY` | Lovable AI Gateway |

### Platform Integrations

| Variable | Integration |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram webhook security |
| `GREEN_API_INSTANCE_ID` + `GREEN_API_TOKEN` | WhatsApp via Green API |
| `WHATSAPP_PHONE_ID` + `WHATSAPP_TOKEN` + `WHATSAPP_VERIFY_TOKEN` | WhatsApp via Meta Cloud |
| `DISCORD_BOT_TOKEN` + `DISCORD_APPLICATION_ID` + `DISCORD_PUBLIC_KEY` | Discord HTTP interactions |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check (server + database) |
| `GET` | `/api/status` | Runtime status, providers, commands |
| `POST` | `/api/command` | Execute a command (requires session) |
| `POST` | `/api/public/telegram/webhook` | Telegram Bot webhook |
| `GET/POST` | `/api/public/whatsapp/webhook` | WhatsApp webhook |
| `POST` | `/api/public/discord/interactions` | Discord HTTP interactions |

## Commands

Commands run identically on web, Telegram, WhatsApp, and Discord:

| Command | Description | Permission |
|---|---|---|
| `help` / `h` / `?` | List all commands | public |
| `ping` | Health check | public |
| `version` / `v` | Show version | public |
| `status` | Runtime status | public |
| `health` | DB health check | public |
| `providers` | List AI providers | public |
| `config` | Show AI config | admin |
| `ai-chat` / `ai` / `ask` | Chat with AI | public |

## Docker

```bash
# Build image
docker build -t deschil .

# Run (with PostgreSQL)
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host/db \
  -e SESSION_SECRET=your-secret \
  deschil
```

## Railway Deployment

This project is pre-configured for Railway:

1. Connect your GitHub repo to Railway
2. Railway auto-detects the `Dockerfile` from `railway.json`
3. Add environment variables in the Railway dashboard
4. Add a PostgreSQL plugin — Railway auto-injects `DATABASE_URL`
5. Deploy 🚀

The `railway.json` specifies:
- Builder: `DOCKERFILE`
- Start command: `node .output/server/index.mjs`
- Restart policy: on failure (max 10 retries)

## Architecture

```
src/
├── routes/
│   ├── __root.tsx          # Root layout, error boundaries
│   ├── index.tsx           # Landing page
│   ├── auth.tsx            # Sign in / Sign up
│   ├── _authenticated/     # Protected routes (session required)
│   │   ├── route.tsx       # Auth guard + layout
│   │   ├── dashboard.tsx   # User dashboard
│   │   └── console.tsx     # Command console
│   └── api/
│       ├── health.ts       # Health endpoint
│       ├── status.ts       # Status endpoint
│       ├── command.ts      # Command API
│       └── public/         # Unauthenticated webhook endpoints
│           ├── telegram/
│           ├── whatsapp/
│           └── discord/
├── lib/
│   ├── ai/                 # AI router + provider catalog
│   ├── auth/               # Session, password, server functions
│   ├── commands/           # Command bus + core commands
│   ├── db/                 # PostgreSQL client + schema bootstrap
│   ├── integrations/       # Telegram, WhatsApp, Discord helpers
│   └── i18n/               # English + Arabic translations
└── server.ts               # SSR error wrapper (Nitro entry)
```
