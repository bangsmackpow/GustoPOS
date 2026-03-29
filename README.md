# GustoPOS Workspace

## Overview

GustoPOS is a full-stack bar management POS system tailored for a Mexican bar environment (specifically inspired by Puerto Vallarta). Built as a pnpm monorepo with TypeScript.

## Project Trajectory & Recent Successes

We have successfully migrated the project from a generic boilerplate to a functional, stable, and highly customized POS system.

### **Phase 1: Stabilization & Auth (COMPLETED)**
- **Unified Custom Auth**: Removed flaky OIDC/Replit Auth. Implemented a robust, environment-backed **Admin Login** and a **PIN-based staff switcher**.
- **Session Persistence**: Fixed "login loops" by ensuring proper credential handling and proxy trust (`trust proxy`) for secure cookies behind Cloudflare.
- **Docker & Nginx Resilience**: Resolved critical "Module Not Found" (`pg`) and "Bad Gateway" (Nginx DNS race conditions) errors by streamlining the build process and deferring host resolution.

### **Phase 2: Inventory & Logic (COMPLETED)**
- **Inventory Automation**: Implemented atomic database transactions to **automatically decrement stock** when orders are placed and **restore stock** when orders are deleted.
- **Starter Data**: Seeded the system with **50+ Puerto Vallarta recipes** and a full inventory of local spirits (Raicilla, Mezcal, Tequila) and Mexican beers.
- **Admin Seeding**: Added a "Seed Starter Data" button to the Inventory portal for easy deployment.

### **Phase 3: Notifications & Scale (IN PROGRESS)**
- **SMTP Configuration**: Integrated a full SMTP management suite (Host, Port, User, Password) into the Admin Settings.
- **Inventory Alerts**: (Ready for Testing) Automated low-stock email reminders triggered when ingredients hit their minimum thresholds.
- **Shift Reporting**: (Ready for Testing) Automated "End of Night" summaries sent to management upon shift closure.

---

## Current Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 20+
- **API framework**: Express 5 (Node.js)
- **Database**: PostgreSQL + Drizzle ORM
- **API codegen**: Orval (OpenAPI 3.1 -> TanStack Query hooks)
- **Frontend**: React + Vite (Tailwind, Lucide, Zustand, Framer Motion)
- **Reverse Proxy**: Nginx (Internal) + Cloudflare/NPM (External)

## Email Notification Logic

The system is configured to use **SMTP2GO** or custom SMTP hosts to keep management informed without manual checks.

### 1. Low Stock Alerts
- **Trigger**: Every time an order is added or updated, the system checks the `currentStock` vs `minimumStock` for all ingredients in the recipe.
- **Action**: Sends an immediate email to the `inventoryAlertEmail` configured in Settings.
- **Content**: Specifies the ingredient name and the remaining quantity.

### 2. Shift Reports
- **Trigger**: When a shift is officially closed via the Dashboard.
- **Action**: Generates a summary of the shift's performance and emails it to management.
- **Content**: Total Sales (MXN), Cash vs Card breakdown, and total tabs closed.

---

## Configuration (stack.env)

Required variables for the system to run:
- `DATABASE_URL`: Postgres connection string.
- `ADMIN_EMAIL`: Main admin login.
- `ADMIN_PASSWORD`: Main admin password.
- `ADMIN_PIN`: Admin staff switcher PIN (e.g., "1234").
- `ADMIN_SEED_ENABLED`: Set to `true` to allow seeding starter data.
- `PORT`: API server port (default `3000`).

## Puerto Vallarta Starter Data
The system includes a pre-configured seed for:
- **Spirits**: Casamigos, Don Julio 70, Herradura, Hacienda El Divisadero (Raicilla), 400 Conejos (Mezcal).
- **Beers**: Pacifico, Corona, Modelo Especial, Victoria.
- **Recipes**: Classic Margaritas, Raicilla Sours, Micheladas, Cantaritos, and more.
