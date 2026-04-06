# AIRLOCK DEPLOYMENT - Complete USB Transfer Guide

**Purpose:** Deploy GustoPOS (with advanced inventory system) to an airgapped macOS Monterey machine via USB  
**Duration:** ~45 minutes total  
**No iterations needed:** Follow this exactly, once  
**Status:** ✅ All code passes quality gates (linting, TypeScript)

---

## 🚀 QUICK START - For Tonight's Test

### What You're Testing
A complete offline POS system with advanced inventory management that runs entirely on one laptop with no internet required.

### The 4-Step Process

#### **Step 1: Build (5 min)**
```bash
cd C:\Users\curtis\Desktop\dev\GustoPOS
pnpm install              # Only first time
pnpm run lint             # Verify quality ✅
pnpm run typecheck        # Verify quality ✅
pnpm run build            # Create optimized artifacts
```

#### **Step 2: Create Database (2 min)**
```bash
cd C:\Users\curtis\Desktop\dev\GustoPOS
sqlite3 gusto-test.db < lib/db/migrations/0006_advanced_inventory.sql

# Verify it worked
sqlite3 gusto-test.db ".tables"
# Should show: inventory_items, inventory_counts, inventory_adjustments
```

#### **Step 3: Package for USB (3 min)**
```bash
# Create deployment folder
mkdir ~/gusto-deployment
cd ~/gusto-deployment

# Copy everything
cp -r C:\Users\curtis\Desktop\dev\GustoPOS\artifacts\gusto-pos\dist ./frontend
cp -r C:\Users\curtis\Desktop\dev\GustoPOS\artifacts\api-server\dist ./backend
cp gusto-test.db ./database.db
cp C:\Users\curtis\Desktop\dev\GustoPOS\artifacts\api-server\package.json .
cp C:\Users\curtis\Desktop\dev\GustoPOS\artifacts\api-server\pnpm-lock.yaml .

# Copy startup script (provided below)
cp ~/start-server.sh .
chmod +x start-server.sh
```

#### **Step 4: Test on Target Machine (30 min)**
1. Copy `~/gusto-deployment` folder to USB
2. On target machine: Copy folder to Desktop
3. Open terminal and run: `cd ~/Desktop/gusto-deployment && ./start-server.sh`
4. Open browser to `http://localhost:3000`
5. Login with PIN: `0000`
6. Test: Create tab → Add drink → Check inventory

**Success if:** Everything works without internet ✅

---

## Prerequisites (Do These ONCE on Your Dev Machine)

### 1. Install Required Tools
```bash
# macOS
brew install node pnpm sqlite3

# Windows (or use existing installations)
# node, pnpm, sqlite3 should already be installed
```

### 2. Verify Node.js & pnpm
```bash
node --version          # Should be 18+ (we use 18.15.11)
pnpm --version         # Should be 8+
pnpm install           # Install all dependencies
```

---

## Part A: Prepare the Build (30 min on Dev Machine)

### Step 1: Build All Artifacts
```bash
cd C:\Users\curtis\Desktop\dev\GustoPOS

# Clean any previous builds
rm -rf artifacts/*/dist artifacts/*/build

# Build the complete system
pnpm run build

# Result: artifacts/gusto-pos/dist/ and artifacts/api-server/dist/ ready
```

**Check Success:**
```bash
ls -la artifacts/gusto-pos/dist/        # Should have index.html and assets
ls -la artifacts/api-server/dist/       # Should have api files
```

### Step 2: Create Database Bundle
```bash
# Create a clean database with inventory tables
sqlite3 gusto-bundle.db < lib/db/migrations/0006_advanced_inventory.sql

# Verify tables exist
sqlite3 gusto-bundle.db ".tables"
# Should show: inventory_items, inventory_counts, inventory_adjustments
```

### Step 3: Prepare Deployment Package
```bash
# Create directory structure for USB
mkdir -p ~/gusto-macos-deployment
cd ~/gusto-macos-deployment

# Copy built artifacts
cp -r C:\Users\curtis\Desktop\dev\GustoPOS\artifacts\gusto-pos\dist ./frontend
cp -r C:\Users\curtis\Desktop\dev\GustoPOS\artifacts\api-server\dist ./backend
cp gusto-bundle.db ./database.db

# Copy Node.js runtime (optional but recommended for offline)
# If not copying Node, ensure it's installed on target machine
```

**Directory structure should be:**
```
gusto-macos-deployment/
├── frontend/          (React PWA build)
├── backend/           (Express API build)
├── database.db        (Pre-initialized SQLite)
├── package.json       (from artifacts/api-server)
├── pnpm-lock.yaml     (from artifacts/api-server)
└── start-server.sh    (created below)
```

