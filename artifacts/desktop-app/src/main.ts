import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import net from 'net';

let apiProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

const API_PORT = 3000;
const API_URL = `http://localhost:${API_PORT}`;

function findOpenPort(port: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      resolve(findOpenPort(port + 1));
    });
    server.listen(port, () => {
      const { port: actualPort } = server.address() as net.AddressInfo;
      server.close(() => {
        resolve(actualPort);
      });
    });
  });
}

async function startApi() {
  const isDev = !app.isPackaged;
  
  // In production, artifacts are in Resources folder
  // In dev, we point to the workspace build folders
  const apiPath = isDev 
    ? path.resolve(__dirname, '../../api-server/dist/index.mjs')
    : path.join(process.resourcesPath, 'api/index.mjs');

  const dbPath = path.join(app.getPath('userData'), 'gusto.db');
  
  console.log('Starting API at:', apiPath);
  console.log('Database at:', dbPath);

  apiProcess = spawn(process.execPath, [apiPath], {
    env: {
      ...process.env,
      PORT: API_PORT.toString(),
      DATABASE_URL: `file:${dbPath}`,
      NODE_ENV: 'production',
      // Ensure migrations can be found
      MIGRATIONS_PATH: isDev 
        ? path.resolve(__dirname, '../../../lib/db/migrations')
        : path.join(process.resourcesPath, 'api/migrations'),
      SEEDS_PATH: isDev
        ? path.resolve(__dirname, '../../../db/seeds')
        : path.join(process.resourcesPath, 'api/seeds'),
      STATIC_PATH: isDev
        ? path.resolve(__dirname, '../../gusto-pos/dist/public')
        : path.join(process.resourcesPath, 'api/public'),
    },
    stdio: 'inherit'
  });

  apiProcess.on('error', (err) => {
    console.error('Failed to start API process:', err);
  });
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
    backgroundColor: '#09090b', // Matches GustoPOS theme
  });

  // Wait for API to be ready before loading
  const checkApi = async () => {
    try {
      const response = await fetch(`${API_URL}/api/healthz`);
      if (response.ok) {
        mainWindow?.loadURL(API_URL);
      } else {
        setTimeout(checkApi, 500);
      }
    } catch {
      setTimeout(checkApi, 500);
    }
  };

  checkApi();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startApi();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  if (apiProcess) {
    apiProcess.kill();
  }
});
