import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.log("[Sentry] VITE_SENTRY_DSN not set — error monitoring disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "development",
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
  });

  console.log("[Sentry] Frontend initialized");
}
