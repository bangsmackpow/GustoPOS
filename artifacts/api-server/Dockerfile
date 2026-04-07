# Stage 1: builder - install dependencies and build the API server
FROM node:20-alpine AS builder
WORKDIR /app
ENV CI=true

# Install pnpm and configure for non-interactive CI
RUN apk add --no-cache wget && npm install -g pnpm && pnpm config set confirmModulesPurge false

# Copy ALL files first for robust monorepo resolution
COPY . .

# Install all dependencies for build
RUN pnpm install --no-frozen-lockfile
    
# Build the API server
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# --- New Stage: Prune node_modules for production ---
# This ensures we have the NATIVE binaries for Alpine (musl)
FROM node:20-alpine AS prod-deps
WORKDIR /app
ENV CI=true
RUN npm install -g pnpm && pnpm config set confirmModulesPurge false
COPY . .

# Install ONLY production dependencies (includes native @libsql binaries)
RUN pnpm install --prod --no-frozen-lockfile

# Stage 2: runtime image
FROM node:20-alpine
WORKDIR /app

# Install Litestream and ca-certificates
RUN apk add --no-cache ca-certificates wget sqlite

# Download Litestream binary
RUN wget https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz && \
    tar -xzf litestream-v0.3.13-linux-amd64.tar.gz && \
    mv litestream /usr/local/bin/litestream && \
    rm litestream-v0.3.13-linux-amd64.tar.gz

# Ensure data directory exists
RUN mkdir -p /app/data && chmod 777 /app/data

# Copy production essentials
# 1. The bundle
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
# 2. Database artifacts
COPY --from=builder /app/lib/db/migrations ./lib/db/migrations
COPY --from=builder /app/db/seeds ./db/seeds
# 3. PRUNED node_modules (required for native binaries like @libsql)
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules
# 4. Configuration
COPY --from=builder /app/artifacts/api-server/litestream.yml /etc/litestream.yml

# Expose the API port
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
ENV MIGRATIONS_PATH=/app/lib/db/migrations

# Reverting to root user to ensure volume permissions work on all host systems
USER root

# The CMD checks if Litestream is configured. 
CMD ["sh", "-c", "if [ -n \"$LITESTREAM_REPLICA_URL\" ]; then litestream restore -if-db-not-exists -if-replica-exists /app/data/gusto.db && litestream replicate -exec 'node --enable-source-maps artifacts/api-server/dist/index.cjs'; else node --enable-source-maps artifacts/api-server/dist/index.cjs; fi"]
