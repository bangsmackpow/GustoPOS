# GustoPOS AI Agent Guide

Welcome, Agent. This document outlines the architecture and standards for GustoPOS.

## 🏗️ Architecture at a Glance

GustoPOS is a **pnpm monorepo** using a "Thin Client, Smart API" model.

- **Frontend**: React (Vite) + TanStack Query + Tailwind CSS.
- **API Server**: Express.js + Drizzle ORM + Pino Logger.
- **Database**: SQLite (LibSQL) for high performance and local-first reliability.
- **Deployment**:
  - **VirtualBox**: Debian-based appliance for airgapped bars.
  - **Desktop**: Electron wrapper for Mac/Windows.
  - **Docker**: Standard containers for cloud/VPS.

## 📦 Package Structure

### Library Packages (`lib/`)

| Package                       | Purpose                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `@workspace/db`               | Database layer with Drizzle ORM, SQLite schema, migrations |
| `@workspace/api-zod`          | Zod schemas for API validation (generated)                 |
| `@workspace/api-client-react` | TanStack Query hooks (generated)                           |
| `@workspace/api-spec`         | OpenAPI spec for code generation                           |

### Application Packages (`artifacts/`)

| Package                     | Purpose                               |
| --------------------------- | ------------------------------------- |
| `@workspace/gusto-pos`      | Main React frontend (Vite + Tailwind) |
| `@workspace/api-server`     | Express.js API server                 |
| `@workspace/desktop-app`    | Electron wrapper                      |
| `@workspace/mockup-sandbox` | Design sandbox                        |

## 📡 Inventory System

**Active Table**: `inventoryItemsTable` in `lib/db/src/schema/inventory.ts`

- Used by `/api/ingredients` and `/api/inventory/items`
- Supports three-mode tracking: Tare/Weight/Count
- Audit logic with `reported_total` vs `expected_total`

**Deprecated**: `_ingredientsTable` in `lib/db/src/schema/gusto.ts`

- No longer used by any routes
- Kept for backward compatibility only

## 🔐 Authentication

- **Pin Login**: `/api/pin-login` - Staff PIN-based authentication
- **Admin Login**: `/api/admin-login` - Manager/Admin access
- Session: JWT stored in httpOnly cookie

## 🚫 Routes Not for Production

- `dev-login.ts` has been removed - do not add debug routes

## 🛠 Quality Standards

- **Linting**: Run `pnpm run lint` before committing.
- **Types**: Ensure `pnpm run typecheck` passes.
- **Schema**: Database changes require a fresh migration in `lib/db/migrations/`.

## 🍹 Final Objective

GustoPOS is built for stability in "Real World" (low-connectivity) environments. Keep it simple, fast, and local-first.
