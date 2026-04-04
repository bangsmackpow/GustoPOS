# GustoPOS - Standalone Hub Setup

This guide is for running GustoPOS on a dedicated laptop (like a MacBook Pro) inside the bar.

---

> **📌 For Complete Airgapped Deployment:** See [airgapped-deployment/README.md](./airgapped-deployment/README.md) for a fully offline installation with bundled scripts and complete documentation.

---

## 🟢 Option 1: Docker Hub Mode (Recommended)
Use this if you want to use the MacBook as a central server for other devices (phones/tablets) over Wi-Fi.

### **1. Prerequisites**
1.  Install **Docker Desktop** on the Mac.
2.  Navigate to the project folder and create `stack.env`:
    ```bash
    cp stack.env.example stack.env
    ```

### **2. Start the Server**
Start the hub:
```bash
docker-compose up -d
```

### **3. Local Network Access**
1.  Find the Mac's IP address (e.g., `192.168.1.50`).
2.  Staff can access the POS on their phones at: `http://192.168.1.50:8080`.
3.  **Pro Tip:** Change the Mac's "Local Hostname" to `gustopos` in System Settings to allow access via `http://gustopos.local:8080`.

### **4. Stop the Server**
To stop the running containers:
```bash
docker-compose down
```

---

## 💾 Backups
*   **USB:** Once a week, copy the `gusto.db` file to a physical USB thumb drive.
*   **Cloud:** If the bar has internet, configure the `LITESTREAM_*` variables in `stack.env` to sync data to Cloudflare R2 automatically.
