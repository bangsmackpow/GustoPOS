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
- PostgreSQL database (SQL dump)
- Application logs
- Metadata file

**File size**: Typically 50-100 MB per backup (small!)

### Backup Locations

```
/data/backups/
├── gustopos_backup_20260406_160000.sql      (database dump)
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

# 2. Start just the database
docker-compose -f /etc/gustopos/docker-compose.yml up -d postgres
sleep 5

# 3. Restore the database
docker exec gustopos-postgres psql -U gustopos -d gustopos < /data/backups/gustopos_backup_20260406_160000.sql

# 4. Start everything
docker-compose -f /etc/gustopos/docker-compose.yml up -d
```

### Backing Up to External Storage

**Copy backups to your host computer**:

From your host:
```bash
# Copy from VM to host
VBoxManage guestcontrol <VM_UUID> copy-from /data/backups/gustopos_backup_*.sql \
  --target-directory ~/.gustopos-backups --recursive

# Or manually:
# 1. Set up shared folder in VirtualBox
# 2. Mount in VM: mount -t vboxsf shared /mnt
# 3. Copy: cp /data/backups/* /mnt/
```

**Automatic cloud backup** (optional):
```bash
# Install in VM
apk add rclone

# Configure for your cloud service (AWS, Google Drive, etc.)
rclone config

# Add to crontab for daily backup
# 0 2 * * * /usr/local/bin/gustopos-backup && rclone sync /data/backups/ cloud:gustopos-backups/
```

---

## Database Maintenance

### Daily Health Check

```bash
# Connect to database
docker exec -it gustopos-postgres psql -U gustopos -d gustopos

# Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Exit
\q
```

### Optimize Database (Monthly)

```bash
# Connect
docker exec -it gustopos-postgres psql -U gustopos -d gustopos

# Analyze and vacuum
ANALYZE;
VACUUM;
REINDEX DATABASE gustopos;

# Check for unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

\q
```

### Export Database for Archival

```bash
# Full dump with compression
docker exec gustopos-postgres pg_dump -U gustopos -d gustopos -Fc | gzip > gustopos_archive_$(date +%Y%m%d).sql.gz

# Compressed size: ~20-30 MB
# Uncompressed size: ~100-200 MB
```

### Restore from Archive Dump

```bash
# Decompress and restore
gunzip -c gustopos_archive_20260406.sql.gz | docker exec -i gustopos-postgres psql -U gustopos -d gustopos

# Monitor progress
docker exec gustopos-postgres psql -U gustopos -d gustopos -c "SELECT pid, query FROM pg_stat_activity WHERE query NOT LIKE '%idle%';"
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

- **Fresh database**: ~50 MB
- **After 1 month of use**: ~200-300 MB
- **After 1 year of use**: ~1-2 GB
- **Each backup**: ~50-100 MB

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

3. **Increase VM disk size**:
   - Stop VM: `gustopos-stop`
   - Close VirtualBox window
   - VirtualBox → Settings → Storage → Select disk → "Resize Disk"
   - Restart VM

### Database Cleanup (Advanced)

```bash
# Remove rows older than 30 days from transaction log (if applicable)
docker exec -it gustopos-postgres psql -U gustopos -d gustopos << EOF
DELETE FROM transaction_log WHERE created_at < NOW() - INTERVAL '30 days';
VACUUM;
EOF
```

---

## Updating GustoPOS

### Check for Updates

```bash
# Pull latest images from registry
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
docker-compose -f /etc/gustopos/docker-compose.yml up -d

# 5. Wait for startup
sleep 15

# 6. Check logs for errors
gustopos-logs | grep -i error
```

### Rollback If Update Failed

```bash
# Option 1: Restore from backup
gustopos-restore <backup_timestamp>

# Option 2: Use Docker layers (if you just started)
gustopos-stop
docker-compose -f /etc/gustopos/docker-compose.yml down
docker-compose -f /etc/gustopos/docker-compose.yml up -d --pull never
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

