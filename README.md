# GustoPOS Workspace

## Overview

GustoPOS is a full-stack bar management POS system tailored for a Mexican bar environment (specifically inspired by Puerto Vallarta). Built as a pnpm monorepo with TypeScript.

## Project Status: Functional Transition

The project has been migrated from a boilerplate OIDC-based setup to a **production-ready custom authentication and inventory system**.

### Recent Fixes & Enhancements
- **Custom Auth**: Replaced flaky OIDC/Replit Auth with a stable, environment-variable-backed **Admin Login** and a **PIN-based staff switcher**.
- **Inventory Automation**: Order additions, deletions, and quantity changes now **automatically decrement/restore stock** based on drink recipes using atomic database transactions.
- **Modernized Seeding**: Admin users and a starter list of **50+ Puerto Vallarta drink recipes** (Tequila, Raicilla, Mezcal favorites) can be seeded directly from the UI or CLI.
- **Docker Stability**: Fixed API server crashes related to module resolution (`pg` error) and missing environment variables (`PORT`).
- **Nginx Resilience**: Configured Nginx to defer DNS resolution for the API host, preventing startup crashes in Docker networks.

## Current Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 20+
- **Package manager**: pnpm
- **API framework**: Express 5 (Node.js)
- **Database**: PostgreSQL + Drizzle ORM
- **API codegen**: Orval (OpenAPI 3.1 -> TanStack Query hooks)
- **Frontend**: React + Vite (Tailwind, Lucide, Zustand, Framer Motion)
- **Reverse Proxy**: Nginx (Internal) + Cloudflare/NPM (External)

## Features

- **Dashboard**: Active shift status, open tabs, low stock alerts.
- **Tabs/Tickets**: Multi-currency (MXN, USD, CAD) with automatic exchange rate application.
- **Drink Menu**: Recipes with cost calculation. Actual Price vs. Suggested (Cost * Markup + Upcharge).
- **Inventory**: Real-time stock tracking with automated decrements on sale.
- **Bilingual**: Full English/Spanish support for menus and UI.
- **Reporting**: End-of-night breakdowns including inventory used and sales by staff.

## Next Step: Email Notifications
The system is being prepared to send automated alerts via **SMTP2GO** or custom SMTP hosts.
- **Configuration**: Admin portal (Settings) already supports configuring SMTP Host, Port, User, Password, and recipient emails.
- **Triggers**: Low stock alerts and end-of-night report summaries.

## Database Schema

- `sessions` — Simple custom sessions (stored in DB for persistence).
- `users` — Staff users with roles (Manager, Bartender, Server), language, and PIN.
- `ingredients` — Inventory items with unit sizes (ml, oz, unit) and stock levels.
- `drinks` — Menu items linked to multiple ingredients via recipes.
- `recipe_ingredients` — Many-to-many link with `amountInMl`.
- `tabs` / `orders` — Customer transactions and specific line items.
- `settings` — Bar name, exchange rates, and **SMTP/Notification config**.

## Key Commands

- `pnpm run lint` — Run ESLint across the monorepo.
- `pnpm run typecheck` — Comprehensive TypeScript validation.
- `pnpm run build` — Build all libraries and artifacts.
- `pnpm --filter @workspace/api-spec run codegen` — Sync frontend hooks with `openapi.yaml`.

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
