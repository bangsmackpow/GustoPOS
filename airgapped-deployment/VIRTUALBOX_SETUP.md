# VirtualBox Appliance - Setup Guide

## Overview

The GustoPOS VirtualBox appliance is a pre-built Alpine Linux image that runs the complete GustoPOS stack locally on your laptop. No Docker installation required on the host—everything runs inside the VM.

**Perfect for:**
- Offline testing and development
- Demo/trial deployments
- Local backup and archive operations
- Running GustoPOS without internet connectivity

## System Requirements

### Minimum (Will work, but slow)
- **OS**: Windows 10/11, macOS, Linux
- **Virtualization**: VirtualBox 6.0 or newer
- **CPU**: 2 cores available
- **RAM**: 4 GB total available (2 GB for VM)
- **Disk**: 20 GB free space for the image

### Recommended (Better performance)
- **CPU**: 4+ cores available
- **RAM**: 8 GB total available (4 GB for VM)
- **Disk**: 30 GB free SSD space
- **Internet**: 500 MB for initial OVA download (one-time)

### Before You Start

1. **Update VirtualBox** to latest version
2. **Enable Virtualization** in BIOS/UEFI (VT-x on Intel, AMD-V on AMD)
3. **Allocate enough disk space** - the image grows as you use it
4. **Close unnecessary applications** to free up RAM

## Installation Steps

### Step 1: Download the Appliance

1. Go to [GustoPOS Releases](https://github.com/bangsmackpow/GustoPOS/releases)
2. Find the latest `gustopos-appliance-vX.X.ova` file (~500 MB)
3. Download it to a convenient location (e.g., `~/VirtualBox Images/`)

### Step 2: Import into VirtualBox

1. **Open VirtualBox**
2. **File → Import Appliance**
3. **Select the .ova file** you downloaded
4. **Review settings** (default = good for most users)
   - CPU: 2 cores
   - RAM: 2048 MB
   - Disk: 20 GB VMDK
5. **Click Import** and wait for completion (~2-3 minutes)

### Step 3: Configure Network (Optional but Recommended)

The appliance comes pre-configured with:
- **NAT adapter** (for internet access, if needed)
- **Host-only adapter** (for local access from your computer)

**Default network:**
- VM access: `https://192.168.56.X` (where X = your VM's IP)
- Port forwarding available if needed

### Step 4: Start the VM

1. **Right-click** the imported VM → **Settings** (optional: adjust RAM/CPU)
2. **Click Start** (or double-click the VM)
3. **Wait 30-60 seconds** for Alpine Linux to boot
4. **You should see a login prompt**

### Step 5: First-Time Setup

The VM is designed to be "auto-running", but on the very first boot, it needs to generate its local SSL certificates and configuration.

```bash
# From the VirtualBox console, login as root (no password required)
# Then run the setup script:

gustopos-init
```

This will:
- Generate unique SSL certificates
- Create the initial `.env` file
- Prepare the data directories

Setup takes **less than 1 minute** since images are pre-pulled in the build.

### Step 6: Start GustoPOS

The stack should start automatically after `gustopos-init`. To start it manually or restart:

```bash
gustopos-start
```

Wait 10-15 seconds for containers to start, then check logs:

```bash
gustopos-logs
```

You should see:
```
[Initialize] Admin user created: admin@gustopos.local
[API] Server listening on port 3000
```

### Step 7: Find Your VM's IP and Access the App

From the VM console:
```bash
ip addr show eth1
```

Look for a line like:
```
inet 192.168.56.X/24
```

Then in your **host computer's browser**, go to:
```
https://192.168.56.X
```

**Accept the self-signed SSL warning** (this is normal and expected).

### Step 8: Login

Use the credentials configured in `/etc/gustopos/.env`:

Default:
- **Email**: `admin@gustopos.local`
- **PIN**: `5080` (Check the .env file for ADMIN_PIN)

---

## Troubleshooting

### VM Won't Start
**Problem**: VirtualBox gives an error about "virtualization"
**Solution**: Enable VT-x/AMD-V in your computer's BIOS settings.

### Can't Access the App
**Problem**: Browser says `https://192.168.56.X` won't connect
**Solution**: 
1. Run `ip addr show eth1` to confirm the IP hasn't changed.
2. Run `docker ps` to ensure `gustopos-api` and `gustopos-frontend` are running.
3. Run `gustopos-logs` to check for application errors.

### Database Connection Error
**Problem**: App says "Cannot connect to database"
**Solution**: 
1. Check if the disk is full: `df -h`
2. Ensure `/data/db/gusto.db` exists and is writable.
3. Restart the stack: `gustopos-stop && gustopos-start`

### Performance is Slow
**Problem**: VM feels sluggish
**Solution**: Allocate more RAM (Settings → System → Motherboard → Base Memory).

## Next Steps

- Read **VIRTUALBOX_USAGE.md** for day-to-day operations
- Read **VIRTUALBOX_MAINTENANCE.md** for backups and updates
- Check **gustopos-help** for available commands
