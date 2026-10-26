# -----------------------------------------------------------------------------
# Stage 1: Install dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Build the Vite SPA and compile assets
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & copy PDF.js worker
RUN npx prisma generate
RUN node scripts/copy-pdfjs-worker.mjs

# Pre-seed template SQLite database with real dataset from temp/paperless_invoices_v5
RUN DATABASE_URL="file:./prisma/dev.db" npx prisma db push --skip-generate
RUN DATABASE_URL="file:./prisma/dev.db" npx tsx scripts/seed-invoices-v5.ts

ENV NODE_ENV=production

# Build the frontend with Vite (outputs to dist/)
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production runner (Express backend serving Vite SPA)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install libc6-compat and curl/wget for healthchecks
RUN apk add --no-cache libc6-compat wget curl

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create persistent directories and set ownership
RUN mkdir -p /app/data /app/cache /app/prisma && \
    chown -R nextjs:nodejs /app

# Copy dependencies, built frontend, and server code
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/server ./server
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy prisma schema and initial seed db for persistent volume initialization
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy real engine dataset for demo/testing fallback
COPY --from=builder --chown=nextjs:nodejs /app/temp/paperless_invoices_v5 ./temp/paperless_invoices_v5

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npx", "tsx", "server/index.ts"]
