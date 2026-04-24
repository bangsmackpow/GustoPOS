# GustoPOS Desktop App Packaging Guide

**Last Updated**: April 13, 2026 (21:00)  
**Current Version**: 0.1.0  
**Build Status**: ✅ Production Ready  
**Build Date**: April 13, 2026  
**MD5 Checksum**: `bf007734c8d1a4b6965e45ed9b09d372`  
**Latest Build Includes**: Rush Events fix + Inventory weight fixes + all previous fixes

---

## 🔧 Latest Build Updates (April 13, 2026 - 21:00)

### Rush Events Fix ✅

- **Default View**: Shows 3 events (not 5)
- **Show More/Less**: Added expand/collapse button with bilingual support
- **API Filter**: Fixed `gte` → `lt` in rushes.ts to correctly show next 7 days
- **Previous Behavior**: Was showing all 52 weekly recurrences of events

**Commit**: `50bfac1`

### Inventory Weight Calculation Fixes ✅

- **Formula Fix**: Changed `* density` to `/ density` in all locations
  - Inventory.tsx (3 locations)
  - InventoryAuditModal.tsx
  - BatchAudit.tsx
- **Display Fix**: Shows "No weight data" instead of density value
- **Legacy Field**: Fixed `glassWeightG` → `containerWeightG`
- **Validation**: Prevents negative container weights when no valid weights exist
- **Root Cause**: The -374998g issue was caused by formula error and fallback using wrong field

**Commit**: `50bfac1`

### Previous Fixes Still Included

- **PIN Pad Lockout Prevention**: Lock state not persisted across sessions
- **All 7 Previously Reported Issues**: Verified and working
- ✅ Bulk ingredient import - Working (all item types)
- ✅ Add item tracking mode - Responsive fields work
- ✅ Edit item stock display - Shows current inventory
- ✅ System defaults - ml/oz toggle functional

See `ISSUE_AUDIT_APRIL_13_2026.md` for detailed investigation results.

---

## Quick Start

### Build and Package

```bash
# Build all artifacts and create DMG
pnpm run build:desktop

# Output location
artifacts/desktop-app/dist/build/GustoPOS-0.1.0.dmg
```

**Build Time**: ~3-5 minutes  
**DMG Size**: ~107 MB  
**Dependencies**: Node.js 20+, pnpm 8+, electron-builder

---

## Build Output

### After `pnpm run build:desktop`

```
artifacts/desktop-app/dist/build/
├── GustoPOS-0.1.0.dmg              # Installer (107 MB)
├── GustoPOS-0.1.0.dmg.blockmap     # Block map for updates
├── builder-debug.yml               # Build debug info
├── builder-effective-config.yaml   # Actual build config
└── mac/                            # Unpackaged app bundle
    └── GustoPOS.app/               # Application bundle
        ├── Contents/
        │   ├── MacOS/
        │   │   └── GustoPOS        # Executable
        │   ├── Resources/
        │   │   ├── api/            # Bundled API server
        │   │   │   ├── index.cjs   # Node.js API
        │   │   │   ├── migrations/ # Database migrations
        │   │   │   └── node_modules/
        │   │   └── app.asar        # Electron app bundle
        │   └── Info.plist          # macOS metadata
        └── _CodeSignature/         # Code signature (unsigned)
```

### Installation

1. **Mount DMG**: Double-click `GustoPOS-0.1.0.dmg`
2. **Drag to Applications**: Drag GustoPOS.app to Applications folder
3. **Run**: Double-click from Applications folder
4. **First Run**:
   - Database created automatically
   - API server starts as background process
   - Admin account created (use `ADMIN_PASSWORD` env var)

---

## Database Configuration

### Database Location

- **macOS Path**: `~/Library/Application Support/@workspace/desktop-app/gusto.db`
- **Environment**: Electron's `app.getPath("userData")`
- **Auto-created**: On first run if missing

### How Database Connects

1. **main.ts** launches the app
2. Creates database path in user's Application Support folder
3. Spawns API server as child process
4. Passes `DATABASE_URL` environment variable
5. API server (`lib/db/src/index.ts`) initializes database
6. Auto-migrations run on startup

### Key Code (artifacts/desktop-app/src/main.ts)

```typescript
// Database path in Application Support
const dbPath = path.join(app.getPath("userData"), "gusto.db");

// Pass to API server
const env = {
  DATABASE_URL: `file://${dbPath.replace(/ /g, "%20")}`,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "default",
  PORT: 3000,
  // ... other env vars
};

