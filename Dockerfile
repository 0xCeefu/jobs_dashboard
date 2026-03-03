# ── Stage 1: install all workspace deps ──────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile

# ── Stage 2: build the API ────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

# Copy full source
COPY apps/api ./apps/api
COPY packages/typescript-config ./packages/typescript-config
COPY turbo.json ./

RUN pnpm --filter=./apps/api run build

# ── Stage 3: prune to production deps only ────────────────────────────────────
FROM deps AS prod-deps
WORKDIR /app

RUN pnpm --filter=./apps/api --prod deploy /prod/api

# ── Stage 4: final lean image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Copy pruned node_modules and compiled output
COPY --from=prod-deps /prod/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 10000
ENV NODE_ENV=production
ENV PORT=10000

CMD ["node", "dist/main.js"]
