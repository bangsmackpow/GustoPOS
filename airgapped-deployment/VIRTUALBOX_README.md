# VirtualBox Appliance - Complete Documentation Index

## 📚 Documentation Structure

Start with these in order:

### 1. **VIRTUALBOX_QUICKSTART.md** ⭐ START HERE
One-page reference with installation steps and common commands.
- Pre-flight checklist
- Installation (5 minutes)
- First-time setup
- Daily commands
- Quick troubleshooting

**Read time**: 5 minutes | **Action**: Check you have requirements

### 2. **VIRTUALBOX_SETUP.md** - Installation Guide
Detailed step-by-step installation with troubleshooting.
- System requirements
- Download and import
- Network configuration
- First-time setup
- Accessing the app
- SSL certificate explanation
- Detailed troubleshooting

**Read time**: 15 minutes | **Action**: Install and configure VM

### 3. **VIRTUALBOX_USAGE.md** - Daily Operations (MOST IMPORTANT)
How to use GustoPOS daily, manage containers, access data.
- Quick start (morning routine)
- Common tasks
- Network troubleshooting
- Storage & cleanup
- Performance tips
- Database access
- Emergency commands
- Advanced configuration

**Read time**: 30 minutes (reference document) | **Action**: Bookmark this

### 4. **VIRTUALBOX_MAINTENANCE.md** - Advanced Administration
Backups, recovery, database maintenance, monitoring.
- Backup & recovery strategies
- Database optimization
- Storage management
- Updating GustoPOS
- VM snapshots
- Monitoring & alerting
- Common issues & fixes
- Performance tuning

**Read time**: 20 minutes (reference document) | **Action**: Understand backup strategy

### 5. **VIRTUALBOX_DEPLOYMENT_SUMMARY.md** - Technical Overview
High-level architecture and comparison with other approaches.
- Why VirtualBox
- What's included
- Architecture diagram
- Security considerations
- Building the image yourself
- Future enhancements

**Read time**: 10 minutes | **Action**: Understand the design

---

## 🚀 Quick Links

### Getting Started
- First-time setup → **VIRTUALBOX_QUICKSTART.md**
- Installation issues → **VIRTUALBOX_SETUP.md** (Troubleshooting section)
- Using the app daily → **VIRTUALBOX_USAGE.md**

### Operations & Maintenance
- Backing up data → **VIRTUALBOX_MAINTENANCE.md** (Backup section)
- Database access → **VIRTUALBOX_USAGE.md** (Database section)
- Performance issues → **VIRTUALBOX_USAGE.md** (Performance section)
- Restoring data → **VIRTUALBOX_MAINTENANCE.md** (Recovery section)

### Administration
- System resources → **VIRTUALBOX_SETUP.md** (System Requirements)
- Network setup → **VIRTUALBOX_SETUP.md** (Port Forwarding)
- Database maintenance → **VIRTUALBOX_MAINTENANCE.md** (Database Maintenance)
- Disaster recovery → **VIRTUALBOX_MAINTENANCE.md** (Disaster Recovery)

### Troubleshooting
- Can't access app → **VIRTUALBOX_SETUP.md** (Troubleshooting)
- SSL warnings → **VIRTUALBOX_SETUP.md** (SSL Certificate Warning)
- Performance issues → **VIRTUALBOX_USAGE.md** (Performance Tips)
- Database errors → **VIRTUALBOX_MAINTENANCE.md** (Common Issues)

---

## 📋 Checklist for First-Time Users

### Pre-Installation
- [ ] Have VirtualBox 6.0+ installed (download if needed)
- [ ] Check virtualization is enabled in BIOS (VT-x or AMD-V)
- [ ] Have at least 4 GB RAM available
- [ ] Have at least 20 GB free disk space
- [ ] Read **VIRTUALBOX_QUICKSTART.md**

### Installation (15 minutes)
- [ ] Download `gustopos-appliance-v1.0.ova` from GitHub Releases
- [ ] Open VirtualBox → File → Import Appliance
- [ ] Select the .ova file
- [ ] Click Import and wait
- [ ] Start the VM

### First-Time Setup (10 minutes)
- [ ] Login to VM (no password needed)
- [ ] Run `gustopos-init`
- [ ] Wait for image pulls to complete
- [ ] Verify no errors in output

