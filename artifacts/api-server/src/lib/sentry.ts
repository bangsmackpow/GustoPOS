import * as Sentry from "@sentry/node";

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("[Sentry] SENTRY_DSN not set — error monitoring disabled");
    return;
  }

  try {
    const { nodeProfilingIntegration } = require("@sentry/profiling-node");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      integrations: [nodeProfilingIntegration()],
    });
  } catch {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      profilesSampleRate: 0,
    });
  }

  console.log("[Sentry] Initialized");
}

export { Sentry };
