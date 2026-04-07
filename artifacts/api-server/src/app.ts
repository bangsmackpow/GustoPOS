import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import * as Sentry from "@sentry/node";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// Serve frontend assets if STATIC_PATH is provided (for Electron standalone mode)
const staticPath = process.env.STATIC_PATH;
if (staticPath) {
  console.log(`[API] Serving static assets from: ${staticPath}`);

  // Disable service worker registration for Electron (prevents stale cache issues)
  app.get("/registerSW.js", (req, res) => {
    if (req.headers["user-agent"]?.includes("Electron")) {
      res.setHeader("Content-Type", "application/javascript");
      res.send("// Service worker disabled in Electron");
      return;
    }
    res.sendFile("registerSW.js", { root: staticPath });
  });

  // Intercept sw.js for Electron to force unregistration
  app.get("/sw.js", (req, res) => {
    if (req.headers["user-agent"]?.includes("Electron")) {
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Expires", "0");
      res.send(`
        self.addEventListener('install', (e) => { self.skipWaiting(); });
        self.addEventListener('activate', (e) => {
          e.waitUntil(
            caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
              .then(() => self.clients.claim())
          );
        });
        self.addEventListener('fetch', (e) => {});
      `);
      return;
    }
    res.sendFile("sw.js", { root: staticPath });
  });

  // Serve index.html for Electron without service worker registration
  app.get("/", (req, res) => {
    if (req.headers["user-agent"]?.includes("Electron")) {
      const indexPath = path.join(staticPath, "index.html");
      let html = fs.readFileSync(indexPath, "utf8");
      // Remove service worker registration script tag
      html = html.replace(
        /<script[^>]*src="\/registerSW\.js"[^>]*><\/script>/g,
        "",
      );
      // Remove manifest link to prevent PWA prompts
      html = html.replace(/<link[^>]*rel="manifest"[^>]*>/g, "");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.send(html);
      return;
    }
    res.sendFile("index.html", { root: staticPath });
  });

  app.use(express.static(staticPath));
  // Handle SPA routing
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile("index.html", { root: staticPath });
  });
}

// Global error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  Sentry.captureException(err, { extra: { url: req.url, method: req.method } });
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", message: err.message });
});

export default app;
