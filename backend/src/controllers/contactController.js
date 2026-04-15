import mongoose from "mongoose";
import ContactMessage from "../models/ContactMessage.js";
import { sendSuccess, sendError } from "../views/jsonResponse.js";

/**
 * POST /api/contact — persist a contact form message.
 */
export async function createContactMessage(req, res, next) {
  try {
    const { name, email, phone, message, source } = req.body ?? {};

    if (!name || !email || !phone || !message) {
      return sendError(
        res,
        "Name, email, phone, and message are required",
        422
      );
    }

    const doc = await ContactMessage.create({
      name: String(name),
      email: String(email),
      phone: String(phone).trim(),
      message: String(message),
      source: source ? String(source) : "website",
    });

    console.log(
      `[mongo] contactmessages inserted ${doc._id} db=${mongoose.connection.name}`
    );

    return sendSuccess(
      res,
      {
        id: doc._id,
        createdAt: doc.createdAt,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}
