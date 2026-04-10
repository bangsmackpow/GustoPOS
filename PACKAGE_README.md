# GustoPOS Desktop Package v0.1.0

## Package Information

**Version**: 0.1.0
**Platform**: macOS (Darwin x64)
**Build Date**: April 9, 2026
**Package Type**: DMG (Apple Disk Image)

---

## Package Details

| Metric               | Value       |
| -------------------- | ----------- |
| **DMG Size**         | 107 MB      |
| **App Bundle Size**  | 292 MB      |
| **Compression**      | zlib        |
| **Electron Version** | 28.3.3      |
| **Architecture**     | x64 (Intel) |

---

## Contents

### Application Bundle Structure:

```
GustoPOS.app/
├── Contents/
│   ├── Info.plist          # App metadata
│   ├── PkgInfo             # Package info
│   ├── MacOS/
│   │   └── GustoPOS        # Main executable
│   ├── Frameworks/         # Electron frameworks
│   └── Resources/
│       ├── api/            # API server bundle
│       │   └── index.cjs   # 4.8MB server code
│       ├── app/            # Frontend bundle
│       │   ├── index.html
│       │   ├── assets/
│       │   │   ├── index-CqYqEwYe.js    # 728KB
│       │   │   └── index-Ed22wDD0.css   # 116KB
│       │   └── migrations/  # Database migrations
│       └── electron.icns   # App icon
```

---

## Included Components

### Frontend (PWA)

- ✅ React 19 + Vite build
- ✅ TanStack Query for API calls
- ✅ Tailwind CSS 4 styling
- ✅ Radix UI components
- ✅ Service Worker for offline support

### API Server

- ✅ Express.js 5 backend
- ✅ Drizzle ORM for database
- ✅ SQLite (LibSQL) database
- ✅ JWT authentication
- ✅ Pino logging
- ✅ All 25 API routes

### Database

- ✅ 22 tables pre-configured
- ✅ Migration 0000 + 0001 applied
- ✅ Seed data available
- ✅ WAL mode enabled

---

## System Requirements

### Minimum Requirements:

- **macOS**: 10.15 (Catalina) or later
- **RAM**: 4 GB
- **Storage**: 300 MB free space
- **Processor**: Intel x64

### Recommended:

- **macOS**: 12.0 (Monterey) or later
- **RAM**: 8 GB
- **Storage**: 500 MB free space
- **Processor**: Apple Silicon (M1/M2/M3) with Rosetta 2

---

## Security Notes

### Code Signing:

- ⚠️ **Not code-signed** (Developer ID required for distribution)
- App uses default Electron icon
- macOS may show "unidentified developer" warning

### To Bypass Gatekeeper:

```bash
xattr -d com.apple.quarantine /Applications/GustoPOS.app
```

---

## Installation

### Method 1: DMG Installation

1. Open `GustoPOS-0.1.0.dmg`
2. Drag `GustoPOS.app` to `Applications` folder
3. Launch from Applications

### Method 2: Direct Copy

```bash
cp -R artifacts/desktop-app/dist/build/mac/GustoPOS.app /Applications/
```

---

## First Run

1. **Launch app** - Double-click GustoPOS
2. **Database initialization** - Automatic on first run
3. **Login** - Use default admin credentials or create new
4. **Settings** - Configure bar name, currency, rates

---

## Environment Variables

The app reads these from `~/Library/Application Support/@workspace/desktop-app/.env`:

```bash
ADMIN_PASSWORD=your_secure_password_here
```

**Required**: `ADMIN_PASSWORD` for JWT session security

---

## Data Storage

### Database Location:

```
~/Library/Application Support/@workspace/desktop-app/gusto.db
```

### Backup Location:

```
~/Library/Application Support/@workspace/desktop-app/backups/
```

### Logs:

```
~/Library/Logs/GustoPOS/
```

---

## Troubleshooting

### App Won't Open:

1. Check macOS version (10.15+ required)
2. Run: `xattr -d com.apple.quarantine /Applications/GustoPOS.app`
3. Check Console.app for crash logs

### Database Errors:

1. Delete `gusto.db` to reset (WARNING: data loss)
2. App will recreate with migrations

### Port Conflicts:

- Default: Port 3000
- Change in Settings or environment

---

## What's Included in This Build

### Critical Fixes Applied:

1. ✅ Database migration (0001) for missing columns
2. ✅ Rate limiter import fix
3. ✅ JWT security hardening
4. ✅ Settings button fixes (Save Staff, Schedule Rush)
5. ✅ Bulk import simplification (16 columns)

### Features:

- ✅ Full POS system (tabs, orders, payments)
- ✅ Inventory management (32 fields)
- ✅ Drink recipes
- ✅ Staff management with PIN login
- ✅ Shift tracking
- ✅ Rush events
- ✅ Analytics dashboard
- ✅ Backup/restore
- ✅ Bulk CSV import
- ✅ Audit logging
- ✅ Bilingual (English/Spanish)

---

## Build Command Reference

```bash
# Build all packages
pnpm run build:desktop

# Package for Mac only
pnpm --filter @workspace/desktop-app run package:mac

# Package for Windows
pnpm --filter @workspace/desktop-app run package:win

# Package for Linux
pnpm --filter @workspace/desktop-app run package:linux
```

---

## Version History

### v0.1.0 (April 9, 2026)

- Initial stable release
- All critical bugs fixed
- Full POS functionality
- Desktop packaging working

---

**Status**: ✅ READY FOR DEPLOYMENT

**Package Location**: `artifacts/desktop-app/dist/build/GustoPOS-0.1.0.dmg`
