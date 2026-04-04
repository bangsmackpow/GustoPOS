# GustoPOS Deployment Runbook for Customer IT

## 📋 Summary

This document provides **step-by-step instructions** for deploying GustoPOS on a MacBook Pro running macOS Monterey in an isolated (airgapped) environment. No internet connection is required.

**Estimated Time:** 10-15 minutes  
**Difficulty:** Beginner (no technical knowledge required)  
**Prerequisites:** USB drive with GustoPOS bundle, MacBook Pro running macOS Monterey

---

## 🎯 Deployment Steps

### Phase 1: Preparation (2 minutes)

#### 1.1 Verify USB Drive Contents

**On your MacBook, insert the USB drive and verify it contains:**

```
gusto-pos-macos-airgapped/
├── api-server/          (Express backend)
├── gusto-pos/           (React frontend)
├── migrations/          (Database files)
├── setup.sh             (Setup script)
├── start.sh             (Start script)
├── stop.sh              (Stop script)
├── README.md            (Documentation)
└── stack.env.example    (Configuration template)
```

**Action:** Open Finder, insert USB, and confirm all files are present.

#### 1.2 Copy Bundle to Hard Drive

**Do NOT run from USB directly (too slow). Copy to your Mac:**

1. Open **Finder**
2. Click **Desktop** in the sidebar
3. Drag the `gusto-pos-macos-airgapped` folder from USB to Desktop
4. Wait for copy to complete (should take 1-2 minutes)
5. Eject the USB drive

**Action:** Verify the folder is now on Desktop with all files intact.

---

### Phase 2: Installation (5 minutes)

#### 2.1 Open Terminal

1. Press **Cmd + Space** (opens Spotlight)
2. Type `terminal` and press Enter
3. You should see a command prompt like:
   ```
   computername:~ username$
   ```

**Action:** Terminal is now ready for commands.

#### 2.2 Navigate to Bundle Directory

In Terminal, type:

```bash
cd ~/Desktop/gusto-pos-macos-airgapped
```

Then press Enter.

**Verify:** Type `ls` and press Enter. You should see the files from Step 1.2.

#### 2.3 Make Scripts Executable

Type these commands (one at a time, press Enter after each):

```bash
chmod +x setup.sh
chmod +x start.sh
chmod +x stop.sh
```

**Action:** Scripts are now executable.

#### 2.4 Run Setup

Type:

```bash
bash setup.sh
```

Press Enter and **watch the output**. It should print:

```
==========================================
GustoPOS Airgapped Setup
==========================================
Log file: /Users/username/.gustopos/setup.log

[1/5] Checking Node.js...
✓ Node.js v20.x.x found

[2/5] Checking pnpm...
✓ pnpm 9.x.x found

[3/5] Setting up configuration...
✓ Created default stack.env

[4/5] Copying application files...
✓ Application files ready

[5/5] Creating helper scripts...
✓ Helper scripts created

==========================================
✓ Setup Complete!
==========================================
```

**If setup succeeds:** Continue to Phase 3.  
**If setup fails:** See Troubleshooting section below.

---

### Phase 3: Configuration (3 minutes)

#### 3.1 Edit Configuration File

The setup script created `~/.gustopos/stack.env`. Open it with:

```bash
open ~/.gustopos/stack.env
```

This opens the file in TextEdit (or your default editor).

#### 3.2 Set Admin Password

Find the line:

```env
ADMIN_PASSWORD=change-me-immediately
```

Change it to something strong (remember this password!):

```env
ADMIN_PASSWORD=MySecure123!Password
```

**Examples of good passwords:**
- `MyBar$Password2026`
- `GustoPOS#April2026`
- Avoid simple passwords like `admin` or `password`

#### 3.3 (Optional) Edit Other Settings

Other important settings:

