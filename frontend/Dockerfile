# =============================================================================
# AIVA Portal — production image (Vite SPA + Express API, one container)
#
#  - `vite build` runs with NODE_ENV=production → mock / bypass login are compiled OUT
#    (src/features/login/config.ts). Do not pass VITE_AUTH_MOCK / VITE_AUTH_BYPASS here.
#  - No demo data in the image: documents come only from the Engine (/api/engine/ingest).
#  - Runs as a non-root user; the database lives on a volume (SQLite) or in SQL Server (DATABASE_URL).
# =============================================================================

# ---- Stage 1: dependencies --------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
COPY scripts/copy-pdfjs-worker.mjs ./scripts/copy-pdfjs-worker.mjs
RUN npm ci

# ---- Stage 2: build ---------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN node scripts/copy-pdfjs-worker.mjs
ENV NODE_ENV=production
RUN npm run build

# ---- Stage 3: runner --------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN apk add --no-cache libc6-compat wget
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 aiva
RUN mkdir -p /app/data /app/cache && chown -R aiva:nodejs /app

COPY --from=builder --chown=aiva:nodejs /app/package*.json ./
COPY --from=builder --chown=aiva:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=aiva:nodejs /app/dist ./dist
COPY --from=builder --chown=aiva:nodejs /app/server ./server
COPY --from=builder --chown=aiva:nodejs /app/src ./src
COPY --from=builder --chown=aiva:nodejs /app/public ./public
COPY --from=builder --chown=aiva:nodejs /app/tsconfig.json ./tsconfig.json
# Schema only (no *.db): the entrypoint creates / migrates the real database.
COPY --from=builder --chown=aiva:nodejs /app/prisma/schema.prisma ./prisma/schema.prisma
# Operational scripts (integration check, backfill). db-reset refuses to run in production anyway.
COPY --from=builder --chown=aiva:nodejs /app/scripts ./scripts
COPY --chown=aiva:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER aiva
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npx", "tsx", "server/index.ts"]
