# GustoPOS Architecture

This document describes the technical architecture of GustoPOS, a point-of-sale system designed for reliability in low-connectivity and offline environments.

---

## Design Philosophy

### "Thin Client, Smart API"

GustoPOS follows a **"Thin Client, Smart API"** architecture where:

- **Frontend** (React): Lightweight, handles UI rendering and user interaction
- **API Server**: Handles all business logic, validation, and data operations
- **Database**: Local SQLite (LibSQL) for high-performance, local-first data storage

This design ensures:

- Fast response times even with poor network connectivity
- Data integrity through server-side validation
- Simplified client implementation
- Easy scaling and deployment

---

## Technology Stack

### Core Technologies

| Layer                | Technology      | Version | Purpose               |
| -------------------- | --------------- | ------- | --------------------- |
| **Runtime**          | Node.js         | >= 20   | JavaScript runtime    |
| **Package Manager**  | pnpm            | >= 8    | Dependency management |
| **Frontend**         | React           | 18.x    | UI framework          |
| **Build Tool**       | Vite            | 5.x     | Fast builds & HMR     |
| **Styling**          | Tailwind CSS    | 3.x     | Utility-first CSS     |
| **State Management** | TanStack Query  | 5.x     | Server state caching  |
| **API Framework**    | Express.js      | 4.x     | HTTP server           |
| **Database**         | SQLite (LibSQL) | -       | Local database        |
| **ORM**              | Drizzle ORM     | 0.x     | Type-safe queries     |
| **Validation**       | Zod             | 3.x     | Schema validation     |
| **Logging**          | Pino            | 9.x     | JSON logging          |
| **Desktop**          | Electron        | 28.x    | Desktop wrapper       |

### Build & Quality

| Tool             | Purpose                     |
| ---------------- | --------------------------- |
| TypeScript       | Type safety across codebase |
| ESLint           | Code linting                |
| Prettier         | Code formatting             |
| electron-builder | Desktop app packaging       |

---

## Package Structure

### Monorepo Layout

```
GustoPOS/
├── package.json             # Root workspace config
├── pnpm-workspace.yaml      # pnpm monorepo config
│
├── artifacts/               # Application packages
│   ├── gusto-pos/          # Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/       # Page components
│   │   │   ├── components/  # Reusable components
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── store.ts    # Client state
│   │   │   └── types/      # TypeScript types
│   │   └── package.json
│   │
│   ├── api-server/          # Express API server
│   │   ├── src/
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── middleware/  # Express middleware
│   │   │   ├── index.ts     # Server entry
│   │   │   └── db.ts       # Database connection
│   │   └── package.json
│   │
│   ├── desktop-app/        # Electron wrapper
│   │   ├── src/
│   │   │   └── main.ts     # Electron main process
│   │   └── package.json
│   │
│   └── mockup-sandbox/    # Design sandbox
│
├── lib/                     # Shared libraries
│   ├── db/                  # Database layer
│   │   ├── src/
│   │   │   ├── schema/      # Drizzle schemas
│   │   │   ├── migrations/ # Schema migrations
│   │   │   └── index.ts    # DB initialization
│   │   └── package.json
│   │
│   ├── api-zod/            # Zod schemas (generated)
│   ├── api-client-react/   # TanStack hooks (generated)
│   └── api-spec/           # OpenAPI spec (generated)
│
├── docs/                    # Documentation
├── airgapped-deployment/  # VirtualBox VM files
└── scripts/                # Build & utility scripts
```

---

## Database Schema

### Overview

The database uses SQLite (LibSQL) with Drizzle ORM. All timestamps are stored as Unix seconds (integers), and booleans are stored as 0/1 integers.

### Core Tables

#### Users (`users`)

Staff accounts with PIN-based authentication.

