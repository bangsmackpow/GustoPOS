# syntax=docker/dockerfile:1

# Stage 1: builder - install dependencies and build the API server
FROM node:20-alpine AS builder
WORKDIR /app
ENV CI=true

# Install pnpm
RUN npm install -g pnpm

# Copy workspace metadata and all package.json files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json ./lib/db/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY scripts/package.json ./scripts/

# Install all dependencies
RUN pnpm install --no-frozen-lockfile
    
# Copy the rest of the repo
COPY . .

# Build the API server (esbuild will bundle almost all dependencies)
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# Stage 2: runtime image
FROM node:20-alpine
WORKDIR /app

# Install Litestream and ca-certificates
RUN apk add --no-cache ca-certificates wget sqlite

# Download static Litestream binary
RUN wget https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64-static.tar.gz && \
    tar -xzf litestream-v0.3.13-linux-amd64-static.tar.gz && \
    mv litestream /usr/local/bin/litestream && \
    rm litestream-v0.3.13-linux-amd64-static.tar.gz

# Ensure data directory exists
RUN mkdir -p /app/data && chmod 777 /app/data

# Copy only the essentials from the builder
# 1. The single-file bundle
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
# 2. Database artifacts
COPY --from=builder /app/lib/db/migrations ./lib/db/migrations
COPY --from=builder /app/db/seeds ./lib/db/seeds
# 3. Configuration
COPY --from=builder /app/artifacts/api-server/litestream.yml /etc/litestream.yml

# Note: We NO LONGER copy node_modules. esbuild has bundled express, drizzle, libsql, etc.
# into the single artifacts/api-server/dist/index.mjs file.

# Expose the API port
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# The CMD checks if Litestream is configured. 
CMD ["sh", "-c", "if [ -n \"$LITESTREAM_REPLICA_URL\" ]; then litestream restore -if-db-not-exists -if-replica-exists /app/data/gusto.db && litestream replicate -exec 'node --enable-source-maps artifacts/api-server/dist/index.mjs'; else node --enable-source-maps artifacts/api-server/dist/index.mjs; fi"]