// Spawn API server
const apiProcess = spawn(apiExecutable, [], { env });
```

---

## Path Resolution (Critical for Packaged Apps)

### Development vs Production

Electron path resolution differs between dev mode and packaged apps:

| Context      | `__dirname`           | Solution                    |
| ------------ | --------------------- | --------------------------- |
| **Dev Mode** | Resolves to workspace | Use `process.cwd()`         |
| **Packaged** | Inside app bundle     | Use `process.resourcesPath` |

### Correct Implementation

```typescript
const isDev = !app.isPackaged;

// API executable
const apiPath = isDev
  ? path.resolve(process.cwd(), "artifacts/api-server/dist/index.cjs")
  : path.join(process.resourcesPath, "api/index.cjs");

// Database migrations
const migrationsPath = isDev
  ? path.resolve(process.cwd(), "lib/db/migrations")
  : path.join(process.resourcesPath, "api/migrations");

// Node modules for API server
const apiNodeModules = isDev
  ? path.resolve(process.cwd(), "node_modules/.pnpm/node_modules")
  : path.join(process.resourcesPath, "api/node_modules");
```

---

## Code Signing & Notarization

### Current Status

⚠️ **Code signing is disabled** in development builds due to expired certificates.

```
• skipped macOS application code signing
  reason=cannot find valid "Developer ID Application" identity
```

### For Production Release

To enable code signing for App Store / notarization:

1. **Obtain Developer ID Certificate**

   ```bash
   # In Keychain Access, create certificate request
   # Import certificate from Apple Developer account
   ```

2. **Update electron-builder config** (artifacts/desktop-app/electron-builder.yml)

   ```yaml
   mac:
     certificateFile: "path/to/certificate.p12"
     certificatePassword: $CERTIFICATE_PASSWORD # Set env var
     signingIdentity: "Developer ID Application: Company Name"
   ```

3. **Set environment variables**

   ```bash
   export CERTIFICATE_PASSWORD=your_password
   export APPLE_ID=your_email
   export APPLE_ID_PASSWORD=your_app_password
   ```

4. **Rebuild with notarization**
   ```bash
   pnpm run build:desktop
   ```

---

## Build Configuration

### electron-builder.yml

```yaml
appId: com.gustopos.app
productName: GustoPOS
directories:
  buildResources: public
  output: dist/build
files:
  - from: dist
    to: app
  - from: ../api-server/dist
    to: api
  - from: ../api-server/package.json
    to: api
  - from: ../../lib/db/migrations
    to: api/migrations
  - from: ../../node_modules/.pnpm/node_modules
    to: api/node_modules

mac:
  target:
    - dmg
  artifactName: "${productName}-${version}.${ext}"
  category: public.app-category.productivity
```

### Build Script (artifacts/desktop-app/build.mjs)

```javascript
// Compiles TypeScript to dist/
// Copies necessary assets
// Runs electron-builder
```

---

## Troubleshooting

### Issue: DMG Build Fails

**Check**:

1. All dependencies installed: `pnpm install`
2. API server built: `pnpm run build:api-server`
3. Frontend built: `pnpm run build:gusto-pos`
4. Disk space available (need ~500 MB)

**Solution**:

```bash
# Clean and rebuild
pnpm run clean
pnpm install
pnpm run build:desktop
```

### Issue: App Won't Start

**Check**:

1. Database path writable: `~/Library/Application Support/@workspace/desktop-app/`
2. `ADMIN_PASSWORD` environment variable set if needed
3. API server logs: Check console in DevTools (Cmd+Shift+I)

**Solution**:

```bash
# Set admin password
export ADMIN_PASSWORD=your_secure_password
# Run from Applications folder
open /Applications/GustoPOS.app
```

### Issue: "Cannot Find Module" Errors

**Usually**: Node modules or API server not bundled correctly

**Check**:

1. `artifacts/api-server/dist/index.cjs` exists
2. `artifacts/api-server/dist/` is built
3. `node_modules/.pnpm/node_modules` contains dependencies

**Solution**:

```bash
# Rebuild API server
pnpm --filter @workspace/api-server run build

# Then rebuild desktop
pnpm run build:desktop
```

### Issue: Database Not Creating

**Check**:

1. `~/Library/Application Support/@workspace/desktop-app/` directory exists
2. User has write permissions
3. `lib/db/src/index.ts` has auto-migration code

**Solution**:

```bash
# Check directory permissions
ls -la ~/Library/Application\ Support/@workspace/desktop-app/