| Setting | Purpose | Example |
|---------|---------|---------|
| `ADMIN_EMAIL` | Login email | `admin@mybar.local` |
| `ADMIN_PIN` | PIN login (optional) | `0000` |
| `PORT` | API server port | `3001` (default, only change if port conflicts) |
| `LOG_LEVEL` | Debug output | `info` (use `debug` for troubleshooting) |

#### 3.4 Save Configuration

1. Press **Cmd+S** to save
2. Close the editor
3. In Terminal, verify the change:
   ```bash
   cat ~/.gustopos/stack.env | grep ADMIN_PASSWORD
   ```
   Should show your new password.

**Action:** Configuration is ready.

---

### Phase 4: Starting the Application (2 minutes)

#### 4.1 Start the Server

In Terminal (same window where you ran setup.sh), type:

```bash
~/.gustopos/start.sh
```

You should see output like:

```
==========================================
GustoPOS Airgapped Server
==========================================
Time: Fri Apr 4 08:00:00 PDT 2026
Database: file:/Users/username/.gustopos/data/gusto.db
Port: 3001
Admin: admin@bar.local

Access the app at: http://localhost:3000
Press Ctrl+C to stop
```

**If you see this:** Go to Phase 5.  
**If you see an error:** See Troubleshooting section.

**Important:** Leave this Terminal window open while using the app. Do NOT close it.

#### 4.2 Verify Server is Running

Open a **new Terminal window** (Cmd+N or Cmd+T) and type:

```bash
curl http://localhost:3001/health
```

