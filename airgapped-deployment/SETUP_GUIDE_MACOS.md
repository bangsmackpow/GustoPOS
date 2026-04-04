# GustoPOS Airgapped Deployment Guide for macOS Monterey

## 📋 Overview

This guide walks you through installing and running **GustoPOS** on your MacBook Pro in a completely offline environment. The system includes:

- ✅ **Express API Server** - Runs locally on your Mac
- ✅ **React Web Application** - Accessed via web browser
- ✅ **SQLite Database** - Stores all your bar data locally
- ✅ **No Internet Required** - Fully offline operation

---

## 🚀 Quick Start (5 minutes)

### Step 1: Extract the USB Drive

1. Insert the USB drive into your MacBook
2. Open **Finder**
3. Copy the `gusto-pos-macos-airgapped` folder to your Desktop or preferred location
4. Eject the USB drive

### Step 2: Open Terminal

1. Press **Cmd + Space** to open Spotlight
2. Type `Terminal` and press Enter
3. You'll see a command prompt like `computername:~ username$`

### Step 3: Run Setup

1. In Terminal, navigate to the folder:
   ```bash
   cd ~/Desktop/gusto-pos-macos-airgapped
   ```

2. Run the setup script:
   ```bash
   bash setup.sh
   ```

3. Follow the prompts. Setup takes about 1 minute.

### Step 4: Configure Your Admin Password

1. The setup script creates a file at `~/.gustopos/stack.env`
2. Open this file:
   ```bash
   open ~/.gustopos/stack.env
   ```

3. Edit the `ADMIN_PASSWORD` line:
   ```env
   ADMIN_PASSWORD=your-secure-password-here
   ```
   (Replace `your-secure-password-here` with something strong)

4. Save the file (Cmd+S)

### Step 5: Start the Server

1. In Terminal, run:
   ```bash
   ~/.gustopos/start.sh
   ```

2. You should see output like:
   ```
   ==========================================
   GustoPOS Airgapped Server
   ==========================================
   Time: Thu Apr 4 08:00:00 PDT 2026
   Database: file:/Users/username/.gustopos/data/gusto.db
   Port: 3001
   Admin: admin@bar.local
   
   Access the app at: http://localhost:3000
   Press Ctrl+C to stop
   ```

### Step 6: Open the App in Browser

1. Open **Safari** (or your preferred browser)
2. Type: `http://localhost:3000`
3. Press Enter

### Step 7: Login

1. You'll see the GustoPOS login screen
2. Enter the admin password you set in Step 4
3. Click **Login**

**You're now running GustoPOS! 🎉**

---

## 🛑 Stopping the Server

1. In the Terminal window where the server is running, press **Ctrl+C**
2. Or, run in a new Terminal:
   ```bash
   ~/.gustopos/stop.sh
   ```

---

## 📁 File Locations

The system stores everything in `~/.gustopos/`:

| Location | Purpose |
|----------|---------|
| `~/.gustopos/stack.env` | Configuration (passwords, ports) |
| `~/.gustopos/data/gusto.db` | **Your bar data** (BACKUP THIS!) |
| `~/.gustopos/logs/` | Server logs (debugging) |
| `~/.gustopos/api-server/` | Express API files |
| `~/.gustopos/gusto-pos/` | React frontend files |

**⚠️ IMPORTANT: Back up `~/.gustopos/data/gusto.db` regularly to a USB drive or external disk.**

---

## 🔧 Troubleshooting

### Issue: "Terminal: command not found" or "bash: setup.sh: command not found"

**Solution:**
1. Make sure you're in the correct folder:
   ```bash
   pwd
   ```
   Should show something like `/Users/yourname/Desktop/gusto-pos-macos-airgapped`

2. List the files to ensure setup.sh exists:
   ```bash
   ls -la
   ```
   You should see `setup.sh` in the output.

3. Make the script executable:
   ```bash
   chmod +x setup.sh
   bash setup.sh
   ```

---

### Issue: "Node.js not found" or "pnpm not found"

**Solution:**
The Node.js runtime should be included in the USB bundle. If missing:

1. **Check if Node.js is installed on your Mac:**
   ```bash
   node --version
   ```

