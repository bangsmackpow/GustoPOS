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

# Just PostgreSQL
gustopos-logs postgres

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
docker restart gustopos-postgres
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

### Access the Database Directly

```bash
# Connect to PostgreSQL interactively
docker exec -it gustopos-postgres psql -U gustopos -d gustopos

# Example queries
\dt                    # List all tables
SELECT COUNT(*) FROM drinks;  # Count drinks
\q                     # Exit
```

### Export Data for Analysis

```bash
# Dump entire database to SQL file
docker exec gustopos-postgres pg_dump -U gustopos -d gustopos > backup.sql

# Dump specific table
docker exec gustopos-postgres pg_dump -U gustopos -t drinks -d gustopos > drinks.sql
```

### View Application Logs from Storage

```bash
# Logs are stored in containers, but you can export them
docker cp gustopos-api:/var/log . 

# Or view directly
docker logs gustopos-api --tail 100
```

### Restart After Crash

```bash
# Check what's running
docker ps -a

# Restart everything
docker-compose -f /etc/gustopos/docker-compose.yml up -d

# Watch the startup
gustopos-logs
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

### Accessing from another computer on the network?

1. Setup port forwarding (see VIRTUALBOX_SETUP.md)
   OR
2. Add the host computer's IP to CORS allowed origins:
   ```bash
   vi /etc/gustopos/.env
   # Edit CORS_ALLOWED_ORIGINS
   gustopos-stop && gustopos-start
   ```

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

### Clean up old logs (if disk is full)

```bash
# Archive logs older than 30 days
find /data/logs -name "*.log" -mtime +30 -exec gzip {} \;

# Delete very old logs (90+ days)
find /data/logs -name "*.log.gz" -mtime +90 -delete
```

### Database maintenance

```bash
# Connect to database
docker exec -it gustopos-postgres psql -U gustopos -d gustopos

# Analyze and vacuum (optimize)
ANALYZE;
VACUUM;

# \q to exit
```

---

## Performance Tips

### If the VM is slow:

1. **Allocate more RAM** (if you have it):
   - Shutdown VM: `gustopos-stop && sleep 5`
   - Exit the VM (close the window)
   - VirtualBox Settings → Memory → Increase to 4-6 GB
   - Restart VM

2. **Check disk performance**:
   ```bash
   # Read speed test
   dd if=/dev/zero of=testfile bs=1M count=100 oflag=direct
   ```
   Good: >100 MB/s, Acceptable: >20 MB/s

3. **Monitor resource usage**:
   ```bash
   docker stats
   ```
   If PostgreSQL is >2GB RAM, you may need to allocate more to VM

4. **Reduce background noise**:
   - Close other apps on host
   - Don't run other VMs
   - Use SSD instead of HDD

### If containers keep crashing:

1. Check logs: `gustopos-logs`
2. Look for "out of memory" or disk errors
3. Either:
   - Allocate more RAM to VM
   - Allocate more disk to VM
   - Delete old backups to free space

---

## Ending Your Day

### Option 1: Suspend VM (Recommended)
```bash
# Shutdown gracefully
gustopos-stop

# Then close the VirtualBox window
# Choose "Save the machine state" when prompted
```

**Pros**: Fast to resume next time, data preserved, minimal disk space used
**Cons**: Requires more disk space than shutdown

### Option 2: Shut Down VM

```bash
# From VM console
poweroff

# Or from VirtualBox menu: Machine → Close → Power Off
```

**Pros**: Minimal disk footprint, full clean shutdown
**Cons**: Takes longer to boot next time

### Option 3: Take a Snapshot (Before major changes)

```bash
# Stop containers first
gustopos-stop

# Then from VirtualBox: Machine → Take Snapshot
# Name it something like "Before Database Migration"
```

Use snapshots to safely experiment. You can always revert.

---

## Emergency Commands

### Everything is broken, start over

```bash
# DESTRUCTIVE - erases all data
docker-compose -f /etc/gustopos/docker-compose.yml down -v

# Start fresh
gustopos-init
gustopos-start
```

### Force stop everything

```bash
docker-compose -f /etc/gustopos/docker-compose.yml kill

# Clean up
docker system prune -f
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

### Change admin password
```bash
# Edit .env
vi /etc/gustopos/.env

# Look for: ADMIN_PASSWORD=...
# Change it, then restart
gustopos-stop && gustopos-start
```

### Configure email notifications
```bash
vi /etc/gustopos/.env

# Add/modify:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

gustopos-stop && gustopos-start
```

### Increase database size
```bash
# Find the volume
docker volume ls | grep postgres

# Inspect
docker volume inspect [volume_name]

# Or just allocate more disk to VM (it auto-grows)
```

---

## Useful Commands Reference

```bash
# Container management
docker ps                           # List running containers
docker ps -a                        # List all containers
docker logs [container]             # View container logs
docker restart [container]          # Restart a container
docker exec -it [container] /bin/sh # Shell into container

# Database
docker exec -it gustopos-postgres psql -U gustopos -d gustopos

# File transfers (host to VM)
docker cp file.txt [container]:/path/to/destination

# System info
hostname                            # VM name
ip addr show                        # Network info
df -h                               # Disk usage
free -h                             # RAM usage
top                                 # Process monitor (Ctrl+C to exit)

# Service management
rc-service docker status            # Docker daemon status
rc-service docker restart           # Restart Docker
```

---

For more detailed help, see:
- **VIRTUALBOX_SETUP.md** - Installation and first setup
- **VIRTUALBOX_MAINTENANCE.md** - Backups and maintenance
- **VIRTUALBOX_CUSTOMIZATION.md** - Advanced configuration
