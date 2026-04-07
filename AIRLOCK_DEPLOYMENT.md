# Airgapped & Local Deployment Options

This document has been superseded by more robust and automated deployment methods. Please use one of the following scenarios based on your needs.

---

## 🚀 Scenario A: Standalone Bar (Offline / Airgapped)

If you are deploying to a machine with **NO internet** or very poor connectivity (e.g., a bar in Puerto Vallarta).

### **Option 1: VirtualBox Appliance (Recommended)**
The easiest and most reliable way to run GustoPOS offline. It includes the OS, Docker, and all dependencies in a single file.
- **Guide:** [VirtualBox Quick Start](./airgapped-deployment/VIRTUALBOX_QUICKSTART.md)
- **Features:** Auto-starts on boot, built-in backups, simple USB updates.

### **Option 2: Native Desktop Application**
A lightweight native application for macOS or Windows.
- **Guide:** [Desktop Deployment Guide](./artifacts/desktop-app/README.md)
- **Features:** Familiar windowed interface, no virtualization needed.

---

## 🚀 Scenario B: Cloud / Multi-Device (Online)

If you have stable internet and want staff to use their own phones or tablets.

### **Docker Compose Deployment**
- **Guide:** [Docker Deployment Guide](./DEPLOY_DOCKER.md)
- **Features:** Access via mobile browsers, real-time sync across devices, easy cloud backups.

---

## 🛠 Legacy Manual Setup (Advanced Users Only)

If you must perform a manual installation on a bare-metal Linux or macOS machine without using the options above:

1.  **Build Phase:** `pnpm run build`
2.  **Database Phase:** `sqlite3 gusto.db < lib/db/migrations/0006_advanced_inventory.sql`
3.  **Transfer:** Copy `artifacts/gusto-pos/dist` and `artifacts/api-server/dist` to the target.
4.  **Run:** `node artifacts/api-server/dist/index.js`

*Note: Manual setup requires pre-installing Node.js (v20+) and pnpm on the target machine.*

---

**For the latest status and roadmap, see [STATUS.md](./STATUS.md).**
