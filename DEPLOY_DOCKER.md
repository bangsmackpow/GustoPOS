# Docker Deployment Guide (Cloud & Mobile)

This guide is for deploying GustoPOS to a central server (VPS) or a local machine with stable internet, where staff will access the system via mobile phones, tablets, or other computers.

---

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed.
- A **Domain Name** (optional but recommended for SSL).
- **Git** to clone the repository.

---

## 🚀 Setup Steps

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/bangsmackpow/GustoPOS.git
    cd GustoPOS
    ```

2.  **Configure Environment**:
    Copy the example environment file and edit it with your settings:
    ```bash
    cp stack.env.example stack.env
    nano stack.env
    ```
    *Ensure you set a strong `ADMIN_PASSWORD` and `ADMIN_PIN`.*

3.  **Start the Stack**:
    ```bash
    docker-compose up -d
    ```

4.  **Verify Status**:
    ```bash
    docker-compose ps
    ```
    The API should be on port `3000` and the Frontend on port `8080`.

---

## 📱 Mobile Access

Staff can access the system by navigating to the server's IP address or domain in their mobile browser:

-   **Internal/Local:** `http://<server-ip>:8080`
-   **Production/Domain:** `https://your-bar-domain.com`

### **Install as PWA (Recommended)**
For the best experience, staff should "Add to Home Screen" from their mobile browser (Chrome on Android, Safari on iOS). This will install GustoPOS as a standalone app with offline support.

---

## 💾 Backups

### **Local SQLite Backup**
The database is stored in the `./data` directory. You can back it up by simply copying the file:
```bash
cp ./data/gusto.db ./backups/gusto-$(date +%Y%m%d).db
```

### **Cloud Backup (Litestream)**
GustoPOS includes built-in support for **Litestream** to replicate your database to Cloudflare R2 or AWS S3. See the `litestream.yml` configuration in `artifacts/api-server/` for details.

---

## 🔄 Updates

To update to the latest version:
```bash
git pull
docker-compose pull
docker-compose up -d
```

---

**For airgapped or standalone deployments, see [README.md](./README.md).**
