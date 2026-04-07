# GustoPOS — Troubleshooting Guide

**Version:** 1.0  
**Last Updated:** 2026-04-04

---

## Quick Diagnostics

Run these commands to check system health:

```bash
# Check API health
curl http://localhost:3000/api/healthz

# Check database connectivity
curl http://localhost:3000/api/ready

# Check Docker containers
docker ps

# View API logs
docker logs gustopos-api

# View frontend logs
docker logs gustopos-frontend
```

---

## Login & Authentication

### Can't log in

**Symptoms:** "Invalid credentials" error on login page

**Causes & Solutions:**

1. **Wrong email or password** — Double-check spelling. Email is case-insensitive.
2. **Account deactivated** — An admin may have set `isActive: false`. Ask an admin to re-enable.
3. **Admin login disabled** — If `ADMIN_LOGIN_ENABLED=false`, only PIN login works.
4. **Rate limited** — After 5 failed attempts in 15 minutes, login is temporarily blocked. Wait 15 minutes.

### Forgot password

**Solution:** Use the "Reset password with PIN" link on the login page. You need your 4-digit PIN.

### Forgot both password and PIN

**Solution:** An admin must reset your password from Settings → Staff Management → Key icon. If the admin account itself is locked out:

1. Access the server directly
2. Edit `stack.env` and set `DEV_LOGIN=true`, `DEV_ADMIN_EMAIL=your-email`, `DEV_ADMIN_PASSWORD=temp-password`
3. Restart the API server
4. Log in via dev login
5. Reset your admin password from Settings
6. Remove the dev login variables and restart

### Session keeps expiring

**Symptoms:** Logged out after short periods of inactivity

**Causes & Solutions:**

1. **Inactivity timeout (1 hour)** — Sessions expire after 60 minutes without activity. This is by design for security.
2. **System clock drift** — JWT validation depends on accurate time. Ensure the server clock is synchronized:
   ```bash
   sudo ntpdate -s time.nist.gov
   ```
3. **Cookie blocked** — Ensure your browser accepts third-party cookies if accessing from a different domain.

---

## Database

### Database connection error

**Symptoms:** API returns 503 on `/api/ready`, or startup fails

**Causes & Solutions:**

1. **Database file missing** — Ensure the `data/` directory exists and is writable:
   ```bash
   mkdir -p ./data && chmod 755 ./data
   ```
2. **Wrong DATABASE_URL** — Check `stack.env`:
   ```bash
   DATABASE_URL=file:/app/data/gusto.db
   ```
3. **Corrupted database** — Restore from backup:
   ```bash
   cp /path/to/backup/gusto-YYYYMMDD.db ./data/gusto.db
   docker compose restart api
   ```

### Database is locked

**Symptoms:** Slow responses, "database is locked" errors in logs

**Causes & Solutions:**

1. **Concurrent writes** — SQLite handles concurrent reads well but serializes writes. Reduce concurrent write operations.
2. **Long-running transactions** — Check for uncommitted transactions. Restart the API server to clear.

### Need to reset everything

**Solution:** From the UI: Settings → Data Management → Reset Database. Or via API:

```bash
curl -X POST http://localhost:3000/api/admin/reset-database \
  -H "Cookie: sid=YOUR_SESSION_TOKEN"
```

---

## Docker & Deployment

### Containers won't start

**Symptoms:** `docker compose up` fails or containers exit immediately

**Solutions:**

1. **Missing stack.env** — Copy from example:
   ```bash
   cp stack.env.example stack.env
   ```
2. **Port conflict** — Check if ports 3000 or 8080 are in use:
   ```bash
   lsof -i :3000
   lsof -i :8080
   ```
   Change ports in `docker-compose.yml` if needed.
3. **Permission issues** — Ensure the data directory is writable:
   ```bash
   sudo chown -R $USER:$USER ./data
   ```

### Can't access from other devices

**Symptoms:** Works on localhost but not from other machines on the network

**Solutions:**

1. **Firewall** — Allow ports 3000 and 8080:
   ```bash
   sudo ufw allow 3000
   sudo ufw allow 8080
   ```
2. **Bind address** — Docker binds to all interfaces by default. Verify with:
   ```bash
   docker compose ps
   ```
   Should show `0.0.0.0:3000->3000/tcp` and `0.0.0.0:8080->80/tcp`.

### API container keeps restarting

**Symptoms:** `docker ps` shows the API container restarting repeatedly

**Solutions:**

1. **Check logs:**
   ```bash
   docker logs gustopos-api --tail 50
   ```
2. **Common causes:**
   - Missing `DATABASE_URL` in `stack.env`
   - Missing `PORT` in `stack.env`
   - Database file permissions
   - Migration failures

### Frontend shows blank page

**Symptoms:** Browser loads but shows nothing

**Solutions:**

1. **Check nginx logs:**
   ```bash
   docker logs gustopos-frontend
   ```
2. **API not reachable** — Frontend proxies `/api/` to the API container. Verify API is running:
   ```bash
   curl http://localhost:3000/api/healthz
   ```
3. **Browser cache** — Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Updating fails

**Symptoms:** `docker compose pull` or `docker compose up -d` fails

**Solutions:**

1. **Authentication to GHCR** — Ensure you're logged in:
   ```bash
   echo $GHCR_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```
2. **Outdated images** — Force pull:
   ```bash
   docker compose pull --no-parallel
   docker compose up -d --force-recreate
   ```

---

## Inventory & Drinks

### Drink shows "Out of Stock"

**Symptoms:** Drink is grayed out and can't be added to tabs

**Causes & Solutions:**