| Column       | Type        | Description            |
| ------------ | ----------- | ---------------------- |
| `id`         | text (UUID) | Primary key            |
| `username`   | text        | Unique login name      |
| `email`      | text        | Unique email           |
| `password`   | text        | Bcrypt-hashed password |
| `first_name` | text        | First name             |
| `last_name`  | text        | Last name              |
| `role`       | text        | `admin` or `employee`  |
| `language`   | text        | `en` or `es`           |
| `pin`        | text        | 4-digit PIN            |
| `is_active`  | integer     | 0/1 boolean            |

#### Shifts (`shifts`)

Work shift tracking.

| Column              | Type        | Description          |
| ------------------- | ----------- | -------------------- |
| `id`                | text (UUID) | Primary key          |
| `name`              | text        | Shift name           |
| `status`            | text        | `active` or `closed` |
| `opened_by_user_id` | text        | FK to users          |
| `started_at`        | integer     | Unix timestamp       |
| `closed_at`         | integer     | Unix timestamp       |
| `expected_cash_mxn` | real        | Expected cash        |
| `actual_cash_mxn`   | real        | Actual cash          |
| `cash_variance_mxn` | real        | Variance             |

#### Tabs (`tabs`)

Customer tabs (checks).

| Column          | Type        | Description            |
| --------------- | ----------- | ---------------------- |
| `id`            | text (UUID) | Primary key            |
| `nickname`      | text        | Tab identifier         |
| `status`        | text        | `open` or `closed`     |
| `staff_user_id` | text        | FK to users            |
| `shift_id`      | text        | FK to shifts           |
| `total_mxn`     | real        | Total amount           |
| `tip_mxn`       | real        | Tip amount             |
| `discount_mxn`  | real        | Discount amount        |
| `tax_mxn`       | real        | Tax amount             |
| `tax_percent`   | real        | Tax rate               |
| `currency`      | text        | Currency code          |
| `opened_at`     | integer     | Unix timestamp         |
| `closed_at`     | integer     | Unix timestamp         |
| `close_type`    | text        | `sale`, `comp`, `void` |

#### Orders (`orders`)

Individual drink orders within a tab.

| Column              | Type        | Description                     |
| ------------------- | ----------- | ------------------------------- |
| `id`                | text (UUID) | Primary key                     |
| `tab_id`            | text        | FK to tabs                      |
| `drink_id`          | text        | FK to drinks                    |
| `drink_name`        | text        | Drink name (denormalized)       |
| `quantity`          | integer     | Order quantity                  |
| `unit_price_mxn`    | real        | Price per unit (after specials) |
| `discount_mxn`      | real        | Manual discount amount          |
| `tax_category`      | text        | Tax category                    |
| `tax_rate`          | real        | Tax rate                        |
| `voided`            | integer     | 0/1 void flag                   |
| `void_reason`       | text        | Void reason                     |
| `voided_by_user_id` | text        | FK to users                     |
| `voided_at`         | integer     | Unix timestamp                  |

#### Order Modifications (`order_modifications`)

Ingredient substitution history with full audit trail.

| Column                        | Type        | Description                             |
| ----------------------------- | ----------- | --------------------------------------- |
| `id`                          | text (UUID) | Primary key                             |
| `order_id`                    | text        | FK to orders                            |
| `recipe_line_index`           | integer     | Which recipe item (0-based)             |
| `original_ingredient_id`      | text        | FK to original ingredient               |
| `original_ingredient_name`    | text        | Name of original ingredient             |
| `original_amount`             | real        | Amount of original ingredient           |
| `replacement_ingredient_id`   | text        | FK to replacement ingredient            |
| `replacement_ingredient_name` | text        | Name of replacement ingredient          |
| `replacement_amount`          | real        | Amount of replacement ingredient        |
| `price_difference_mxn`        | real        | Price adjustment (positive or negative) |
| `modified_by_user_id`         | text        | FK to users (who made the change)       |
| `modified_at`                 | integer     | Unix timestamp of modification          |
| `notes`                       | text        | Optional reason/comments                |

#### Drinks (`drinks`)

