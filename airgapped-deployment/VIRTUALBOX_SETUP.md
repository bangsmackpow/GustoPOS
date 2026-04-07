# VirtualBox Appliance - Setup Guide

## Overview

The GustoPOS VirtualBox appliance is a pre-built **Debian 12 (Bookworm)** image that runs the complete GustoPOS stack locally on your laptop. No Docker installation required on the host—everything runs inside the VM.

**Perfect for:**
- Standalone bars without internet (Airgapped)
- Offline testing and development
- Local backup and archive operations

## System Requirements

- **OS**: Windows 10/11, macOS, Linux
- **Virtualization**: VirtualBox 6.0 or newer
- **CPU**: 2+ cores available
- **RAM**: 4 GB total available (Appliance uses 2 GB)
- **Disk**: 20 GB free space (SSD recommended)

## Installation Steps

### Step 1: Download the Appliance
Find the latest `gustopos-appliance-vX.X.ova` file from the project releases.

### Step 2: Import into VirtualBox
1.  **Open VirtualBox**.
2.  **File → Import Appliance**.
3.  **Select the .ova file** and click **Import**.

### Step 3: Start the VM
1.  **Double-click** the imported VM.
2.  **Wait 30-60 seconds** for the login prompt.

### Step 4: First-Time Setup
Login to the VM console with:
- **User**: `gustopos`
- **Password**: `gustopos`

Then run the setup script:
```bash
gustopos-init
```
This generates your unique SSL certificates and creates the initial `.env` file. It takes less than a minute.

### Step 5: Access the App
From the VM console, find your IP:
```bash
ip addr show eth1
```
In your **host computer's browser**, go to: `https://192.168.56.X` (replace X with your IP).

---

## 🛠️ Common Helper Commands

| Command | Action |
| :--- | :--- |
| `gustopos-start` | Start the containers |
| `gustopos-stop` | Stop the containers |
| `gustopos-logs` | View real-time logs |
| `gustopos-backup` | Manual database backup |
| `gustopos-help` | Show all available commands |

---

**For updating an existing VM via USB, see [AIRGAPPED_VM_GUIDE.md](../../AIRGAPPED_VM_GUIDE.md) in the root.**
