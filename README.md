# GustoPOS Workspace

## Overview

GustoPOS is a full-stack bar management POS system for a Mexican bar. Built as a pnpm monorepo with TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (Tailwind, Recharts, Zustand, Framer Motion, Lucide React)
- **Auth**: Replit Auth (OpenID Connect / PKCE)

## Features

- **Login**: Replit Auth + PIN-based staff switcher during shifts
- **Dashboard**: Active shift status, open tabs summary, low stock alerts
- **Tabs/Tickets**: Open tabs with nicknames, add drinks, close with cash/card payment. Multi-currency (MXN, USD, CAD)
- **Drink Menu**: Recipes with cost calculation. Markup factor + upcharge = suggested price. Manager override
- **Inventory**: Track ingredients, current stock vs. minimum. Low-stock alerts
- **End-of-Night Reports**: Full breakdown (sales by staff, by drink, by category, top sellers, inventory used, low stock alerts)
- **Shift Management**: Start/close shifts
- **Settings**: Exchange rates (USD/MXN, CAD/MXN), default markup, bar name
- **Bilingual**: English/Spanish toggle (stored per user preference)
- **Roles**: Manager, Head Bartender, Bartender, Server

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express 5 API server
│   └── gusto-pos/          # React + Vite web app (POS frontend)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `sessions` — Replit Auth sessions (mandatory)
- `users` — Staff users with role, language, PIN, isActive
- `ingredients` — Inventory items with cost, stock, unit size
- `drinks` — Menu items with recipe references, markup, upcharge
- `recipe_ingredients` — Many-to-many: drinks ↔ ingredients with amount
- `tabs` — Open/closed customer tabs with currency and payment
- `orders` — Line items on tabs (drink, quantity, price snapshot)
- `shifts` — Shift records for end-of-night reporting
- `settings` — App-wide settings (exchange rates, markup default)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all lib packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## API Routes

All routes at `/api` prefix.

- `GET/PATCH /settings` — Exchange rates, markup defaults, bar name
- `GET /auth/user` — Current auth state
- `GET /login` → OIDC login, `GET /callback` → OIDC callback, `GET /logout`
- `GET/POST /users`, `GET/PATCH/DELETE /users/:id`
- `GET/POST /ingredients`, `GET/PATCH/DELETE /ingredients/:id`
- `GET/POST /drinks`, `GET/PATCH/DELETE /drinks/:id`
- `GET/POST /tabs`, `GET/PATCH /tabs/:id`, `POST /tabs/:id/close`, `POST /tabs/:id/orders`
- `PATCH/DELETE /orders/:id`
- `GET/POST /shifts`, `GET /shifts/active`, `POST /shifts/:id/close`
- `GET /reports/end-of-night/:shiftId`

## Key Commands

- `pnpm --filter @workspace/api-server run dev` — run API dev server
- `pnpm --filter @workspace/gusto-pos run dev` — run frontend dev server
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API types
- `pnpm --filter @workspace/db run push` — push DB schema changes

## Packages

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API server. Routes live in `src/routes/`. Uses cookie-based session auth via `openid-client` and PostgreSQL session store.

### `artifacts/gusto-pos` (`@workspace/gusto-pos`)
React + Vite POS frontend. State managed by Zustand (active staff, language). Uses `@workspace/api-client-react` generated hooks.

### `lib/db` (`@workspace/db`)
Database layer using Drizzle ORM with PostgreSQL. Schema in `src/schema/` (auth.ts + gusto.ts).

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI 3.1 spec (`openapi.yaml`) + Orval codegen config.

## Future: Mobile App

Architecture is ready for Expo mobile app:
- Backend routes support all mobile use cases (tabs, orders, inventory)
- Multi-currency already implemented
- Auth supports mobile token exchange (`/mobile-auth/token-exchange`)
- Offline sync: tabs/orders created locally can POST to API when back online

## Seed Data

On initial setup, sample data was seeded:
- 15 ingredients (spirits, beers, wines, mixers, garnishes)
- 8 drinks (margaritas, mezcal, beers, wine, shots) with recipes and cost calculations
- 4 staff users: Carlos Mendez (Manager), Ana Lopez (Head Bartender), Miguel Torres (Bartender), Sofia Garcia (Server)
