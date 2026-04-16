#!/usr/bin/env node
/**
 * Create an admin user in MongoDB (bcrypt-hashes the password).
 *
 * Usage (from repo `backend/` folder):
 *   node scripts/createAdmin.js owner@example.com "YourSecurePassword"
 *   node scripts/createAdmin.js owner@example.com "YourSecurePassword" "Display Name"
 *
 * Requires MONGODB_URI (and optional MONGODB_DB_NAME) in `.env`.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/config/database.js";
import Admin from "../src/models/Admin.js";

const emailArg = process.argv[2];
const passwordArg = process.argv[3];
const displayNameArg = process.argv[4];

if (!emailArg || !passwordArg) {
  console.error(
    "Usage: node scripts/createAdmin.js <email> <password> [displayName]\nExample: node scripts/createAdmin.js owner@gym.com \"MyPass123\" \"Jane Owner\""
  );
  process.exit(1);
}

const email = String(emailArg).trim().toLowerCase();
const password = String(passwordArg);
const displayName = displayNameArg != null ? String(displayNameArg).trim() : "";

async function main() {
  await connectDB();
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await Admin.create({ email, passwordHash, displayName });
    console.log("Admin created in MongoDB:", email, displayName ? `(${displayName})` : "");
    console.log("Sign in at /admin/login with this email and password.");
  } catch (err) {
    if (err.code === 11000) {
      console.error("An admin with this email already exists.");
      process.exit(1);
    }
    throw err;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
