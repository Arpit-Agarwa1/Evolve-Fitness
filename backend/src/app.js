import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

/** Uploaded trainer photos (persisted on disk; use external object storage for multi-instance hosts). */
const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/api/uploads", express.static(uploadsDir));

/** Required for express-rate-limit and correct client IP on Render / reverse proxies */
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/** Comma-separated list; trailing slashes stripped so `https://site.com/` matches browser `Origin`. */
function parseCorsOrigins(raw) {
  if (!raw?.trim()) return true;
  return raw
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

/**
 * Also allow `www.` ↔ apex so only one needs to be listed in CORS_ORIGIN.
 * @param {true|string[]} parsed
 */
function expandCorsOrigins(parsed) {
  if (parsed === true) return true;
  const out = new Set(parsed);
  for (const o of parsed) {
    try {
      const u = new URL(o);
      if (u.protocol !== "http:" && u.protocol !== "https:") continue;
      const port = u.port ? `:${u.port}` : "";
      const host = u.hostname;
      if (host.startsWith("www.")) {
        out.add(`${u.protocol}//${host.slice(4)}${port}`);
      } else {
        out.add(`${u.protocol}//www.${host}${port}`);
      }
    } catch {
      /* ignore bad URLs */
    }
  }
  return [...out];
}

const corsOrigin = process.env.CORS_ORIGIN;
const corsAllowed = expandCorsOrigins(parseCorsOrigins(corsOrigin));

if (process.env.NODE_ENV === "production" && corsOrigin?.trim()) {
  const n = corsAllowed === true ? "all (*)" : String(corsAllowed.length);
  console.log(`[CORS] Allowed origin count: ${n} (set CORS_ORIGIN on Render if the site domain is missing)`);
}

app.use(
  cors({
    origin: corsAllowed,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: "64kb" }));

app.use("/api", apiRoutes);

app.use(errorHandler);

export default app;
