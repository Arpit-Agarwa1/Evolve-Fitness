#!/usr/bin/env node
/**
 * Lists the active database name and all collection names (like Atlas Data Explorer).
 * Run from `backend/` with `.env` containing MONGODB_URI.
 *
 *   npm run db:list
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/database.js";

async function main() {
  await connectDB();
  const name = mongoose.connection.name;
  const db = mongoose.connection.db;
  if (!db) {
    console.error("No database handle.");
    process.exit(1);
  }
  const cols = await db.listCollections().toArray();
  const sorted = cols.map((c) => c.name).sort();

  console.log("");
  console.log("Connected database name:", name);
  console.log("Collection count:", sorted.length);
  if (sorted.length === 0) {
    console.log("");
    console.log(
      "No collections yet — MongoDB creates a collection when the first document is saved."
    );
    console.log(
      "Submit Contact/Register on the live site, or run: npm run admin:create -- you@email.com \"password\""
    );
  } else {
    console.log("Collections:", sorted.join(", "));
  }
  console.log("");
  console.log(
    "In Atlas: Browse Collections → pick this database name → you should see the same collection names."
  );
  console.log("");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
