# ---------------------------------------------------------------------------
# Stage 1: Build & Dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma native binary runtime in Alpine
RUN apk add --no-cache openssl

# Copy package management files
COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install all dependencies including devDependencies for build
RUN npm ci || npm install

# Copy application source code
COPY . .

# Generate Prisma Client for Linux runtime
RUN npm run prisma:generate

# Build frontend production bundle
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Production Runtime
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Install openssl for Prisma engine in runtime container
RUN apk add --no-cache openssl curl

ENV NODE_ENV=production
ENV PORT=8443

# Copy dependencies and built assets from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create local storage directory
RUN mkdir -p /app/storage

EXPOSE 8443

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8443/health || exit 1

CMD ["npx", "tsx", "src/server/index.ts"]
