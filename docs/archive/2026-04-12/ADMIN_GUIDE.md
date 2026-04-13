# GustoPOS Administrator Guide

**Version**: 2.0 (Beta)  
**Last Updated**: April 12, 2026

---

## Table of Contents

1. [System Administration Overview](#1-system-administration-overview)
2. [Initial Setup](#2-initial-setup)
3. [User Management](#3-user-management)
4. [System Configuration](#4-system-configuration)
5. [Backup & Disaster Recovery](#5-backup--disaster-recovery)
6. [Inventory Administration](#6-inventory-administration)
7. [Security](#7-security)
8. [Monitoring & Diagnostics](#8-monitoring--diagnostics)
9. [Maintenance](#9-maintenance)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. System Administration Overview

### 1.1 Admin vs Employee Roles

| Capability            | Admin | Employee |
| --------------------- | ----- | -------- |
| Manage staff accounts | ✅    | ❌       |
| Modify settings       | ✅    | ❌       |
| Access audit logs     | ✅    | ❌       |
| Clear inventory trash | ✅    | ❌       |
| Bulk import           | ✅    | ❌       |
| View all tabs         | ✅    | ✅       |
| Process orders        | ✅    | ✅       |
| Run reports           | ✅    | ✅       |

### 1.2 Admin Responsibilities

- Staff account creation and management
- System configuration
- Backup management
- Inventory oversight
- Troubleshooting
- End-of-night report review

---

## 2. Initial Setup

### 2.1 Environment Variables

When starting the API server, set these environment variables:

```bash
# Required
ADMIN_PASSWORD=your-secure-password

# Optional (with defaults)
ADMIN_USERNAME=GUSTO
ADMIN_PIN=0000
PORT=3000
DATABASE_URL=file:./gusto.db
```

### 2.2 First-Time Configuration

After first login:

1. **Update bar branding** (Settings → Branding)
   - Bar name
   - Bar icon

2. **Configure exchange rates** (Settings → Exchange Rates)
   - USD to MXN
   - CAD to MXN

3. **Set system defaults** (Settings → System Defaults)
   - Default serving size
   - Default bottle size
   - Default density

4. **Create staff accounts** (Settings → Staff)
   - Add all employees
   - Set PINs
   - Assign roles

5. **Import initial inventory** (Settings → Data Management)
   - Use bulk import for initial stock

---

## 3. User Management

### 3.1 Creating Staff Accounts

1. Navigate to **Settings** → **Staff**
2. Click **+ Add Staff**
3. Fill in details:

| Field      | Required | Description             |
| ---------- | -------- | ----------------------- |
| First Name | Yes      | Staff first name        |
| Last Name  | Yes      | Staff last name         |
| Email      | Yes      | Unique login identifier |
| PIN        | Yes      | 4-digit numeric PIN     |
| Role       | Yes      | admin or employee       |
| Language   | Yes      | en or es                |
| Active     | Yes      | Account status          |

4. Click **Save**

### 3.2 Editing Staff

- Click on staff member to edit
- All fields editable except email
- Leave password blank to keep current

### 3.3 Deactivating Staff

- Set **Active** toggle to OFF
- Deactivated staff cannot log in
- Historical data preserved

### 3.4 PIN Management

- Staff can reset their own PIN (future feature)
- Admin can reset via staff edit
- PINs are bcrypt hashed in database

### 3.5 Role Assignment

**Admin**: Full system access

- Create/edit/delete staff
- Modify all settings
- Access audit logs
- Clear trash
- Bulk import

**Employee**: Operational access

- Process tabs and orders
- View reports
- Basic inventory (view)
- Cannot modify system

---

## 4. System Configuration

### 4.1 Branding Settings

| Setting  | Location            | Description         |
| -------- | ------------------- | ------------------- |
| Bar Name | Settings → Branding | Displayed in header |
| Bar Icon | Settings → Branding | Visual identifier   |

### 4.2 Exchange Rates

| Setting   | Default | Update Frequency |
| --------- | ------- | ---------------- |
| USD → MXN | 17.50   | As needed        |
| CAD → MXN | 12.80   | As needed        |

Rates used for currency conversion in tabs.

### 4.3 System Defaults

Configure defaults applied to new inventory items:

| Setting             | Default | Description           |
| ------------------- | ------- | --------------------- |
| Alcohol Density     | 0.94    | g/ml for spirits      |
| Serving Size        | 44.36ml | Standard pour (1.5oz) |
| Bottle Size         | 750ml   | Standard bottle       |
| Units Per Case      | 1       | Beer case count       |
| Low Stock Threshold | 0       | Alert level           |
| Tracking Mode       | auto    | Pool/collection       |
| Audit Method        | auto    | Audit type            |
| Variance Warning    | 5%      | Alert threshold       |

### 4.4 Security Settings

| Setting          | Default   | Description        |
| ---------------- | --------- | ------------------ |
| PIN Lock Timeout | 5 minutes | Auto-lock duration |

### 4.5 Backup Settings

| Setting         | Default    | Description       |
| --------------- | ---------- | ----------------- |
| Auto Backup     | Enabled    | Automatic backups |
| Backup Interval | 15 minutes | Frequency         |
| Max Backups     | 5          | Retention count   |
| USB Backup      | Disabled   | External drive    |
| Litestream      | Disabled   | Cloud sync        |

---

## 5. Backup & Disaster Recovery

### 5.1 Auto-Backup

The system automatically creates backups:

- Every 15 minutes (configurable)
- On shift close
- Maximum 5 backups retained

Backup location: `./backups/` directory

### 5.2 Manual Backup

1. Go to **Settings** → **Backups**
2. Click **Create Backup Now**
3. Backup saved with timestamp

### 5.3 USB Backup

1. Enable **USB Backup** in settings
2. Insert formatted USB drive
3. System detects and writes backups

### 5.4 Litestream (Cloud)

1. Enable **Litestream** in settings
2. Configure S3-compatible endpoint
3. Credentials stored securely
4. Real-time WAL replication

### 5.5 Restoring from Backup

```bash
# Stop the application
# Replace current database with backup
cp backups/gusto-2026-04-12.db gusto.db
# Restart application
```

### 5.6 Backup Verification

Check backup integrity:

```bash
# Verify SQLite database
sqlite3 gusto.db "PRAGMA integrity_check;"
```

---

## 6. Inventory Administration

### 6.1 Bulk Import

Import inventory from CSV:

**CSV Format**:

```csv
name,type,baseUnitAmount,orderCost,currentStock,bottleSizeMl,fullBottleWeightG
Don Julio Tequila,spirit,750,450,3,750,1200
Corona Beer,beer,355,120,6,355,
```

**Import Process**:

1. Go to **Settings** → **Data Management**
2. Click **Import Ingredients**
3. Upload CSV
4. Map columns (if needed)
5. Select strategy:
   - **Update**: Replace existing
   - **Merge**: Keep existing, add new
   - **Skip**: Don't change existing
   - **Replace**: Delete all, import fresh
6. Review results
7. Confirm import

### 6.2 Inventory Trash

Deleted items go to trash:

- View count: **Settings** → check trash indicator
- Clear trash: Admin only, requires confirmation

### 6.3 Audit Oversight

1. Review **Variance Analysis** page regularly
2. Identify items with consistent variance
3. Investigate high variance (>5%)
4. Standardize counting procedures

### 6.4 System Defaults for Inventory

Set defaults in **Settings** → **System Defaults**:

- Default alcohol density
- Default serving size
- Default bottle size
- Default tracking mode

---

## 7. Security

### 7.1 Authentication

- **PIN Login**: 4-digit PIN with bcrypt hashing
- **Session**: JWT in httpOnly cookie, 7-day TTL
- **Rate Limiting**: Prevents brute force

### 7.2 Rate Limiting

| Endpoint       | Limit             |
| -------------- | ----------------- |
| PIN Login      | 5 attempts/minute |
| Admin Login    | 5 attempts/minute |
| Password Reset | 3 attempts/minute |

### 7.3 Data Security

- Local SQLite database
- No cloud sync (unless configured)
- Backup encryption: Not enabled by default

### 7.4 Audit Logging

All admin actions logged:

- Inventory changes
- Staff modifications
- Settings updates
- Tab closures

View logs: **Settings** → (future: Audit Logs)

---

## 8. Monitoring & Diagnostics

### 8.1 Health Checks

| Endpoint             | Purpose               |
| -------------------- | --------------------- |
| `GET /api/health`    | API status            |
| `GET /api/auth/user` | Authentication status |

### 8.2 Database Integrity

Run integrity check:

```bash
sqlite3 gusto.db "PRAGMA integrity_check;"
```

### 8.3 Log Files

| Location       | Content              |
| -------------- | -------------------- |
| Console        | API requests, errors |
| app_launch.log | Startup sequence     |

### 8.4 Common Diagnostics

**Check open tabs**:

```sql
SELECT * FROM tabs WHERE status = 'open';
```

**Check inventory stock**:

```sql
SELECT name, currentStock, reservedStock, currentBulk, currentPartial
FROM inventory_items;
```

**Check shift status**:

```sql
SELECT * FROM shifts WHERE status = 'active';
```

---

## 9. Maintenance

### 9.1 Regular Tasks

| Task                       | Frequency | Notes            |
| -------------------------- | --------- | ---------------- |
| Review end-of-night report | Daily     | Check variances  |
| Verify backups             | Weekly    | Test restoration |
| Clear inventory trash      | As needed | Free up space    |
| Update exchange rates      | Weekly    | Accurate totals  |
| Review low stock           | Daily     | Reorder supplies |

### 9.2 Database Maintenance

**Vacuum** (reclaim space):

```bash
sqlite3 gusto.db "VACUUM;"
```

**Analyze** (update statistics):

```bash
sqlite3 gusto.db "ANALYZE;"
```

### 9.3 Application Updates

1. Stop the application
2. Backup database
3. Pull latest code
4. Run migrations: `pnpm run migrate`
5. Restart application

---

## 10. Troubleshooting

### 10.1 Common Admin Issues

| Issue                 | Solution                                    |
| --------------------- | ------------------------------------------- |
| Can't log in as admin | Check ADMIN_PASSWORD environment variable   |
| Staff PIN not working | Reset via staff edit                        |
| Backup not working    | Check write permissions on backup directory |
| Database locked       | Restart API server                          |
| Import failing        | Check CSV format and encoding               |

### 10.2 Resetting Admin Password

```bash
# Stop the application
# Edit environment variable
ADMIN_PASSWORD=newpassword node dist/index.cjs
# Restart - admin password updated
```

### 10.3 Database Recovery

If database is corrupted:

1. Stop application
2. Restore from backup
3. Verify integrity: `sqlite3 db "PRAGMA integrity_check;"`
4. Restart application

### 10.4 Getting Help

When reporting issues, include:

- Steps to reproduce
- Expected vs actual behavior
- Error messages
- Screenshots (if applicable)
- Recent changes to system

---

## Appendix A: Database Schema Reference

### Core Tables

| Table                | Purpose         |
| -------------------- | --------------- |
| `users`              | Staff accounts  |
| `inventory_items`    | Inventory stock |
| `inventory_audits`   | Audit records   |
| `drinks`             | Menu items      |
| `recipe_ingredients` | Drink recipes   |
| `tabs`               | Customer tabs   |
| `orders`             | Tab orders      |
| `shifts`             | Work shifts     |
| `settings`           | System config   |
| `rushes`             | Event schedule  |
| `promo_codes`        | Discount codes  |
| `tax_rates`          | Tax categories  |
| `event_logs`         | Audit trail     |

### Key Fields

**Inventory Stock**:

- `currentBulk`: Full containers
- `currentPartial`: Open container amount
- `currentStock`: Total (calculated)
- `reservedStock`: Reserved by open tabs

**Order Tracking**:

- `voided`: Order voided flag
- `voidReason`: Reason for void
- `voidedByUserId`: Who voided

---

**End of Administrator Guide**
