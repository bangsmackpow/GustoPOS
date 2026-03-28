# syntax=docker/dockerfile:1

# Stage 1: builder - install dependencies and build the API server
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace metadata and api-server package for proper workspace resolution
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY artifacts/api-server/package.json artifacts/api-server/package.json

# Copy the rest of the repo (needed for build steps and shared libs)
COPY . .

# Install all workspace dependencies and resolve links
RUN pnpm install

# Build the API server (produces dist/index.mjs as per package.json)
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# Stage 2: runtime image
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/api-server/node_modules ./node_modules

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
