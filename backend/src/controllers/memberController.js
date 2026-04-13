import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Member, { PLAN_VALUES } from "../models/Member.js";
import { sendSuccess, sendError } from "../views/jsonResponse.js";

const SALT_ROUNDS = 10;

/**
 * POST /api/members/register — create member account (signup).
 */
export async function registerMember(req, res, next) {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      plan,
      dateOfBirth,
      city,
    } = req.body ?? {};

    if (!fullName || !email || !phone || !password) {
      return sendError(
        res,
        "Full name, email, phone, and password are required",
        422
      );
    }

    if (password.length < 8) {
      return sendError(res, "Password must be at least 8 characters", 422);
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return sendError(res, "Passwords do not match", 422);
    }

    const rawPlan = plan ? String(plan).toLowerCase() : "unknown";
    const planInterest = PLAN_VALUES.includes(rawPlan) ? rawPlan : "unknown";

    let dob = null;
    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      if (!Number.isNaN(d.getTime())) dob = d;
    }

    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);

    const member = await Member.create({
      fullName: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      passwordHash,
      planInterest,
      dateOfBirth: dob,
      city: city ? String(city).trim() : "",
    });

    console.log(
      `[mongo] members inserted ${member._id} db=${mongoose.connection.name}`
    );

    return sendSuccess(
      res,
      {
        id: member._id,
        email: member.email,
        fullName: member.fullName,
        planInterest: member.planInterest,
        createdAt: member.createdAt,
      },
      201
    );
  } catch (err) {
    if (err.code === 11000) {
      return sendError(
        res,
        "An account with this email already exists",
        409
      );
    }
    next(err);
  }
}
