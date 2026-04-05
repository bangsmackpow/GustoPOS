# GustoPOS Workspace

## Overview
GustoPOS is a professional bar management system designed for both high-connectivity cloud environments and low-connectivity "Standalone Hub" environments (like a bar in Puerto Vallarta).

**Latest Addition:** Advanced Inventory Management System (Luke's Specification) - ✅ COMPLETE & INTEGRATED

---

## 🚀 Choose Your Scenario

### **Scenario A: Standalone Bar (Best for your friend)**
*   **Hardware:** An offline or poorly-connected laptop (Mac/Windows) at the bar.
*   **Solution:** **Airgapped Deployment** - Complete offline POS system with advanced inventory.
*   **Why:** Runs entirely locally. No Docker, no Wi-Fi, and no setup required for the staff.
*   **Guides:** 
    - [Airgapped Deployment Guide](./airgapped-deployment/README.md) - Complete offline installation
    - [Airgapped Setup Instructions](./AIRLOCK_DEPLOYMENT.md) - Step-by-step zip transfer guide
    - [DEPLOY_LOCAL.md](./DEPLOY_LOCAL.md) - Local deployment options

### **Scenario B: Multi-Bar / Cloud (Best for new customers)**
*   **Hardware:** A central server (VPS) and staff using mobile phones/tablets.
*   **Solution:** **Docker + PWA** with advanced inventory system.
*   **Why:** Easy to update, staff can use their own devices, and data is synced to the cloud.
*   **Features:** All advanced inventory features (tare tracking, low stock alerts, audit trail)
*   **Guide:** Standard Docker-compose workflow.

---

## 📦 Advanced Inventory System (NEW)

A complete production-ready inventory management system with:

- ✅ **Flexible Tracking:** Tare (liquor by weight), Weight (bulk), Count (discrete)
- ✅ **Dual Audit Methods:** Bulk+Partial detailed entry or Loose-only simplified
- ✅ **Three Low Stock Alerts:** Manual threshold, Percentage-based, Usage-based
- ✅ **Complete Audit Trail:** Track who audited when with variance analysis
- ✅ **Dashboard Visibility:** Real-time low stock alerts
- ✅ **CSV Import:** Supports Luke's exact 10-column format

**Status:** ✅ FULLY INTEGRATED & PRODUCTION READY

**Documentation:**
- [System Integration Summary](./SESSION_FILES/SYSTEM_LIVE.md)
- [Implementation Complete](./SESSION_FILES/BUILD_COMPLETE.md)
- [Quick Reference Guide](./SESSION_FILES/QUICK_REFERENCE.md)

---

## 📈 Project Status & Roadmap
For the latest on what's built and what's coming next, see [STATUS.md](./STATUS.md).

## 🤖 AI Agent Onboarding
If you are an AI assistant helping with this repo, please read [AGENTS.md](./AGENTS.md) first.

---

## 🛠 Developer Guide

### **1. Running Web Dev Mode**
To work on the code with live-reloading:
```bash
pnpm run dev
```

### **2. Quality Control**
```bash
pnpm run typecheck  # Architect check (Logic)
pnpm run lint       # Editor check (Style)
pnpm run test:e2e   # Playwright check (Automation)
```

### **3. Working with Inventory System**
The advanced inventory system is fully integrated:
```bash
# Migrate database (creates inventory tables)
pnpm run db:migrate

# Import inventory from CSV
npx tsx scripts/import-inventory-csv.ts luke-inventory.csv

# API endpoints auto-available at /api/inventory/*
```

### **4. Tech Stack**
- **Frontend**: React (Vite), Tailwind CSS 4, Shadcn UI, TanStack Query (with local persistence), Zustand.
- **Backend**: Express 5, Drizzle ORM, LibSQL (SQLite).
- **Infrastructure**: Docker, Litestream (R2 Backup).
- **Advanced Features**: Inventory system with tare/weight/count tracking, multi-method low stock alerts, audit trails.

---

## 💎 Key Features
- **Stateless Auth:** Blazing fast logins with zero database overhead.
- **Offline PWA:** Install on phones; keeps working during Wi-Fi blips.
- **Quick Search (⌘K):** Find drinks and tabs in milliseconds.
- **Profitability Reports:** Real-time leaderboards for money-makers.
- **Disaster Recovery:** Built-in Litestream support for Cloudflare R2.
- **Advanced Inventory:** Tare tracking, flexible bulk+partial, three low stock alert types, complete audit trail.

