# Guide: Building & Updating the Airgapped VM

This guide provides technical instructions for creating the GustoPOS VirtualBox appliance and updating its software via USB in environments without internet.

---

## 🏗️ Part 1: Building the VM Image (Dev Machine)

To build the `.ova` appliance, you need a machine with **VirtualBox** and **Packer** installed.

1.  **Preparation**:
    -   Ensure you have internet access (to download the Debian ISO and Docker images).
    -   Open a terminal in the `airgapped-deployment/` directory.

2.  **Initialize Packer**:
    ```powershell
    ./packer.exe init packer-virtualbox.pkr.hcl
    ```

3.  **Run the Build**:
    ```powershell
    ./packer.exe build -force packer-virtualbox.pkr.hcl
    ```
    *This process takes 10-15 minutes. It will automatically:*
    -   Download Debian 12.
    -   Perform a silent installation.
    -   Install Docker & dependencies.
    -   **Pre-pull** all GustoPOS Docker images.
    -   Configure the `gustopos` auto-start service.

4.  **Output**:
    The resulting file will be in `airgapped-deployment/output-gustopos/gustopos-appliance-v1.0.ova`.

---

## 💾 Part 2: Preparing a USB Update Bundle

When a new version of GustoPOS is released, follow these steps to create an update for the airgapped bar.

1.  **Run the Bundle Script**:
    On your connected computer, run:
    ```bash
    bash scripts/create-vbox-update.sh
    ```
    This creates a folder called `gustopos-update-bundle/` containing:
    -   `images.tar.gz` (The new Docker images).
    -   `docker-compose.yml` (Updated orchestration).
    -   `scripts/` (New helper scripts).

2.  **Copy to USB**: Copy the entire `gustopos-update-bundle/` folder to your USB drive.

---

## 🚀 Part 3: Applying the Update (Standalone VM)

Inside the bar's VirtualBox VM:

1.  **Mount the USB**:
    -   Connect the USB drive to the physical computer.
    -   In VirtualBox: **Devices → USB → [Your Drive]**.
    -   In the VM terminal:
        ```bash
        sudo mkdir -p /mnt/usb
        sudo mount /dev/sdb1 /mnt/usb
        ```

2.  **Run the Update Command**:
    ```bash
    gustopos-update
    ```
    *The script will:*
    -   Create a safety backup of your current database.
    -   Load the new Docker images from the USB.
    -   Replace the configuration files.
    -   Restart the application stack.

3.  **Verification**:
    Wait 30 seconds and run `gustopos-logs` to confirm the new version is running.

---

## 🛠️ Common Helper Commands (Inside VM)

| Command | Action |
| :--- | :--- |
| `gustopos-init` | First-time setup (SSL/Env) |
| `gustopos-start` | Start the containers |
| `gustopos-stop` | Stop the containers |
| `gustopos-backup` | Manual database backup |
| `gustopos-restore` | Restore data from a timestamp |
| `gustopos-help` | Show all available commands |
