# ──────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies using lock file for reproducible builds
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

# Copy all source files
COPY . .

# Build the app (Nitro node-server preset → .output/)
ENV NITRO_PRESET=node-server
RUN bun run build

# ──────────────────────────────────────────────
# Stage 2: Production runner (Node — no Bun needed at runtime)
# ──────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Nitro bundles almost everything; copy the output directory only.
# We also copy node_modules because pg uses a native-ish loader at runtime
# and needs the full pg package tree (pure-JS path, no pg-native required).
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
