# VirtualBox Appliance - Airgapped Upgrade Guide

This guide explains how to update the GustoPOS application stack on a machine that has **no internet connection**.

---

## 🛠️ Phase 1: Prepare the Update Bundle (Connected Machine)

On your machine **with internet access**, run the following steps:

1.  **Open a terminal** in the GustoPOS project directory.
2.  **Run the bundle script**:
    ```bash
    bash scripts/create-vbox-update.sh
    ```
    This will:
    - Download the latest Docker images.
    - Save them to a single `images.tar.gz` file.
    - Create a folder named `gustopos-update-bundle`.

3.  **Copy the folder**: Move the `gustopos-update-bundle` folder onto a USB drive.

---

## 💾 Phase 2: Transfer and Mount (Airgapped Machine)

1.  **Plug the USB drive** into the computer running the VirtualBox VM.
2.  **Mount the USB** in the VM:
    - In VirtualBox: **Devices → USB → [Select your drive]**
    - Inside the VM (command line):
      ```bash
      sudo mkdir -p /mnt/usb
      sudo mount /dev/sdb1 /mnt/usb  # (Note: sdb1 may vary, check 'lsblk')
      ```

---

## 🚀 Phase 3: Apply the Update (Inside the VM)

Run the following command inside the appliance terminal:

```bash
# Start the automated update
gustopos-update
```

The script will:
1.  **Backup** your existing data (for safety).
2.  **Load** the new Docker images from the USB.
3.  **Update** the `docker-compose.yml` and helper scripts.
4.  **Restart** the GustoPOS stack with the new version.
5.  **Clean up** old, unused images.

---

## 🔄 Verification

Check the running version:
```bash
docker ps
# Ensure containers are running and 'Up'
```

Access the app at `https://192.168.56.X` and verify your data is still present.

---

## 🆘 Troubleshooting

### USB not mounting?
Run `lsblk` to see all available disks. If your USB is `sdb`, mount partition 1: `mount /dev/sdb1 /mnt/usb`.

### Images failed to load?
Ensure the USB has enough space (at least 2GB free) and that the `images.tar.gz` file is not corrupted.

### Stack won't start after update?
Check the logs: `gustopos-logs`. You can always restore from the automatic backup created during step 1: `gustopos-restore <timestamp>`.
