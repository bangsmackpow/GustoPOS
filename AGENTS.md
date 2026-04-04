# AI Agent Onboarding Guide

Welcome, Agent. This document will help you understand the GustoPOS codebase and how to contribute effectively.

## 🏗️ Architecture at a Glance

GustoPOS is a **pnpm monorepo**. Logic is shared through internal workspace packages.

### **Key Directories**
- **`lib/`**: Shared foundation.
    - `db/src/schema/`: The source of truth for the database.
    - `api-zod/`: Shared validation schemas (crucial for API-client sync).
    - `api-client-react/`: Auto-generated or hand-crafted hooks for the frontend.
- **`artifacts/`**: Deployable applications.
    - `gusto-pos/`: The React PWA. Mobile-first design for staff.
    - `api-server/`: The Node.js Express API.
    - `desktop-app/`: Electron wrapper for offline hub deployment.

## 🛠️ Typical Workflows

### **Modifying the Schema**
1. Update `lib/db/src/schema/gusto.ts` or `auth.ts`.
2. Run `pnpm -w generate:db` (to create Drizzle migrations).
3. If changing API inputs/outputs, update `lib/api-zod`.

### **Developing the Frontend**
```bash
# From workspace root
pnpm run dev
```
The PWA uses **Wouter** for routing and **Zustand** for transient UI state. Persistent data is handled by **TanStack Query**.

### **Building for Desktop**
```bash
pnpm run build:desktop
```
This builds the core projects and packages them into `artifacts/desktop-app/dist`.

## 💡 Important Design Decisions

- **Local Persistence**: We use `PersistQueryClientProvider` with `localStorage` in the browser. This allows the app to stay "live" and informative even if the internet drops at a bar in Puerto Vallarta.
- **Stateless Auth**: High-speed, low-SQL logins. Prefer PIN-based or Token-based auth patterns.
- **Markup Logic**: Always consider `markup_factor` when pricing drinks. The inventory system tracks `ml` to allow for precise recipe-based cost analysis.

## 🛑 Gotchas
- **Windows Environment**: The owner uses Windows. Ensure commands and paths are cross-platform compatible.
- **PNPM Workspace**: Always run `pnpm install` from the root. Use `pnpm --filter <pkg> <cmd>` for package-specific tasks.
- **Tailwind 4**: We are using the bleeding-edge Tailwind CSS 4. CSS-in-JS is minimal; prefer standard utility classes.
