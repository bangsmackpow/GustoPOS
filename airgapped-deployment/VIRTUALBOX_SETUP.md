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
- **Internet**: 500 MB for initial Docker image pull (one-time)

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

Once the VM is running, SSH into it or use VirtualBox console:

```bash
# From the VirtualBox console, login as root (no password required)
# Then run the setup script:

gustopos-init
```

This will:
- Generate SSL certificates
- Create configuration files
- Download Docker images
- Prepare the system

Setup takes **3-5 minutes** depending on internet speed.

### Step 6: Start GustoPOS

```bash
gustopos-start
```

Wait 10-15 seconds for containers to start, then check logs:

```bash
gustopos-logs
```

You should see:
```
[AdminLogin] Starting authentication service
[API] Server listening on port 3000
[POS] Frontend ready
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
- **Password**: Check the .env file

## Accessing via Port Forwarding (Optional)

If you want to access the appliance from your network (not just localhost):

### Windows/Mac Host:

1. **VirtualBox Settings** → **Network**
2. **NAT** adapter → **Port Forwarding**
3. **Add Rule:**
   - Name: `GustoPOS HTTPS`
   - Protocol: TCP
   - Host Port: `8443`
   - Guest Port: `443`
   - Guest IP: Leave blank (auto)
4. **OK** → **Apply**

Then access from any computer on your network:
```
https://localhost:8443  (from host computer)
https://<host-ip>:8443  (from another computer on network)
```

**Note:** You'll need to add the host computer's IP to CORS settings if accessing from other machines.

## Troubleshooting

### VM Won't Start

**Problem**: VirtualBox gives an error about "virtualization"

**Solution**:
1. Restart your computer
2. Enter BIOS/UEFI (usually F2, F10, or DEL on startup)
3. Find "Virtualization", "VT-x", or "AMD-V" setting
4. Enable it
5. Save and restart

### Can't Access the App

**Problem**: Browser says `https://192.168.56.X` won't connect

**Solution**:
1. Verify VM is running: `ip addr show eth1` (should show an IP)
2. Check if containers are running: `docker ps`
3. View logs for errors: `gustopos-logs | grep error`
4. Try a different IP: Run `ip addr show` to see all interfaces

### SSL Certificate Warning

**This is normal!** The appliance uses a self-signed certificate for security.

1. Click **Advanced**
2. Click **Proceed to 192.168.56.X** (or similar)

The warning won't reappear once you've accessed the site.

### Out of Disk Space

**Problem**: `No space left on device` error

**Solution**:
1. From host: Right-click VM → Settings → Storage
2. Select the disk
3. Resize it to a larger size (VirtualBox can grow VMDK files)
4. Inside VM, the filesystem will auto-expand

### Database Connection Error

**Problem**: App says "Cannot connect to database"

**Solution**:
1. Check if containers are running: `docker ps`
2. If PostgreSQL is down: `docker restart gustopos-postgres`
3. View database logs: `docker logs gustopos-postgres`
4. Verify data directory has space: `df -h /data/`

### Performance is Slow

**Problem**: VM feels sluggish

**Solution**:
1. Allocate more RAM: Shutdown VM → Settings → Increase to 4GB
2. Use SSD storage: VMDK on SSD is much faster than HDD
3. Reduce background apps on host computer
4. Check disk space: `df -h` (aim for >10GB free in VM)

## Next Steps

- Read **VIRTUALBOX_USAGE.md** for day-to-day operations
- Read **VIRTUALBOX_MAINTENANCE.md** for backups and updates
- Check **gustopos-help** for available commands

## Getting Help

Inside the VM:
```bash
gustopos-help      # Show all available commands
gustopos-logs      # View real-time logs
```

Online:
- GitHub Issues: [GustoPOS Issues](https://github.com/bangsmackpow/GustoPOS/issues)
- Documentation: [Full Guide](VIRTUALBOX_USAGE.md)
