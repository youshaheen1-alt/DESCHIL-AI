# DESCHIL — Unified Automation Platform

One TanStack Start app on Railway. One database, one auth system, one command bus. Web dashboard is primary; Telegram, WhatsApp, Discord are alternate clients that dispatch the same commands.

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│           TanStack Start (Node) on Railway              │
│                                                         │
│  Web Dashboard ── server fns ─┐                         │
│  Telegram webhook  ───────────┤                         │
│  WhatsApp webhook  ───────────┼──► Command Bus ──► AI   │
│  Discord bot (WS + slash)  ───┘         │        Router │
│                                         ▼               │
│                                  Postgres (Railway)     │
└─────────────────────────────────────────────────────────┘
```

Everything (HTTP, webhooks, Discord gateway WebSocket) runs in one long-lived Node process — Railway supports that; the Cloudflare/edge preset is dropped for this build.

## Stack decisions

- **Runtime**: Node 22 on Railway, TanStack Start with Nitro `node-server` preset (already wired).
- **DB**: Railway Postgres via `pg` + Drizzle ORM (migrations checked into repo).
- **Auth**: email/password + session cookies via `lucia`-style hand-rolled sessions in Postgres (no Supabase — the user wants Railway-only). Roles: `admin`, `operator`, `user` in a `user_roles` table.
- **i18n**: `i18next` + `react-i18next`, JSON dictionaries for `ar` and `en`, RTL flip via `dir="rtl"` on `<html>` when Arabic. Bot replies localized per-user preference.
- **AI abstraction**: single `AIProvider` interface (`chat`, `stream`) with adapters for OpenAI, OpenRouter, Gemini, Anthropic, Groq, DeepSeek, Mistral, xAI. Provider + model selected per-command; keys from env; falls back to Lovable AI Gateway when no external key present.
- **Command bus**: `commands/*.ts` modules registered in a central `registry.ts`. Each command declares `{ name, description, schema (zod), requiredRole, handler(ctx) }`. All four clients dispatch through the same executor.

## File layout (new)

```text
src/
  routes/
    api/public/telegram/webhook.ts         # Telegram bot webhook
    api/public/whatsapp/webhook.ts         # WhatsApp Cloud API webhook (verify + receive)
    api/public/discord/interactions.ts     # Discord slash-command HTTP endpoint
    _authenticated/
      dashboard.tsx                        # command console
      providers.tsx                        # AI provider config viewer
      bots.tsx                             # bot status + webhook URLs
      users.tsx                            # RBAC admin
    auth.tsx                               # login/signup
    index.tsx                              # marketing landing
  lib/
    db/schema.ts                           # drizzle tables
    db/client.ts                           # pg pool
    auth/                                  # session helpers, password hashing (argon2)
    commands/
      registry.ts
      ai-chat.ts
      workflow-run.ts
      status.ts
      help.ts
    ai/
      types.ts                             # AIProvider interface
      router.ts                            # picks provider from env/config
      providers/{openai,openrouter,gemini,anthropic,groq,deepseek,mistral,xai,lovable}.ts
    bots/
      telegram.ts                          # send/receive helpers
      whatsapp.ts                          # Meta Cloud API helpers
      discord.ts                           # gateway client + slash registrar
      dispatch.ts                          # normalize message → command
    i18n/{index.ts,ar.json,en.json}
  server-start.ts                          # boot Discord gateway alongside HTTP
drizzle/                                   # migrations
```

## Bot wiring

- **Telegram**: webhook at `/api/public/telegram/webhook`, HMAC secret in `X-Telegram-Bot-Api-Secret-Token`. Users link their Telegram ID to a dashboard account via a one-time `/link CODE` flow.
- **WhatsApp**: Meta Cloud API webhook at `/api/public/whatsapp/webhook` (GET for verification challenge, POST for messages). Requires `WHATSAPP_PHONE_ID`, `WHATSAPP_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` (for signature check).
- **Discord**: two paths in one — HTTP interactions endpoint (`/api/public/discord/interactions`) for slash commands with Ed25519 signature verify, plus a long-lived gateway WebSocket connection started from `server-start.ts` for message events. Bot user gets slash commands registered on boot.

All three normalize incoming messages into `{ platform, externalUserId, text, attachments }`, resolve to a linked dashboard user (or reject with a link prompt), then call `commandBus.dispatch(...)`. Replies flow back through platform-specific senders.

## AI provider config

Env vars enable providers; missing = disabled:

```text
OPENAI_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY,
GROQ_API_KEY, DEEPSEEK_API_KEY, MISTRAL_API_KEY, XAI_API_KEY,
LOVABLE_API_KEY                        # fallback via Lovable AI Gateway
DEFAULT_AI_PROVIDER=openai             # which to route to by default
DEFAULT_AI_MODEL=gpt-5-mini
```

Admin dashboard shows which are configured (never the values) and lets admins set the default per-command in DB.

## Secrets to add (via Railway env or `add_secret`)

Bot: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_PUBLIC_KEY`.
Session: `SESSION_SECRET` (generated).
DB: `DATABASE_URL` (Railway Postgres).
AI: whichever providers the user wants active.

## Build phases (proposed order)

1. **Foundation** — DB schema, migrations, auth (email/password + sessions), RBAC, i18n scaffolding, updated `Dockerfile`/`railway.json` to run migrations on boot.
2. **Command bus + AI router** — interface, registry, first three commands (`help`, `status`, `ai-chat`), OpenAI + Lovable adapters as a proof.
3. **Web dashboard** — auth pages, command console, provider/bot/user admin pages, Arabic/English toggle with RTL.
4. **Telegram bot** — webhook route, message normalizer, link flow, reply sender; `setWebhook` script.
5. **WhatsApp bot** — verification GET, signed POST, sender via Cloud API.
6. **Discord bot** — interactions endpoint + gateway client started from `server-start.ts`, slash command registrar.
7. **Remaining AI adapters** — OpenRouter, Gemini, Anthropic, Groq, DeepSeek, Mistral, xAI.
8. **Polish** — rate limiting per user, audit log table, admin analytics.

## Notes / open questions

- **This is 6-10 turns of work minimum.** I'll do it phase by phase; after each phase you can course-correct.
- **User linking**: I'll default to a one-time code (`/link ABC123` in the bot after generating a code in the dashboard). Alternative is OAuth per platform — heavier, tell me if you'd rather.
- **WhatsApp provider**: I'll use Meta's official Cloud API (free tier, no per-message cost for service conversations under the 2025 rules). Twilio is an option if you already have a number there.
- **Discord gateway on Railway**: fine on Railway's persistent Node runtime, but it means only one instance can run at a time (single shard). Not a problem until you scale horizontally.
- **Confirm before I start Phase 1**: does this architecture match what you want, or do you want to swap anything (e.g. Supabase instead of hand-rolled auth, Twilio instead of Meta for WhatsApp, drop Arabic RTL, etc.)?