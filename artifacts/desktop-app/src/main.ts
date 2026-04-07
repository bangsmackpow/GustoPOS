import { app, BrowserWindow } from "electron";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import net from "net";
import fs from "fs";

let apiProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

const API_PORT = 3000;
const API_URL = `http://localhost:${API_PORT}`;

// Suppress error dialogs during startup
process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]", reason);
});

function loadEnvFile(envPath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    env[key] = value;
  }
  return env;
}

function findEnvFile(): Record<string, string> {
  const searchPaths = [
    path.join(process.resourcesPath, "stack.env"),
    path.join(path.dirname(process.execPath), "stack.env"),
    path.join(app.getPath("userData"), "stack.env"),
  ];
  for (const p of searchPaths) {
    const env = loadEnvFile(p);
    if (Object.keys(env).length > 0) {
      console.log("Loaded env file from:", p);
      return env;
    }
  }
  console.log("No stack.env found, using defaults");
  return {};
}

function _findOpenPort(port: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => {
      resolve(_findOpenPort(port + 1));
    });
    server.listen(port, () => {
      const { port: actualPort } = server.address() as net.AddressInfo;
      server.close(() => {
        resolve(actualPort);
      });
    });
  });
}

async function startApi(): Promise<void> {
  const isDev = !app.isPackaged;

  // In production, artifacts are in Resources folder
  // In dev, we point to the workspace build folders
  const apiPath = isDev
    ? path.resolve(__dirname, "../../api-server/dist/index.cjs")
    : path.join(process.resourcesPath, "api/index.cjs");

  const dbPath = path.join(app.getPath("userData"), "gusto.db");

  // Ensure the database directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Ensure data storage directory exists
  const dataDir = path.join(app.getPath("userData"), "data");
  if (!fs.existsSync(dataDir)) {
    console.log(`Creating data directory: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Ensure reports directory exists on desktop
  const reportsDir = path.join(app.getPath("desktop"), "GUSTO REPORTS");
  if (!fs.existsSync(reportsDir)) {
    console.log(`Creating reports directory: ${reportsDir}`);
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Don't create an empty database file - let SQLite create it
  // An empty file is not a valid SQLite database and causes "Failed query" errors
  if (!fs.existsSync(dbPath)) {
    console.log(`Database file will be created by SQLite: ${dbPath}`);
  }

  console.log("Starting API at:", apiPath);
  console.log("Database at:", dbPath);

  // pnpm hoists packages to .pnpm/node_modules/, not the root node_modules/
  // We need to point NODE_PATH to the pnpm hoisted location
  const apiNodeModules = isDev
    ? path.resolve(__dirname, "../../../../node_modules/.pnpm/node_modules")
    : path.join(process.resourcesPath, "api/node_modules");

  // Also include the dist/node_modules for external deps (like @libsql)
  const distNodeModules = isDev
    ? path.resolve(__dirname, "../../api-server/dist/node_modules")
    : path.join(process.resourcesPath, "api/node_modules");

  // Load admin credentials from stack.env (searches Resources, app dir, userData)
  const envFileVars = isDev
    ? loadEnvFile(path.resolve(__dirname, "../../../../stack.env"))
    : findEnvFile();

  try {
    apiProcess = spawn(process.execPath, [apiPath], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        PORT: API_PORT.toString(),
        DATABASE_URL: `file://${dbPath.replace(/ /g, "%20")}`,
        NODE_ENV: "production",
        // NODE_PATH with both pnpm hoisted and dist node_modules
        NODE_PATH: `${distNodeModules}${path.delimiter}${apiNodeModules}`,
        // Admin credentials from stack.env
        ADMIN_EMAIL: envFileVars.ADMIN_EMAIL || "",
        ADMIN_PASSWORD: envFileVars.ADMIN_PASSWORD || "",
        ADMIN_PIN: envFileVars.ADMIN_PIN || "0000",
        ADMIN_LOGIN_ENABLED: envFileVars.ADMIN_LOGIN_ENABLED || "true",
        ADMIN_SEED_ENABLED: envFileVars.ADMIN_SEED_ENABLED || "true",
        // Ensure migrations can be found
        MIGRATIONS_PATH: isDev
          ? path.resolve(__dirname, "../../../lib/db/migrations")
          : path.join(process.resourcesPath, "api/migrations"),
        SEEDS_PATH: isDev
          ? path.resolve(__dirname, "../../../db/seeds")
          : path.join(process.resourcesPath, "api/seeds"),
        STATIC_PATH: isDev
          ? path.resolve(__dirname, "../../gusto-pos/dist/public")
          : path.join(process.resourcesPath, "api/public"),
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Log API stdout and stderr
    apiProcess.stdout?.on("data", (data) => {
      const message = data.toString().trim();
      console.log(`[API] ${message}`);
      // Detect successful admin initialization
      if (
        message.includes("[Initialize] ✓ Admin user") ||
        message.includes("[Initialize] ✓ Database initialization completed")
      ) {
        adminInitialized = true;
        console.log("[Desktop] Admin user initialization confirmed!");
      }
      // Detect critical failures
      if (message.includes("[Initialize] ✗ CRITICAL")) {
        apiStartupError = message;
        console.error(`[Desktop] Critical initialization error: ${message}`);
      }
    });

    apiProcess.stderr?.on("data", (data) => {
      console.error(`[API ERROR] ${data.toString().trim()}`);
    });

    apiProcess.on("error", (err) => {
      console.error("Failed to start API process:", err);
      apiStartupError = `Failed to start API: ${err.message}`;
    });

    apiProcess.on("exit", (code, signal) => {
      console.log(`API process exited with code ${code} (signal: ${signal})`);
      if (code !== 0 && code !== null) {
        apiStartupError = `API process exited with code ${code}`;
      }
    });
  } catch (err: any) {
    console.error("Error starting API process:", err);
    apiStartupError = `Failed to start API: ${err.message}`;
  }
}

let apiStartupError: string | null = null;
let adminInitialized = false;
const API_STARTUP_TIMEOUT = 30000; // 30 seconds max wait for API

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: app.isPackaged,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#09090b", // Matches GustoPOS theme
  });

  // Open DevTools in dev mode or when not packaged (for debugging)
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Wait for API to be ready before loading, with timeout
  const startTime = Date.now();
  const checkApi = async () => {
    // Check if API startup failed
    if (apiStartupError) {
      mainWindow?.loadURL(`data:text/html,
        <html>
          <head><title>GustoPOS - API Error</title></head>
          <body style="background:#09090b;color:#f5f5f7;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:2rem;">
            <div style="max-width:600px;text-align:center;">
              <h1 style="color:#f59e0b;font-size:2rem;margin-bottom:1rem;">GustoPOS</h1>
              <h2 style="color:#ef4444;margin-bottom:1rem;">API Initialization Failed</h2>
              <p style="color:#a1a1aa;margin-bottom:1.5rem;">Error: ${apiStartupError}</p>
              <p style="color:#71717a;font-size:0.875rem;">Check the console for more details.</p>
            </div>
          </body>
        </html>
      `);
      return;
    }

    // Timeout check
    if (Date.now() - startTime > API_STARTUP_TIMEOUT) {
      mainWindow?.loadURL(`data:text/html,
        <html>
          <head><title>GustoPOS - Timeout</title></head>
          <body style="background:#09090b;color:#f5f5f7;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:2rem;">
            <div style="max-width:600px;text-align:center;">
              <h1 style="color:#f59e0b;font-size:2rem;margin-bottom:1rem;">GustoPOS</h1>
              <h2 style="color:#ef4444;margin-bottom:1rem;">API Server Timeout</h2>
              <p style="color:#a1a1aa;margin-bottom:1.5rem;">The API server did not start within ${API_STARTUP_TIMEOUT / 1000} seconds.</p>
              <p style="color:#71717a;font-size:0.875rem;">Check the console for more details.</p>
            </div>
          </body>
        </html>
      `);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/healthz`);
      if (response.ok) {
        console.log("API is ready, loading application...");
        mainWindow?.loadURL(API_URL);
      } else {
        console.log(`API check: ${response.status} ${response.statusText}`);
        setTimeout(checkApi, 500);
      }
    } catch (err: any) {
      console.log(`API check failed: ${err.message}`);
      setTimeout(checkApi, 500);
    }
  };

  checkApi();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startApi();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("will-quit", () => {
  if (apiProcess) {
    apiProcess.kill();
  }
});
