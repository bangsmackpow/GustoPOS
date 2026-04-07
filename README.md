# GustoPOS Workspace

## Overview
GustoPOS is a professional bar management system designed for high-connectivity cloud environments and low-connectivity "Standalone Hub" environments.

---

## 🚀 Choose Your Deployment Mode

### **Mode 1: Airgapped VirtualBox Appliance (Easiest / Most Robust)**
*   **Best for:** Standalone bars with NO internet or very poor connectivity.
*   **Hardware:** Any laptop (Windows/Mac/Linux) running VirtualBox.
*   **Setup:** Import a single `.ova` file. No Docker or Node.js knowledge required.
*   **Features:** Auto-starts on boot, built-in backups, fully isolated.
*   **Guide:** [VirtualBox Quick Start](./airgapped-deployment/VIRTUALBOX_QUICKSTART.md)

### **Mode 2: macOS / Windows Desktop Application**
*   **Best for:** Bars that want a native app experience on their existing hardware.
*   **Hardware:** Mac or Windows PC.
*   **Setup:** Run the installer/executable. Uses a local SQLite database.
*   **Features:** Familiar windowed interface, low resource overhead.
*   **Guide:** [Desktop Deployment Guide](./artifacts/desktop-app/README.md)

### **Mode 3: Cloud / Docker (Multi-Device & Mobile)**
*   **Best for:** Bars with stable internet and staff using phones/tablets.
*   **Hardware:** A central Linux server (VPS) or a local machine with Docker.
*   **Setup:** Standard `docker-compose up -d`.
*   **Features:** Staff can use mobile browsers, real-time sync across devices.
*   **Guide:** [Docker Deployment Guide](./DEPLOY_DOCKER.md)

---

## 📦 Key Systems

### **Advanced Inventory Management**
A production-ready system with ml-precision tracking:
- ✅ **Tracking:** Tare (by weight), Weight (bulk), Count (discrete).
- ✅ **Alerts:** Manual threshold, Percentage-based, and Usage-based.
- ✅ **Audit Trail:** Complete history of stock changes and variances.

---

## 🛠 Developer Guide

### **Quick Start**
```bash
pnpm install
pnpm run dev      # App available at http://localhost:5173
```

### **Building for Production**
```bash
pnpm run build            # Build all web/api artifacts
pnpm run build:desktop    # Build Electron desktop app
```

### **Building the Appliance**
```bash
cd airgapped-deployment
packer build -force packer-virtualbox.pkr.hcl
```

---

## 📈 Documentation Index

| Topic | Document |
|-------|----------|
| **VirtualBox VM** | [VIRTUALBOX_README.md](./airgapped-deployment/VIRTUALBOX_README.md) |
| **Airgapped Setup** | [AIRLOCK_DEPLOYMENT.md](./AIRLOCK_DEPLOYMENT.md) |
| **Inventory Specs** | [SESSION_FILES/QUICK_REFERENCE.md](./SESSION_FILES/QUICK_REFERENCE.md) |
| **Project Status** | [STATUS.md](./STATUS.md) |
| **Agent Guide** | [AGENTS.md](./AGENTS.md) |

---

**Happy serving! 🍹**
