import mongoose from "mongoose";

const PLAN_VALUES = [
  "1month",
  "3months",
  "6months",
  "1year",
  "essential",
  "premium",
  "elite",
  "unknown",
];

/**
 * Registered member account (signup). Password stored as hash only.
 */
const memberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      maxlength: 32,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    planInterest: {
      type: String,
      enum: PLAN_VALUES,
      default: "unknown",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
  },
  { timestamps: true }
);

memberSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Member", memberSchema);
export { PLAN_VALUES };