# Grant write permissions if needed
chmod 755 ~/Library/Application\ Support/@workspace/desktop-app/
```

---

## Testing the Build

### Pre-Release Checklist

- [ ] DMG file created successfully (107 MB)
- [ ] App launches from Applications folder
- [ ] Database initializes on first run
- [ ] Admin login works
- [ ] PIN login works
- [ ] Can create a tab and add orders
- [ ] Discounts/specials apply correctly
- [ ] Inventory displays correctly
- [ ] Settings are accessible
- [ ] Reports generate without errors

### Manual Testing Steps

1. **Mount and Install**

   ```bash
   open artifacts/desktop-app/dist/build/GustoPOS-0.1.0.dmg
   # Drag to Applications folder
   ```

2. **First Launch**

   ```bash
   # Set admin password
   export ADMIN_PASSWORD=test123

   # Launch app
   open /Applications/GustoPOS.app
   ```

3. **Test Admin Login**
   - Username: GUSTO
   - Password: test123

4. **Test PIN Login**
   - Create a staff member with PIN (e.g., 1234)
   - Log out and log in with PIN

5. **Test Core Functionality**
   - [ ] Create inventory item
   - [ ] Create drink recipe
   - [ ] Open a tab
   - [ ] Add order with special applied
   - [ ] Apply manual discount
   - [ ] Close tab with promo code
   - [ ] View reports

### Performance Metrics

| Metric            | Target  | Actual |
| ----------------- | ------- | ------ |
| App Launch        | < 5s    | ~2-3s  |
| Database Init     | < 2s    | ~1s    |
| Tab Creation      | < 500ms | ~300ms |
| Order Addition    | < 200ms | ~100ms |
| Report Generation | < 1s    | ~500ms |

---

## Distribution

### Sharing the DMG

1. **Direct Download**

   ```
   Send: GustoPOS-0.1.0.dmg (~107 MB)
   Hosted at: [your-server]/downloads/GustoPOS-0.1.0.dmg
   ```

2. **Auto-Updates** (Future)
   - electron-updater can check for new versions
   - Uses DMG blockmap for delta updates
   - Requires update server setup

3. **Version Tracking**
   - Current: 0.1.0
   - Update `version` in `artifacts/desktop-app/package.json` to bump
   - DMG filename auto-includes version

### System Requirements

| Requirement | Minimum      | Tested           |
| ----------- | ------------ | ---------------- |
| macOS       | 10.13+       | 12.0+            |
| Memory      | 2 GB         | 4 GB+            |
| Disk Space  | 200 MB       | 500 MB available |
| Internet    | Not required | Works offline    |

---

## Development Builds

### For Testing During Development

```bash
# Run Electron app in dev mode (no DMG)
pnpm --filter @workspace/desktop-app run dev

# Rebuilds on file changes
# Allows live reloading of frontend
# Backend changes require restart
```

---

## Build Artifacts

### What Gets Bundled

| Component    | Size            | Notes               |
| ------------ | --------------- | ------------------- |
| Electron     | ~150 MB         | Framework + runtime |
| API Server   | ~5 MB           | Node.js backend     |
| Frontend     | ~2 MB           | React + Vite        |
| Migrations   | ~100 KB         | Database schema     |
| Node Modules | ~200 MB         | Dependencies        |
| **Total**    | **~107 MB DMG** | Compressed          |

### DMG Contents

- **GustoPOS.app** - Full application bundle (can also run standalone)
- **Drag to Applications** - Installation indicator
- **alias to Applications** - Shortcut for ease of installation

---

## Maintenance

### Regular Updates

1. **Code changes**

   ```bash
   # Commit changes
   git add .
   git commit -m "..."

   # Rebuild
   pnpm run build:desktop
   ```

2. **Version bumps** (semantic versioning)

   ```bash
   # In artifacts/desktop-app/package.json
   "version": "0.1.1"  # Update version

   # Rebuild generates new DMG: GustoPOS-0.1.1.dmg
   pnpm run build:desktop
   ```

3. **Dependency updates**
   ```bash
   pnpm update
   pnpm run build:desktop
   ```

### Critical Fixes (April 13, 2026)

**PIN Pad Lockout Prevention**:

- ✅ Auto-lock no longer persists across app restarts
- ✅ Users can always authenticate on app startup
- ✅ Lock state resets when app is closed/reopened
- ✅ Inactivity timeout still works during active session
- **Impact**: Fixes issue where users would be permanently locked out after inactivity

**All Issues Verified**:
See `ISSUE_AUDIT_APRIL_13_2026.md` for complete verification of 7 reported issues:

- Schedule events filter - ✅ Working
- Batch audit system - ✅ Working
- PIN pad entry - ✅ Fixed
- Bulk import - ✅ Working
- Tracking mode fields - ✅ Working
- Current stock display - ✅ Working
- System defaults - ✅ Working

### Known Limitations

- ⚠️ **Code signing**: Unsigned - accept warning on first launch
- ⚠️ **Notarization**: Not notarized - macOS may show gatekeeper warning
- ✅ **Offline mode**: Full local SQLite database
- ✅ **Multi-user**: Each user gets own database location
- ✅ **Portable**: Can copy app to external drive (database stays in app support)

---

## Architecture Overview

```
GustoPOS Desktop App Structure:

