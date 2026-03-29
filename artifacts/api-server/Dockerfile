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
WORKDIR /app/artifacts/api-server

# Since we now bundle dependencies like 'pg' and 'nodemailer', 
# we only need the dist folder and the source maps.
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/api-server/package.json ./package.json

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Run the bundled entry point
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
