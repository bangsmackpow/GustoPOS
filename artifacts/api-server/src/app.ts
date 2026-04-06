import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
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

// CORS configuration for credentials (httpOnly cookies)
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, desktop, curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost variants for development/Docker
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow requests from the same domain (production)
    const allowedDomains = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').filter(Boolean);
    if (allowedDomains.some(domain => origin.includes(domain))) {
      return callback(null, true);
    }
    
    callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// Serve frontend assets if STATIC_PATH is provided (for Electron standalone mode)
const staticPath = process.env.STATIC_PATH;
if (staticPath) {
  console.log(`[API] Serving static assets from: ${staticPath}`);
  app.use(express.static(staticPath));
  // Handle SPA routing
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile("index.html", { root: staticPath });
  });
}

export default app;
