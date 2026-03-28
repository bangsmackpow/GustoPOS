# syntax=docker/dockerfile:1

# Stage 1: build frontend assets
FROM node:20-slim AS builder
WORKDIR /app
ENV CI=true

# Provide default port for Vite build-time config that expects PORT to be set
ENV PORT=5173

# Install pnpm
RUN npm install -g pnpm

# Copy workspace metadata and frontend package for proper workspace resolution
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY artifacts/gusto-pos/package.json artifacts/gusto-pos/package.json

# Copy all repo (needed for building the frontend in its package scope)
COPY . .

RUN pnpm install
RUN PORT=5173 BASE_PATH=/ pnpm --filter @workspace/gusto-pos build
RUN if [ ! -d ./artifacts/gusto-pos/dist ]; then echo "ERROR: frontend dist not found after build"; exit 1; fi

# Stage 2: serve with nginx
FROM nginx:alpine
COPY --from=builder /app/artifacts/gusto-pos/dist /usr/share/nginx/html

# Simple SPA routing for history API fallback
COPY artifacts/gusto-pos/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
