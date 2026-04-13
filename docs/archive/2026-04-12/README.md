# GustoPOS Workspace

## Overview
GustoPOS is a professional bar management system designed for both high-connectivity cloud environments and low-connectivity "Standalone Hub" environments (like a bar in Puerto Vallarta).

---

## 🚀 Choose Your Deployment Mode

### **Mode 1: Airgapped VirtualBox Appliance (Recommended for Standalone)**
*   **Best for:** Standalone bars with NO internet or very poor connectivity.
*   **Hardware:** Any laptop (Mac/Windows/Linux) running VirtualBox.
*   **Features:** Auto-starts on boot, robust Debian base, automated USB updates.
*   **Guide:** [VirtualBox Quick Start](./airgapped-deployment/VIRTUALBOX_QUICKSTART.md)

### **Mode 2: macOS / Windows Native Desktop App**
*   **Best for:** Bars wanting a native "app" experience on a single computer.
*   **Hardware:** Mac (Monterey+) or Windows PC.
*   **Features:** Lightweight Electron wrapper, local SQLite persistence.
*   **Guide:** [Desktop App Guide](./artifacts/desktop-app/README.md)

### **Mode 3: Cloud / VPS Docker (Multi-Device & Mobile)**
*   **Best for:** Bars with stable internet and staff using phones/tablets.
*   **Hardware:** A central Linux server or stable local machine with Docker.
*   **Features:** Multi-device sync, PWA mobile support, real-time reports.
*   **Guide:** [Docker Deployment Guide](./DEPLOY_DOCKER.md)

---

## 📦 Core Systems

### **Advanced Inventory Tracking**
Production-grade tracking with ml-precision:
- ✅ **Methods:** Tare (weight-based), Bulk (weight/volume), and Count (discrete units).
- ✅ **Alerts:** Manual threshold, Percentage-based, and Usage-based low stock alerts.
- ✅ **Audit Trail:** Complete history of audits, adjustments, and variances.

### **Staff & Financials**
- ✅ **Staff Management:** Clock-in/out logic, shift reports, and performance metrics.
- ✅ **Financials:** Integrated tax rates, split payments, and promo code support.

---

## 🛠 Developer Quick Start

```bash
pnpm install
pnpm run dev      # App available at http://localhost:5173
```

**Build for Appliance:**
```bash
cd airgapped-deployment
packer build -force packer-virtualbox.pkr.hcl
```

---

**Happy serving! 🍹**
