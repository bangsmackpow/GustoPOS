# GustoPOS - Point of Sale System

GustoPOS is a comprehensive bar and restaurant management system built with a **"Thin Client, Smart API"** architecture. Designed for reliability in low-connectivity and offline environments, ideal for bars, restaurants, and hospitality venues.

---

## Overview

GustoPOS provides complete operational management:

- **Tab Management**: Open tabs, add orders, process payments, handle splits
- **Inventory Tracking**: Pool (weight-based) and Collection (unit-based) inventory
- **Drinks & Recipes**: Menu management with recipe ingredients
- **Staff Management**: PIN-based login, shift tracking, performance analytics
- **Discounts & Specials**: Three-level discount system (promo codes, scheduled specials, manual discounts)
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
│   ├── gusto-pos/        # Main React frontend
│   ├── api-server/        # Express.js API server
│   ├── desktop-app/       # Electron wrapper
│   └── mockup-sandbox/   # Design sandbox
├── lib/                 # Shared library packages
│   ├── db/             # Database layer & migrations
│   ├── api-zod/         # Zod validation schemas
│   ├── api-client-react/ # TanStack Query hooks
│   └── api-spec/        # OpenAPI specification
├── docs/                # Documentation
└── airgapped-deployment/ # VirtualBox deployment
```

### Deployment Options

1. **Desktop App**: Electron for Mac/Windows (`.dmg`/`.exe`)
2. **VirtualBox**: Debian-based VM for airgapped bars
3. **Docker**: Standard containers for cloud/VPS

---

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 8

### Development

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`

### Production Build

```bash
# Build all packages
pnpm run build

# Build desktop app
pnpm run build:desktop
```

### Running API Server

```bash
ADMIN_PASSWORD=your-password PORT=3000 node ./dist/index.cjs
```

---

## Key Features

### Bartender Experience

- **PIN Login**: Quick staff authentication with auto-lock protection
- **Real-time Stock Status**: Drink cards show availability (green/yellow/red/out)
- **Quantity Selector**: Select 1-20 units per order
- **Split Bill**: Divide tab among 2-10 people
- **Ingredient Substitution**: Swap ingredients during preparation with automatic price & stock adjustments
- **Payment Selection**: Two-step payment confirmation (cash/card) with total review
- **Recipe Viewing**: See full cocktail recipes with ml/oz conversions

### Cashbox Management

- **Starting Cash Verification**: Modal verification of opening register balance
- **Staff Clock-In Tracking**: Real-time widget showing active and clocked-out staff
- **Shift Management**: Integrated clock-in/out with duration tracking

### Discount System

Three-level discount system:

1. **Specials**: Automatic drink/category discounts based on schedule (day, time, date range)
2. **Manual Discounts**: Per-order discounts (% or fixed amount) applied by staff
3. **Promo Codes**: Tab-level discount codes at checkout with usage limits

### Inventory System

- **Pool Tracking**: Weight-based (ml) for spirits, mixers, liquids
- **Collection Tracking**: Unit-based for beer, merch, packaged goods
- **Auto-tracking Mode**: Automatically determines tracking type
- **Inventory Audits**: Physical count reconciliation with variance detection
- **Variance Analysis**: Track overage/underage patterns with trending
- **Stock Reservation**: Real-time reserved stock tracking for pending orders
- **Ingredient Substitution Tracking**: Full audit trail of ingredient swaps with price impact

### Accounting & Reporting

- **Period Closing**: Daily/weekly/monthly with COGS calculations
- **Sales Analytics**: Revenue, tips, discounts, voids by date range with quick date filters
- **Void Analytics**: Track voids by reason, staff, and drink with financial impact
- **Staff Performance**: Sales, tabs, average ticket, tips per employee
- **CSV Export**: Sales, inventory, COGS, audit logs
- **Shift Reports**: Daily sales summary by shift with opening/closing balances

### Events & Specials Management