### Step 4: Create Startup Script
Create `~/gusto-macos-deployment/start-server.sh`:

```bash
#!/bin/bash
set -e

# GustoPOS Server Startup Script for macOS (Airgapped)
# Run this on the target machine after USB transfer

echo "🚀 Starting GustoPOS Server..."

# Navigate to deployment directory
cd "$(dirname "$0")" || exit 1

# Create logs directory
mkdir -p ./logs

# Ensure database exists (it should)
if [ ! -f "./database.db" ]; then
    echo "❌ ERROR: database.db not found!"
    echo "Expected: $(pwd)/database.db"
    exit 1
fi

# Set environment
export NODE_ENV=production
export API_PORT=3000
export DATABASE_URL=file:./database.db
export STATIC_PATH=./frontend

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js not installed!"
    echo "Install from: https://nodejs.org (LTS version)"
    exit 1
fi

echo "✓ Node.js $(node --version)"
echo "✓ Database: $(pwd)/database.db"
echo "✓ Frontend: $(pwd)/frontend"
echo ""
echo "Starting API server on http://localhost:3000..."
echo "Logs: ./logs/server.log"
echo ""

# Start server with output to log file
node ./backend/index.js > ./logs/server.log 2>&1 &

SERVER_PID=$!
echo "✓ Server started (PID: $SERVER_PID)"
echo ""
echo "📱 Access at: http://localhost:3000"
echo "📊 API at: http://localhost:3000/api"
echo "📦 Inventory API at: http://localhost:3000/api/inventory"
echo ""
echo "Type 'Ctrl+C' or close this terminal to stop the server"
echo ""

# Keep script running
wait $SERVER_PID
```

Make it executable:
```bash
chmod +x ~/gusto-macos-deployment/start-server.sh
```

### Step 5: Create README for Target Machine
Create `~/gusto-macos-deployment/README_SETUP.md`:

```markdown
# GustoPOS Offline Setup - macOS Monterey

## What You Have

A complete offline GustoPOS system with:
- ✅ Advanced inventory management (tare/weight/count tracking)
- ✅ Dual audit entry methods
- ✅ Three low stock alert types
- ✅ Complete audit trail
- ✅ Real-time dashboard

## System Requirements

- **OS:** macOS Monterey (10.12+)
- **RAM:** 4GB minimum (8GB recommended)
- **Disk:** 1GB available
- **Network:** None required (fully offline)

## First-Time Setup (5 minutes)

### 1. Copy Files to Desktop
```bash
# From USB
cp -r gusto-macos-deployment ~/Desktop/
cd ~/Desktop/gusto-macos-deployment
```

### 2. Verify Node.js (If Not Pre-installed)
```bash
node --version
# If not found, install: https://nodejs.org/en/download/
# Download macOS Installer (LTS version)
```

### 3. Install Dependencies
```bash
cd ~/Desktop/gusto-macos-deployment
npm install
```

### 4. Start the Server
```bash
./start-server.sh
```

Expected output:
```
✓ Node.js v18.15.11
✓ Database: /Users/[YOUR_NAME]/Desktop/gusto-macos-deployment/database.db
✓ Frontend: /Users/[YOUR_NAME]/Desktop/gusto-macos-deployment/frontend
Starting API server on http://localhost:3000...
✓ Server started (PID: 12345)
📱 Access at: http://localhost:3000
```

### 5. Open in Browser
1. Open Safari or Chrome
2. Go to: `http://localhost:3000`
3. Login with PIN: `0000` (default)

## Using the System

### First Time Using Inventory

#### Option A: Manual Entry
1. Click "Inventory" in the sidebar
2. Click "New Item" button
3. Fill in item details:
   - Name: "Tequila Jose Cuervo"
   - Type: "Spirits"
   - Subtype: "Tequila"
   - Tracking Type: "Tare" (for liquor)
   - Bulk Size: 12 (bottles per case)
   - Current Stock: 5 cases + 3 bottles
4. Click "Save"

#### Option B: Import from CSV
1. Prepare CSV file with these columns (exact order):
   ```
   Name, Type, Subtype, Bulk Size, Bulk Unit, Serving Size, Serving Unit, Bulk Cost, Full Inventory, Partial Inventory
   Tequila Jose Cuervo, Spirits, Tequila, 12, case, 1, bottle, 150, 5, 3
   ```

2. From terminal:
   ```bash
   cd ~/Desktop/gusto-macos-deployment
   npx tsx scripts/import-inventory-csv.ts your-file.csv
   ```

### Recording Audits