Menu items (drinks/cocktails).

| Column          | Type        | Description           |
| --------------- | ----------- | --------------------- |
| `id`            | text (UUID) | Primary key           |
| `name`          | text        | Drink name            |
| `description`   | text        | Description           |
| `category`      | text        | Category              |
| `tax_category`  | text        | Tax category          |
| `tax_rate`      | real        | Tax rate              |
| `actual_price`  | real        | Base price            |
| `markup_factor` | real        | Markup multiplier     |
| `source_type`   | text        | `standard`, `special` |
| `is_available`  | integer     | Available flag        |
| `is_on_menu`    | integer     | Show on menu          |

#### Recipe Ingredients (`recipe_ingredients`)

Drink recipes linking drinks to inventory items.

| Column                | Type        | Description           |
| --------------------- | ----------- | --------------------- |
| `id`                  | text (UUID) | Primary key           |
| `drink_id`            | text        | FK to drinks          |
| `ingredient_id`       | text        | FK to inventory_items |
| `amount_in_ml`        | real        | Amount in ml          |
| `amount_in_base_unit` | real        | Amount in base unit   |

#### Inventory Items (`inventory_items`)

Inventory stock with pool/collection tracking.

| Column                 | Type        | Description                     |
| ---------------------- | ----------- | ------------------------------- |
| `id`                   | text (UUID) | Primary key                     |
| `name`                 | text        | Item name                       |
| `type`                 | text        | `spirit`, `mixer`, `beer`, etc. |
| `subtype`              | text        | Subtype                         |
| `base_unit`            | text        | `ml` or `units`                 |
| `base_unit_amount`     | real        | Container size                  |
| `serving_size`         | real        | Serving size                    |
| `bottle_size_ml`       | real        | Bottle size in ml               |
| `container_weight_g`   | real        | Empty container weight          |
| `full_bottle_weight_g` | real        | Full bottle weight              |
| `density`              | real        | Liquid density                  |
| `order_cost`           | real        | Order cost                      |
| `markup_factor`        | real        | Markup multiplier               |
| `sell_single_serving`  | integer     | Single serving flag             |
| `single_serving_price` | real        | Single serving price            |
| `current_bulk`         | real        | Full bottles                    |
| `current_partial`      | real        | Partial bottle                  |
| `current_stock`        | real        | Total stock                     |
| `reserved_stock`       | real        | Reserved for open tabs          |
| `units_per_case`       | integer     | Units per case                  |
| `tracking_mode`        | text        | `auto`, `pool`, `collection`    |
| `audit_method`         | text        | `auto`, `manual`                |
| `low_stock_threshold`  | real        | Low stock threshold             |
| `last_audited_at`      | integer     | Last audit timestamp            |

#### Inventory Audits (`inventory_audits`)

Audit records for inventory reconciliation.

| Column               | Type        | Description           |
| -------------------- | ----------- | --------------------- |
| `id`                 | text (UUID) | Primary key           |
| `item_id`            | text        | FK to inventory_items |
| `audit_date`         | integer     | Audit timestamp       |
| `system_stock`       | real        | System stock          |
| `physical_count`     | real        | Physical count        |
| `variance`           | real        | Variance amount       |
| `variance_percent`   | real        | Variance percentage   |
| `counted_by_user_id` | text        | FK to users           |
| `notes`              | text        | Audit notes           |

#### Periods (`periods`)

Accounting periods for COGS tracking.

| Column                  | Type        | Description                  |
| ----------------------- | ----------- | ---------------------------- |
| `id`                    | text (UUID) | Primary key                  |
| `name`                  | text        | Period name                  |
| `period_type`           | text        | `daily`, `weekly`, `monthly` |
| `start_date`            | integer     | Start timestamp              |
| `end_date`              | integer     | End timestamp                |
| `status`                | text        | `open` or `closed`           |
| `total_sales_mxn`       | real        | Total sales                  |
| `total_cost_mxn`        | real        | Total cost                   |
| `total_tips_mxn`        | real        | Total tips                   |
| `total_discounts_mxn`   | real        | Total discounts              |
| `total_voids_mxn`       | real        | Total voids                  |
| `total_comps_mxn`       | real        | Total comps                  |
| `inventory_start_value` | real        | Opening inventory value      |
| `inventory_end_value`   | real        | Closing inventory value      |
| `cogs_mxn`              | real        | Cost of goods sold           |