- **Rush Events**: Schedule rush periods (cruises, festivals, etc.) with impact levels
- **Calendar View**: Visual calendar, list, and management views
- **Specials Scheduling**: Create drink/category specials with complex scheduling (days, hours, date ranges)
- **Active Specials**: Real-time filtering of active discounts based on current time

### System Defaults (Admin-configurable)

- Default alcohol density (0.94)
- Default serving size (44.36ml / 1.5oz)
- Default bottle size (750ml)
- Default units per case
- Default tracking mode
- Variance warning threshold
- Low stock alert thresholds

### Data Seeding & Setup

- **Starter Data**: Load 50+ common ingredients with preset values
- **Cocktail Library**: Seed 8 popular cocktails (Margarita, Mojito, Daiquiri, etc.)
- **Admin User**: Create/update admin account with PIN authentication

---

## Database Schema

### Core Tables

| Table                 | Purpose                          |
| --------------------- | -------------------------------- |
| `users`               | Staff accounts with PIN auth     |
| `shifts`              | Work shift tracking              |
| `staff_shifts`        | Staff clock-in/out within shifts |
| `tabs`                | Customer tabs/orders             |
| `orders`              | Individual drink orders          |
| `order_modifications` | Ingredient substitution history  |
| `drinks`              | Menu items                       |
| `recipe_ingredients`  | Drink recipes                    |
| `inventory_items`     | Inventory stock                  |
| `inventory_audits`    | Audit history                    |
| `periods`             | Accounting periods               |
| `cogs_entries`        | Cost of goods sold               |
| `promo_codes`         | Discount codes                   |
| `specials`            | Scheduled specials               |
| `rushes`              | Rush/event scheduling            |
| `event_logs`          | Audit trail of all actions       |

---

## API Endpoints

### Authentication

- `POST /api/pin-login` - Staff PIN login
- `POST /api/admin-login` - Admin login

### Tabs & Orders

- `POST /api/tabs` - Create tab
- `GET /api/tabs/:id` - Get tab details
- `PATCH /api/tabs/:id` - Update tab
- `POST /api/tabs/:id/orders` - Add order
- `PATCH /api/orders/:id` - Update order (quantity)
- `PATCH /api/orders/:id/discount` - Apply manual discount
- `PATCH /api/orders/:id/modify-ingredient` - Substitute ingredient with price adjustment
- `DELETE /api/tabs/orders/:id` - Void order with reason
- `PATCH /api/tabs/:id/close` - Close tab with payment

### Inventory

- `GET /api/inventory/items` - List inventory
- `POST /api/inventory/items` - Add item
- `PATCH /api/inventory/items/:id` - Update item
- `POST /api/inventory/items/:id/audit` - Record physical audit
- `GET /api/inventory/variance` - Variance analysis with trending
- `POST /api/bulk-import` - Bulk CSV import

### Staff & Shifts

- `POST /api/staff-shifts/clock-in` - Clock in staff member
- `PATCH /api/staff-shifts/:id/clock-out` - Clock out staff member
- `GET /api/staff-shifts/:shiftId` - Get staff shifts for shift

### Events & Promotions

- `GET /api/rushes` - List rush events
- `POST /api/rushes` - Create rush event
- `DELETE /api/rushes/:id` - Delete rush event
- `GET /api/promo-codes` - List promo codes
- `POST /api/promo-codes` - Create code
- `PATCH /api/promo-codes/:id` - Update code
- `DELETE /api/promo-codes/:id` - Delete code
- `GET /api/specials` - List specials
- `GET /api/specials/active` - Active specials now
- `POST /api/specials` - Create special
- `PATCH /api/specials/:id` - Update special
- `DELETE /api/specials/:id` - Delete special

### Reports & Analytics