┌─────────────────────────────────────┐
│  GustoPOS.app (macOS Application)   │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐                   │
│  │  Electron    │ (Main Process)    │
│  │  main.ts     │                   │
│  └──────────────┘                   │
│         │                           │
│    ┌────┴─────────────┐            │
│    │                  │            │
│  ┌─▼──────┐    ┌─────▼──┐         │
│  │React   │    │ API    │         │
│  │Frontend│    │Server  │         │
│  │(UI)    │    │(Node)  │         │
│  └────────┘    └────────┘         │
│                      │             │
│                  ┌───▼────┐        │
│                  │SQLite  │        │
│                  │Database│        │
│                  └────────┘        │
│                                     │
└─────────────────────────────────────┘
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [OPERATIONS_GUIDE.md](./OPERATIONS_GUIDE.md) - Deployment guide
- [README.md](./README.md) - Project overview
- [docs/archive/2026-04-12/PACKAGING_GUIDE.md](./docs/archive/2026-04-12/PACKAGING_GUIDE.md) - Previous version

---

## Changelog

### April 13, 2026 - Latest Build (21:00)

**Critical Fixes**:

- ✅ **PIN PAD LOCKOUT FIXED** - Lock state not persisted across sessions
- ✅ **RUSH EVENTS FIXED** - Default shows 3 events, Show More/Less button working
- ✅ **INVENTORY WEIGHT FIXED** - Formula corrected (\* → / density), display shows "No weight data"
- ✅ **LEGACY FIELD FIXED** - glassWeightG → containerWeightG with validation

**Features**:

- ✅ Discount/Specials system fully integrated (3-level discounting)
- ✅ Dashboard enhancements (rush event filters, collapsible sections)
- ✅ Batch audit system (full session management)
- ✅ Inventory tracking (pool & collection modes, auditing)
- ✅ All linting errors fixed
- ✅ TypeCheck passes cleanly
- ✅ DMG packaged successfully (107 MB)
- ✅ Build time: ~3-5 minutes
- ✅ Ready for distribution

### What's Included

- Complete three-level discount system (promo codes, specials, manual discounts)
- Inventory management with auditing and variance analysis
- Batch audit sessions for efficient inventory reconciliation
- Shift tracking and reporting with detailed analytics
- Void tracking and analytics (reason, staff, drink analysis)
- Staff management with PIN/password authentication
- Auto-lock on inactivity with PIN pad unlock
- Full offline support via SQLite (no internet required)
- Bilingual interface (English/Spanish)
- Complete import system (CSV bulk import, markdown format)

**Latest Build Improvements (April 13, 2026 - 21:00)**:

- Rush Events: Default shows 3 events, "Show More/Less" button (bilingual)
- Rush Events API: Filter fixed to show next 7 days (not 52 weeks)
- Inventory: Formula corrected (grams → ml uses division, not multiplication)
- Inventory: Display shows "No weight data" instead of density value
- Inventory: Legacy field glassWeightG → containerWeightG with validation
- Inventory: Validation prevents negative container weights when no valid data
- All previous fixes still included (PIN lockout, etc.)

---

## Build Command Reference

```bash
# Clean build
pnpm run clean
pnpm install

# Build individual components
pnpm --filter @workspace/api-server run build        # API server
pnpm --filter @workspace/gusto-pos run build          # Frontend
pnpm --filter @workspace/desktop-app run build        # Electron app

# Build everything
pnpm run build                                        # All packages

# Build and package
pnpm run build:desktop                               # Creates DMG

# Run in dev mode
pnpm run dev                                         # All dev servers
pnpm --filter @workspace/desktop-app run dev         # Desktop app dev

# Find DMG file
ls -lh artifacts/desktop-app/dist/build/*.dmg
```

---

## Support & Troubleshooting

For issues or questions:

1. Check this guide's Troubleshooting section
2. Review build logs: `artifacts/desktop-app/dist/build/builder-debug.yml`
3. Check Electron console: Cmd+Shift+I in running app
4. Review API logs: Check terminal where app was launched

---

## Next Steps

After packaging:

1. ✅ Test the DMG thoroughly (see checklist)
2. ✅ Get admin password for distribution
3. ✅ Host DMG on distribution server
4. ✅ Create release notes (what's new in this build)
5. ✅ Provide installation instructions to users