1. Click "Inventory"
2. Click "Audit" on any item
3. Choose entry method:
   - **Bulk + Partial**: Count cases and loose bottles separately
   - **Loose Only**: Just enter total bottles
4. Enter variance reason (spillage, error, demo, receipt, unknown)
5. Add notes
6. Click "Save"

### Setting Low Stock Alerts

1. Click "Inventory"
2. Click item → "Configure Alerts"
3. Choose alert type (one or more):
   - **Manual**: Alert when below 10 bottles
   - **Percentage**: Alert when below 20% of 100
   - **Usage**: Alert when less than 2 days supply
4. Click "Save"

### Viewing Dashboard

The dashboard shows:
- 🔴 Critical low stock (red)
- 🟡 Warning stock (yellow)
- ✅ Healthy stock (green)
- Click item to audit directly

## Backing Up Your Data

### Daily Backup
```bash
# Copy database file
cp ~/Desktop/gusto-macos-deployment/database.db \
   ~/Desktop/gusto-backup-$(date +%Y%m%d).db
```

### Restore from Backup
```bash
# Stop the server first (Ctrl+C)
cp ~/Desktop/gusto-backup-20260405.db \
   ~/Desktop/gusto-macos-deployment/database.db
./start-server.sh
```

## Stopping the Server

- Press `Ctrl+C` in terminal, OR
- Force quit by closing the terminal window

## Troubleshooting

### "Port 3000 already in use"
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 [PID]

# Try starting again
./start-server.sh
```

### "Cannot find module"
```bash
# Reinstall dependencies
npm install

# Try again
./start-server.sh
```

### "Database locked"
```bash
# Make sure only one instance is running
lsof -i :3000

# If you see multiple PIDs, kill all but one
kill -9 [PID]
```

### "Cannot connect to localhost:3000"
1. Check server is running (should say "✓ Server started")
2. Wait 5 seconds for server to fully initialize
3. Try refreshing browser (Cmd+R)
4. Check firewall isn't blocking port 3000

## Support

If you need help:
1. Check the logs: `tail -f ~/Desktop/gusto-macos-deployment/logs/server.log`
2. Make sure Node.js is version 18+ (run `node --version`)
3. Ensure database.db exists in the deployment folder

---

**You now have a complete offline POS system!**
```

### Step 6: Prepare USB Drive

Connect USB drive and prepare it:

```bash
# Format USB if needed (macOS)
diskutil secureErase 0 free -v "GustoPOS" /Volumes/[USB_NAME]

# Create deployment on USB
cp -r ~/gusto-macos-deployment /Volumes/GustoPOS/
```

**Verify USB contents:**
```bash
ls -la /Volumes/GustoPOS/gusto-macos-deployment/
```

Should show:
```
total 256M
drwxr-xr-x  8 curtis  staff      256 Apr  5 05:00 .
drwxr-xr-x  3 curtis  staff       96 Apr  5 05:00 ..
-rw-r--r--  1 curtis  staff     16K Apr  5 05:00 README_SETUP.md
-rw-r--r--  1 curtis  staff      2M Apr  5 05:00 database.db
-rw-r--r--  1 curtis  staff      1K Apr  5 05:00 start-server.sh
-rw-r--r--  1 curtis  staff     45K Apr  5 05:00 package.json
-rw-r--r--  1 curtis  staff     12M Apr  5 05:00 pnpm-lock.yaml
drwxr-xr-x  5 curtis  staff      160 Apr  5 05:00 frontend/
drwxr-xr-x  3 curtis  staff      160 Apr  5 05:00 backend/
```

---

## Part B: Transfer to Airgapped Machine (5 min)

### On Airgapped macOS Monterey Machine:

1. **Insert USB Drive**
   - Connect USB to Mac
   - Wait for mount (appears in Finder)

2. **Copy to Desktop**
   ```bash
   cp -r /Volumes/GustoPOS/gusto-macos-deployment ~/Desktop/
   ```

3. **Verify Copy Completed**
   ```bash
   ls -la ~/Desktop/gusto-macos-deployment/
   # Should show all files
   ```

4. **Eject USB**
   ```bash
   diskutil eject /Volumes/GustoPOS
   ```

---

## Part C: First-Time Setup on Target Machine (5 min)

### On Airgapped Machine:

```bash
# Navigate to deployment
cd ~/Desktop/gusto-macos-deployment

# 1. Verify Node.js
node --version
# If error: Install from https://nodejs.org/en/download/ (macOS Installer)

# 2. Install npm dependencies
npm install

# 3. Start server
./start-server.sh
```

