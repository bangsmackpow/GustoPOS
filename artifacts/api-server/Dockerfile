# syntax=docker/dockerfile:1

# Stage 1: builder - install dependencies and build the API server
FROM node:20-slim AS builder
WORKDIR /app
ENV CI=true

# Install pnpm
RUN npm install -g pnpm

# Copy workspace metadata and all package.json files for proper pnpm workspace resolution
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json ./lib/db/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY scripts/package.json ./scripts/

# Copy the rest of the repo
COPY . .

# Install all workspace dependencies
RUN pnpm install --no-frozen-lockfile
    
# Build the API server
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# Stage 2: runtime image
FROM node:20-slim
WORKDIR /app

# Install Litestream and ca-certificates (needed for S3/R2 HTTPS connections)
RUN apt-get update && apt-get install -y ca-certificates wget && \
    wget https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.deb && \
    dpkg -i litestream-v0.3.13-linux-amd64.deb && \
    rm litestream-v0.3.13-linux-amd64.deb && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create data directory and set permissions for non-root user
RUN mkdir -p /app/data && chown -R node:node /app/data

# Preserve the EXACT workspace structure to ensure all relative symlinks resolve correctly
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules
COPY --from=builder /app/artifacts/api-server/package.json ./artifacts/api-server/package.json

# Copy migrations and seeds needed for initialization
COPY --from=builder /app/lib/db/migrations /app/lib/db/migrations
COPY --from=builder /app/db/seeds /app/lib/db/seeds

# Copy Litestream config
COPY artifacts/api-server/litestream.yml /etc/litestream.yml
RUN chown node:node /etc/litestream.yml

# Switch to non-root user
USER node

# Expose the API port
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# The CMD checks if Litestream is configured. 
# If LITESTREAM_REPLICA_URL is present, it uses Litestream for replication.
# Otherwise, it starts the Node.js server directly.
CMD ["sh", "-c", "if [ -n \"$LITESTREAM_REPLICA_URL\" ]; then litestream restore -if-db-not-exists -if-replica-exists /app/data/gusto.db && litestream replicate -exec 'node --enable-source-maps artifacts/api-server/dist/index.mjs'; else node --enable-source-maps artifacts/api-server/dist/index.mjs; fi"]
