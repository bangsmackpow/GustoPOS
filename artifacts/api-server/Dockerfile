# syntax=docker/dockerfile:1

# Stage 1: builder - install dependencies and build the API server
FROM node:20-slim AS builder
WORKDIR /app
ENV CI=true

# Install pnpm
RUN npm install -g pnpm

# Copy workspace metadata and api-server package for proper workspace resolution
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY artifacts/api-server/package.json artifacts/api-server/package.json
COPY lib/db/package.json lib/db/package.json
COPY lib/api-client-react/package.json lib/api-client-react/package.json
COPY lib/api-spec/package.json lib/api-spec/package.json
COPY lib/api-zod/package.json lib/api-zod/package.json
COPY scripts/package.json scripts/package.json

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

# In a pnpm monorepo, dependencies are often symlinked to the root node_modules/.pnpm
# To be safe and keep things simple, we copy the built dist AND the necessary node_modules
COPY --from=builder /app/artifacts/api-server/dist ./dist
# We copy the root node_modules because artifacts/api-server/node_modules likely contains symlinks to it
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# We run from the root to ensure module resolution for symlinks works as expected
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
