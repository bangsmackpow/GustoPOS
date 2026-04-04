import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import https from "https";

const NODE_VERSION = "20.11.0";
const ARCH = "x64"; // Intel Mac
const PLATFORM = "darwin";
const NODE_URL = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${PLATFORM}-${ARCH}.tar.gz`;

const rootDir = process.cwd();
const outDir = path.join(rootDir, "dist-mac");

async function downloadNode() {
  const tarPath = path.join(outDir, "node.tar.gz");
  const binDir = path.join(outDir, "bin");
  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });

  console.log(`Downloading Node.js v${NODE_VERSION} for Intel Mac...`);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(tarPath);
    https.get(NODE_URL, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log("Download complete. Extracting...");
        try {
          // Use native tar (available on Windows 10+ and macOS/Linux)
          execSync(`tar -xzf "${tarPath}" -C "${binDir}" --strip-components=1`, { stdio: "inherit" });
          fs.unlinkSync(tarPath);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", (err) => {
      fs.unlinkSync(tarPath);
      reject(err);
    });
  });
}

function buildAndPackage() {
  console.log("Building workspaces...");
  execSync("pnpm install", { stdio: "inherit" });
  execSync("pnpm run build", { stdio: "inherit" });

  console.log("Deploying API Server to dist-mac/server...");
  if (fs.existsSync(path.join(outDir, "server"))) {
    fs.rmSync(path.join(outDir, "server"), { recursive: true, force: true });
  }
  execSync(`pnpm --filter @workspace/api-server deploy "${path.join(outDir, "server")}"`, { stdio: "inherit" });

  console.log("Copying Frontend to dist-mac/public...");
  const pubDir = path.join(outDir, "public");
  if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
  
  // Copy static assets from gusto-pos build
  const frontendDist = path.join(rootDir, "artifacts/gusto-pos/dist");
  fs.cpSync(frontendDist, pubDir, { recursive: true });

  console.log("Generating start.sh for Mac...");
  const startScript = `#!/bin/bash
# GustoPOS Local Launcher (Standalone)

SCRIPT_DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
NODE_BIN="$SCRIPT_DIR/bin/node"
SERVER_DIR="$SCRIPT_DIR/server"
PUBLIC_DIR="$SCRIPT_DIR/public"
DB_PATH="$SCRIPT_DIR/gusto.db"

echo "-----------------------------------"
echo "  🚀 Starting GustoPOS Local Hub   "
echo "-----------------------------------"

# Check if database exists, if not, migrations will handle it
if [ ! -f "$DB_PATH" ]; then
  echo "📦 Initializing new database at $DB_PATH..."
fi

# Set Environment Variables
export PORT=3000
export HOST=127.0.0.1
export DATABASE_URL="file:$DB_PATH"
export STATIC_PATH="$PUBLIC_DIR"
export NODE_ENV=production

echo "📍 Frontend: $PUBLIC_DIR"
echo "📍 API: localhost:$PORT"
echo "📍 Database: $DB_PATH"

cd "$SERVER_DIR"
"$NODE_BIN" dist/index.mjs
`;

  fs.writeFileSync(path.join(outDir, "start.sh"), startScript, { mode: 0o755 });
}

async function run() {
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    await downloadNode();
    buildAndPackage();
    console.log("\n✅ Success! Transfer the 'dist-mac' folder to your thumb drive.");
  } catch (err) {
    console.error("\n❌ Deployment failed:", err);
    process.exit(1);
  }
}

run();
