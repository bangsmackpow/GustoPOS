# GustoPOS Desktop App Packaging Guide

## Overview

This document covers the process of building and packaging GustoPOS as a macOS DMG, with special attention to database initialization and common issues.

---

## Quick Start

```bash
# Build and package
pnpm run build:desktop

# DMG location
artifacts/desktop-app/dist/build/GustoPOS-0.1.0.dmg
```

---

## Database Configuration

### Location

- **Packaged app**: `~/Library/Application Support/@workspace/desktop-app/gusto.db`
- Uses Electron's `app.getPath("userData")` API

### How It's Connected

1. **main.ts** spawns the API server as a child process
2. Passes `DATABASE_URL` environment variable: `file://path/to/gusto.db`
3. API server uses `lib/db/src/index.ts` which reads `process.env.DATABASE_URL`
4. Database is created automatically on first run if it doesn't exist

### Key Code in `artifacts/desktop-app/src/main.ts`

```typescript
const dbPath = path.join(app.getPath("userData"), "gusto.db");

// Pass to API as environment variable
DATABASE_URL: `file://${dbPath.replace(/ /g, "%20")}`,
```

---

## Path Resolution (Critical for Packaged Apps)

### The Problem

In Electron, `__dirname` behaves differently:

- **Dev mode**: resolves to the compiled `.cjs` file location
- **Packaged app**: resolves inside the app bundle, NOT the workspace

### The Solution

Use `process.cwd()` for dev mode and `process.resourcesPath` for production:

```typescript
const isDev = !app.isPackaged;

// API executable
const apiPath = isDev
  ? path.resolve(process.cwd(), "artifacts/api-server/dist/index.cjs")
  : path.join(process.resourcesPath, "api/index.cjs");

// Migrations
MIGRATIONS_PATH: isDev
  ? path.resolve(process.cwd(), "lib/db/migrations")
  : path.join(process.resourcesPath, "api/migrations"),

// Node modules
const apiNodeModules = isDev
  ? path.resolve(process.cwd(), "node_modules/.pnpm/node_modules")
  : path.join(process.resourcesPath, "api/node_modules");
```

---

## Common Issues & Fixes

### 1. Sentry Profiling Module Not Found

**Error**:

```
Cannot find module '../build/Release/sentry_cpu_profiler.node'
```

**Cause**: `@sentry/profiling-node` has native bindings that don't work in Electron without rebuilding.

**Fix** in `artifacts/api-server/src/lib/sentry.ts`:

```typescript
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("[Sentry] SENTRY_DSN not set — error monitoring disabled");
    return;
  }

  try {
    const { nodeProfilingIntegration } = require("@sentry/profiling-node");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      integrations: [nodeProfilingIntegration()],
    });
    console.log("[Sentry] Initialized with profiling");
  } catch (err) {
    // Fallback without profiling
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
    console.log("[Sentry] Initialized without profiling");
  }
}
```

---

### 2. Migration Schema Mismatch

**Error**: `SQLITE_ERROR: duplicate column name: bar_icon`

**Cause**: Drizzle schema and SQL migrations were out of sync. The schema expected columns that weren't in the initial migration.

**Fix**: Ensure `0000_slippery_george_stacy.sql` includes ALL columns:

```sql
CREATE TABLE `settings` (
  `id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
  `bar_name` text DEFAULT 'GustoPOS' NOT NULL,
  `bar_icon` text DEFAULT 'Wine' NOT NULL,       -- Must be here
  `base_currency` text DEFAULT 'MXN' NOT NULL, -- Must be here
  `usd_to_mxn_rate` real DEFAULT 17.5 NOT NULL,
  `cad_to_mxn_rate` real DEFAULT 12.8 NOT NULL,
  `default_markup_factor` real DEFAULT 3 NOT NULL,
  `smtp_host` text,
  `smtp_port` integer,
  `smtp_user` text,
  `smtp_password` text,
  `smtp_from_email` text,
  `inventory_alert_email` text,
  `enable_litestream` integer DEFAULT false NOT NULL,   -- Must be here
  `enable_usb_backup` integer DEFAULT false NOT NULL,   -- Must be here
  `pin_lock_timeout_min` integer DEFAULT 5 NOT NULL,     -- Must be here
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
```

Remove duplicate `ALTER TABLE` statements from later migrations.

---

### 3. NOT NULL Constraint Failed

**Error**: `NOT NULL constraint failed: settings.bar_icon`

**Cause**: Drizzle schema didn't have a default value, but SQLite migration did.

**Fix** in `lib/db/src/schema/gusto.ts`:

```typescript
// Must have default to match migration
barIcon: text("bar_icon").default("Wine"),  // NOT .notNull() without default
```

---

### 4. Empty Migration Files

**Issue**: Drizzle migrator fails on empty SQL files.

**Fix**: Add a placeholder statement:

```sql
-- Migration: Placeholder to maintain migration index
SELECT 1;
```

---

### 5. Duplicate Column Name in Migrations

**Error**: `SQLITE_ERROR: duplicate column name: parent_item_id`

**Cause**: A column is defined in the initial migration (`0000_*.sql`) via `CREATE TABLE`, but also attempted to be added via `ALTER TABLE` in a subsequent migration.

**Fix**: Remove the `ALTER TABLE ... ADD COLUMN` statement from the later migration. The column already exists in the initial schema.

**Example**: `parent_item_id` was in both `0000_redundant_prodigy.sql` (line 269) and `0001_add_inventory_columns.sql`. Removed from 0001.

**To fix existing installations**: Delete the corrupted database and reinstall:

```bash
rm -f ~/Library/Application\ Support/@workspace/desktop-app/gusto.db
```

---

## Build Configuration

### Required Dependencies in `artifacts/api-server/build.mjs`

```javascript
const expectedPackages = [
  "@libsql",
  "libsql",
  "@neon-rs",
  "detect-libc",
  "bcryptjs",
  "drizzle-orm",
  "drizzle-zod",
  "zod",
];
```

---

## Debugging

### Run App Directly to See Output

```bash
cd /Applications/GustoPOS.app/Contents/MacOS
./GustoPOS
```

### Check if API is Listening

```bash
lsof -i :3000
```

### Inspect Database

```bash
# List tables
sqlite3 ~/Library/Application\ Support/@workspace/desktop-app/gusto.db ".tables"

# View schema
sqlite3 ~/Library/Application\ Support/@workspace/desktop-app/gusto.db ".schema settings"

# View migrations applied
sqlite3 ~/Library/Application\ Support/@workspace/desktop-app/gusto.db "SELECT * FROM __drizzle_migrations;"
```

### Clean Database for Fresh Start

```bash
rm -f ~/Library/Application\ Support/@workspace/desktop-app/gusto.db
```

---

## Package Contents

The DMG includes:

```
GustoPOS.app/
└── Contents/
    ├── MacOS/
    │   └── GustoPOS          # Main executable
    └── Resources/
        ├── api/
        │   ├── index.cjs     # API server
        │   ├── migrations/   # SQL migrations
        │   ├── node_modules/ # Runtime dependencies
        │   ├── public/       # Frontend static files
        │   └── seeds/        # Database seeds
        └── stack.env         # Environment config
```

---

## Build Command

```bash
pnpm run build:desktop
```

This runs:

1. `pnpm run build` - Typecheck all packages
2. Build all workspace packages (gusto-pos, api-server, mockup-sandbox, desktop-app)
3. Package as DMG for macOS (x64)

---

## Version History

- **0.1.0**: Initial production build
