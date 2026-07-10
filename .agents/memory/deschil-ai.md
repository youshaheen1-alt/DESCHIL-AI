---
name: DESCHIL-AI project
description: Audit and repair record for the DESCHIL TanStack Start app extracted from zip and pushed to GitHub.
---

## Key facts

- Project lives at `/home/runner/workspace/deschil-app/` — a standalone Bun project, NOT a pnpm workspace package.
- GitHub repo: `https://github.com/youshaheen1-alt/DESCHIL-AI`
- Build: `bun run build` (Vite 8 + Nitro 3 node-server preset)
- Output: `.output/server/index.mjs` (NOT `dist/` — Nitro v3 changed the output dir)
- Start: `node .output/server/index.mjs`

## Critical issues fixed

1. **Output path mismatch** — original Dockerfile/railway.json/Procfile referenced `dist/server/index.mjs`; Nitro v3 outputs to `.output/server/index.mjs`. Fixed all three files.
2. **Missing `start` script** — added `"start": "node .output/server/index.mjs"` to package.json.
3. **Deprecated API** — `createServerFn().inputValidator()` → `.validator()` in auth/functions.ts and admin/functions.ts.
4. **WhatsApp webhook unauthenticated** — added X-Hub-Signature-256 HMAC verification for Meta Cloud; fail-503 in prod when WHATSAPP_APP_SECRET missing.
5. **Telegram fail-open** — verifyTelegramSecret() now returns false in production when TELEGRAM_WEBHOOK_SECRET is unset; dev-only skip with warning.
6. **DB TLS rejectUnauthorized:false** — replaced with explicit PGSSL env var; defaults to strict TLS for cloud, no SSL for localhost.
7. **No GitHub Actions** — added .github/workflows/ci.yml and deploy.yml (couldn't push via git due to token scope; files exist locally).

**Why:** Token `youshaheen1-alt` lacked `workflow` scope so GitHub Actions files couldn't be pushed via git push. Use GitHub UI or a token with workflow scope to add them.

## Packages of note

- `@lovable.dev/vite-tanstack-config` and `nitro@3.0.260603-beta` ARE available on npm (bun resolves them); `bun install --frozen-lockfile` works.
- `bun.lock` must be committed for Docker `--frozen-lockfile` to work.
