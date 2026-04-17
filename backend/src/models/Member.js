import mongoose from "mongoose";

const PLAN_VALUES = [
  "1month",
  "3months",
  "6months",
  "1year",
  "unknown",
];

const GENDER_VALUES = ["male", "female", "other", "prefer_not_say", ""];

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
    gender: {
      type: String,
      enum: GENDER_VALUES,
      default: "",
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
    /** Legacy short location — prefer `address` when both set in UI. */
    city: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    /** Full street address (admin + optional at signup). */
    address: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    emergencyContact: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    /** Admin can deactivate accounts (e.g. churned); inactive still listed in admin. */
    isActive: {
      type: Boolean,
      default: true,
    },
    /** Membership period (admin-set; optional — null means not set). */
    membershipStartDate: {
      type: Date,
      default: null,
    },
    membershipEndDate: {
      type: Date,
      default: null,
    },
    /** Paused membership — clock stops until unfrozen (expiry extended by frozen days on unfreeze). */
    membershipFrozen: {
      type: Boolean,
      default: false,
    },
    /** First day of freeze (UTC); set when freeze starts. */
    membershipFreezeStartedAt: {
      type: Date,
      default: null,
    },
    /** Optional planned resume date (informational). */
    membershipFreezeEndDate: {
      type: Date,
      default: null,
    },
    /** Optional assigned coach from Trainer collection. */
    assignedTrainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
      default: null,
    },
    heightCm: {
      type: Number,
      default: null,
      min: [0, "Height must be positive"],
      max: [300, "Height out of range"],
    },
    weightKg: {
      type: Number,
      default: null,
      min: [0, "Weight must be positive"],
      max: [500, "Weight out of range"],
    },
    fitnessGoal: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    /** Internal notes — admin only, not shown to the member. */
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
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
export { PLAN_VALUES, GENDER_VALUES };
