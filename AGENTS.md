# AI Agent Onboarding Guide

Welcome, Agent. This document will help you understand the GustoPOS codebase and how to contribute effectively.

## 🏗️ Architecture at a Glance

GustoPOS is a **pnpm monorepo**. Logic is shared through internal workspace packages.

### **Key Directories**
- **`lib/`**: Shared foundation.
    - `db/src/schema/`: The source of truth for the database.
      - `gusto.ts` - Core POS schema
      - `auth.ts` - Authentication schema
      - `inventory.ts` - Advanced inventory schema (NEW)
    - `api-zod/`: Shared validation schemas (crucial for API-client sync).
    - `api-client-react/`: Auto-generated or hand-crafted hooks for the frontend.
- **`artifacts/`**: Deployable applications.
    - `gusto-pos/`: The React PWA. Mobile-first design for staff.
    - `api-server/`: The Node.js Express API.
      - `src/routes/inventory.ts` - Inventory endpoints (NEW)
    - `desktop-app/`: Electron wrapper for offline hub deployment.
- **`airgapped-deployment/`**: Complete offline deployment package for isolated environments.
- **`scripts/`**: Utility scripts.
    - `import-inventory-csv.ts` - CSV importer for inventory data (NEW)

## 🛠️ Typical Workflows

### **Working with Advanced Inventory System**

#### Adding/Modifying Inventory Fields
1. Update `lib/db/src/schema/inventory.ts` (Drizzle ORM definitions)
2. Create new migration in `lib/db/migrations/` if needed
3. Run `pnpm run db:migrate` to apply
4. Update related API endpoints in `artifacts/api-server/src/routes/inventory.ts`

#### Creating Inventory UI Components
- Add components to `artifacts/gusto-pos/src/components/`
- Import from existing inventory components:
  - `InventoryAuditModal.tsx` - Audit entry form
  - `InventoryList.tsx` - List with filters
  - `LowStockConfig.tsx` - Admin settings
  - `LowStockWidget.tsx` - Dashboard alerts

#### Importing Inventory Data
```bash
# Luke's CSV format: 10 columns
# Name, Type, Subtype, Bulk Size, Bulk Unit, Serving Size, Serving Unit, Bulk Cost, Full Inventory, Partial Inventory
npx tsx scripts/import-inventory-csv.ts path/to/file.csv
```

### **Modifying the POS Schema**
1. Update `lib/db/src/schema/gusto.ts` or `auth.ts`.
2. Run `pnpm -w generate:db` (to create Drizzle migrations).
3. If changing API inputs/outputs, update `lib/api-zod`.

### **Developing the Frontend**
```bash
# From workspace root
pnpm run dev
```
The PWA uses **Wouter** for routing and **Zustand** for transient UI state. Persistent data is handled by **TanStack Query**.

**Inventory Components Integration:**
- All components use React Query for API calls
- Dashboard includes `LowStockWidget` for visibility
- Inventory page uses `InventoryList` with full filtering
- Audit modal accessible from list and dashboard

### **Building for Desktop**
```bash
pnpm run build:desktop
```
This builds the core projects and packages them into `artifacts/desktop-app/dist`.

**For offline deployment:**
See `AIRLOCK_DEPLOYMENT.md` for complete instructions on packaging for airgapped environments.

## 💡 Important Design Decisions

- **Local Persistence**: We use `PersistQueryClientProvider` with `localStorage` in the browser. This allows the app to stay "live" and informative even if the internet drops at a bar in Puerto Vallarta.
- **Stateless Auth**: High-speed, low-SQL logins. Prefer PIN-based or Token-based auth patterns.
- **Markup Logic**: Always consider `markup_factor` when pricing drinks. The inventory system tracks `ml` to allow for precise recipe-based cost analysis.
- **Inventory Flexibility**: The bulk+partial model works for ANY item type (not case-specific). Tracking type (tare/weight/count) determines calculation method.
- **Component Memoization**: Move helper functions outside components to avoid React Compiler warnings. See `InventoryList.tsx` for the `isLowStock` pattern.
- **Type-Only Constants**: Variables used only in `typeof` expressions should be ignored by linters with `/* eslint-disable-next-line */` comments. See `use-toast.ts` for pattern.

## 🛑 Gotchas
- **Windows Environment**: The owner uses Windows. Ensure commands and paths are cross-platform compatible. Use backslashes (`\`) for paths.
- **PNPM Workspace**: Always run `pnpm install` from the root. Use `pnpm --filter <pkg> <cmd>` for package-specific tasks.
- **Tailwind 4**: We are using the bleeding-edge Tailwind CSS 4. CSS-in-JS is minimal; prefer standard utility classes.
- **Inventory Routes**: Routes are registered at `/api/inventory/*` (not `/inventory/*` at root). Always test with full path.
- **CSV Import**: Exact 10-column order required - see `scripts/import-inventory-csv.ts` for validation.
- **Quality Gates**: All PRs must pass `pnpm run lint` and `pnpm run typecheck` before merge. No exceptions.

## 📚 Key Documentation

For agents working on this codebase:
- **[STATUS.md](./STATUS.md)** - Latest project status and quality gates
- **[SYSTEM_LIVE.md](SESSION_FILES/SYSTEM_LIVE.md)** - Current integration status
- **[BUILD_COMPLETE.md](SESSION_FILES/BUILD_COMPLETE.md)** - What was built
- **[IMPLEMENTATION_COMPLETE.md](SESSION_FILES/IMPLEMENTATION_COMPLETE.md)** - Technical specs
- **[QUICK_REFERENCE.md](SESSION_FILES/QUICK_REFERENCE.md)** - Quick overview
- **[AIRLOCK_DEPLOYMENT.md](./AIRLOCK_DEPLOYMENT.md)** - Offline deployment guide (for tonight's test)
