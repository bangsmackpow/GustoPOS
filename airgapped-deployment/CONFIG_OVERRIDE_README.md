# macOS Stack Override Files

## Purpose
These files override default configurations for airgapped deployment on macOS Monterey. They ensure the app runs entirely offline with zero external dependencies.

## Files

### stack.env.airgapped
Default environment configuration for offline deployment. Customer will edit this after setup.

### nginx.conf (Optional)
If customer wants to use nginx as a reverse proxy, this configuration:
- Routes `/api/*` to Express backend (localhost:3001)
- Serves React static files from `dist/`
- Runs on port 8080
- No SSL (internal network only)

### app.config.json
Frontend configuration for offline PWA mode:
- Disables cloud features
- Enables offline queue
- Disables telemetry/analytics
- Caches all static assets locally

---

## Integration Notes

1. **During Setup**: setup.sh copies these files to `~/.gustopos/`
2. **During Start**: start.sh loads stack.env and exports variables
3. **Database**: Initialized locally on first run (no migrations needed from network)
4. **Frontend**: Pre-built static assets served from included files

---

## For Customer Support

If issues arise:
1. Check `~/.gustopos/stack.env` - verify all settings are correct
2. Check logs: `~/.gustopos/logs/server-*.log`
3. Verify Node.js: `node --version` (should be >=20)
4. Verify database exists: `ls -la ~/.gustopos/data/`
