# GustoPOS Workspace

## Overview
GustoPOS is a professional bar management system designed for both high-connectivity cloud environments and low-connectivity "Standalone Hub" environments (like a bar in Puerto Vallarta).

---

## 🚀 Choose Your Scenario

### **Scenario A: Standalone Bar (Best for your friend)**
*   **Hardware:** An offline or poorly-connected laptop (Mac/Windows) at the bar.
*   **Solution:** **The Desktop App.**
*   **Why:** Runs entirely locally. No Docker, no Wi-Fi, and no setup required for the staff.
*   **Guide:** See [DEPLOY_LOCAL.md](./DEPLOY_LOCAL.md)

### **Scenario B: Multi-Bar / Cloud (Best for new customers)**
*   **Hardware:** A central server (VPS) and staff using mobile phones/tablets.
*   **Solution:** **Docker + PWA.**
*   **Why:** Easy to update, staff can use their own devices, and data is synced to the cloud.
*   **Guide:** Standard Docker-compose workflow.

---

## 📈 Project Status & Roadmap
For the latest on what's built and what's coming next, see [STATUS.md](./STATUS.md).

## 🤖 AI Agent Onboarding
If you are an AI assistant helping with this repo, please read [AGENTS.md](./AGENTS.md) first.

---

## 🛠 Developer Guide

### **1. Building the Desktop App**
To generate a standalone installer (`.dmg` for Mac or `.exe` for Windows):
```bash
# Build core + package for desktop
pnpm run build:desktop
```
The installer will be generated in `artifacts/desktop-app/dist/build`.

### **2. Running Web Dev Mode**
To work on the code with live-reloading:
```bash
pnpm run dev
```

### **3. Quality Control**
```bash
pnpm run typecheck  # Architect check (Logic)
pnpm run lint       # Editor check (Style)
pnpm run test:e2e   # Playwright check (Automation)
```

### **4. Tech Stack**
- **Frontend**: React (Vite), Tailwind CSS 4, Shadcn UI, TanStack Query (with local persistence), Zustand.
- **Backend**: Express 5, Drizzle ORM, LibSQL (SQLite).
- **Desktop**: Electron + Electron Builder.
- **Infrastructure**: Docker, Litestream (R2 Backup).

---

## 💎 Key Features
- **Stateless Auth:** Blazing fast logins with zero database overhead.
- **Offline PWA:** Install on phones; keeps working during Wi-Fi blips.
- **Quick Search (⌘K):** Find drinks and tabs in milliseconds.
- **Profitability Reports:** Real-time leaderboards for money-makers.
- **Disaster Recovery:** Built-in Litestream support for Cloudflare R2.
