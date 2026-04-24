# GustoPOS Operations Guide

This guide covers deployment, configuration, and operational procedures for GustoPOS.

---

## Deployment Options

GustoPOS supports multiple deployment models:

| Option        | Description         | Best For           |
| ------------- | ------------------- | ------------------ |
| Desktop App   | Electron wrapper    | Single workstation |
| VirtualBox VM | Airgapped appliance | Offline bars       |
| Docker        | Containerized       | Cloud/VPS          |

---

## Prerequisites

### Hardware Requirements

| Deployment  | Minimum               | Recommended       |
| ----------- | --------------------- | ----------------- |
| Desktop     | 4GB RAM, 10GB disk    | 8GB RAM, 20GB SSD |
| VM          | 4GB RAM, 20GB disk    | 8GB RAM, 40GB SSD |
| Docker Host | 2GB RAM per container | 4GB RAM           |

### Software Requirements

- Node.js >= 20
- pnpm >= 8
- SQLite (LibSQL)
- For Desktop: macOS 10.15+ or Windows 10+
- For VM: VirtualBox 7.0+

---

## Development Setup

### Local Development

```bash
# Clone and setup
git clone <repository>
cd GustoPOS

# Install dependencies
pnpm install

# Start development servers
pnpm run dev
```

This starts:

- Frontend: http://localhost:5173
- API: http://localhost:3000

### Environment Variables

Create `.env` file:

```bash
# Required
ADMIN_PASSWORD=your-secure-password

# Optional
PORT=3000
DATABASE_URL=./data/gusto.db
NODE_ENV=development
```

---

## Production Build

### Building All Packages

```bash
pnpm run build
```

This runs:

1. TypeScript type checking
2. Frontend build (Vite)
3. API server build (esbuild)
4. Generates API client hooks
5. Generates Zod schemas

### Building Desktop App

```bash
pnpm run build:desktop
```

Output:

- macOS: `artifacts/desktop-app/dist/build/GustoPOS-0.1.0.dmg`
- Windows: `artifacts/desktop-app/dist/build/GustoPOS Setup.exe`

---

## Deployment: Desktop App

### macOS

1. Run `pnpm run build:desktop`
2. Open the generated `.dmg` file
3. Drag GustoPOS to Applications
4. Launch the app

### Windows

1. Run `pnpm run build:desktop`
2. Run the generated installer
3. Launch from Start Menu

### Configuration

For desktop deployments, the app runs both frontend and API:

- Default API: http://localhost:3000
- Database: `./data/gusto.db`

---

## Deployment: Docker

### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY . .
RUN pnpm run build

FROM base AS runner
COPY --from=builder /app/artifacts ./artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV ADMIN_PASSWORD=your-password
ENV PORT=3000

EXPOSE 3000
CMD ["node", "./artifacts/api-server/dist/index.cjs"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  api:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - ADMIN_PASSWORD=your-password
      - PORT=3000
    restart: unless-stopped

  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api
    restart: unless-stopped
```

### Nginx Configuration

```nginx
events {
  worker_connections 1024;
}

http {
  server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
      try_files $uri $uri/ /index.html;
    }

    location /api {
      proxy_pass http://api:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }
  }
}
```

### Build and Run

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Deployment: VirtualBox (Airgapped)

For offline bars with no internet connection.

### VM Setup

See `airgapped-deployment/` directory for detailed instructions.

1. **Import Appliance**
   - Download the `.ova` file
   - VirtualBox → File → Import Appliance
   - Select the `.ova` file

2. **Configure Networking**
   - Set to Internal Network for isolation
   - Record the IP address

3. **Start the VM**
   - Login credentials provided separately
   - Services start automatically

### VM Maintenance

- **Updates**: Requires re-importing updated appliance
- **Backups**: Use USB drive or shared folder
- **Monitoring**: SSH into VM for diagnostics

---

## Database Management

### Location

Default location: `./data/gusto.db`

### Backup

```bash
# Manual backup
cp ./data/gusto.db ./backups/gusto-$(date +%Y%m%d).db

# Or use the built-in backup feature in Settings
```

### Restore

```bash
# Stop the server
# Replace database file
cp ./backups/gusto-2026-01-01.db ./data/gusto.db
# Start the server
```

### Migrations

The database auto-migrates on startup, adding missing columns. For major schema changes, run migrations:

```bash
# Run migrations (if using drizzle-kit)
pnpm --filter @workspace/db run migration
```

---

## Logging

### Log Location

- Development: Console output
- Production: `./logs/` directory

### Log Levels

Configure in `api-server/src/index.ts`:

- `info` - General operations
- `warn` - Potential issues
- `error` - Errors

### Log Format

Pino JSON format, parseable by log aggregators:

```json
{
  "level": 30,
  "time": 1700000000000,
  "msg": "Request completed",
  "method": "GET",
  "url": "/api/tabs",
  "statusCode": 200,
  "responseTime": 45
}
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": 1700000000000,
  "database": "connected"
}
```

### Metrics to Monitor

| Metric            | Description      | Threshold |
| ----------------- | ---------------- | --------- |
| API Response Time | Average response | < 500ms   |
| Error Rate        | Failed requests  | < 1%      |
| Database Size     | SQLite file size | < 1GB     |
| Disk Space        | Available disk   | > 10%     |

---

## Security

### Network

- Use HTTPS in production (reverse proxy)
- Firewall API port (3000) from public access
- For desktop: only listen on localhost

### Authentication

- Change default admin password
- Use strong PINs (not sequential or repeated)
- Enable PIN lock timeout (Settings → Security)

### Data

- Regular backups
- Encrypt sensitive backups
- Restrict file permissions

---

## Troubleshooting

### API Won't Start

```bash
# Check port
lsof -i :3000

# Check logs
tail -f logs/error.log

# Common issues:
# - Port in use → kill process or change PORT
# - Missing ADMIN_PASSWORD → set env var
# - Database locked → check for other processes
```

### Frontend Connection Issues

1. Check API is running: `curl http://localhost:3000/api/health`
2. Check CORS settings in API config
3. Verify frontend API URL in `.env`

### Database Issues

```bash
# Check database integrity
sqlite3 ./data/gusto.db "PRAGMA integrity_check;"

# Vacuum to reclaim space
sqlite3 ./data/gusto.db "VACUUM;"
```

### Performance Issues

1. Check for long-running queries
2. Monitor disk I/O
3. Increase memory allocation
4. Consider SSD for database

---

## Maintenance Schedule

### Daily

- Review sales reports
- Check backup success
- Monitor low stock alerts

### Weekly

- Review void reports
- Check staff performance
- Verify backup integrity

### Monthly

- Close accounting period
- Review COGS reports
- Test backup restoration
- Update system (if applicable)

### Quarterly

- Full system audit
- Security review
- Performance tuning

---

## Upgrading

### Desktop App

1. Download new version
2. Install over existing (macOS) or run installer (Windows)
3. Database is preserved

### Docker

```bash
# Pull latest or rebuild
docker-compose build
docker-compose up -d
```

### VM

1. Download new appliance
2. Backup current database
3. Import new appliance
4. Restore database

---

## Support

For issues:

1. Check logs for error messages
2. Review this documentation
3. Check archived docs in `docs/archive/`
4. Contact support with:
   - Error messages
   - Steps to reproduce
   - System info

---

## Related Documentation

- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [USER_GUIDE.md](USER_GUIDE.md) - Staff user guide
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Administrator guide
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing procedures
