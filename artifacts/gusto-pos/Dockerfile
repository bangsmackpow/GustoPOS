# syntax=docker/dockerfile:1

# Stage 1: builder
FROM node:20-slim AS builder
WORKDIR /app
ENV CI=true

# Install pnpm
RUN npm install -g pnpm

# Copy ALL files for robust pnpm workspace resolution
COPY . .

# Install all workspace dependencies
RUN pnpm install --no-frozen-lockfile

# Build the frontend
WORKDIR /app/artifacts/gusto-pos
RUN pnpm run build

# Stage 2: production runtime (Nginx)
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy the built assets from the builder stage
COPY --from=builder /app/artifacts/gusto-pos/dist/public .

# Copy Nginx configuration
COPY artifacts/gusto-pos/nginx.conf /etc/nginx/nginx.conf

# Ensure Nginx can write its PID and logs in a read-only root environment
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