### Set Up Log Rotation

```bash
# Configure log rotation
vi /etc/gustopos/docker-compose.yml

# Add logging section to each service:
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Monitor Disk Space

```bash
# Create a monitoring script
cat > /usr/local/bin/check-disk-space << 'EOF'
#!/bin/sh
USED=$(df /data | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $USED -gt 80 ]; then
  echo "WARNING: Disk usage is ${USED}%"
  # Trigger alert (email, etc.)
fi
EOF

chmod +x /usr/local/bin/check-disk-space

# Add to crontab (every 6 hours)
# 0 */6 * * * /usr/local/bin/check-disk-space
```

### Real-Time Monitoring

```bash
# Watch resource usage
while true; do
  clear
  echo "=== GustoPOS Resource Usage ==="
  echo ""
  echo "Disk:"
  df -h /data | tail -1
  echo ""
  echo "Containers:"
  docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
  echo ""
  sleep 10
done
```

---

## Common Issues & Fixes

### Database Corruption

```bash
# Check database integrity
docker exec gustopos-postgres pg_database.fsm_clean

# If corrupted:
# 1. Create full backup
# 2. Drop database
# 3. Restore from backup

docker exec -it gustopos-postgres psql -U gustopos << EOF
DROP DATABASE gustopos;
CREATE DATABASE gustopos;
EOF

# Restore from backup
docker exec -i gustopos-postgres psql -U gustopos -d gustopos < backup.sql
```

### Database Locked

```bash
# See what's running
docker exec -it gustopos-postgres psql -U gustopos -d gustopos << EOF
SELECT pid, usename, query FROM pg_stat_activity WHERE state != 'idle';
EOF

# Kill long-running query
docker exec -it gustopos-postgres psql -U gustopos -d gustopos << EOF
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE pid <> pg_backend_pid() AND state = 'active';
EOF
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

# 5. Allocate more space to VM
```

---

## Performance Tuning

### PostgreSQL Configuration

```bash
# Edit PostgreSQL config
docker exec -it gustopos-postgres vi /var/lib/postgresql/data/postgresql.conf

# Key settings for 2GB VM:
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 32MB
maintenance_work_mem = 256MB
```

### Connection Pool Optimization

```bash
# Edit docker-compose.yml
vi /etc/gustopos/docker-compose.yml

# Add to postgres service:
environment:
  POSTGRES_INIT_ARGS: "-c max_connections=200"
```

---

## Scheduled Maintenance

### Cron Schedule (Optional)

```bash
# Edit root crontab
crontab -e

# Add these lines:
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/gustopos-backup

# Weekly database optimization (Sunday 3 AM)
0 3 * * 0 docker exec gustopos-postgres vacuum analyze

# Log rotation (daily at 4 AM)
0 4 * * * find /data/logs -name "*.log" -mtime +7 -delete
```

---

## Disaster Recovery Plan

### Step 1: Backup Offsite
```bash
# Copy latest backup to external storage
cp /data/backups/gustopos_backup_*.sql* ~/external-drive/
```

### Step 2: Document Configuration
```bash
# Save your configuration
cp /etc/gustopos/.env ~/documents/gustopos-config-$(date +%Y%m%d).txt
```

### Step 3: Test Recovery
```bash
# Monthly: test that your backups can restore
gustopos-restore <oldest_backup>
# Verify it works
# Restore from latest backup
gustopos-restore <latest_backup>
```

### Step 4: Recovery Time Objective (RTO)
- **Total recovery time**: ~5 minutes (restore backup + start containers)
- **Data loss**: Only data since last backup

---

## Support & Documentation

For detailed help:
- `gustopos-help` - Quick reference
- `gustopos-logs` - View errors
- VIRTUALBOX_SETUP.md - Initial setup
- VIRTUALBOX_USAGE.md - Daily operations
- VIRTUALBOX_CUSTOMIZATION.md - Advanced config
