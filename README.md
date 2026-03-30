# GustoPOS Workspace

## Overview

GustoPOS is a full-stack bar management POS system tailored for a Mexican bar environment (specifically inspired by Puerto Vallarta). Built as a pnpm monorepo with TypeScript.

## Deployment Options

### **1. Standalone Hub Mode (Recommended for Bars)**
Run the system on a dedicated laptop (like a MacBook Pro) inside the bar.
- **Resilience:** Works without internet.
- **Local Access:** Staff connect via Wi-Fi to `http://gustopos.local:8080`.
- **Guide:** See [DEPLOY_LOCAL.md](./DEPLOY_LOCAL.md) for step-by-step instructions.

### **2. Cloud Deployment**
Run the system on a VPS (DigitalOcean, AWS, etc.) using Docker.
- **Access:** Reached via your custom domain.
- **Sync:** Real-time backups to Cloudflare R2.

---

## Key Project Features

- **Multi-Admin Support:** Create multiple "Manager" accounts with unique passwords. No need to share master credentials.
- **Offline PWA:** Install the app on any iPhone or Android. It loads instantly and caches data locally to survive Wi-Fi blips.
- **Quick Search (⌘K):** Lightning-fast command palette to find drinks, recipes, and open tabs in seconds.
- **Business Insights:** Real-time leaderboards for **Top Profit Drivers** and **Most Common Items**.
- **Automated Inventory:** Stock levels decrement automatically on sale and restore on deletion. Supports ml/oz units.
- **Litestream DR:** Real-time, zero-data-loss replication to Cloudflare R2.

---

## Core Tech Stack

- **Database:** SQLite (via `@libsql/client`) + Drizzle ORM.
- **Backups:** Litestream (S3/R2 replication).
- **Frontend:** React + Vite + Tailwind (Mobile Optimized PWA).
- **API:** Node.js Express + Orval (TanStack Query hooks).

---

## Configuration (stack.env)

Required variables for the system to run:
- `ADMIN_EMAIL`: Main admin login.
- `ADMIN_PASSWORD`: Main admin password.
- `ADMIN_PIN`: PIN for staff switching (4 digits).
- `DATABASE_URL`: `file:/app/data/gusto.db`.

**For Backups:**
- `LITESTREAM_REPLICA_URL`: `s3://bucket-name/gusto.db`.
- `LITESTREAM_ENDPOINT`: Your Cloudflare R2 Endpoint URL.
- `LITESTREAM_ACCESS_KEY_ID`: Your R2 Key.
- `LITESTREAM_SECRET_ACCESS_KEY`: Your R2 Secret.

---

## Developer Guide

1. **Install dependencies:** `pnpm install`
2. **Generate API clients:** `pnpm --filter @workspace/api-spec run codegen`
3. **Run Dev Mode:** `pnpm run dev` (Starts API and Frontend)
4. **Typecheck:** `pnpm run typecheck`
