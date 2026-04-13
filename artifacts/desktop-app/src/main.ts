import { app, BrowserWindow } from "electron";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import net from "net";
import fs from "fs";

let apiProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

let apiPort = 3000;
let apiUrl = `http://localhost:${apiPort}`;

// Setup logging infrastructure
const LOG_DIR = path.join(app.getPath("home"), "Library", "Logs", "GustoPOS");
const LOG_FILE = path.join(
  LOG_DIR,
  `app-${new Date().toISOString().split("T")[0]}.log`,
);

function ensureLogDirectory(): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("[Logging] Failed to create log directory:", err);
  }
}

function logToFile(level: string, message: string): void {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (err) {
    console.error("[Logging] Failed to write to log file:", err);
  }
}

// Enhanced console logging that also writes to file
function logInfo(message: string): void {
  console.log(message);
  logToFile("INFO", message);
}

function logError(message: string): void {
  console.error(message);
  logToFile("ERROR", message);
}

// Initialize logging on startup
ensureLogDirectory();
logInfo("[Desktop] GustoPOS starting up...");
logInfo(`[Desktop] Log file: ${LOG_FILE}`);

// Suppress error dialogs during startup
process.on("uncaughtException", (error) => {
  logError(`[Uncaught Exception] ${error.message}`);
  logError(error.stack || "");
});

