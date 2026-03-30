# GustoPOS - Standalone Local Setup Guide

This guide is for running GustoPOS as a **Local Hub** on a MacBook Pro inside the bar. This setup ensures the POS works even if the bar's internet goes down.

## 1. Prerequisites
- **Docker Desktop**: Install the Intel version for your 2015 MacBook Pro.
- **Stable Wi-Fi**: Ensure the MacBook and all staff phones are on the same local network.

## 2. Network Configuration (The "Bonjour" Setup)

To make the POS easy to find without typing an IP address:
1.  On your Mac, go to **System Settings > General > Sharing**.
2.  Look for **Local Hostname** (usually `your-name.local`).
3.  Click **Edit** and change it to: `gustopos`
4.  Your Mac is now reachable at **`http://gustopos.local:8080`**.

### **Recommended: Static IP**
For maximum reliability, give your Mac a "Manual" IP in your Wi-Fi settings (e.g., `192.168.1.50`).

---

## 3. Launching the POS

1.  Open **Terminal** on your Mac.
2.  Navigate to the project folder.
3.  Create your environment file:
    ```bash
    cp stack.env.example stack.env
    ```
4.  Edit `stack.env` with your desired Admin Email and Password.
5.  Start the system:
    ```bash
    docker-compose up -d
    ```

---

## 4. Mobile Setup (Staff Devices)

Once the Mac is running Docker:
1.  On an iPhone or Android, open Chrome/Safari and go to `http://gustopos.local:8080`.
2.  **Android**: Tap the three dots and select **"Install App"**.
3.  **iPhone**: Tap the **Share** icon and select **"Add to Home Screen"**.
4.  The POS will now appear as an app on their home screen and work even during brief internet blips!

---

## 5. Backups & Safety

### **Cloud Backups (Litestream)**
If the bar has internet, Litestream will automatically sync every sale to your Cloudflare R2 bucket. Configure the `LITESTREAM_*` variables in `stack.env` to activate this.

### **Manual USB Backup**
Even without internet, your data is saved in the `./data` folder in the project directory. 
- **Pro Tip**: Once a week, copy the `gusto.db` file from that folder to a USB thumb drive.

---

## 6. Support
If the POS isn't loading on a phone:
- Double-check that the Mac and Phone are on the **same Wi-Fi**.
- Ensure Docker Desktop is running on the Mac.
- Try using the Mac's IP address directly (e.g., `http://192.168.1.50:8080`).
