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

# Ensure data directory exists for SQLite and is writable
RUN mkdir -p /app/data && chmod 777 /app/data

# Preserve the EXACT workspace structure to ensure all relative symlinks resolve correctly
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules
COPY --from=builder /app/artifacts/api-server/package.json ./artifacts/api-server/package.json

# Copy migrations needed for auto-migration on startup
COPY --from=builder /app/lib/db/migrations /app/lib/db/migrations

# Expose the API port
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Run from the root using the absolute path to the entrypoint
# This matches the structure preserved above and satisfies module lookups
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