process.on("unhandledRejection", (reason) => {
  logError(`[Unhandled Rejection] ${reason}`);
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
      logInfo(`[Desktop] Loaded env file from: ${p}`);
      return env;
    }
  }
  logInfo("[Desktop] No stack.env found, using defaults");
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
  const workspaceRoot = isDev ? path.resolve(app.getAppPath(), "..", "..") : "";

  // Find an available port starting from 3000
  apiPort = await _findOpenPort(3000);
  apiUrl = `http://localhost:${apiPort}`;
  logInfo(`[Desktop] Using port ${apiPort} for API`);

  // In production, artifacts are in Resources folder
  // In dev mode, point to the workspace build output
  const apiPath = isDev
    ? path.join(workspaceRoot, "artifacts/api-server/dist/index.cjs")
    : path.join(process.resourcesPath, "api/index.cjs");

  const dbPath = path.join(app.getPath("userData"), "gusto.db");

  logInfo(`[Desktop] API Path: ${apiPath}`);
  logInfo(`[Desktop] Database Path: ${dbPath}`);
  logInfo(`[Desktop] Is Packaged: ${app.isPackaged}`);
  logInfo(`[Desktop] Resources Path: ${process.resourcesPath}`);
  logInfo(`[Desktop] User Data Path: ${app.getPath("userData")}`);

  // Check if API file exists
  if (!fs.existsSync(apiPath)) {
    const error = `API server file not found: ${apiPath}`;
    logError(`[Desktop] ${error}`);
    apiStartupError = error;
    return;
  }

  // Ensure the database directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    logInfo(`[Desktop] Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Ensure data storage directory exists
  const dataDir = path.join(app.getPath("userData"), "data");
  if (!fs.existsSync(dataDir)) {
    logInfo(`[Desktop] Creating data directory: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Ensure reports directory exists on desktop
  const reportsDir = path.join(app.getPath("desktop"), "GUSTO REPORTS");
  if (!fs.existsSync(reportsDir)) {
    logInfo(`[Desktop] Creating reports directory: ${reportsDir}`);
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Don't create an empty database file - let SQLite create it
  // An empty file is not a valid SQLite database and causes "Failed query" errors
  if (!fs.existsSync(dbPath)) {
    logInfo(`[Desktop] Database file will be created by SQLite: ${dbPath}`);
  }

  // pnpm hoists packages to .pnpm/node_modules/, not the root node_modules/
  // In dev mode, we need to use the workspace root's node_modules
  const apiNodeModules = isDev
    ? path.join(workspaceRoot, "node_modules/.pnpm/node_modules")
    : path.join(process.resourcesPath, "api/node_modules");

  // Also include the dist/node_modules for external deps (like @libsql)
  const distNodeModules = isDev
    ? path.join(workspaceRoot, "artifacts/api-server/dist/node_modules")
    : path.join(process.resourcesPath, "api/node_modules");

  // Load admin credentials from stack.env
  // In dev mode, use stack.env at project root
  // In prod mode, search in Resources, app dir, userData
  const envFileVars = isDev
    ? loadEnvFile(path.join(workspaceRoot, "stack.env"))
    : findEnvFile();

  // Log all paths for debugging
  logInfo(
    `[Desktop] NODE_PATH will be: ${distNodeModules}${path.delimiter}${apiNodeModules}`,
  );
  logInfo(
    `[Desktop] Migrations Path: ${isDev ? path.join(workspaceRoot, "lib/db/migrations") : path.join(process.resourcesPath, "api/migrations")}`,
  );
  logInfo(
    `[Desktop] Seeds Path: ${isDev ? path.join(workspaceRoot, "db/seeds") : path.join(process.resourcesPath, "api/seeds")}`,
  );
  logInfo(
    `[Desktop] Static Path: ${isDev ? path.join(workspaceRoot, "artifacts/gusto-pos/dist/public") : path.join(process.resourcesPath, "api/public")}`,
  );

  // Check if migrations exist
  const migrationsPath = isDev
    ? path.join(workspaceRoot, "lib/db/migrations")
    : path.join(process.resourcesPath, "api/migrations");
  if (!fs.existsSync(migrationsPath)) {
    logError(`[Desktop] Migrations directory not found: ${migrationsPath}`);
  } else {
    const migrationFiles = fs
      .readdirSync(migrationsPath)
      .filter((f) => f.endsWith(".sql"));
    logInfo(`[Desktop] Found ${migrationFiles.length} migration files`);
  }

  // Check if static files exist
  const staticPath = isDev
    ? path.join(workspaceRoot, "artifacts/gusto-pos/dist/public")
    : path.join(process.resourcesPath, "api/public");
  if (!fs.existsSync(staticPath)) {
    logError(`[Desktop] Static files directory not found: ${staticPath}`);
  } else {
    const indexHtml = path.join(staticPath, "index.html");
    logInfo(
      `[Desktop] Static files exist: ${fs.existsSync(indexHtml) ? "Yes" : "No index.html found"}`,
    );
  }

  try {
    apiProcess = spawn(process.execPath, [apiPath], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        PORT: apiPort.toString(),
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
        // In dev mode: use workspace lib/db/migrations
        // In prod mode: use the bundled api/migrations in Resources
        MIGRATIONS_PATH: migrationsPath,
        SEEDS_PATH: isDev
          ? path.join(workspaceRoot, "db/seeds")
          : path.join(process.resourcesPath, "api/seeds"),
        STATIC_PATH: staticPath,
        // Add log directory for API to use
        LOG_DIR: LOG_DIR,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Handle process exit - this is when API fails to start
    apiProcess.on("exit", (code, signal) => {
      logInfo(
        `[Desktop] API process exited with code ${code} (signal: ${signal})`,
      );
      if (code !== 0 && code !== null) {
        const errorMsg = `API process exited with code ${code}`;
        apiStartupError = errorMsg;
        logError(`[Desktop] ${errorMsg}`);
      }
    });

    // Log API stdout and stderr
    apiProcess.stdout?.on("data", (data) => {
      const message = data.toString().trim();
      logInfo(`[API] ${message}`);
      // Detect successful admin initialization
      if (
        message.includes("[Initialize] ✓ Admin user") ||
        message.includes("[Initialize] ✓ Database initialization completed")
      ) {
        _adminInitialized = true;
        logInfo("[Desktop] Admin user initialization confirmed!");
      }
      // Detect critical failures
      if (message.includes("[Initialize] ✗ CRITICAL")) {
        apiStartupError = message;
        logError(`[Desktop] Critical initialization error: ${message}`);
      }
    });

    apiProcess.stderr?.on("data", (data) => {
      const errorMsg = data.toString().trim();
      logError(`[API ERROR] ${errorMsg}`);
      // Store first error for display
      if (!apiStartupError) {
        apiStartupError = errorMsg;
      }
    });

    apiProcess.on("error", (err) => {
      const errorMsg = `Failed to start API process: ${err.message}`;
      logError(`[Desktop] ${errorMsg}`);
      apiStartupError = errorMsg;
    });

    apiProcess.on("exit", (code, signal) => {
      logInfo(
        `[Desktop] API process exited with code ${code} (signal: ${signal})`,
      );
      if (code !== 0 && code !== null) {
        apiStartupError = `API process exited with code ${code}`;
      }
    });

    logInfo("[Desktop] API process spawned successfully");
  } catch (err: any) {
    const errorMsg = `Failed to start API: ${err.message}`;
    logError(`[Desktop] ${errorMsg}`);
    apiStartupError = errorMsg;
  }
}

let apiStartupError: string | null = null;
let _adminInitialized = false;
const API_STARTUP_TIMEOUT = 30000; // 30 seconds max wait for API

function getErrorHtml(
  title: string,
  error: string,
  troubleshooting: string[],
): string {
  return `
    <html>
      <head>
        <title>GustoPOS - ${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #09090b;
            color: #f5f5f7;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            padding: 2rem;
          }
          .container {
            max-width: 700px;
            text-align: left;
            background: #18181b;
            border-radius: 16px;
            padding: 2.5rem;
            border: 1px solid #27272a;
          }
          .logo {
            color: #f59e0b;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          h2 {
            color: #ef4444;
            margin-bottom: 1rem;
            font-size: 1.25rem;
          }
          .error-box {
            background: #27272a;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            font-family: "SF Mono", Monaco, monospace;
            font-size: 0.875rem;
            color: #a1a1aa;
            border-left: 3px solid #ef4444;
          }
          h3 {
            color: #71717a;
            font-size: 0.875rem;
            margin-bottom: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          ul {
            list-style: none;
            padding: 0;
          }
          li {
            color: #a1a1aa;
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
            padding-left: 1.25rem;
            position: relative;
          }
          li:before {
            content: "→";
            position: absolute;
            left: 0;
            color: #f59e0b;
          }
          .footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #27272a;
            text-align: center;
          }
          .log-info {
            color: #52525b;
            font-size: 0.75rem;
          }
          button {
            background: #f59e0b;
            color: #000;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
          }
          button:hover {
            background: #fbbf24;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">GustoPOS</div>
          <h2>${title}</h2>
          <div class="error-box">${error}</div>
          <h3>Troubleshooting Steps</h3>
          <ul>
            ${troubleshooting.map((step) => `<li>${step}</li>`).join("")}
          </ul>
          <div class="footer">
            <div class="log-info">Log file: ${LOG_FILE}</div>
            <button onclick="location.reload()">Retry</button>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: app.isPackaged,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#09090b",
    show: false, // Don't show until content is ready
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
      logError(`[Desktop] API startup error detected: ${apiStartupError}`);
      const dbPath = app.getPath("userData");
      const html = getErrorHtml("API Initialization Failed", apiStartupError, [
        "Check that your database file is not corrupted",
        `Try deleting the database folder at: ${dbPath}`,
        "Then restart the application (a new database will be created)",
        "Ensure all app files are properly installed",
        "Check the log file for more details",
      ]);
      mainWindow?.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      );
      mainWindow?.show();
      return;
    }

    // Timeout check
    if (Date.now() - startTime > API_STARTUP_TIMEOUT) {
      logError("[Desktop] API startup timeout");
      const html = getErrorHtml(
        "API Server Timeout",
        `The API server did not start within ${API_STARTUP_TIMEOUT / 1000} seconds.`,
        [
          "The application may be taking longer than expected to start",
          "Check the log file for initialization errors",
          "Try restarting the application",
          "If the problem persists, reinstall the application",
        ],
      );
      mainWindow?.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      );
      mainWindow?.show();
      return;
    }

    try {
      logInfo(`[Desktop] Checking API health at ${apiUrl}/api/healthz...`);
      const response = await fetch(`${apiUrl}/api/healthz`);
      if (response.ok) {
        logInfo("[Desktop] API is ready, loading application...");
        await mainWindow?.loadURL(apiUrl);
        mainWindow?.show();
      } else {
        logInfo(
          `[Desktop] API check: ${response.status} ${response.statusText}`,
        );
        setTimeout(checkApi, 500);
      }
    } catch (err: any) {
      logInfo(`[Desktop] API check failed: ${err.message}`);
      setTimeout(checkApi, 500);
    }
  };

  checkApi();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  logInfo("[Desktop] App ready, starting API...");
  await startApi();
  logInfo("[Desktop] Creating window...");
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
  logInfo("[Desktop] App quitting, killing API process...");
  if (apiProcess) {
    apiProcess.kill();
  }
});
