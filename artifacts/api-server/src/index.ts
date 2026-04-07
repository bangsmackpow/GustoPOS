import app from "./app";
import { logger } from "./lib/logger";
import { initializeDatabase } from "@workspace/db";
import { initSentry } from "./lib/sentry";

initSentry();

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function startServer() {
  try {
    // Ensure database is ready before accepting requests
    await initializeDatabase();

    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  } catch (error) {
    logger.error({ error }, "Failed to initialize application");
    process.exit(1);
  }
}

startServer();