2. **If not installed, you'll need to download Node.js from another machine:**
   - Visit https://nodejs.org/
   - Download the **macOS Installer** (LTS version)
   - Install it on your Mac
   - Then run setup again

---

### Issue: "Database file not found" or "Permission denied"

**Solution:**
1. Check that the data directory exists:
   ```bash
   ls -la ~/.gustopos/data/
   ```

2. If it doesn't exist, create it:
   ```bash
   mkdir -p ~/.gustopos/data
   ```

3. Check permissions:
   ```bash
   chmod 755 ~/.gustopos
   chmod 755 ~/.gustopos/data
   ```

---

### Issue: "Port 3001 is already in use"

**Solution:**
Another application is using port 3001. You have two options:

**Option A: Use a different port**
1. Edit `~/.gustopos/stack.env`
2. Change the `PORT` line to something else:
   ```env
   PORT=8001
   ```
3. Restart the server

**Option B: Kill the process using the port**
1. Find what's using port 3001:
   ```bash
   lsof -i :3001
   ```

2. Note the PID (process ID) from the output
3. Kill it:
   ```bash
   kill -9 <PID>
   ```

---

### Issue: "Cannot log in" or "Invalid credentials"

**Solution:**
1. Verify your admin password in `~/.gustopos/stack.env`
2. Make sure you set `ADMIN_PASSWORD` correctly (without quotes)
3. Restart the server to apply changes:
   ```bash
   ~/.gustopos/stop.sh
   ~/.gustopos/start.sh
   ```

---

### Issue: "Browser shows blank page or connection refused"

**Solution:**
1. Check that the server is running (Terminal should show "Server listening")
2. Try a hard refresh in the browser:
   - Press **Cmd+Shift+R** (bypasses cache)
3. Check the logs:
   ```bash
   tail ~/.gustopos/logs/server-*.log
   ```

---

## 💾 Backup & Restore

### Backup Your Data

**Every week**, copy your database to a USB drive or external disk:

```bash
# Create a backup file with today's date
cp ~/.gustopos/data/gusto.db ~/.gustopos/data/backup-$(date +%Y%m%d).db

# Now copy to USB drive
# (Plug in USB, then drag the backup file to it)
```

### Restore from Backup

If something goes wrong:

1. Stop the server:
   ```bash
   ~/.gustopos/stop.sh
   ```

2. Restore the backup:
   ```bash
   cp ~/.gustopos/data/backup-YYYYMMDD.db ~/.gustopos/data/gusto.db
   ```

3. Start the server:
   ```bash
   ~/.gustopos/start.sh
   ```

---

## 🔐 Security Notes

1. **Change Default Password**
   - Do this immediately after setup
   - Use a strong password (uppercase, numbers, symbols)

2. **Backup Regularly**
   - Data is only stored locally
   - Without backups, data loss is permanent

3. **Keep Server Running**
   - Don't close the Terminal window while the app is in use
   - Staff can continue using the web app as long as the server is running

4. **Network Access**
   - By default, only your Mac can access the app
   - To allow other devices on Wi-Fi, that requires additional configuration (ask for support)

---

## 📞 Support

If you encounter issues not covered here:

1. **Check logs:**
   ```bash
   cat ~/.gustopos/logs/server-*.log
   ```

2. **Note the error message** and contact support with:
   - The error message
   - Your macOS version (`System Preferences → About This Mac`)
   - The steps you took before the error

---

## 🎯 What You Can Do

- ✅ Create tabs and add drinks/items
- ✅ Track inventory and recipes
- ✅ View sales by hour/shift
- ✅ Generate reports
- ✅ Manage staff and pricing
- ✅ Run completely offline

## ⚠️ What You Cannot Do (Offline)

- ❌ Cloud backup (Litestream)
- ❌ Access from other devices/apps (no sync)
- ❌ Send emails (no SMTP)
- ❌ Access from internet/phones without Wi-Fi setup

---

## 🚀 Next Steps

1. **Configure:** Edit `~/.gustopos/stack.env` to add your bar details
2. **Seed Data:** Set `ADMIN_SEED_ENABLED=true` to populate sample ingredients/drinks
3. **Start Fresh:** Delete `~/.gustopos/data/gusto.db` to reset everything

---

**Happy serving! 🍹**