- `GET /api/shifts/:id/report` - Shift sales report
- `GET /api/analytics/voids` - Void analytics by reason/staff
- `GET /api/periods` - List accounting periods
- `POST /api/periods` - Create period
- `POST /api/periods/:id/close` - Close period with COGS
- `GET /api/periods/:id/cogs` - COGS report
- `GET /api/export/sales` - CSV export of sales data
- `GET /api/export/inventory` - CSV export of inventory
- `GET /api/export/cogs` - CSV export of COGS entries
- `GET /api/export/audit-logs` - CSV export of audit logs

### Data Seeding (Admin only)

- `POST /api/seed-admin` - Create/update admin user
- `POST /api/seed-starter` - Load starter data (ingredients, recipes)
- `POST /api/seed-cocktails` - Seed popular cocktails

---

## Configuration

### Environment Variables

| Variable         | Description    | Default           |
| ---------------- | -------------- | ----------------- |
| `ADMIN_PASSWORD` | Admin password | (required)        |
| `PORT`           | API port       | 3000              |
| `DATABASE_URL`   | Database path  | `./data/gusto.db` |

### Settings (Database)

- Bar name and icon
- Currency rates (USD, CAD to MXN)
- SMTP for email alerts
- Backup settings
- System defaults

---

## Bilingual Support

GustoPOS supports English and Spanish:

- Language toggle on login and PIN screens
- Staff language preference
- Bilingual drink names and descriptions
- All UI labels translated

---

## Version

**v0.1.0** (April 2026 - Complete Build)

### Phase 4: Major Features ✅

- ✅ Cashbox Verification Modal (Issue #27)
- ✅ Staff Clock-In Indicator Dashboard Widget (Issue #25)
- ✅ Calendar Refactor with Events & Specials (Issue #28)
- ✅ Seed Cocktails with Intelligent Ingredient Matching (Issue #34)

### Phase 3: Data Flow Fixes ✅

- ✅ Inventory stock initialization defaults
- ✅ Menu visibility price validation
- ✅ Serving size unit labels by tracking mode
- ✅ Stock reservation flow with order modifications

### Phase 2: UI/Layout Fixes ✅

- ✅ Removed placeholder variables
- ✅ Fixed stock display format
- ✅ Removed duplicate audit UI
- ✅ Added missing item names
- ✅ Custom delete confirmation modal
- ✅ 2x2 dashboard grid layout

### Phase 1: Core Features ✅

- ✅ PIN pad lockout prevention
- ✅ Complete discount/specials system
- ✅ Inventory management with audits
- ✅ Variance analysis with trending
- ✅ Accounting & period closing
- ✅ Split bill functionality
- ✅ Ingredient substitution with price adjustment
- ✅ Staff clock-in/out tracking
- ✅ Rush event scheduling
- ✅ Bilingual UI (English/Spanish)
- ✅ CSV data export
- ✅ Comprehensive audit trail

### Build Information

- **Build**: GustoPOS-0.1.0.dmg
- **Platform**: macOS (Intel x64)
- **Size**: 104 MB
- **MD5**: b39f81f6cb01dd34cd6a61864b1fba1c
- **Location**: `artifacts/desktop-app/dist/build/GustoPOS-0.1.0.dmg`
- **Included**: Full database, API server, React frontend, PWA support
- **Status**: ✅ Ready for deployment (Login loop API client bug fixed)

---

## Documentation

| Document                   | Description                           |
| -------------------------- | ------------------------------------- |
| USER_GUIDE.md              | End-user operational guide for staff  |
| ADMIN_GUIDE.md             | Administrator configuration guide     |
| ARCHITECTURE.md            | Technical architecture & schema       |
| OPERATIONS_GUIDE.md        | Deployment, backup, maintenance       |
| TESTING_GUIDE.md           | Testing procedures & validation       |
| INGREDIENT_SUBSTITUTION.md | Ingredient swap feature & workflows   |
| CALCULATIONS.md            | Stock, cost, and pricing formulas     |
| AGENTS.md                  | Development guidelines & architecture |

---

## License

MIT
