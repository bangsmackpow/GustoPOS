# GustoPOS - Point of Sale System

GustoPOS is a comprehensive bar and restaurant management system built with a **"Thin Client, Smart API"** architecture. It is designed for reliability in low-connectivity and offline environments, making it ideal for bars, restaurants, and hospitality venues.

---

## Overview

GustoPOS provides complete operational management for hospitality venues:

- **Tab Management**: Open tabs, add orders, process payments, handle splits
- **Inventory Tracking**: Pool (weight-based) and Collection (unit-based) inventory
- **Drinks & Recipes**: Menu management with recipe ingredients
- **Staff Management**: PIN-based login, shift tracking, performance analytics
- **Reporting**: Sales reports, void analytics, staff performance, COGS tracking
- **Accounting**: Period closing with cost of goods sold (COGS) calculations

---

## Architecture

### Technology Stack

| Layer                | Technology                  | Purpose                     |
| -------------------- | --------------------------- | --------------------------- |
| **Frontend**         | React + Vite + Tailwind CSS | User interface              |
| **State Management** | TanStack Query              | Server state & caching      |
| **API Server**       | Express.js                  | REST API endpoints          |
| **Database**         | SQLite (LibSQL)             | Local-first data storage    |
| **ORM**              | Drizzle                     | Type-safe database queries  |
| **Logging**          | Pino                        | Structured JSON logging     |
| **Desktop**          | Electron                    | Desktop application wrapper |

### Package Structure

```
GustoPOS/
├── artifacts/               # Application packages
│   ├── gusto-pos/          # Main React frontend
│   ├── api-server/          # Express.js API server
│   ├── desktop-app/         # Electron wrapper
│   └── mockup-sandbox/     # Design sandbox
├── lib/                     # Shared library packages
│   ├── db/                  # Database layer & migrations
│   ├── api-zod/            # Zod validation schemas
│   ├── api-client-react/   # TanStack Query hooks
│   └── api-spec/           # OpenAPI specification
├── docs/                    # Documentation
└── airgapped-deployment/   # VirtualBox deployment
```

### Deployment Options

1. **Desktop App**: Electron wrapper for Mac/Windows (`.dmg`/`.exe`)
2. **VirtualBox Appliance**: Debian-based VM for airgapped bars
3. **Docker**: Standard containers for cloud/VPS deployment

---

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 8

### Development

```bash
# Install dependencies
pnpm install

# Start development servers (frontend + API)
pnpm run dev
```

The frontend runs on `http://localhost:5173` and the API on `http://localhost:3000`.

### Production Build

```bash
# Build all packages
pnpm run build

# Build desktop application
pnpm run build:desktop
```

### Running the API Server

```bash
ADMIN_PASSWORD=your-password PORT=3000 node ./dist/index.cjs
```

---

## Key Features

### Bartender Experience

- **PIN Login**: Quick staff authentication
- **Real-time Stock Status**: Drink cards show availability (green/yellow/red)
- **Quantity Selector**: Select 1-20 units per order
- **Split Bill**: Divide tab among 2-10 people

### Inventory System

- **Pool Tracking**: Weight-based (ml) for spirits, mixers, liquids
- **Collection Tracking**: Unit-based for beer, merch, packaged goods
- **Auto-tracking Mode**: Automatically determines tracking type
- **Inventory Audits**: Record physical counts, track variance over time
- **Variance Analysis**: Identify consistent overage/underage patterns

### Accounting & Reporting

- **Period Closing**: Daily/weekly/monthly period closes with COGS
- **Sales Analytics**: Revenue, tips, discounts, voids by date range
- **Void Analytics**: Track voided orders by reason, staff, and drink
- **Staff Performance**: Sales, tabs, average ticket, tips per employee
- **CSV Export**: Export sales, inventory, COGS, audit logs

### System Defaults (Admin-configurable)

- Default alcohol density
- Default serving size (ml)
- Default bottle size (ml)
- Default tracking mode
- Variance warning threshold

---

## Database Schema

### Core Tables

| Table                | Purpose                                |
| -------------------- | -------------------------------------- |
| `users`              | Staff accounts with PIN authentication |
| `shifts`             | Work shift tracking                    |
| `tabs`               | Customer tabs/orders                   |
| `orders`             | Individual drink orders                |
| `drinks`             | Menu items                             |
| `recipe_ingredients` | Drink recipes                          |
| `inventory_items`    | Inventory stock                        |
| `inventory_audits`   | Audit history                          |
| `periods`            | Accounting periods                     |
| `cogs_entries`       | Cost of goods sold entries             |

