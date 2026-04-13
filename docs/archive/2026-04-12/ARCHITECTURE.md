# ARCHITECTURE.md - GustoPOS Technical Architecture

> **Last Updated**: April 10, 2026  
> **Version**: 1.0  
> **Status**: ACTIVE

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Package Structure](#package-structure)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [Authentication Flow](#authentication-flow)
7. [Inventory System](#inventory-system)
8. [Frontend Architecture](#frontend-architecture)
9. [Deployment Modes](#deployment-modes)

---

## System Overview

GustoPOS is a **pnpm monorepo** using a "Thin Client, Smart API" model designed for offline-first bar operations.

| Layer          | Technology                                   | Purpose           |
| -------------- | -------------------------------------------- | ----------------- |
| **Frontend**   | React (Vite) + TanStack Query + Tailwind CSS | UI/UX             |
| **API Server** | Express.js + Drizzle ORM + Pino Logger       | Business Logic    |
| **Database**   | SQLite (LibSQL)                              | Local Persistence |

### Design Principles

- **Offline-First**: All data stored locally, no internet required
- **Bilingual**: Full EN/ES support throughout
- **Flexible**: Handles non-standard bar operations (unknown costs, promotional items)
- **Audit Trail**: Complete logging of changes

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     GUSTOPOS SYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐      ┌─────────────────────────────┐    │
│  │                 │      │                             │    │
│  │   Frontend      │◄────►│      API Server            │    │
│  │   (Vite/React)  │      │      (Express.js)          │    │
│  │                 │      │                             │    │
│  │   Port: 5173    │      │   Port: 3000               │    │
│  │                 │      │                             │    │
│  └─────────────────┘      └──────────────┬──────────────┘    │
│                                          │                    │
│                                          ▼                    │
│                                 ┌─────────────────────┐      │
│                                 │                     │      │
│                                 │   SQLite Database   │      │
│                                 │   (LibSQL)          │      │
│                                 │                     │      │
│                                 │   - inventory_items │      │
│                                 │   - drinks          │      │
│                                 │   - tabs            │      │
│                                 │   - users           │      │
│                                 │   - settings        │      │
│                                 │                     │      │
│                                 └─────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Package Structure

### Library Packages (`lib/`)

| Package                       | Path                    | Purpose                                                    |
| ----------------------------- | ----------------------- | ---------------------------------------------------------- |
| `@workspace/db`               | `lib/db/`               | Database layer with Drizzle ORM, SQLite schema, migrations |
| `@workspace/api-zod`          | `lib/api-zod/`          | Zod schemas for API validation (generated)                 |
| `@workspace/api-client-react` | `lib/api-client-react/` | TanStack Query hooks (generated)                           |
| `@workspace/api-spec`         | `lib/api-spec/`         | OpenAPI spec for code generation                           |

### Application Packages (`artifacts/`)

| Package                     | Path                        | Purpose               |
| --------------------------- | --------------------------- | --------------------- |
| `@workspace/gusto-pos`      | `artifacts/gusto-pos/`      | Main React frontend   |
| `@workspace/api-server`     | `artifacts/api-server/`     | Express.js API server |
| `@workspace/desktop-app`    | `artifacts/desktop-app/`    | Electron wrapper      |
| `@workspace/mockup-sandbox` | `artifacts/mockup-sandbox/` | Design sandbox        |

---

## Database Schema

### Core Tables

#### 1. `inventory_items` (ACTIVE)

The primary inventory tracking table. Located at `lib/db/src/schema/inventory.ts`.

**Key Columns:**

| Column                | Type        | Description                                |
| --------------------- | ----------- | ------------------------------------------ |
| `id`                  | text (UUID) | Primary key                                |
| `name`                | text        | Item name                                  |
| `type`                | text        | spirit, beer, mixer, etc.                  |
| `subtype`             | text        | tequila, mezcal, bulk, etc.                |
| `parentItemId`        | text        | Links variations to parent                 |
| **Pool Fields**       |             | _(spirit, mixer, ingredient liquid)_       |
| `bottleSizeMl`        | real        | ml per bottle                              |
| `alcoholDensity`      | real        | Liquid density (default 0.94)              |
| `fullBottleWeightG`   | real        | Full bottle weight                         |
| `glassWeightG`        | real        | Empty bottle weight (calculated)           |
| `servingSize`         | real        | Standard pour in oz                        |
| **Collection Fields** |             | _(beer, merch, misc, ingredient weighted)_ |
| `unitsPerCase`        | integer     | Units per case/box                         |
| **Stock Fields**      |             |                                            |
| `currentBulk`         | real        | Sealed containers (bottles/cases)          |
| `currentPartial`      | real        | Open: Pool=grams, Collection=loose units   |
| **Common Fields**     |             |                                            |
| `orderCost`           | real        | Price per bottle/case                      |
| `isOnMenu`            | boolean     | Show on menu                               |
| `isDeleted`           | boolean     | Soft delete                                |
| `lowStockThreshold`   | real        | Low stock alert level                      |

> **Inventory Model: Pool vs Collection**
>
> **Pool (spirit, mixer):** Weight-based using tare method
>
> - liquidWeight = bottleSizeMl × alcoholDensity
> - containerWeight = fullBottleWeightG - liquidWeight
> - partialStock = (currentPartial - containerWeight) / alcoholDensity
> - Total = (currentBulk × bottleSizeMl) + partialStock
>
> **Collection (beer, merch):** Unit-based
>
> - Total = (currentBulk × unitsPerCase) + currentPartial

**Relationships:**

- Self-referential: `parentItemId` → `inventory_items.id` (variations)
- One-to-many: parent → variations

#### 2. `drinks` (ACTIVE)

Drink/menu items with recipes. Located in `lib/db/src/schema/gusto.ts` (legacy) + `artifacts/api-server/src/routes/drinks.ts`.

#### 3. `tabs` (ACTIVE)

Tab/order management. Located in `artifacts/api-server/src/routes/tabs.ts`.

#### 4. `users` (ACTIVE)

Staff management. Located in `artifacts/api-server/src/routes/users.ts`.

#### 5. `settings` (ACTIVE)

System configuration. Located in `artifacts/api-server/src/routes/settings.ts`.

---

## API Routes

### Authentication

| Route              | Method | Description              |
| ------------------ | ------ | ------------------------ |
| `/api/pin-login`   | POST   | Staff PIN authentication |
| `/api/admin-login` | POST   | Admin authentication     |
| `/api/auth/user`   | GET    | Get current user         |
| `/api/auth/logout` | POST   | Logout                   |

### Inventory

| Route                        | Method | Description              |
| ---------------------------- | ------ | ------------------------ |
| `/api/inventory/items`       | GET    | List all items           |
| `/api/inventory/items`       | POST   | Create item              |
| `/api/inventory/items/:id`   | GET    | Get item                 |
| `/api/inventory/items/:id`   | PUT    | Update item              |
| `/api/inventory/items/:id`   | DELETE | Soft delete (trash)      |
| `/api/inventory/trash/count` | GET    | Count deleted items      |
| `/api/inventory/trash/clear` | DELETE | Permanent delete (admin) |
| `/api/inventory/low-stock`   | GET    | Get low stock items      |

### Drinks/Menu

| Route                   | Method | Description  |
| ----------------------- | ------ | ------------ |
| `/api/drinks`           | GET    | List drinks  |
| `/api/drinks`           | POST   | Create drink |
| `/api/drinks/:id`       | GET    | Get drink    |
| `/api/drinks/:id`       | PUT    | Update drink |
| `/api/drinks/:id`       | DELETE | Delete drink |
| `/api/drinks/:id/clone` | POST   | Clone drink  |

### Tabs/Orders

| Route                 | Method | Description            |
| --------------------- | ------ | ---------------------- |
| `/api/tabs`           | GET    | List tabs              |
| `/api/tabs`           | POST   | Create tab             |
| `/api/tabs/:id`       | GET    | Get tab                |
| `/api/tabs/:id`       | PUT    | Update tab             |
| `/api/tabs/:id`       | DELETE | Delete tab             |
| `/api/tabs/:id/close` | POST   | Close tab with payment |

### Staff

| Route            | Method | Description         |
| ---------------- | ------ | ------------------- |
| `/api/users`     | GET    | List users (admin)  |
| `/api/users`     | POST   | Create user (admin) |
| `/api/users/:id` | PUT    | Update user         |
| `/api/users/:id` | DELETE | Delete user         |

### Settings

| Route                  | Method | Description     |
| ---------------------- | ------ | --------------- |
| `/api/settings`        | GET    | Get settings    |
| `/api/settings`        | PUT    | Update settings |
| `/api/settings/backup` | POST   | Create backup   |

---

## Authentication Flow

### PIN Login Flow

```
1. User enters email + 4-digit PIN
2. POST /api/pin-login
3. Server validates against users table
4. If valid → Generate JWT (7-day expiry)
5. JWT stored in httpOnly cookie
6. Redirect to dashboard
```

### Session Management

- **Expiry**: 7 days from issue
- **Activity Timeout**: 1 hour of inactivity
- **Storage**: httpOnly cookie (XSS safe)

### Role-Based Access

| Role             | Access Level                                     |
| ---------------- | ------------------------------------------------ |
| `admin`          | Full access, can manage users, settings, backups |
| `manager`        | Can manage inventory, drinks, tabs               |
| `head_bartender` | Can manage tabs, basic inventory                 |
| `bartender`      | Can open/manage tabs                             |
| `server`         | Can view tabs, take orders                       |

---

## Inventory System

### Key Concepts

#### 1. Parent/Variation System

```
Tequila (Parent)
├── Tequila 750ml (Variation)
├── Tequila 1L (Variation)
└── Tequila 1.75L (Variation)
```

- Each variation has its own inventory and cost
- Pooled stock shows total across all variations

#### 2. Weighted Average Cost

Cost calculation for inventory additions:

```
new_average_cost = ((current_stock × current_cost) + (new_qty × unit_cost)) / (current_stock + new_qty)
```

**Example:**

- Current: 10 bottles @ $10/bottle = $100 total
- Add: 5 bottles @ $12/bottle = $60 total
- New Average: ($100 + $60) / 15 = $10.67/bottle

#### 3. Measurement Modes

| Mode        | Description           | Use Case               |
| ----------- | --------------------- | ---------------------- |
| Tare/Weight | Uses scale to measure | Spirits, wine          |
| Bulk        | Weight/volume based   | Beer kegs, bulk mixers |
| Count       | Discrete units        | Bottled beer, soda     |

#### 4. Audit System

Two audit approaches combined in `inventory_audits` table:

**Guest Logic**: `physical_count - system_stock = variance`

**Advanced Logic**: `reported_total - expected_total = variance`

---

## Frontend Architecture

### Pages

| Page            | Purpose              | Features                            |
| --------------- | -------------------- | ----------------------------------- |
| `Dashboard.tsx` | Home                 | Quick stats, recent tabs            |
| `Inventory.tsx` | Inventory management | All items, Add Inventory, Edit Item |
| `Drinks.tsx`    | Menu management      | Drink list, recipes, categories     |
| `Tabs.tsx`      | Tab management       | Open tabs, create new               |
| `TabDetail.tsx` | Single tab           | Order management, payment           |
| `Reports.tsx`   | Analytics            | Sales, inventory, staff             |
| `Settings.tsx`  | Configuration        | Staff, backups, rates               |

### Key Components

- **Layout**: Main app shell with navigation
- **PinPad**: PIN entry component
- **Modal**: Reusable modal system
- **Toast**: Notifications

### State Management

- **TanStack Query**: Server state (inventory, drinks, tabs)
- **React useState**: Local UI state
- **useSearchParams**: URL-based state (filters)

---

## Deployment Modes

### 1. Desktop App (PRIMARY)

**Target**: Single-machine bar operations  
**Platform**: macOS/Windows (Electron)  
**Database**: Local SQLite

```
┌────────────────────────┐
│   GustoPOS.app         │
│   ├─ Frontend (React)  │
│   ├─ API (Express)     │
│   └─ SQLite (LibSQL)   │
└────────────────────────┘
```

### 2. VirtualBox Appliance

**Target**: Airgapped bars (no internet)  
**OS**: Debian-based Linux  
**Features**: Auto-start, USB backup

### 3. Docker (Cloud/VPS)

**Target**: Multi-device, mobile access  
**Features**: PWA, real-time sync

---

## Build Commands

```bash
# Development
pnpm run dev

# Build all
pnpm run build

# Build desktop app
pnpm run build:desktop

# Lint
pnpm run lint

# Typecheck
pnpm run typecheck

# Generate API types
pnpm --filter @workspace/api-spec run codegen
```

---

## File Locations

| Component       | Path                                   |
| --------------- | -------------------------------------- |
| Database Schema | `lib/db/src/schema/inventory.ts`       |
| API Routes      | `artifacts/api-server/src/routes/*.ts` |
| Frontend Pages  | `artifacts/gusto-pos/src/pages/*.tsx`  |
| Migrations      | `lib/db/migrations/*.sql`              |
| OpenAPI Spec    | `lib/api-spec/openapi.yaml`            |

---

## Related Documentation

- [USER_GUIDE.md](./USER_GUIDE.md) - Operational guide for staff
- [OFFLINE_DESKTOP_GUIDE.md](./OFFLINE_DESKTOP_GUIDE.md) - Desktop app setup
- [ROADMAP.md](./ROADMAP.md) - Future features and priorities
- [INVENTORY_MANUAL.md](./inventory/INVENTORY_MANUAL.md) - Inventory system details
