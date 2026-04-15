import "dotenv/config";
import app from "./src/app.js";
import { getAdminJwtSecret } from "./src/config/adminJwt.js";
import { connectDB } from "./src/config/database.js";

/** Render and most PaaS require binding to all interfaces, not loopback only. */
const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number(process.env.PORT) || 5001;

const RETRY_ATTEMPTS = Number(process.env.MONGODB_RETRY_ATTEMPTS) || 5;
const RETRY_DELAY_MS = Number(process.env.MONGODB_RETRY_DELAY_MS) || 2500;

/**
 * Atlas / cold clusters sometimes fail the first connect; retries help deploys succeed.
 * @returns {Promise<void>}
 */
async function connectWithRetry() {
  let lastErr;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      await connectDB();
      return;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[MongoDB] attempt ${attempt}/${RETRY_ATTEMPTS} failed: ${msg}`
      );
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  console.error(`
[MongoDB] All connection attempts failed. For Render / production:
  1. In Render → Environment, set MONGODB_URI to your Atlas SRV string (include /evolve_fitness_data before ? or rely on MONGODB_DB_NAME).
  2. In Atlas → Network Access, allow 0.0.0.0/0 (or Render's egress IPs for stricter setups).
  3. Confirm the database user/password and that the user can read/write the target database.
`);
  throw lastErr;
}

/**
 * Bootstraps MongoDB then starts the HTTP server.
 */
async function start() {
  try {
    await connectWithRetry();

    const jwtLen = getAdminJwtSecret().length;
    if (!jwtLen) {
      console.warn(
        "[Admin] ADMIN_JWT_SECRET is not set — POST /api/admin/login will return 503."
      );
    } else {
      console.log(
        `[Admin] ADMIN_JWT_SECRET is set (length ${jwtLen}).`
      );
    }

    app.listen(PORT, HOST, () => {
      console.log(`Evolve API listening on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