### Key Relationships

```
User → Shifts → Tabs → Orders → Drinks → RecipeIngredients → InventoryItems
```

---

## API Endpoints

### Authentication

- `POST /api/pin-login` - Staff PIN login
- `POST /api/admin-login` - Admin authentication

### Tabs & Orders

- `POST /api/tabs` - Create tab
- `POST /api/tabs/:id/orders` - Add order
- `PATCH /api/tabs/:id/close` - Close tab
- `DELETE /api/tabs/orders/:id` - Void order (requires manager PIN)

### Inventory

- `GET /api/inventory/items` - List inventory
- `POST /api/inventory/items` - Add item
- `POST /api/inventory/items/:id/audit` - Record audit
- `GET /api/inventory/variance` - Variance analysis

### Reports & Analytics

- `GET /api/shifts/:id/report` - Shift sales report
- `GET /api/analytics/voids` - Void analytics
- `GET /api/periods/:id/cogs` - COGS report

### Export

- `GET /api/export/sales` - Sales CSV
- `GET /api/export/inventory` - Inventory CSV
- `GET /api/export/cogs` - COGS CSV
- `GET /api/export/audit-logs` - Audit logs CSV

---

## Configuration

### Environment Variables

| Variable         | Description            | Default           |
| ---------------- | ---------------------- | ----------------- |
| `ADMIN_PASSWORD` | Admin account password | (required)        |
| `PORT`           | API server port        | 3000              |
| `DATABASE_URL`   | Database file path     | `./data/gusto.db` |

### Settings (Database)

- Bar name and icon
- Currency rates (USD, CAD to MXN)
- SMTP configuration for email alerts
- Backup settings (Litestream, USB)
- System defaults for inventory

---

## Bilingual Support

GustoPOS supports English and Spanish:

- Language toggle on login screen
- Staff language preference
- Bilingual drink names and descriptions
- All UI labels translated

---

## Version History

- **v0.1.0 (April 13, 2026)**:
  - ✅ Critical fix: PIN pad lockout prevention
  - ✅ All 7 reported issues verified & fixed
  - ✅ Complete discount/specials system
  - ✅ Batch audit functionality
  - ✅ Full inventory management
  - ✅ Accounting & reporting features
  - ✅ Rush Events display fix (3 default, Show More/Less)
  - ✅ Inventory weight calculation fix (formula corrected)
  - **Build**: GustoPOS-0.1.0.dmg (107 MB)
  - **MD5**: bf007734c8d1a4b6965e45ed9b09d372

- **Earlier Versions**: Development builds with core POS features

---

## Documentation

### Core Documentation

| Document                                   | Description                |
| ------------------------------------------ | -------------------------- |
| [USER_GUIDE.md](USER_GUIDE.md)             | End-user operational guide |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md)           | Administrator guide        |
| [ARCHITECTURE.md](ARCHITECTURE.md)         | Technical architecture     |
| [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) | Deployment & operations    |
| [TESTING_GUIDE.md](TESTING_GUIDE.md)       | Testing procedures         |

### Latest Updates (April 13, 2026 - 21:00)

| Document                                                                             | Description                          |
| ------------------------------------------------------------------------------------ | ------------------------------------ |
| [PACKAGING_GUIDE.md](PACKAGING_GUIDE.md)                                             | Desktop app packaging & distribution |
| [ISSUE_AUDIT_APRIL_13_2026.md](ISSUE_AUDIT_APRIL_13_2026.md)                         | Issue audit & fixes report           |
| [docs/DISCOUNTS_IMPLEMENTATION_SUMMARY.md](docs/DISCOUNTS_IMPLEMENTATION_SUMMARY.md) | Discount system overview             |

**Latest Build**: April 13, 2026 (21:00)  
**Status**: ✅ Production Ready  
**MD5**: `bf007734c8d1a4b6965e45ed9b09d372`  
**Critical Fixes**: Rush Events display/filter, Inventory weight formula (\*→/ density), legacy field fix

---

## License

MIT
# GUSTOPOS
