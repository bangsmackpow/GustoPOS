# GustoPOS Desktop Application

This is the native desktop wrapper for GustoPOS, built using **Electron**. It provides a familiar windowed interface for macOS and Windows, running a local API server and SQLite database.

---

## 🚀 Installation

### **For Users**
1.  Download the latest installer from [GustoPOS Releases](https://github.com/bangsmackpow/GustoPOS/releases).
    -   **macOS:** `.dmg` file
    -   **Windows:** `.exe` setup
2.  Run the installer and follow the prompts.
3.  Launch **GustoPOS** from your Applications or Start menu.

### **For Developers (Building from Source)**

1.  **Prerequisites**:
    -   Node.js (v20+)
    -   pnpm (`npm install -g pnpm`)

2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

3.  **Build the Application**:
    ```bash
    pnpm run build:desktop
    ```
    This command builds the frontend, the API server, and then packages them into the Electron app.

4.  **Find the Output**:
    The installers will be generated in:
    `artifacts/desktop-app/dist/`

---

## ⚙️ Configuration

The desktop app stores its data and logs in the standard user data directory for your OS:

-   **macOS**: `~/Library/Application Support/gustopos/`
-   **Windows**: `%APPDATA%\gustopos\`

You can find the `gusto.db` SQLite file in the `data/` subfolder of that directory.

---

## 🆘 Troubleshooting

### **App won't open?**
Ensure no other process is using port `3000` (the default API port).

### **Database Errors?**
If you encounter database locked errors, ensure only one instance of the app is running. You can reset the app by deleting the `data/` folder in the Application Support directory (⚠️ this will erase all data).

---

**For other deployment modes, see the root [README.md](../../README.md).**
