# ──────────────────────────────────────────────────────────────────────────────
# Stage 1: Build  (Bun + full source)
# ──────────────────────────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies first (layer-cached until lock file changes)
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

# Copy all source files
COPY . .

# Build with Nitro node-server preset → .output/
ENV NITRO_PRESET=node-server
RUN bun run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2: Production runner  (Node only — no Bun at runtime)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Runtime environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Nitro bundles almost everything; we copy:
#   .output/         — the complete Nitro build (server + public assets)
#   node_modules/    — needed at runtime because pg uses the filesystem resolver
#                      for its pure-JS path (no pg-native required)
#   package.json     — needed for Node.js module resolution in some edge cases
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Healthcheck — Railway uses this to determine when the container is ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
