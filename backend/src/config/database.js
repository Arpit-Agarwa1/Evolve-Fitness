import mongoose from "mongoose";

/**
 * Default DB name. Must be a valid MongoDB identifier (no spaces — spaces cause InvalidNamespace).
 * Display as "Evolve Fitness Data" in product copy; this is the actual database name on disk.
 */
const DEFAULT_DB_NAME = "evolve_fitness_data";

/**
 * Fixes common Atlas paste mistakes: missing database path before `?`.
 * @param {string} uri
 * @param {string} dbName
 */
export function normalizeMongoUri(uri, dbName) {
  if (!uri || !dbName) return uri;
  const enc = encodeURIComponent(dbName);

  let u = uri.trim();

  // ...mongodb.net/?opts  →  ...mongodb.net/<encodedDbName>?opts
  if (u.includes(".mongodb.net/?")) {
    u = u.replace(".mongodb.net/?", `.mongodb.net/${enc}?`);
    return u;
  }

  // ...mongodb.net?opts  (no slash) → insert /dbname before ?
  if (/\.mongodb\.net\?/.test(u)) {
    u = u.replace(/\.mongodb\.net\?/, `.mongodb.net/${enc}?`);
    return u;
  }

  // ...mongodb.net/ only (Atlas paste with trailing slash, no db name)
  if (/\.mongodb\.net\/$/u.test(u.split("?")[0])) {
    u = u.replace(/\.mongodb\.net\/$/, `.mongodb.net/${enc}`);
    return u;
  }

  return u;
}

/**
 * Connects to MongoDB once per process lifecycle.
 */
export async function connectDB() {
  const rawUri = process.env.MONGODB_URI?.trim();
  if (!rawUri) {
    throw new Error("MONGODB_URI is not set in environment");
  }

  const dbName =
    process.env.MONGODB_DB_NAME?.trim() || DEFAULT_DB_NAME;
  const uri = normalizeMongoUri(rawUri, dbName);

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15_000,
  });

  console.log("MongoDB connected");
  console.log("Using database:", mongoose.connection.name);
}
