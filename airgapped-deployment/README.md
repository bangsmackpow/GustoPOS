# GustoPOS Airgapped Deployment for macOS

**Complete offline Point-of-Sale system for standalone bars** - No internet required, fully self-contained.

## 📋 Quick Overview

This deployment provides a complete GustoPOS installation that runs entirely offline on a MacBook Pro:

- ✅ **Express API Server** - Local backend running on macOS
- ✅ **React Web Application** - Access via web browser (http://localhost:3000)
- ✅ **SQLite Database** - All data stored locally on the Mac
- ✅ **No Internet Required** - Completely airgapped operation
- ✅ **USB Delivery** - Single USB bundle with everything needed

## 🚀 Quick Start (5 minutes)

1. **Extract from USB:**
   ```bash
   cd ~/Desktop/gusto-pos-macos-airgapped
   ```

2. **Run setup:**
   ```bash
   bash setup.sh
   ```

3. **Configure password:**
   ```bash
   open ~/.gustopos/stack.env
   ```

4. **Start the server:**
   ```bash
   ~/.gustopos/start.sh
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

## 📖 Documentation

| Guide | Purpose | Audience |
|-------|---------|----------|
| **[SETUP_GUIDE_MACOS.md](./SETUP_GUIDE_MACOS.md)** | Quick start guide with troubleshooting | End Users |
| **[DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md)** | Step-by-step deployment instructions | IT Teams |
| **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** | Project overview and architecture | Project Managers |
| **[CONFIG_OVERRIDE_README.md](./CONFIG_OVERRIDE_README.md)** | Configuration variable reference | DevOps/IT |
| **[POSTGRESQL_UPGRADE_PATH.md](./POSTGRESQL_UPGRADE_PATH.md)** | Future upgrade planning | Technical Planning |

## 🛠️ Scripts

### setup.sh
Interactive setup script that initializes GustoPOS on the Mac:
- Checks prerequisites (Node.js, pnpm)
- Creates ~/.gustopos directory structure
- Sets up configuration template
- **Run once:** `bash setup.sh`

### start.sh
Starts the GustoPOS server:
- Loads configuration from stack.env
- Starts Express API server
- Sets up logging
- **Usage:** `~/.gustopos/start.sh`

### stop.sh
Gracefully stops the GustoPOS server:
- Stops all running processes
- Cleans up resources
- **Usage:** `~/.gustopos/stop.sh` or `Ctrl+C` in terminal

### create-usb-bundle.sh
Creates a USB-ready deployment bundle:
- Builds all artifacts
- Packages everything for USB delivery
- Creates manifest
- **Usage:** `bash create-usb-bundle.sh /Volumes/USB`

## 📁 File Locations

After setup, all data and configuration is stored in `~/.gustopos/`:

```
~/.gustopos/
├── stack.env           # Configuration (passwords, ports)
├── data/
│   └── gusto.db       # ⚠️  Your bar data (BACKUP REGULARLY!)
├── logs/
│   └── server-*.log   # Server logs for debugging
├── api-server/        # Express API files
└── gusto-pos/         # React frontend files
```

## 🔒 Security

- **Local Authentication** - No cloud login required
- **Offline-Only** - Zero external API calls
- **Admin Password Protected** - Set during setup
- **No Telemetry** - No usage tracking
- **No Auto-Updates** - Manual control over changes

## 💾 Backup & Recovery

**Back up your data weekly:**

```bash
# Create backup with today's date
cp ~/.gustopos/data/gusto.db ~/Desktop/gusto-backup-$(date +%Y%m%d).db

# Copy to USB drive for safekeeping
# (Drag file to USB in Finder)
```

**Restore from backup:**
```bash
cp ~/Desktop/gusto-backup-YYYYMMDD.db ~/.gustopos/data/gusto.db
~/.gustopos/start.sh
```

## ✅ System Requirements

- **OS:** macOS Monterey (10.12.6) or later
- **RAM:** 2GB minimum (4GB recommended)
- **Disk Space:** 1GB free for app + data
- **Network:** None required (fully offline)
- **Internet:** Not needed at any point

## 🎯 What You Can Do

✅ Create tabs and track orders  
✅ Manage inventory and recipes  
✅ View sales reports by shift  
✅ Track staff performance  
✅ Generate receipts and invoices  
✅ Run completely offline  

## ⚠️ What You Cannot Do (Offline)

❌ Cloud backup (Litestream)  
❌ Real-time sync to other devices  
❌ Send emails (no SMTP)  
❌ Access from the internet  
❌ Integrate with payment processors  

## 🚀 Upgrading to PostgreSQL

Currently using SQLite (recommended for standalone bars). For multi-location scenarios or higher concurrency, see **[POSTGRESQL_UPGRADE_PATH.md](./POSTGRESQL_UPGRADE_PATH.md)** for future upgrade planning.

## 📞 Troubleshooting

**Common issues and solutions:**

- **"Node.js not found"** → See SETUP_GUIDE_MACOS.md
- **"Port already in use"** → Change PORT in stack.env
- **"Cannot connect"** → Check server is running in Terminal
- **"Cannot login"** → Verify ADMIN_PASSWORD in stack.env
- **"Database locked"** → Stop server, check permissions, restart

For detailed troubleshooting, see the **Troubleshooting** section in [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md).

## 🎉 Next Steps

1. Run **setup.sh** to initialize
2. Edit **~/.gustopos/stack.env** to set password
3. Start with **~/.gustopos/start.sh**
4. Access at **http://localhost:3000**
5. Set up **weekly backups** to USB

---

**Questions?** Check the documentation files above, or contact support with:
- Error message (exact text)
- Terminal output (screenshot)
- macOS version
- Steps you took before the error

**Happy serving! 🍹**
