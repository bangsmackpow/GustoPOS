# GustoPOS Workspace

## Overview

GustoPOS is a full-stack bar management POS system tailored for a Mexican bar environment (specifically inspired by Puerto Vallarta). Built as a pnpm monorepo with TypeScript.

## Project Trajectory & Recent Successes

We have successfully migrated the project from a generic boilerplate to a functional, stable, and highly customized POS system.

### **Phase 1: Stabilization & Auth (COMPLETED)**
- **Unified Custom Auth**: Removed flaky OIDC/Replit Auth. Implemented a robust, environment-backed **Admin Login** and a **PIN-based staff switcher**.
- **Session Persistence**: Fixed "login loops" by ensuring proper credential handling and proxy trust (`trust proxy`) for secure cookies behind Cloudflare.
- **Docker & Nginx Resilience**: Resolved critical "Module Not Found" (`pg`) and "Bad Gateway" (Nginx DNS race conditions) errors by streamlining the build process and deferring host resolution.

### **Phase 2: Architecture & Inventory (COMPLETED)**
- **SQLite/LibSQL Migration**: Simplified the stack by moving from PostgreSQL to a local SQLite architecture. This eliminated the `db` container, reduced latency, and simplified deployments.
- **Litestream Backups**: Integrated real-time, zero-data-loss backups. The system automatically streams every change to an S3-compatible bucket (like Cloudflare R2) and can self-restore on startup.
- **Inventory Automation**: Implemented atomic database transactions to **automatically decrement stock** when orders are placed and **restore stock** when orders are deleted.
- **Bulk Importers**: Added CSV and Markdown support for mass-importing both Inventory items and Drink Recipes.

### **Phase 3: Operations & Features (IN PROGRESS)**
- **Staff Management**: Full portal to manage team members, roles, and PINs.
- **Recipe Recall**: Bartenders can now tap a "ⓘ" icon on any drink to see exact ml/oz measurements and stock availability.
- **Nightly Reports**: Automated "End of Night" summaries including sales by staff, top sellers, and inventory velocity.

---

## Current Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 20+
- **Database**: SQLite (via `@libsql/client`) + Drizzle ORM
- **Backups**: Litestream (Real-time S3 replication)
- **API codegen**: Orval (OpenAPI 3.1 -> TanStack Query hooks)
- **Frontend**: React + Vite (Tailwind, Lucide, Zustand, Framer Motion)
- **Reverse Proxy**: Nginx (Internal) + Cloudflare/NPM (External)

---

## Disaster Recovery (Litestream)

The system is "indestructible" by design. Every change to `gusto.db` is replicated in real-time to your cloud bucket.
- **Auto-Restore**: If the server is wiped, the API container will automatically pull the latest backup from your bucket on startup before accepting requests.
- **Configuration**: Set `LITESTREAM_REPLICA_URL`, `LITESTREAM_ACCESS_KEY_ID`, and `LITESTREAM_SECRET_ACCESS_KEY` in your `stack.env`.

---

## Key Features

- **Dashboard**: Active shift status, open tabs, live low-stock alerts, and local PV "Rush" feed.
- **Tabs/Tickets**: Multi-currency (MXN, USD, CAD) with automatic exchange rate application.
- **Inventory**: Real-time stock tracking with automated decrements on sale. Supports ml/oz units.
- **Bilingual**: Full English/Spanish support for menus, recipes, and UI.

---

## Configuration (stack.env)

Required variables for the system to run:
- `DATABASE_URL`: `file:/app/data/gusto.db` (The location of your SQLite file).
- `ADMIN_EMAIL`: Main admin login.
- `ADMIN_PASSWORD`: Main admin password.
- `ADMIN_PIN`: Admin staff switcher PIN (e.g., "1234").
- `PORT`: API server port (default `3000`).

**For Backups:**
- `LITESTREAM_REPLICA_URL`: Your S3/R2 bucket URL.
- `LITESTREAM_ACCESS_KEY_ID`: Cloudflare R2 Access Key.
- `LITESTREAM_SECRET_ACCESS_KEY`: Cloudflare R2 Secret Key.

---

## Deployment (Portainer)

The project includes a GitHub workflow that can automatically update your Portainer stack.
1. In Portainer, enable the **Webhook** for your stack and copy the URL.
2. In GitHub, add a repository secret named `PORTAINER_WEBHOOK_URL`.
3. Every push to `main` will now trigger an automatic update of your live stack.
