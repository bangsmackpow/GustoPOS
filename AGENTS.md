# GustoPOS AI Agent Guide

Welcome, Agent. This document outlines the architecture and standards for GustoPOS.

## 🏗️ Architecture at a Glance

GustoPOS is a **pnpm monorepo** using a "Thin Client, Smart API" model.

-   **Frontend**: React (Vite) + TanStack Query + Tailwind CSS.
-   **API Server**: Express.js + Drizzle ORM + Pino Logger.
-   **Database**: SQLite (LibSQL) for high performance and local-first reliability.
-   **Deployment**: 
    -   **VirtualBox**: Debian-based appliance for airgapped bars.
    -   **Desktop**: Electron wrapper for Mac/Windows.
    -   **Docker**: Standard containers for cloud/VPS.

## 📦 Key Systems to Protect

When modifying the codebase, prioritize these core systems:

1.  **Advanced Inventory (`lib/db/src/schema/inventory.ts`)**: 
    -   Always maintain the three-mode tracking (Tare/Weight/Count).
    -   Ensure `reported_total` vs `expected_total` logic is preserved in audits.
2.  **Stateless Auth (`artifacts/api-server/src/lib/auth.ts`)**: 
    -   Fast, JWT-based sessions without database lookups on every request.
3.  **Deployment Scripts (`airgapped-deployment/scripts/`)**: 
    -   These MUST remain Bash-compatible for Debian/Alpine environments.

## 🛠 Quality Standards

-   **Linting**: Run `pnpm run lint` before committing.
-   **Types**: Ensure `pnpm run typecheck` passes across the whole monorepo.
-   **Schema**: Database changes require a fresh migration in `lib/db/migrations/`.

## 🍹 Final Objective
GustoPOS is built for stability in "Real World" (low-connectivity) environments. Keep it simple, fast, and local-first.
