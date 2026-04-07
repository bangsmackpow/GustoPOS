import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, cp, mkdir, writeFile, access, readdir } from "node:fs/promises";
import { execSync } from "node:child_process";

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(artifactDir, "../..");

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  const distNmPath = path.join(distDir, "node_modules");

  // Step 1: Ensure dist directory exists
  try {
    await access(distDir);
  } catch {
    await mkdir(distDir, { recursive: true });
  }

  // Step 2: Clean old build files (but preserve node_modules)
  try {
    const files = await readdir(distDir);
    for (const file of files) {
      if (file === "node_modules") continue;
      await rm(path.join(distDir, file), { recursive: true, force: true });
    }
  } catch {
    // dist directory might not exist yet, that's ok
  }

  // Step 3: Build with esbuild
  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outdir: distDir,
    outExtension: { ".js": ".cjs" },
    logLevel: "info",
    external: [
      "*.node",
      "libsql",
      "electron",
      "@mapbox/node-pre-gyp",
      "@sentry/profiling-node",
      "@sentry-internal/node-cpu-profiler",
    ],
    sourcemap: "linked",
    plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
    banner: {
      js: `const __bannerCrReq = require('node:module').createRequire(__filename);
const __bannerPath = require('node:path');
const __bannerUrl = require('node:url');

globalThis.require = __bannerCrReq;
globalThis.__filename = __bannerUrl.fileURLToPath('file://' + __filename);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });

  // Step 4: Install external dependencies
  // Check for ALL expected packages, not just directory non-empty
  const expectedPackages = [
    "@libsql",
    "libsql",
    "@neon-rs",
    "detect-libc",
    "bcryptjs",
  ];

  const hasAllExternalDeps = await (async () => {
    try {
      const entries = await readdir(distNmPath);
      return expectedPackages.every((pkg) => entries.includes(pkg));
    } catch {
      return false;
    }
  })();

  if (!hasAllExternalDeps) {
    console.log("Installing external dependencies...");
    // pnpm hoists packages to .pnpm/node_modules/, not the root node_modules/
    const pnpmNm = path.resolve(rootDir, "node_modules/.pnpm/node_modules");
    const workspaceNm = path.resolve(rootDir, "node_modules");

    await mkdir(distNmPath, { recursive: true });

    for (const pkg of expectedPackages) {
      // Try pnpm hoisted location first, then root node_modules
      const srcPnpm = path.join(pnpmNm, pkg);
      const srcRoot = path.join(workspaceNm, pkg);
      const dest = path.join(distNmPath, pkg);

      let src = null;
      try {
        await access(srcPnpm);
        src = srcPnpm;
      } catch {
        try {
          await access(srcRoot);
          src = srcRoot;
        } catch {
          console.warn(
            `Warning: Could not find ${pkg} in pnpm or workspace node_modules`,
          );
        }
      }

      if (src) {
        try {
          await cp(src, dest, { recursive: true, dereference: true });
          console.log(`  Copied ${pkg}`);
        } catch (err) {
          console.warn(`  Failed to copy ${pkg}: ${err.message}`);
        }
      }
    }
  } else {
    console.log("External dependencies already installed, skipping...");
  }

  console.log("API server build complete");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
