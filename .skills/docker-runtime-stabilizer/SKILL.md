---
name: docker-runtime-stabilizer
description: Ensure Docker and Nginx stability for the GustoPOS monorepo. Use when modifying Dockerfiles, docker-compose.yml, or Nginx configurations to prevent module resolution errors and 502/504 gateway issues.
---

# docker-runtime-stabilizer

Specialized guidance for maintaining a stable runtime environment for GustoPOS.

## Core Rules for Dockerfiles

### 1. Preserve Workspace Structure
To ensure pnpm's symlinks resolve correctly, the runtime image MUST preserve the relative pathing from the builder stage.
- **Root node_modules**: Always copy the root `node_modules` to `/app/node_modules`.
- **Artifact structure**: Copy built artifacts to their original workspace path (e.g., `/app/artifacts/api-server/dist`).
- **WORKDIR**: Set the `WORKDIR` to the specific artifact directory (e.g., `/app/artifacts/api-server`).

### 2. Required Environment Variables
Ensure the following variables are explicitly set in the Dockerfile or `docker-compose.yml`:
- `PORT=3000` (for API server)
- `NODE_ENV=production`

## Core Rules for Nginx (Frontend)

### 1. Runtime DNS Resolution
To prevent Nginx from crashing if the `api` host is not immediately available, use the variable-based `proxy_pass` pattern:
```nginx
location /api/ {
  resolver 127.0.0.11 valid=30s;
  set $upstream_api api;
  proxy_pass http://$upstream_api:3000;
}
```

### 2. Forwarding Headers
Always include standard headers for proxy trust:
- `proxy_set_header Host $host;`
- `proxy_set_header X-Real-IP $remote_addr;`
- `proxy_set_header X-Forwarded-Proto $scheme;`

## Validation Checklist
- [ ] Does the API container show port 3000 in `docker ps`?
- [ ] Are all `node_modules` symlinks preserved in the runtime image?
- [ ] Does Nginx use a `resolver` for the `api` upstream?
- [ ] Is `trust proxy` enabled in the Express `app.ts`?
