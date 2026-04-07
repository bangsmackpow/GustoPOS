# VirtualBox Appliance - Maintenance Guide

## Backup & Recovery

### Creating Backups

**Automated backup every day** (recommended):

```bash
# Manual backup anytime
gustopos-backup

# Creates backup in /data/backups/ with timestamp
```

This backs up:
- SQLite database file (gusto.db)
- Application logs
- Metadata file

**File size**: Typically 10-50 MB per backup (small!)

### Backup Locations

```
/data/backups/
├── gustopos_backup_20260406_160000.db       (database file)
├── gustopos_backup_20260406_160000-logs.tar.gz (logs)
└── gustopos_backup_20260406_160000.meta     (metadata)
```

### Listing Available Backups

```bash
# List all backups
ls -lh /data/backups/

# Show backup metadata
cat /data/backups/gustopos_backup_20260406_160000.meta
```

### Restoring from Backup

**Simple restore**:
```bash
# See available backups
gustopos-restore

# Restore specific backup
gustopos-restore 20260406_160000
```

**Manual restore** (if gustopos-restore doesn't work):
```bash
# 1. Stop containers
gustopos-stop

# 2. Restore the database file
cp /data/backups/gustopos_backup_20260406_160000.db /data/db/gusto.db

# 3. Start everything
gustopos-start
```

---

## Database Maintenance (SQLite)

### Health Check

```bash
# Connect to SQLite inside the API container
docker exec -it gustopos-api sqlite3 /app/data/gusto.db

# Check table sizes
SELECT name, sum(pgsize)/1024.0/1024.0 as size_mb 
FROM dbstat 
GROUP BY name 
ORDER BY size_mb DESC;

# Exit
.quit
```

### Optimize Database (Monthly)

```bash
# Connect
docker exec -it gustopos-api sqlite3 /app/data/gusto.db

# Vacuum (reclaims unused space)
VACUUM;

# Reindex (rebuilds indexes)
REINDEX;

# .quit to exit
```

---

## Storage Management

### Check Current Usage

```bash
# Total disk
df -h /

# By directory
du -sh /data/*

# Database size
du -sh /data/db/

# Logs size
du -sh /data/logs/

# Backups size
du -sh /data/backups/
```

### Common Sizes (for reference)

- **Fresh database**: ~1-5 MB
- **After 1 month of use**: ~50-100 MB
- **After 1 year of use**: ~500 MB - 1 GB
- **Each backup**: ~10-50 MB

### If Running Low on Disk Space

1. **Delete old backups** (keep last 3-5):
   ```bash
   # List old backups
   find /data/backups -name "*.meta" -mtime +90

   # Delete backups older than 90 days
   find /data/backups -name "gustopos_backup_*" -mtime +90 -delete
   ```

2. **Archive old logs**:
   ```bash
   # Compress logs older than 30 days
   find /data/logs -name "*.log" -mtime +30 -exec gzip {} \;

   # Move to archive
   tar -czf /data/backups/logs_archive_$(date +%Y%m).tar.gz /data/logs/
   rm -rf /data/logs/*
   ```

---

## Updating GustoPOS

### Check for Updates

```bash
# Pull latest images from registry (requires internet)
docker-compose -f /etc/gustopos/docker-compose.yml pull
```

### Update Procedure

```bash
# 1. Create a backup
gustopos-backup

# 2. Stop containers
gustopos-stop

# 3. Pull latest images
docker-compose -f /etc/gustopos/docker-compose.yml pull

# 4. Start with new images
gustopos-start

# 5. Wait for startup
sleep 15

# 6. Check logs for errors
gustopos-logs | grep -i error
```

---

## VM Snapshots (Point-in-Time Recovery)

### Create a Snapshot

Before doing anything risky:
```bash
# Stop containers
gustopos-stop

# In VirtualBox menu:
# Machine → Take Snapshot → Give it a name
```

### Restore to Snapshot

```bash
# In VirtualBox menu:
# Machine → Snapshots → Select snapshot → Restore
# VM will revert to that exact point in time
```

**Use cases:**
- Before major database changes
- Before significant configuration changes
- Before upgrading GustoPOS
- Testing purposes

---

## Monitoring & Alerting

### Monitor Disk Space

```bash
# Create a monitoring script
cat > /usr/local/bin/check-disk-space << 'EOF'
#!/bin/sh
USED=$(df /data | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $USED -gt 80 ]; then
  echo "WARNING: Disk usage is ${USED}%"
fi
EOF

chmod +x /usr/local/bin/check-disk-space
```

---

## Common Issues & Fixes

### Database Corruption (SQLite)

```bash
# Integrity check
docker exec -it gustopos-api sqlite3 /app/data/gusto.db "PRAGMA integrity_check;"

# If corrupted:
# 1. Try to recover
docker exec -it gustopos-api sqlite3 /app/data/gusto.db ".recover" > recovery.sql
# 2. Or restore from backup
gustopos-restore <timestamp>
```

### Disk Full Errors

```bash
# Immediate action:
# 1. Stop containers
gustopos-stop

# 2. Clean old backups
find /data/backups -name "gustopos_backup_*" -mtime +30 -delete

# 3. Compress logs
gzip /data/logs/*.log

# 4. Restart
gustopos-start
```

---

## Disaster Recovery Plan

### Step 1: Backup Offsite
```bash
# Copy latest backup to external storage (USB/Cloud)
# Backups are in /data/backups/
```

### Step 2: Document Configuration
```bash
# Save your configuration
cp /etc/gustopos/.env ~/gustopos-config-backup.txt
```

---

## Support & Documentation

For detailed help:
- `gustopos-help` - Quick reference
- `gustopos-logs` - View errors
- VIRTUALBOX_SETUP.md - Initial setup
- VIRTUALBOX_USAGE.md - Daily operations