### First Access (5 minutes)
- [ ] Run `gustopos-start`
- [ ] Check logs: `gustopos-logs`
- [ ] Find your IP: `ip addr show eth1`
- [ ] Open browser to https://192.168.56.X
- [ ] Accept SSL warning
- [ ] Login with admin credentials
- [ ] ✅ Success!

---

## 🔧 Common Tasks

### Every Day
```bash
gustopos-start          # Morning: start the app
gustopos-logs           # Check if running
# ... use app all day ...
gustopos-stop           # Evening: stop the app
```

### Every Week
```bash
gustopos-backup         # Create a backup
```

### Before Major Changes
```bash
# In VirtualBox: Machine → Take Snapshot
# Name it something like "Before Database Migration"
# Make your changes
# If something goes wrong: Revert to Snapshot
```

### Emergency Recovery
```bash
gustopos-restore <timestamp>    # Restore from backup
```

---

## 📊 File Sizes & Performance

### Image Size
- **Download size**: ~500 MB (.ova file)
- **Expanded size**: ~5 GB (when running)

### Typical Performance
- **Boot time**: 30-60 seconds
- **GustoPOS startup**: 10-15 seconds
- **Page load time**: 1-2 seconds (normal)
- **Backup time**: 1-2 minutes
- **Restore time**: 2-3 minutes

### Storage Usage
- **Fresh database**: ~50 MB
- **After 1 month**: ~200-300 MB
- **Each backup**: ~50-100 MB
- **Keep**: Last 5-10 backups = 500 MB max

---

## 🆘 Getting Help

### In the VM
```bash
gustopos-help           # Show all commands and help
gustopos-logs           # View real-time logs
docker ps               # Check running containers
df -h                   # Check disk space
```

### In Documentation
- Search for your issue in **VIRTUALBOX_USAGE.md** first (most common Q&As)
- Check **VIRTUALBOX_MAINTENANCE.md** for advanced issues
- Review **VIRTUALBOX_SETUP.md** for installation issues

### Online
- GitHub Issues: [GustoPOS/issues](https://github.com/bangsmackpow/GustoPOS/issues)
- Include:
  - VirtualBox version
  - Host OS (Windows/Mac/Linux)
  - VM allocation (CPU/RAM)
  - Error message / screenshot
  - Output from `gustopos-logs`

---

## 📝 Document Purposes

| Document | Purpose | Audience |
|----------|---------|----------|
| QUICKSTART | One-page reference | Everyone |
| SETUP | Installation guide | First-time users |
| USAGE | Day-to-day operations | All users |
| MAINTENANCE | Backups & advanced | Admins |
| SUMMARY | Technical architecture | Architects, Developers |

---

## 🔐 Security Notes

1. **Self-signed SSL** = Normal browser warning on first visit. Click "Proceed".
2. **Only accessible locally** = By design (not exposed to internet).
3. **Always backup** = Before making major changes.
4. **Strong passwords** = Use strong admin password in .env.
5. **Regular updates** = `docker-compose pull` before critical updates.

---

## 🎓 Learning Path

**Beginner**: Just want to run it
1. Read QUICKSTART
2. Install per SETUP
3. Daily use per USAGE

**Intermediate**: Want to understand it
1. Read all above
2. Read MAINTENANCE
3. Try backup/restore procedures

**Advanced**: Want to customize/rebuild it
1. Read all documents
2. Understand packer-virtualbox.pkr.hcl
3. Build your own variant

---

## ✅ Success Criteria

You know you're set up correctly when:
- ✅ VM boots in <60 seconds
- ✅ `docker ps` shows 4-5 running containers
- ✅ https://192.168.56.X loads in browser
- ✅ SSL certificate warning appears (normal)
- ✅ Can login with admin credentials
- ✅ Can create a test order
- ✅ `gustopos-backup` completes successfully
- ✅ `gustopos-logs` shows no errors

---

## 📞 Support

For help:
1. Check relevant documentation section above
2. Run `gustopos-logs` and look for errors
3. Try `gustopos-help` in the VM
4. If stuck: Open GitHub issue with logs attached

---

**Version**: 1.0.0 | **Last Updated**: 2026-04-06 | **Status**: Ready for Production

