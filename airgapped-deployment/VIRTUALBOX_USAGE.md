# VirtualBox Appliance - Daily Usage Guide

## Quick Reference

```bash
gustopos-help       # Show all commands
gustopos-init       # First-time setup (SSL, .env, images)
gustopos-start      # Start containers
gustopos-stop       # Stop containers (data preserved)
gustopos-logs       # View real-time logs
gustopos-backup     # Create a backup
gustopos-restore    # Restore from backup
```

## Starting Your Day

### 1. Boot the VM
- Open VirtualBox
- Double-click the GustoPOS Appliance VM
- Wait 30 seconds for Alpine Linux to boot
- You should see a login prompt

### 2. Start GustoPOS
The GustoPOS service is configured to start automatically on boot. 
If it's not running, or you stopped it manually:
```bash
gustopos-start
```

### 3. Wait for containers to be ready
```bash
gustopos-logs | grep "Server listening"
```

Takes about 10-15 seconds.

### 4. Access in your browser
```
https://192.168.56.X  (replace X with your VM's IP)
```

Find your IP with:
```bash
ip addr show eth1 | grep "inet " | awk '{print $2}' | cut -d/ -f1
```

### 5. Login with your credentials
Default or whatever you set in `/etc/gustopos/.env`

---

## Common Tasks

### View Real-Time Logs

```bash
# All services
gustopos-logs

# Just the API server
gustopos-logs api

# Just the POS app
gustopos-logs gusto-pos

# Follow errors only
gustopos-logs | grep -i error
```

### Restart a Specific Service

```bash
# Stop everything
gustopos-stop

# Start everything
gustopos-start

# Or restart individual containers
docker restart gustopos-api
docker restart gustopos-frontend
```

### Check System Resources

```bash
# View running containers
docker ps

# View detailed container info
docker inspect gustopos-api

# Live resource usage (CPU, Memory)
docker stats

# Disk space
df -h
```

### Access the Database Directly (SQLite)

```bash
# Connect to SQLite interactively (inside the API container)
docker exec -it gustopos-api sqlite3 /app/data/gusto.db

# Example queries
.tables                # List all tables
SELECT COUNT(*) FROM drinks;  # Count drinks
.quit                  # Exit
```

### Export Data for Analysis

```bash
# Copy database file to your current directory
cp /data/db/gusto.db ./gusto_backup.db

# Or export to SQL dump
docker exec -it gustopos-api sqlite3 /app/data/gusto.db ".dump" > backup.sql
```

### View Application Logs from Storage

```bash
# View directly
docker logs gustopos-api --tail 100
```

---

## Network Troubleshooting

### Can't reach the app?

```bash
# 1. Check if containers are running
docker ps

# 2. Check if API is listening
docker exec gustopos-api netstat -tlnp | grep 3000

# 3. Check your VM IP
ip addr show eth1

# 4. Check if firewall is blocking (unlikely in appliance)
rc-service iptables status
```

### Getting SSL certificate errors?

This is **normal and expected**. The appliance uses self-signed SSL.

1. Click "Advanced" in the browser warning
2. Click "Proceed to 192.168.56.X" (or similar)
3. The warning won't appear again once you accept

---

## Storage & Cleanup

### Check disk usage

```bash
# Total disk usage
df -h

# Database size
du -sh /data/db/

# Logs size
du -sh /data/logs/

# Backup size
du -sh /data/backups/
```

### Database maintenance

```bash
# Connect to database
docker exec -it gustopos-api sqlite3 /app/data/gusto.db

# Vacuum and optimize
VACUUM;
ANALYZE;

# .quit to exit
```

---

## Performance Tips

### If the VM is slow:

1. **Allocate more RAM** (if you have it):
   - Shutdown VM: `gustopos-stop && sleep 5`
   - Exit the VM (close the window)
   - VirtualBox Settings → Memory → Increase to 4-6 GB
   - Restart VM

2. **Reduce background noise**:
   - Close other apps on host
   - Don't run other VMs
   - Use SSD instead of HDD

---

## Ending Your Day

### Option 1: Suspend VM (Recommended)
Choose "Save the machine state" when closing the window.

**Pros**: Fast to resume next time, data preserved
**Cons**: Uses more host disk space while saved

### Option 2: Shut Down VM
```bash
# From VM console
poweroff
```

### Option 3: Take a Snapshot (Before major changes)
From VirtualBox: Machine → Take Snapshot. Use snapshots to safely experiment.

---

## Emergency Commands

### Everything is broken, start over
```bash
# DESTRUCTIVE - erases all data
rm -rf /data/db/*
rm -rf /etc/gustopos/.env
gustopos-init
gustopos-start
```

### Check system health
```bash
# Show kernel messages
dmesg | tail -50

# Check service status
rc-status

# Check Docker daemon
rc-service docker status
```

---

## Getting Help

From inside the VM:
```bash
gustopos-help    # Quick reference
gustopos-logs    # View errors
docker ps        # Check running services
```

Check logs for specific errors:
```bash
gustopos-logs 2>&1 | grep -i "error\|fail\|exception"
```

---

## Advanced: Custom Configuration

### Change admin PIN
```bash
# Edit .env
vi /etc/gustopos/.env

# Look for: ADMIN_PIN=...
# Change it, then restart
gustopos-stop && gustopos-start
```

---

## Useful Commands Reference

```bash
# Container management
docker ps                           # List running containers
docker logs [container]             # View container logs
docker restart [container]          # Restart a container
docker exec -it [container] /bin/sh # Shell into container

# Database (SQLite)
docker exec -it gustopos-api sqlite3 /app/data/gusto.db

# System info
hostname                            # VM name
ip addr show                        # Network info
df -h                               # Disk usage
free -h                             # RAM usage
top                                 # Process monitor (Ctrl+C to exit)
```

---

For more detailed help, see:
- **VIRTUALBOX_SETUP.md** - Installation and first setup
- **VIRTUALBOX_MAINTENANCE.md** - Backups and maintenance
