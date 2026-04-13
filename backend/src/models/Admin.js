import mongoose from "mongoose";

/**
 * Gym owner admin accounts — used for JWT sign-in (not member registrations).
 */
const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    /** Bcrypt hash only — never store plain text */
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
