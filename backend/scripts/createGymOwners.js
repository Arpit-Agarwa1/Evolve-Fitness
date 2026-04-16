#!/usr/bin/env node
/**
 * Create the two Evolve Fitness gym owner admin accounts (MongoDB, bcrypt).
 *
 * Usage (from `backend/`):
 *   node scripts/createGymOwners.js "<password>"
 *   npm run admin:create-owners -- "<password>"
 *
 * Edit `OWNERS` below if you need different login emails (must stay unique).
 * Requires MONGODB_URI (and optional MONGODB_DB_NAME) in `.env`.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/config/database.js";
import Admin from "../src/models/Admin.js";

/** Login emails and display names — change emails here if your owners use different addresses. */
const OWNERS = [
  { email: "rajeev.bhat@evolvefitness.com", displayName: "Rajeev Bhat" },
  { email: "ujjwal.bajaj@evolvefitness.com", displayName: "Ujjwal Bajaj" },
];

const passwordArg = process.argv[2];

if (!passwordArg) {
  console.error(
    'Usage: node scripts/createGymOwners.js "<password>"\nExample: npm run admin:create-owners -- "your-password"'
  );
  process.exit(1);
}

const password = String(passwordArg);

async function main() {
  await connectDB();
  const passwordHash = await bcrypt.hash(password, 10);

  for (const { email, displayName } of OWNERS) {
    const normalized = email.trim().toLowerCase();
    const existing = await Admin.findOne({ email: normalized });
    if (existing) {
      console.log(`Skip (already exists): ${normalized}`);
      continue;
    }
    try {
      await Admin.create({
        email: normalized,
        passwordHash,
        displayName,
      });
      console.log(`Created admin: ${normalized} (${displayName})`);
    } catch (err) {
      if (err.code === 11000) {
        console.error(`Duplicate email: ${normalized}`);
        continue;
      }
      throw err;
    }
  }

  console.log("\nSign in at /admin/login with either email and this password.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
