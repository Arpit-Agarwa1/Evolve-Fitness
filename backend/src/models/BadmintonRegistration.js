import mongoose from "mongoose";
import {
  CATEGORY_IDS,
  PLAYER_LEVELS,
} from "../config/badmintonChampionship.js";

/**
 * Badminton Championship registration — confirmed only after payment (or free member path).
 */
const badmintonRegistrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 120,
    },
    mobile: {
      type: String,
      required: [true, "Mobile is required"],
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    emergencyContact: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    isEvolveMember: {
      type: Boolean,
      default: false,
    },
    membershipId: {
      type: String,
      trim: true,
      maxlength: 64,
      default: "",
    },
    playerLevel: {
      type: String,
      enum: PLAYER_LEVELS,
      required: true,
    },
    clubName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    /** Required when any doubles category is selected. */
    partnerName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    partnerMobile: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },
    categories: {
      type: [
        {
          type: String,
          enum: CATEGORY_IDS,
        },
      ],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length >= 1 && v.length <= 3;
        },
        message: "Select 1–3 categories",
      },
    },
    amountInr: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "waived"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["draft", "confirmed", "cancelled"],
      default: "draft",
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: "",
    },
    razorpaySignature: {
      type: String,
      trim: true,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

badmintonRegistrationSchema.index({ status: 1, "categories": 1 });
badmintonRegistrationSchema.index({ email: 1 });
badmintonRegistrationSchema.index({ createdAt: -1 });

export default mongoose.model(
  "BadmintonRegistration",
  badmintonRegistrationSchema
);