#### COGS Entries (`cogs_entries`)

Cost of goods sold per item per period.

| Column          | Type        | Description           |
| --------------- | ----------- | --------------------- |
| `id`            | text (UUID) | Primary key           |
| `period_id`     | text        | FK to periods         |
| `item_id`       | text        | FK to inventory_items |
| `item_name`     | text        | Item name             |
| `quantity_used` | real        | Quantity used         |
| `unit_cost`     | real        | Unit cost             |
| `total_cost`    | real        | Total cost            |
| `category`      | text        | Item category         |

#### Promo Codes (`promo_codes`)

Discount codes for tab-level discounts.

| Column           | Type        | Description                         |
| ---------------- | ----------- | ----------------------------------- |
| `id`             | text (UUID) | Primary key                         |
| `code`           | text        | Unique code (e.g., "SAVE15")        |
| `description`    | text        | Admin notes                         |
| `discount_type`  | text        | `percentage` or `fixed_amount`      |
| `discount_value` | real        | Amount (% or MXN)                   |
| `max_uses`       | integer     | Max uses (null = unlimited)         |
| `uses_count`     | integer     | Times used so far                   |
| `expires_at`     | integer     | Expiration timestamp (null = never) |
| `is_active`      | integer     | 0/1 active flag                     |
| `created_at`     | integer     | Creation timestamp                  |

#### Specials (`specials`)

Time-based drink-level discounts.

| Column           | Type        | Description                                     |
| ---------------- | ----------- | ----------------------------------------------- |
| `id`             | text (UUID) | Primary key                                     |
| `name`           | text        | Special name (e.g., "Happy Hour")               |
| `type`           | text        | `manual`, `happy_hour`, `promotional`, `bundle` |
| `apply_to`       | text        | `drink`, `category`, or `all`                   |
| `drink_id`       | text        | FK to drinks (if apply_to = drink)              |
| `category`       | text        | Category name (if apply_to = category)          |
| `discount_type`  | text        | `percentage` or `fixed_amount`                  |
| `discount_value` | real        | Amount (% or MXN)                               |
| `days_of_week`   | text        | Comma-separated 0-6 (e.g., "1,2,3,4,5")         |
| `start_hour`     | integer     | Start hour 0-23                                 |
| `end_hour`       | integer     | End hour 0-23                                   |
| `start_date`     | integer     | Start date timestamp (null = no limit)          |
| `end_date`       | integer     | End date timestamp (null = no limit)            |
| `is_active`      | integer     | 0/1 active flag                                 |
| `created_at`     | integer     | Creation timestamp                              |

#### Settings (`settings`)

System configuration (singleton table).

| Column                       | Type    | Description           |
| ---------------------------- | ------- | --------------------- |
| `id`                         | text    | Always `default`      |
| `bar_name`                   | text    | Bar name              |
| `bar_icon`                   | text    | Icon name             |
| `base_currency`              | text    | Currency code         |
| `usd_to_mxn_rate`            | real    | USD to MXN rate       |
| `cad_to_mxn_rate`            | real    | CAD to MXN rate       |
| `pin_lock_timeout_min`       | integer | PIN lock timeout      |
| `default_alcohol_density`    | real    | Default density       |
| `default_serving_size_ml`    | real    | Default serving size  |
| `default_bottle_size_ml`     | real    | Default bottle size   |
| `default_tracking_mode`      | text    | Default tracking mode |
| `variance_warning_threshold` | real    | Variance warning %    |