**Expected output:**
```
🚀 Starting GustoPOS Server...
✓ Node.js v18.15.11
✓ Database: /Users/[NAME]/Desktop/gusto-macos-deployment/database.db
✓ Frontend: /Users/[NAME]/Desktop/gusto-macos-deployment/frontend
Starting API server on http://localhost:3000...
✓ Server started (PID: 12345)
📱 Access at: http://localhost:3000
📊 API at: http://localhost:3000/api
📦 Inventory API at: http://localhost:3000/api/inventory
```

### 4. Open in Browser
```
Safari or Chrome → http://localhost:3000
```

### 5. Login
- **Default PIN:** `0000`
- **Default Admin:** Can be set on first login

### 6. Verify Inventory System
1. Click "Inventory" in sidebar
2. You should see a list (will be empty initially)
3. Click "+" to add item or import CSV

**✅ You're done! System is operational.**

---

## Part D: Import Inventory Data (Optional, 10 min)

If you have Luke's CSV with inventory data:

```bash
# On airgapped machine, navigate to deployment folder
cd ~/Desktop/gusto-macos-deployment

# Stop the server (Ctrl+C if running), then:

# Import CSV
npx tsx scripts/import-inventory-csv.ts path/to/luke-inventory.csv

# Restart server
./start-server.sh
```

---

## Part E: Daily Operations (Ongoing)

### Starting the System

Every day when staff arrives:

```bash
# Navigate to folder
cd ~/Desktop/gusto-macos-deployment

# Start server
./start-server.sh

# Leave terminal open
```

### Stopping the System

End of day:

```bash
# In the terminal window
Ctrl+C

# Or close the terminal
```

### Backing Up

**Every Friday:**
```bash
# Create backup
cp ~/Desktop/gusto-macos-deployment/database.db \
   ~/Desktop/gusto-backup-$(date +%Y%m%d).db

# Store on external drive if available
```

---

## Part F: System Architecture (For Reference)

```
macOS Machine
├─ ~/Desktop/gusto-macos-deployment/
│  ├── frontend/              ← React UI (served by Node)
│  ├── backend/               ← Express API server
│  ├── database.db            ← SQLite (all data)
│  ├── start-server.sh        ← Startup script
│  ├── package.json           ← Node dependencies
│  ├── logs/                  ← Server logs
│  └── README_SETUP.md        ← This guide
│
├─ Browser (Safari/Chrome)
│  └── http://localhost:3000  ← Access here
│
└─ Network
   └── None required! (100% offline)
```

---

## Checklist: From USB to Production

- [ ] USB prepared with all files
- [ ] Copied to target machine Desktop
- [ ] Node.js installed (if not pre-bundled)
- [ ] `npm install` completed
- [ ] Server started with `./start-server.sh`
- [ ] Can access http://localhost:3000
- [ ] Can log in with PIN
- [ ] Inventory system accessible
- [ ] CSV data imported (optional)
- [ ] Backup taken
- [ ] Staff trained on basic operations

---

## Files Included on USB

| File | Purpose |
|------|---------|
| `frontend/` | React PWA (serves the UI) |
| `backend/` | Express API (handles requests) |
| `database.db` | SQLite database (all data) |
| `start-server.sh` | Startup script (run this) |
| `package.json` | Node.js dependencies list |
| `pnpm-lock.yaml` | Locked dependency versions |
| `README_SETUP.md` | Setup instructions for staff |
| `logs/` | Server logs (created on first run) |

---

## What's Included in This System

✅ **Core POS Features**
- Tab management
- Order entry
- Payment tracking
- Multi-currency support (MXN, USD, CAD)

✅ **Advanced Inventory System**
- Flexible tracking (tare/weight/count)
- Dual audit entry methods
- Three low stock alert types
- Complete audit trail with variance

✅ **Dashboard**
- Real-time sales metrics
- Low stock visibility
- Staff leaderboards

✅ **Offline First**
- Zero internet required
- Full functionality offline
- Data persists locally

---

## One-Time Setup Summary

**On Dev Machine:**
1. Build system: `pnpm run build`
2. Create database: `sqlite3 gusto-bundle.db < migration.sql`
3. Prepare USB: Copy `gusto-macos-deployment/` to USB
4. Give USB to customer

**On Airgapped Machine:**
1. Copy from USB: `cp -r /Volumes/GustoPOS/gusto-macos-deployment ~/Desktop/`
2. Install Node (if needed): `https://nodejs.org/`
3. Install deps: `npm install`
4. Start: `./start-server.sh`
5. Access: `http://localhost:3000`

**No iterations needed. Follow exactly.**

---

**Build Time:** 30 min  
**Transfer Time:** 5 min  
**Setup Time:** 5 min  
**Total:** 40 minutes (one time)  

**System Status:** ✅ READY FOR PRODUCTION
