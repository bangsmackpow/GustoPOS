# GustoPOS — Admin Guide

**Version:** 1.0  
**Last Updated:** 2026-04-04  
**Audience:** System administrators, managers, owners

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Initial Setup](#initial-setup)
3. [Staff Management](#staff-management)
4. [Inventory Management](#inventory-management)
5. [Drink Menu Management](#drink-menu-management)
6. [Settings Configuration](#settings-configuration)
7. [Database Backup & Restore](#database-backup--restore)
8. [Audit Log Review](#audit-log-review)
9. [Promo Codes](#promo-codes)
10. [Rush Events](#rusher-events)
11. [Bulk Import (CSV)](#bulk-import-csv)
12. [Seed Library](#seed-library)
13. [Database Reset](#database-reset)
14. [Security](#security)
15. [Deployment](#deployment)
16. [Monitoring & Error Tracking](#monitoring--error-tracking)

---

## System Overview

GustoPOS is a TypeScript monorepo with:

| Component      | Tech                            | Port                  |
| -------------- | ------------------------------- | --------------------- |
| **API Server** | Express 5, SQLite, Drizzle ORM  | 3000                  |
| **Frontend**   | React 19, Vite 7, TailwindCSS 4 | 8080 (via nginx)      |
| **Database**   | SQLite (via libSQL)             | File-based            |
| **Backups**    | Litestream → Cloudflare R2/S3   | Real-time replication |

**Deployment modes:**

- **Standalone Desktop** — Electron app for single-bar offline use
- **Docker + PWA** — Multi-service deployment for networked bars

---

## Initial Setup

### Environment Configuration

1. Copy `stack.env.example` to `stack.env`
2. Update the following values:

```bash
# API Server
PORT=3000
DATABASE_URL=file:/app/data/gusto.db

# Admin Credentials (CHANGE THESE)
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=strong-password-here
ADMIN_PIN=1234
ADMIN_LOGIN_ENABLED=true

# Sentry Error Monitoring (optional)
SENTRY_DSN=https://your-dsn@sentry.io/your-project
VITE_SENTRY_DSN=https://your-dsn@sentry.io/your-project
```

3. **Never commit `stack.env`** — it's in `.gitignore` but always verify

### First Login

1. Start the application (see [Deployment](#deployment))
2. Navigate to the login page
3. Log in with the admin credentials from `stack.env`
4. Set up your staff, inventory, and menu

---

## Staff Management

### Creating Staff Members

1. Go to **Settings → Staff Management**
2. Click **Add Staff**
3. Fill in:
   - **First Name** (required)
   - **Last Name** (optional)
   - **Email** (used for login)
   - **Password** (required for admin/manager roles)
   - **Role** — admin, manager, head_bartender, bartender, server
   - **PIN** — 4 digits, not all the same (e.g., not 0000, 1111)
   - **Active** — toggle to enable/disable
4. Click **Save**

### Editing Staff

1. Click the **edit icon (✏️)** next to a staff member
2. Update any field
3. Click **Save**

### Resetting a Password

If a staff member forgets their password:

**Option 1: From Settings (admin only)**

1. Go to **Settings → Staff Management**
2. Click the **key icon (🔑)** next to the staff member
3. Enter a new password (minimum 4 characters)
4. Confirm the password
5. Click **Reset Password**

**Option 2: Staff self-reset via PIN**

1. On the login page, click **Reset password with PIN**
2. Enter their email
3. Enter their 4-digit PIN
4. Set a new password

### Deactivating Staff

Instead of deleting, toggle **Active** to off. This archives the user without losing their historical data.

### Roles & Permissions

| Role               | Settings Access | Staff Management | Inventory | Reports | Audit Logs |
| ------------------ | --------------- | ---------------- | --------- | ------- | ---------- |
| **admin**          | Full            | Full             | Full      | Full    | Full       |
| **manager**        | Read            | Read             | Full      | Full    | Read       |
| **head_bartender** | Read            | None             | Full      | Full    | None       |
| **bartender**      | None            | None             | Read      | Read    | None       |
| **server**         | None            | None             | None      | Read    | None       |

---

## Inventory Management

### Adding an Item

1. Go to **Inventory**
2. Click **Add Item**
3. Fill in:
   - **Name** (required)
   - **Type** — spirit, beer, mixer, unit
   - **Subtype** — tequila, mezcal, vodka, etc. (for spirits) or nacional, importada, etc. (for beer)
   - **Base Unit** — ml, g, unit
   - **Base Unit Amount** — total in a full container (e.g., 750 for a 750ml bottle)
   - **Serving Size** — standard pour/serving in base units (e.g., 44.36 for a 1.5oz pour in ml)
   - **Pour Size** — pour size in ounces
   - **Current Stock** — starting amount in base units
   - **Order Cost** — last purchase price for full container
   - **Low Stock Threshold** — amount that triggers low-stock warning
4. Click **Save**

### Editing Stock Levels

1. Find the item in the inventory list
2. Click the **edit icon (✏️)**
3. Update **Current Stock**
4. Click **Save**

### Weight-Based Counting

For spirits, you can count inventory by weighing bottles:

1. Click the **weigh icon (⚖️)** next to an item
2. Enter the **current weight** of the bottle (in grams)
3. The system calculates remaining stock based on the bottle's full and empty weights

### Soft Delete

Deleting an inventory item **hides** it from the list rather than permanently removing it. This preserves historical order data. Soft-deleted items:

- Don't appear in the inventory list
- Can't be used in new recipes
- Are still referenced in historical orders

### CSV Import

1. Go to **Settings → Data Management**
2. Click **Import Ingredients**
3. Upload a CSV file with columns matching the inventory schema
4. Review validation errors (if any)
5. Confirm the import

---

## Drink Menu Management

### Creating a Drink

1. Go to **Menu** (or **Drinks** in Settings)
2. Click **Add Drink**
3. Fill in:
   - **Name** (required)
   - **Category** — cocktail, beer, wine, shot, non_alcoholic, other
   - **Price** (required, must be > 0)
   - **Tax Category** — standard, reduced, food, spirits, beer, non_taxable
   - **Available** — toggle to show/hide from POS
   - **On Menu** — toggle to include in menu view
4. Add **recipe ingredients** (links to inventory items)
5. Click **Save**

### Profit Margins

The Drinks page shows **profit margin %** for each drink, calculated from:

- Drink price
- COGS (cost of goods sold) based on recipe ingredients and their order costs

### Soft Delete

Deleting a drink **hides** it from the menu. Historical orders referencing the drink are preserved.

### CSV Import

1. Go to **Settings → Data Management**
2. Click **Import Recipes**
3. Upload a CSV file with drink and recipe data
4. Review and confirm

---

## Settings Configuration

### Exchange Rates

Set currency conversion rates for multi-currency support:

1. Go to **Settings**
2. Find the **Exchange Rates** section
3. Set rates for USD and CAD (relative to MXN)
4. Rates must be > 0
5. Click **Save**

### PIN Lock Timeout

Set how long before the POS auto-locks due to inactivity:

1. Go to **Settings**
2. Find **PIN Lock Timeout (minutes)**
3. Enter a value (default: 5)
4. Click **Save**

### Tax Rates

Configure tax rates by category:

1. Go to **Settings → Tax Rates**
2. Set rates for each tax category
3. Click **Save**

### Default Markup Factor

Set the default markup multiplier for new drinks:

1. Go to **Settings**
2. Find **Default Markup Factor**
3. Enter a value (e.g., 3.0 for 3x cost)
4. Click **Save**

---

## Database Backup & Restore

### Automatic Backups (Litestream)

If configured, Litestream replicates your SQLite database to Cloudflare R2 or S3 in real-time.

**Configuration** (in `stack.env`):

```bash
LITESTREAM_REPLICA_URL=s3://your-bucket/gusto.db
LITESTREAM_ENDPOINT=https://your-account.r2.cloudflarestorage.com
LITESTREAM_ACCESS_KEY_ID=your-key
LITESTREAM_SECRET_ACCESS_KEY=your-secret
```

### Manual Backup

1. Stop the API server
2. Copy the database file:
   ```bash
   cp /path/to/data/gusto.db /path/to/backup/gusto-$(date +%Y%m%d).db
   ```
3. Restart the API server

### Restore from Backup

1. Stop the API server
2. Replace the database file:
   ```bash
   cp /path/to/backup/gusto-20260404.db /path/to/data/gusto.db
   ```
3. Restart the API server

> **Warning:** Restoring from backup replaces all current data. Any changes made after the backup was taken will be lost.

---

## Audit Log Review

The audit log tracks all significant changes:

1. Go to **Settings → Audit Log** (admin only)
2. Filter by entity type: **All**, **Tab**, **Inventory**, **User**
3. Each entry shows:
   - Who made the change
   - What action was taken
   - What entity was affected
   - Old and new values
   - Timestamp

### Tracked Events

| Event              | Triggered By            |
| ------------------ | ----------------------- |
| `inventory_update` | Updating stock levels   |
| `drink_update`     | Modifying drink details |
| `tab_close`        | Closing a tab           |
| `apply_promo_code` | Applying a discount     |
| `user_create`      | Creating a staff member |
| `user_update`      | Editing a staff member  |

---

## Promo Codes

### Creating a Promo Code

Promo codes are created via the API or database. Each code has:

- **Code** — The text customers enter (e.g., "HAPPYHOUR")
- **Description** — What the discount is for
- **Discount Type** — `percentage` or `fixed_amount`
- **Discount Value** — Percentage (0-100) or fixed MXN amount
- **Max Uses** — Maximum times the code can be used (0 = unlimited)
- **Current Uses** — Auto-tracked
- **Expires At** — Optional expiration date
- **Is Active** — Toggle to enable/disable

### Managing Promo Codes

View and manage promo codes through the API:

```bash
GET /api/promo-codes/:code
```

---

## Rush Events

Schedule rush events to prepare for busy periods:

1. Go to **Settings → Rush Events**
2. Click **Schedule Rush**
3. Fill in:
   - **Title** — Event name
   - **Type** — Event type
   - **Impact** — Expected impact level
   - **Start Time** — Must be in the future
4. Click **Save**

> Rush events with past start times are automatically hidden from the active list.

---

## Bulk Import (CSV)

### Supported Imports

| Import Type | Endpoint                              | Description                        |
| ----------- | ------------------------------------- | ---------------------------------- |
| Ingredients | `POST /admin/bulk-import/ingredients` | Add inventory items from CSV       |
| Recipes     | `POST /admin/bulk-import/recipes`     | Add drinks with recipe ingredients |

### CSV Format

**Ingredients CSV:**

```csv
name,type,base_unit,base_unit_amount,serving_size,order_cost,low_stock_threshold
Casa Dragones,spirit,ml,750,44.36,850,2
```

**Recipes CSV:**

```csv
drink_name,category,price,ingredient_name,amount_in_base_unit
Margarita,cocktail,150,Casa Dragones,44.36
```

### Validation

All CSV imports are validated before import:

- Required fields are checked
- Data types are verified
- Duplicate names are flagged
- Row numbers are included in error messages

---

## Seed Library

Load starter data for testing:

1. Go to **Settings → Data Management**
2. Click **Seed Library**
3. Confirm the action
4. Sample data is loaded:
   - Inventory items (spirits, beers, mixers)
   - Drinks with recipes
   - Tax rates

> **Warning:** Seeding adds data but doesn't clear existing data. Use **Reset Database** first for a clean start.

---

## Database Reset

Permanently delete all data:

1. Go to **Settings → Data Management**
2. Click **Reset Database**
3. Type "RESET" to confirm
4. Click **Delete All**

> **Warning:** This is irreversible. All tabs, orders, inventory, drinks, staff, and settings will be deleted. Create a backup first.

---

## Security

### Password Policy

- Minimum 4 characters
- Stored as bcrypt hashes (cost factor 10)
- Transparent migration from plaintext on first login

### PIN Policy

- Must be exactly 4 digits
- Cannot be all the same digit (0000, 1111, etc.)
- Stored as bcrypt hashes (cost factor 10)
- Used for quick user switching and password reset

### Session Security

- JWT-based sessions stored in httpOnly cookies
- 7-day maximum session lifetime
- **1-hour inactivity timeout** — sessions expire after 60 minutes of no activity
- Activity is refreshed on every authenticated request
- Secure cookie settings (httpOnly, sameSite: lax)

### Rate Limiting

| Endpoint    | Limit      | Window     |
| ----------- | ---------- | ---------- |
| Admin login | 5 attempts | 15 minutes |
| PIN login   | 5 attempts | 15 minutes |

### API Authentication

All admin endpoints require authentication. Role-based access control restricts sensitive operations.

---

## Deployment

### Docker Deployment

1. Ensure `stack.env` is configured
2. Run:
   ```bash
   docker compose up -d
   ```
3. Access the app at `http://localhost:8080`

### Docker Configuration

The `docker-compose.yml` includes:

- **Health checks** — API `/api/healthz` and frontend `/`
- **Resource limits** — CPU and memory caps
- **Read-only filesystems** — with tmpfs for temp files
- **Security options** — no-new-privileges

### HTTPS Setup

For production, enable HTTPS in `nginx.conf`:

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Mount certificates in the container:
   ```yaml
   volumes:
     - ./ssl:/etc/nginx/ssl:ro
   ```
3. Uncomment the HTTPS server block in `nginx.conf`
4. Uncomment the HTTP→HTTPS redirect
5. Restart the frontend container

### Updating

```bash
docker compose pull
docker compose up -d
```

---

## Monitoring & Error Tracking

### Sentry

If configured, Sentry captures:

- **Backend errors** — Unhandled exceptions, database errors
- **Frontend errors** — React errors, network failures
- **Performance traces** — Slow requests, rendering issues
- **Session replays** — User interactions leading to errors

**Configuration** (in `stack.env`):

```bash
SENTRY_DSN=https://your-dsn@sentry.io/backend
VITE_SENTRY_DSN=https://your-dsn@sentry.io/frontend
```

### Logging

The API server uses structured JSON logging (pino):

- Log level: `LOG_LEVEL` env var (default: info)
- Sensitive data (auth headers, cookies) is redacted
- HTTP request/response logging via pino-http

### Health Checks

| Endpoint           | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `GET /api/healthz` | Basic liveness check                           |
| `GET /api/ready`   | Readiness check (verifies database connection) |

---

## Troubleshooting

| Problem                         | Solution                                               |
| ------------------------------- | ------------------------------------------------------ |
| Can't start Docker              | Check `stack.env` exists and has valid values          |
| Database connection error       | Verify `DATABASE_URL` path is correct                  |
| API not responding              | Check health: `curl http://localhost:3000/api/healthz` |
| Frontend shows blank page       | Check nginx logs: `docker logs gustopos-frontend`      |
| Litestream not replicating      | Verify R2/S3 credentials in `stack.env`                |
| Session keeps expiring          | Check system clock synchronization                     |
| Can't access from other devices | Verify firewall allows ports 3000 and 8080             |

For more help, see the [Troubleshooting Guide](./TROUBLESHOOTING.md).
