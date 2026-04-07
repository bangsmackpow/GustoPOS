# VirtualBox Appliance - Quick Start (One-Pager)

## Pre-Flight Checklist
- ☐ VirtualBox 6.0+ installed
- ☐ 4 GB RAM available
- ☐ 20 GB free disk space
- ☐ Virtualization enabled in BIOS (VT-x / AMD-V)

## Installation (5 minutes)

```bash
# 1. Download gustopos-appliance-vX.X.ova from GitHub Releases
# 2. Open VirtualBox → File → Import Appliance
# 3. Select the .ova file → Click Import
# 4. Start the VM (double-click)
# 5. Wait for login prompt (~30 sec)
```

## First-Time Setup (1 minute)

```bash
# At the login prompt (no password, just press Enter or type 'root'):
gustopos-init

# This creates SSL certificates and .env. 
# Images are already pre-pulled in the build!
```

## Start Using It

```bash
# 1. Start GustoPOS (usually auto-starts after init)
gustopos-start

# 2. Wait 10-15 seconds
gustopos-logs

# 3. Find your IP
ip addr show eth1 | grep "inet " | awk '{print $2}' | cut -d/ -f1

# 4. Open browser to: https://192.168.56.X
# 5. Accept SSL warning (normal)
# 6. Login with admin credentials (admin@gustopos.local / 5080)
```

## Daily Commands

| Task | Command |
|------|---------|
| Start | `gustopos-start` |
| Stop | `gustopos-stop` |
| View Logs | `gustopos-logs` |
| Backup | `gustopos-backup` |
| Help | `gustopos-help` |

## Common Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't access app | Check IP: `ip addr show eth1` |
| SSL warning | Click "Proceed" (normal for self-signed) |
| Slow performance | Stop VM → Settings → ↑ RAM to 4GB |
| Disk full | Delete old backups: `rm /data/backups/gustopos_backup_*-*` |
| App won't start | Check logs: `gustopos-logs` |

## Backup & Restore

```bash
# Backup (anytime)
gustopos-backup

# List backups
ls -1 /data/backups/gustopos_backup_*.meta

# Restore (emergency only)
gustopos-restore 20260406_160000
```

## Useful Paths

```
/etc/gustopos/.env           Configuration
/etc/gustopos/ssl/           SSL certificates
/data/db/gusto.db            Database file
/data/logs/                  Application logs
/data/backups/               Backups
```

## Advanced (SQLite)

```bash
# Connect to SQLite
docker exec -it gustopos-api sqlite3 /app/data/gusto.db

# Common queries
.tables                  # List tables
SELECT COUNT(*) FROM drinks;
.quit                    # Exit
```

## Get Help

- **In VM**: `gustopos-help`
- **Logs**: `gustopos-logs | grep error`
- **Documentation**: Read VIRTUALBOX_USAGE.md

---

## ⚠️ Important Notes

1. **Self-signed SSL is normal** - You'll get browser warnings, that's expected
2. **Default IP is 192.168.56.X** - Only accessible from your computer by default
3. **Data is persistent** - All your drinks, tabs, and settings stay in /data/db/
4. **Always backup before major changes** - `gustopos-backup`
5. **Check disk space monthly** - `df -h`

---

**Version**: 1.0 | **Updated**: 2026-04-06 | **Next**: Read VIRTUALBOX_USAGE.md
