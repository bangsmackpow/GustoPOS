# OFFLINE_DESKTOP_GUIDE.md - GustoPOS Desktop App Guide

> **Last Updated**: April 10, 2026  
> **Version**: 1.0  
> **Platform**: macOS / Windows (Electron)

---

## Table of Contents

1. [Installation](#installation)
2. [Initial Setup](#initial-setup)
3. [Daily Operations](#daily-operations)
4. [Data Management](#data-management)
5. [Troubleshooting](#troubleshooting)
6. [Backup & Recovery](#backup--recovery)

---

## Installation

### System Requirements

| Requirement | Minimum                    | Recommended            |
| ----------- | -------------------------- | ---------------------- |
| OS          | macOS 10.15+ / Windows 10+ | macOS 12+ / Windows 11 |
| RAM         | 4 GB                       | 8 GB                   |
| Storage     | 1 GB free                  | 5 GB free              |
| Display     | 1024x768                   | 1920x1080              |

### Installing on macOS

1. **Download** the DMG file
2. **Open** the DMG
3. **Drag** GustoPOS to Applications
4. **Open** from Applications (first time requires right-click → Open)

### Installing on Windows

1. **Download** the installer
2. **Run** the installer
3. **Follow** the prompts
4. **Launch** from Start Menu

---

## Initial Setup

### First Launch

On first launch, GustoPOS will:

1. **Create database** - Stores all data locally
2. **Run migrations** - Sets up tables
3. **Seed default data** - Creates initial settings

### Admin Account Setup

1. Launch the app
2. Login with default admin credentials (check with your deployment)
3. **Change the default password**
4. **Create staff accounts** for your team

### Recommended First Steps

1. ☐ Set bar name and icon (Settings)
2. ☐ Configure exchange rates (USD/CAD to MXN)
3. ☐ Add your first inventory items
4. ☐ Set up drinks/menu
5. ☐ Create staff accounts
6. ☐ Create a backup

---

## Daily Operations

### Starting the App

1. Double-click GustoPOS in Applications
2. Wait for window to appear (5-10 seconds)
3. Login with your PIN

### App Layout

```
┌──────────────────────────────────────────────────────────────┐
│  GUSTOPOS                                    [User: Admin]  │
├─────┬────────────────────────────────────────────────────────┤
│     │                                                        │
│ 📊  │                                                        │
│     │                   MAIN CONTENT                        │
│ 🍹  │                   (Changes based on                   │
│     │                   selected section)                   │
│ 📦  │                                                        │
│     │                                                        │
│ 🧾  │                                                        │
│     │                                                        │
│ 📈  │                                                        │
│     │                                                        │
│ ⚙️  │                                                        │
│     │                                                        │
├─────┴────────────────────────────────────────────────────────┤
│  Status: Online                          v0.1.0             │
└──────────────────────────────────────────────────────────────┘
```

### Navigation

- **Left sidebar**: Main sections
- **Top area**: Current section title
- **Main content**: Lists, forms, reports

### Closing the App

1. Click the close button (red X)
2. App will save any pending data
3. Fully closes

_Note: The app runs locally, so no internet is required._

---

## Data Management

### Where Data is Stored

| Data Type | Location                                                        |
| --------- | --------------------------------------------------------------- |
| Database  | `~/Library/Application Support/@workspace/desktop-app/gusto.db` |
| Logs      | `~/Library/Logs/GustoPOS/`                                      |

_On Windows: `%APPDATA%\@workspace\desktop-app\`_

### Database Location

To find your database:

**macOS:**

```bash
open ~/Library/Application\ Support/@workspace/desktop-app/
```

**Windows:**

```
%APPDATA%\@workspace\desktop-app\
```

---

## Troubleshooting

### App Won't Open

**Symptom**: Clicking app does nothing

**Solutions**:

1. Check the log file for errors
2. Delete database and restart:
   ```bash
   rm -f ~/Library/Application\ Support/@workspace/desktop-app/gusto.db
   ```
3. Reinstall the app

### Database Errors

**Symptom**: "Database not found" or SQL errors

**Solutions**:

1. Delete existing database (creates fresh one):
   ```bash
   rm -f ~/Library/Application\ Support/@workspace/desktop-app/gusto.db
   ```
2. Reinstall app - fresh database will be created

### Slow Performance

**Symptom**: App runs slowly

**Solutions**:

1. Close unused tabs in the app
2. Restart the app daily
3. Ensure adequate RAM available

### Check Log File

For any issues, check the log:

**macOS:**

```bash
cat ~/Library/Logs/GustoPOS/app-2026-*.log
```

**Windows:**

```
type %APPDATA%\@workspace\desktop-app\logs\app.log
```

---

## Backup & Recovery

### Manual Backup

1. Go to **Settings**
2. Click **Create Backup**
3. Backup saved to `~/Library/Application Support/@workspace/desktop-app/backups/`

### Backup File Location

**macOS:**

```bash
ls ~/Library/Application\ Support/@workspace/desktop-app/backups/
```

**Windows:**

```
dir %APPDATA%\@workspace\desktop-app\backups\
```

### Restoring from Backup

1. Close the app
2. Locate backup file
3. Copy to database location
4. Restart app

### Automated Backups

The app can be configured to:

- Auto-backup every 15 minutes
- Keep last 5 backups
- Enable in Settings → Backup

---

## Uninstalling

### macOS

1. Delete the app from Applications
2. Optionally delete user data:
   ```bash
   rm -rf ~/Library/Application\ Support/@workspace/desktop-app/
   ```

### Windows

1. Go to Settings → Apps → GustoPOS → Uninstall
2. Optionally delete user data:
   ```
   %APPDATA%\@workspace\desktop-app\
   ```

---

## Version Information

| Version | Date       | Notes                      |
| ------- | ---------- | -------------------------- |
| 0.1.0   | April 2026 | Initial production release |

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details
- [USER_GUIDE.md](./USER_GUIDE.md) - Staff operations guide
- [ROADMAP.md](./ROADMAP.md) - Future features
- [PACKAGING_GUIDE.md](./PACKAGING_GUIDE.md) - Build process