You should get a response (may be JSON or empty, that's fine).

**Action:** Server is confirmed running.

---

### Phase 5: Access the Application (2 minutes)

#### 5.1 Open Web Browser

1. Open **Safari** (or your preferred browser)
2. In the address bar at the top, type:
   ```
   http://localhost:3000
   ```
3. Press Enter

You should see the **GustoPOS Login Screen**.

#### 5.2 Login

1. You'll see a field asking for **Admin PIN** or **Admin Password**
2. Enter the password you set in Phase 3.2
3. Click **Login**

**If successful:** You see the GustoPOS dashboard. Go to Phase 6.  
**If unsuccessful:** See Troubleshooting section.

---

### Phase 6: Daily Operations

#### 6.1 Starting Each Day

1. Open Terminal (Cmd+Space → `terminal`)
2. Type: `~/.gustopos/start.sh`
3. Leave Terminal running
4. Open browser to `http://localhost:3000`

#### 6.2 Stopping Each Day

**When closing the bar:**

1. In Terminal (the server window), press **Ctrl+C**
2. Wait for it to stop (should say "Stopped")
3. Or use: `~/.gustopos/stop.sh`

#### 6.3 Daily Backup Recommendation

Once per day, backup your data to USB:

```bash
cp ~/.gustopos/data/gusto.db ~/Desktop/gusto-backup-$(date +%Y%m%d).db
```

Then copy this file to a USB drive or external disk for safekeeping.

---

## ⚠️ Troubleshooting

### Problem 1: "Node.js not found" or "command not found"

**Cause:** Node.js is not installed or not in PATH.

**Solution:**

1. Check if Node.js is installed:
   ```bash
   node --version
   ```

2. If not installed, you must download Node.js **on another machine** with internet:
   - Go to https://nodejs.org/
   - Download macOS Installer (LTS)
   - Transfer to USB drive
   - Install on your MacBook
   - Run setup again

**Alternative:** Contact support for pre-installed bundle.

---

### Problem 2: "Permission denied" or "Cannot access file"

**Cause:** Files don't have execute permissions.

**Solution:**

```bash
chmod +x ~/.gustopos/setup.sh
chmod +x ~/.gustopos/start.sh
chmod +x ~/.gustopos/stop.sh
```

Then try again.

---

### Problem 3: "Port 3001 already in use"

**Cause:** Another application is using that port.

**Solution Option A - Use different port:**

1. Edit `~/.gustopos/stack.env`
2. Change `PORT=3001` to `PORT=8001`
3. Restart server

**Solution Option B - Find and stop the process:**

```bash
lsof -i :3001
kill -9 <PID>
```

---

### Problem 4: "Cannot connect to localhost:3000" or blank page

**Cause:** Server not running or browser cache issue.

**Solution:**

1. Verify server is running:
   - Check Terminal window - should say "Server listening"
   
2. Hard refresh browser:
   - Press **Cmd+Shift+R** (clears cache)
   
3. Try different port:
   - Maybe port 3000 is in use
   - Change `PORT` in `~/.gustopos/stack.env` to `8001`
   - Update browser address to `http://localhost:8001`

4. Check logs for errors:
   ```bash
   tail -50 ~/.gustopos/logs/server-*.log
   ```

---

### Problem 5: "Database locked" or "Cannot write to database"

**Cause:** File permissions or database corruption.

**Solution:**

1. Check database exists:
   ```bash
   ls -la ~/.gustopos/data/
   ```

2. Fix permissions:
   ```bash
   chmod 755 ~/.gustopos/data
   chmod 644 ~/.gustopos/data/gusto.db
   ```

3. Restore from backup if corrupted:
   ```bash
   ~/.gustopos/stop.sh
   cp ~/Desktop/gusto-backup-*.db ~/.gustopos/data/gusto.db
   ~/.gustopos/start.sh
   ```

---

### Problem 6: "Cannot login" or "Invalid credentials"

**Cause:** Wrong password or configuration issue.

**Solution:**

1. Verify password in config:
   ```bash
   cat ~/.gustopos/stack.env | grep ADMIN_PASSWORD
   ```

2. Make sure it matches what you entered earlier

3. Restart server:
   ```bash
   ~/.gustopos/stop.sh
   sleep 2
   ~/.gustopos/start.sh
   ```

4. Try login again

---

## 📞 Emergency Recovery

### If Application Won't Start

1. **Check logs:**
   ```bash
   tail -100 ~/.gustopos/logs/server-*.log
   ```

2. **Reset database (WARNING: Deletes all data):**
   ```bash
   rm ~/.gustopos/data/gusto.db
   ~/.gustopos/start.sh
   ```

3. **Restore from backup:**
   ```bash
   ~/.gustopos/stop.sh
   cp ~/Desktop/gusto-backup-YYYYMMDD.db ~/.gustopos/data/gusto.db
   ~/.gustopos/start.sh
   ```

### If Data Appears Corrupted

1. Stop the server: `~/.gustopos/stop.sh`
2. Locate your latest backup
3. Restore: `cp backup.db ~/.gustopos/data/gusto.db`
4. Restart: `~/.gustopos/start.sh`

---

## ✅ Verification Checklist

After following all steps, verify:

- [ ] Terminal shows "Server listening" message
- [ ] Browser loads `http://localhost:3000` without errors
- [ ] Can login with your admin password
- [ ] Can create a test tab and add an item
- [ ] Can view the main dashboard
- [ ] Can stop server with Ctrl+C and restart successfully

---

## 📞 Support Information

**If you need help:**

1. **Collect information:**
   - Error message (exact text)
   - Terminal output (screenshot)
   - macOS version (System Preferences → About This Mac)
   - What steps you took

2. **Provide logs:**
   ```bash
   cat ~/.gustopos/logs/server-*.log
   ```

3. **Check documentation:**
   - See README.md in the bundle
   - Review troubleshooting above

---

## 🎯 Summary of Commands

**Quick reference for daily use:**

| Task | Command |
|------|---------|
| Start server | `~/.gustopos/start.sh` |
| Stop server | `~/.gustopos/stop.sh` |
| View configuration | `cat ~/.gustopos/stack.env` |
| Edit configuration | `open ~/.gustopos/stack.env` |
| View logs | `tail ~/.gustopos/logs/server-*.log` |
| Backup data | `cp ~/.gustopos/data/gusto.db ~/backup.db` |
| Reset database | `rm ~/.gustopos/data/gusto.db` (WARNING!) |

---

**Deployment complete! Questions? See troubleshooting section or contact support.**
