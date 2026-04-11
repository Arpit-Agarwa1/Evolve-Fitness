import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/config/database.js";

const PORT = Number(process.env.PORT) || 5001;

/**
 * Bootstraps MongoDB then starts the HTTP server.
 */
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Evolve API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
