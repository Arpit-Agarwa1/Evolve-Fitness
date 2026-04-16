import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { isPinnedCorsOrigin } from "./config/corsHeaders.js";

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

const IS_PROD = process.env.NODE_ENV === "production";

/** Vite dev server & preview — always merged in non-production when using an explicit allowlist. */
const CORS_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

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
 * @param {string[]} origins
 */
function expandCorsOrigins(origins) {
  const out = new Set(origins);
  for (const o of origins) {
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

/**
 * Public site URL for CORS (admin calls Render from the browser). Override with PUBLIC_SITE_ORIGIN.
 * Set CORS_SKIP_DEFAULT_SITE=1 to omit this merge (e.g. other deployments).
 */
function getPublicSiteOriginForCors() {
  if (process.env.CORS_SKIP_DEFAULT_SITE === "1") return null;
  const raw = process.env.PUBLIC_SITE_ORIGIN;
  if (raw === "") return null;
  const base = (raw || "https://evolvestudio.fitness").trim().replace(/\/+$/, "");
  return base || null;
}

/**
 * @returns {{ mode: "all" } | { mode: "list"; list: string[] }}
 */
function buildCorsConfig() {
  const parsed = parseCorsOrigins(process.env.CORS_ORIGIN);
  if (parsed === true) {
    if (IS_PROD) {
      console.warn(
        "[CORS] CORS_ORIGIN is not set — allowing any origin. Set CORS_ORIGIN on Render for a strict allowlist."
      );
    }
    return { mode: "all" };
  }

  let list = expandCorsOrigins(parsed);
  if (!IS_PROD) {
    list = [...new Set([...list, ...CORS_DEV_ORIGINS])];
  } else {
    const site = getPublicSiteOriginForCors();
    if (site) {
      list = [...new Set([...list, ...expandCorsOrigins([site])])];
    }
  }

  console.log(
    `[CORS] Explicit allowlist: ${list.length} origin(s)${IS_PROD ? "" : " (includes local Vite/preview)"}`
  );
  return { mode: "list", list };
}

const corsConfig = buildCorsConfig();

/** Optional: set CORS_ALLOW_VERCEL_PREVIEWS=1 to allow any https://*.vercel.app during deploy previews. */
const VERCEL_PREVIEW =
  process.env.CORS_ALLOW_VERCEL_PREVIEWS === "1"
    ? /^https:\/\/[^\s/]+\.vercel\.app$/i
    : null;

function corsOriginCallback(origin, callback) {
  if (corsConfig.mode === "all") {
    callback(null, true);
    return;
  }
  if (!origin) {
    callback(null, true);
    return;
  }
  if (isPinnedCorsOrigin(origin)) {
    callback(null, true);
    return;
  }
  if (corsConfig.list.includes(origin)) {
    callback(null, true);
    return;
  }
  if (VERCEL_PREVIEW && VERCEL_PREVIEW.test(origin)) {
    callback(null, true);
    return;
  }
  if (!IS_PROD || process.env.CORS_LOG_BLOCKED === "1") {
    console.warn(`[CORS] Blocked Origin: ${origin}`);
  }
  callback(null, false);
}

app.use(
  cors({
    origin: corsOriginCallback,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
    maxAge: 86_400,
  })
);

/** Admin routes need larger JSON (trainer `imageBase64`); other `/api` routes stay at 64kb. */
const jsonAdmin = express.json({ limit: "8mb" });
const jsonPublic = express.json({ limit: "64kb" });
app.use((req, res, next) => {
  /** Use pathname from full URL — matches `req.path` at app root but safer across Express edge cases. */
  const pathname = (req.originalUrl ?? req.url ?? "").split("?")[0] || req.path || "";
  if (pathname.startsWith("/api/admin")) {
    return jsonAdmin(req, res, next);
  }
  return jsonPublic(req, res, next);
});

app.use("/api", apiRoutes);

app.use(errorHandler);

export default app;
