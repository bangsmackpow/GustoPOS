# GustoPOS - Standalone Hub Setup

This guide is for running GustoPOS on a dedicated laptop (like a MacBook Pro) inside the bar. 

---

## 🟢 Option 1: The Desktop App (Recommended)
This is the simplest way to run GustoPOS. It doesn't require Docker or any technical setup on the bar laptop.

### **1. Build the Installer**
On your development machine, run:
```bash
pnpm run build:desktop
```
This will create a `.dmg` file (Mac) or `.exe` (Windows) in:
`artifacts/desktop-app/dist/build/`

### **2. Install at the Bar**
1.  Copy the installer to a **USB Stick**.
2.  Plug the stick into the bar laptop and run the installer.
3.  Drag "GustoPOS" to your **Applications** folder.

### **3. Configuration**
The first time you run the app, it will look for a `stack.env` file in the same folder as the app to set your `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### **4. Data Location**
The app saves your data locally on the laptop:
*   **Mac:** `~/Library/Application Support/GustoPOS/gusto.db`
*   **Windows:** `%APPDATA%/GustoPOS/gusto.db`

---

## 🟡 Option 2: Docker Hub Mode
Use this if you want to use the MacBook as a central server for other devices (phones/tablets) over Wi-Fi.

### **1. Setup**
1.  Install **Docker Desktop** on the Mac.
2.  Navigate to the project folder and create `stack.env`:
    ```bash
    cp stack.env.example stack.env
    ```
3.  Start the hub:
    ```bash
    docker-compose up -d
    ```

### **2. Local Network Access**
1.  Find the Mac's IP address (e.g., `192.168.1.50`).
2.  Staff can access the POS on their phones at: `http://192.168.1.50:8080`.
3.  **Pro Tip:** Change the Mac's "Local Hostname" to `gustopos` in System Settings to allow access via `http://gustopos.local:8080`.

---

## 💾 Backups
*   **USB:** Once a week, copy the `gusto.db` file to a physical USB thumb drive.
*   **Cloud:** If the bar has internet, configure the `LITESTREAM_*` variables in `stack.env` to sync data to Cloudflare R2 automatically.