1. **Ingredient depleted** — One or more recipe ingredients have 0 stock. Restock the ingredient:
   - Go to Inventory
   - Find the ingredient
   - Update current stock
2. **Missing recipe link** — The drink's recipe references an ingredient that doesn't exist. Edit the drink and fix the recipe.

### Stock count is wrong

**Symptoms:** Physical count doesn't match system stock

**Causes & Solutions:**

1. **Spillage/waste not recorded** — Use the inventory audit feature to reconcile:
   - Go to Inventory
   - Click the weigh/audit icon
   - Enter the physical count
2. **Recipe amounts incorrect** — Verify recipe ingredient amounts match actual pour sizes.
3. **Theft or over-pouring** — Review inventory audit variance reports for patterns.

### Can't delete an item

**Symptoms:** Delete button doesn't work or item reappears

**Solution:** Items are soft-deleted (hidden, not removed). If an item appears after deletion, it may have been re-added. Check if there's a duplicate.

---

## Tabs & Orders

### Can't close a tab

**Symptoms:** Close Tab button is disabled or returns an error

**Causes & Solutions:**

1. **No orders on tab** — A tab must have at least one order before closing.
2. **Split bill total mismatch** — Payment amounts must equal the grand total exactly (within $0.01).
3. **Tab already closed** — Refresh the page to see updated status.

### Can't close a shift

**Symptoms:** "Cannot close shift with open tabs" error

**Solutions:**

1. **Close all tabs first** — Go to Tabs and close each open tab.
2. **Force close** — Check "Force close with open tabs" in the close shift dialog. Open tabs will remain open.

### Order total is wrong

**Symptoms:** Tab total doesn't match expected amount

**Causes & Solutions:**

1. **Wrong drink price** — Check the drink's `actualPrice` in the Menu.
2. **Quantity error** — Edit the order and verify the quantity.
3. **Tax not applied** — Tax is calculated at close time. Check tax rates in Settings.

---

## Performance

### App is slow

**Symptoms:** Pages take several seconds to load

**Causes & Solutions:**

1. **Large dataset** — If you have 100+ drinks or 50+ open tabs, consider:
   - Closing old tabs regularly
   - Archiving inactive drinks (set `isAvailable: false`)
2. **Server resources** — Check CPU and memory usage:
   ```bash
   docker stats
   ```
   The API is limited to 1 CPU and 512MB RAM by default.
3. **Database size** — Large databases can slow queries. Consider archiving old shifts.

### High memory usage

**Symptoms:** Container using more memory than expected

**Solution:** Restart the container:

```bash
docker compose restart api
```

---

## Backups & Litestream

### Litestream not replicating

**Symptoms:** No backups appearing in R2/S3

**Solutions:**

1. **Check credentials** — Verify `stack.env` has valid R2/S3 credentials:
   ```bash
   LITESTREAM_REPLICA_URL=s3://your-bucket/gusto.db
   LITESTREAM_ENDPOINT=https://your-account.r2.cloudflarestorage.com
   LITESTREAM_ACCESS_KEY_ID=your-key
   LITESTREAM_SECRET_ACCESS_KEY=your-secret
   ```
2. **Check Litestream logs:**
   ```bash
   docker exec gustopos-api litestream replicate -config /etc/litestream.yml
   ```
3. **Network issues** — Ensure the server can reach the R2/S3 endpoint.

### Need to restore from backup

**Solution:**

1. Stop the API server:
   ```bash
   docker compose stop api
   ```
2. Download the latest backup from R2/S3
3. Replace the database file:
   ```bash
   cp /path/to/downloaded/backup.db ./data/gusto.db
   ```
4. Restart:
   ```bash
   docker compose start api
   ```

---

## Sentry & Error Monitoring

### Not receiving error reports

**Symptoms:** Errors occur but don't appear in Sentry

**Solutions:**

1. **DSN not set** — Check `stack.env`:
   ```bash
   SENTRY_DSN=https://your-dsn@sentry.io/project
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/project
   ```
2. **Restart containers** after setting DSN:
   ```bash
   docker compose restart
   ```
3. **Check console** — If DSN is not set, you'll see: `[Sentry] SENTRY_DSN not set — error monitoring disabled`

---

## Common Error Messages

| Error                               | Meaning                              | Fix                                           |
| ----------------------------------- | ------------------------------------ | --------------------------------------------- |
| `Invalid request body`              | Missing or malformed JSON in request | Check request body format and required fields |
| `Authentication required`           | No valid session cookie              | Log in again                                  |
| `Insufficient permissions`          | User doesn't have required role      | Ask an admin to upgrade your role             |
| `Cannot close shift with open tabs` | Shift has unclosed tabs              | Close all tabs or use force close             |
| `Promo code is inactive`            | Code has been disabled               | Check promo code status in database           |
| `Promo code has expired`            | Code past its expiration date        | Use a different code or extend expiration     |
| `PIN must be 4 digits`              | PIN format is invalid                | Use exactly 4 different digits                |
| `There is already an active shift`  | Can't have two active shifts         | Close the existing shift first                |
| `Database file not found`           | SQLite database doesn't exist        | Check `DATABASE_URL` and file path            |
| `Internal server error`             | Unexpected server-side error         | Check API logs, report to admin               |

---

## Getting Help

If none of the above resolves your issue:

1. **Check the logs** — `docker logs gustopos-api --tail 100`
2. **Check Sentry** — If configured, errors are reported at sentry.io
3. **Check the audit log** — Settings → Audit Log for recent changes
4. **Contact your system administrator** — They have access to server-level diagnostics