---

## API Architecture

### Route Structure

```
/api/
├── auth/
│   ├── pin-login         # Staff PIN login
│   ├── admin-login       # Admin login
│   └── admin/            # Admin operations
├── users/                # User management
├── shifts/               # Shift management
├── tabs/                 # Tab operations
│   └── :id/orders       # Order operations
├── drinks/               # Menu management
├── ingredients/          # (deprecated, use inventory)
├── inventory/
│   ├── items/           # Inventory CRUD
│   ├── audits/          # Audit records
│   └── variance/        # Variance analysis
├── promo-codes/         # Discount codes (admin CRUD)
├── specials/            # Time-based specials (admin CRUD)
├── periods/             # Accounting periods
├── analytics/           # Analytics endpoints
├── export/              # CSV exports
├── settings/            # System settings
└── health/              # Health check
```

### Middleware

| Middleware       | Purpose               |
| ---------------- | --------------------- |
| `authenticate`   | JWT validation        |
| `requireAdmin`   | Admin role check      |
| `requireManager` | Manager authorization |
| `validateBody`   | Zod schema validation |
| `errorHandler`   | Global error handling |
| `requestLogger`  | Pino request logging  |

### Response Format

All API responses follow a consistent format:

```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Frontend Architecture

### Routing

The frontend uses React Router for navigation:

```tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<Layout />}>
    <Route index element={<Dashboard />} />
    <Route path="tabs" element={<Tabs />} />
    <Route path="tabs/:id" element={<TabDetail />} />
    <Route path="drinks" element={<Drinks />} />
    <Route path="inventory" element={<Inventory />} />
    <Route path="inventory/:id/audit" element={<InventoryAudit />} />
    <Route path="inventory/variance" element={<InventoryVariance />} />
    <Route path="reports" element={<Reports />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>
```

### State Management

| Store        | Technology      | Purpose          |
| ------------ | --------------- | ---------------- |
| Server State | TanStack Query  | API data caching |
| UI State     | React Context   | Theme, language  |
| Auth State   | Zustand         | User session     |
| Form State   | React Hook Form | Form handling    |

### Key Components

#### Layout Components

- `Layout.tsx` - Main app shell with sidebar
- `Sidebar.tsx` - Navigation menu
- `Header.tsx` - Top bar with user info

#### Feature Components

- `TabList.tsx` - Open tabs grid
- `DrinkCard.tsx` - Menu item display
- `OrderSummary.tsx` - Tab totals
- `InventoryTable.tsx` - Stock table
- `AuditModal.tsx` - Audit entry form
- `PinPad.tsx` - PIN entry component

---

## Inventory Tracking System

### Tracking Modes

GustoPOS supports three inventory tracking modes:

1. **Auto** (default): Automatically determines pool vs. collection based on item type
2. **Pool**: Weight-based tracking for spirits, mixers, liquids
3. **Collection**: Unit-based tracking for beer, merch, packaged goods

### Pool Mode (Weight-Based)

Used for spirits, mixers, and liquid ingredients:

- Tracks full bottles (`current_bulk`)
- Tracks partial bottle (`current_partial`)
- Calculates total in ml
- Uses bottle weight for accuracy

**Formula**:

```
liquidWeightG = (fullBottleWeightG - containerWeightG)
mlRemaining = (currentPartialWeightG / liquidWeightG) × bottleSizeMl
totalStock = (currentBulk × bottleSizeMl) + mlRemaining
```

### Collection Mode (Unit-Based)

Used for beer, merch, and packaged goods:

- Tracks units per case
- Tracks individual units
- Uses `units_per_case` field

### Stock Flow

| Action          | Behavior                                             |
| --------------- | ---------------------------------------------------- |
| Add Order       | `reservedStock += amount × quantity`                 |
| Update Quantity | Adjusts `reservedStock`                              |
| Delete Order    | `reservedStock -= amount × quantity`                 |
| Delete Tab      | Returns `reservedStock` to `currentStock`            |
| Close Tab       | `currentStock -= reservedStock`, `reservedStock = 0` |

---

## Authentication & Authorization

### PIN Login

Staff authenticate with a 4-digit PIN:

1. User enters PIN on PinPad
2. Server validates PIN against user record
3. JWT token issued with user ID and role
4. Token stored in httpOnly cookie

### Admin Login

Admin users authenticate with username/password:

1. User enters credentials
2. Server validates against stored hash
3. JWT token issued with admin role

### Authorization Levels

| Action           | Employee | Admin |
| ---------------- | -------- | ----- |
| Open/close tabs  | ✓        | ✓     |
| Add/void orders  | ✓        | ✓     |
| View reports     | ✓        | ✓     |
| Manage inventory | ✓        | ✓     |
| Manage staff     | ✗        | ✓     |
| System settings  | ✗        | ✓     |
| Void with reason | ✗        | ✓     |

---

## Data Flow

### Order Flow

```
1. Bartender logs in (PIN)
2. Opens new tab for customer
3. Adds drinks to tab
   - API checks stock availability
   - Reserves inventory (reservedStock++)
4. Customer pays
5. Bartender closes tab
   - Finalizes inventory (currentStock -= reservedStock)
   - Clears reservedStock
6. Manager closes shift
   - Generates sales report
   - Calculates cash variance
```

### Inventory Flow

```
1. Admin adds inventory item
   - Sets bottle size, cost, density
2. Staff performs audit
   - Counts physical bottles
   - Enters partial bottle weight
3. System calculates variance
   - Compares physical to system
4. Period close
   - Calculates COGS
   - Updates inventory values
```

---

## Error Handling

### Client-Side

- TanStack Query handles network errors with automatic retry
- Form validation with React Hook Form + Zod
- User-friendly error messages in Spanish/English

### Server-Side

- Global error handler middleware
- Structured error responses
- Pino logging for debugging

### Error Codes

| Code                 | Description           |
| -------------------- | --------------------- |
| `INVALID_PIN`        | PIN validation failed |
| `INSUFFICIENT_STOCK` | Not enough inventory  |
| `TAB_NOT_FOUND`      | Tab doesn't exist     |
| `UNAUTHORIZED`       | Not authenticated     |
| `FORBIDDEN`          | Not authorized        |
| `VALIDATION_ERROR`   | Invalid input         |

---

## Performance Considerations

### Database

- SQLite with proper indexing
- Prepared statements via Drizzle
- Connection pooling

### API

- TanStack Query caching
- Optimistic updates
- Pagination for large lists

### Frontend

- Code splitting via Vite
- Lazy loading routes
- Minimal re-renders with React.memo

---

## Security

- Passwords hashed with bcrypt
- JWT tokens in httpOnly cookies
- SQL injection prevention via Drizzle
- Input validation with Zod
- Rate limiting on auth endpoints

---

## Deployment

### Development

```bash
pnpm install
pnpm run dev
```

### Production Build

```bash
pnpm run build
```

### Desktop App

```bash
pnpm run build:desktop
```

Output: `artifacts/desktop-app/dist/build/GustoPOS-0.1.0.dmg`

### API Server

```bash
ADMIN_PASSWORD=your-password PORT=3000 node ./dist/index.cjs
```

---

## Glossary

| Term       | Definition                      |
| ---------- | ------------------------------- |
| Tab        | A customer's open order/check   |
| Pool       | Weight-based inventory tracking |
| Collection | Unit-based inventory tracking   |
| COGS       | Cost of Goods Sold              |
| Period     | Accounting time period          |
| Void       | Cancelled order with reason     |
| Comp       | Complimentary item              |

---

## Related Documentation

- [README.md](README.md) - Project overview
- [USER_GUIDE.md](USER_GUIDE.md) - End-user guide
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Administrator guide
- [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) - Deployment guide
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing procedures
